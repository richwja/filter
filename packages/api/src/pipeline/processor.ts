import { supabase } from '../db/supabase';
import { classifyEmail, ClassificationResult } from '../services/classifier';
import { enrichEmail } from '../services/enricher';
import { rankEmail } from '../services/ranker';
import { autoDiscoverContact } from '../services/contacts';
import { postToChannel, sendDM, buildTriageNotification } from '../services/slack';

const FILTERED_CATEGORIES = ['spam', 'auto_reply', 'newsletter'];

async function logStep(
  projectId: string,
  emailId: string,
  step: string,
  status: 'started' | 'completed' | 'failed',
  startTime: number,
  error?: string,
) {
  await supabase.from('pipeline_logs').insert({
    project_id: projectId,
    email_id: emailId,
    step,
    status,
    duration_ms: Date.now() - startTime,
    error_message: error,
  });
}

export async function processEmail(emailId: string, projectId: string): Promise<void> {
  const pipelineStart = Date.now();

  // Mark processing started
  await supabase
    .from('emails')
    .update({ processing_started_at: new Date().toISOString() })
    .eq('id', emailId);

  // Fetch email
  const { data: email } = await supabase.from('emails').select('*').eq('id', emailId).single();

  if (!email) throw new Error(`Email ${emailId} not found`);

  // Fetch project config for sensitive topics
  const { data: project } = await supabase
    .from('projects')
    .select('sensitive_topics, notification_threshold, slack_channel_id, auto_assign_rules')
    .eq('id', projectId)
    .single();

  // Step 1: Classify
  let classification: ClassificationResult;
  let stepStart = Date.now();

  try {
    await logStep(projectId, emailId, 'classify', 'started', stepStart);

    classification = await classifyEmail(
      email.subject,
      email.body_text,
      email.from_address,
      email.from_name,
      project?.sensitive_topics,
    );

    // Create triage result with classification
    await supabase.from('triage_results').insert({
      email_id: emailId,
      project_id: projectId,
      category: classification.category,
      sender_type: classification.sender_type,
      outlet_name: classification.outlet_name,
      beat_topics: classification.beat_topics,
      is_deadline_driven: classification.is_deadline_driven,
      estimated_deadline: classification.estimated_deadline,
      sentiment: classification.sentiment,
      summary: classification.summary,
      requires_response: classification.requires_response,
      touches_sensitive_topic: classification.touches_sensitive_topic,
      classification_confidence: classification.confidence,
    });

    await supabase.from('emails').update({ status: 'classified' }).eq('id', emailId);
    await logStep(projectId, emailId, 'classify', 'completed', stepStart);

    // Auto-discover contact
    autoDiscoverContact(projectId, email.from_address, email.from_name, classification).catch(
      () => {},
    );

    // Filter check
    if (FILTERED_CATEGORIES.includes(classification.category)) {
      await supabase
        .from('emails')
        .update({ status: 'filtered', processing_completed_at: new Date().toISOString() })
        .eq('id', emailId);
      await logStep(projectId, emailId, 'filter', 'completed', stepStart);
      return;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Classification failed';
    await logStep(projectId, emailId, 'classify', 'failed', stepStart, msg);
    await supabase.from('emails').update({ status: 'error', error_message: msg }).eq('id', emailId);
    throw err;
  }

  // Step 2: Enrich
  stepStart = Date.now();
  let context;
  try {
    await logStep(projectId, emailId, 'enrich', 'started', stepStart);
    context = await enrichEmail(emailId, projectId, classification, email.from_address);
    await supabase.from('emails').update({ status: 'enriched' }).eq('id', emailId);
    await logStep(projectId, emailId, 'enrich', 'completed', stepStart);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Enrichment failed';
    await logStep(projectId, emailId, 'enrich', 'failed', stepStart, msg);
    await supabase.from('emails').update({ status: 'error', error_message: msg }).eq('id', emailId);
    throw err;
  }

  // Step 3: Rank + Draft
  stepStart = Date.now();
  try {
    await logStep(projectId, emailId, 'rank', 'started', stepStart);

    const ranking = await rankEmail(
      {
        subject: email.subject,
        body_text: email.body_text,
        from_name: email.from_name,
        from_address: email.from_address,
      },
      classification,
      context,
    );

    // Force escalation on sensitive topics
    if (classification.touches_sensitive_topic) {
      ranking.flags = [...new Set([...ranking.flags, 'Sensitive'])];
      ranking.draft_reply.requires_approval = true;
      ranking.draft_reply.approval_reason =
        ranking.draft_reply.approval_reason || 'Touches sensitive topic';
    }

    // Update triage result with ranking
    await supabase
      .from('triage_results')
      .update({
        impact_score: ranking.impact_score,
        urgency_score: ranking.urgency_score,
        risk_score: ranking.risk_score,
        composite_score: ranking.composite_score,
        recommended_action: ranking.recommended_action,
        recommended_owner_role: ranking.recommended_owner_role,
        reasoning: ranking.reasoning,
        talking_points: ranking.talking_points,
        flags: ranking.flags,
        follow_up_suggestion: ranking.follow_up_suggestion,
        draft_reply_subject: ranking.draft_reply.subject,
        draft_reply_body: ranking.draft_reply.body,
        draft_reply_tone: ranking.draft_reply.tone_used,
        draft_reply_requires_approval: ranking.draft_reply.requires_approval,
        draft_reply_approval_reason: ranking.draft_reply.approval_reason,
        context_packet: context,
        updated_at: new Date().toISOString(),
      })
      .eq('email_id', emailId);

    await supabase.from('emails').update({ status: 'ranked' }).eq('id', emailId);
    await logStep(projectId, emailId, 'rank', 'completed', stepStart);

    // Step 4: Publish
    await supabase
      .from('emails')
      .update({ status: 'published', processing_completed_at: new Date().toISOString() })
      .eq('id', emailId);

    // Step 5: Notifications
    const threshold = project?.notification_threshold ?? 6.0;
    if (ranking.composite_score >= threshold && project?.slack_channel_id) {
      const triageData = {
        composite_score: ranking.composite_score,
        summary: classification.summary,
        recommended_action: ranking.recommended_action,
        flags: ranking.flags,
        category: classification.category,
      };
      const blocks = buildTriageNotification(triageData, email);
      postToChannel(project.slack_channel_id, blocks).catch(() => {});
    }

    // Step 6: Auto-assign
    const rules = project?.auto_assign_rules ?? [];
    for (const rule of rules as {
      category?: string;
      min_score?: number;
      assign_to?: string;
      slack_user_id?: string;
    }[]) {
      const categoryMatch = !rule.category || rule.category === classification.category;
      const scoreMatch = !rule.min_score || ranking.composite_score >= rule.min_score;

      if (categoryMatch && scoreMatch && rule.assign_to) {
        await supabase
          .from('triage_results')
          .update({ assigned_to: rule.assign_to, assigned_at: new Date().toISOString() })
          .eq('email_id', emailId);

        if (rule.slack_user_id) {
          const blocks = buildTriageNotification(
            {
              ...{
                composite_score: ranking.composite_score,
                summary: classification.summary,
                recommended_action: ranking.recommended_action,
                flags: ranking.flags,
                category: classification.category,
              },
            },
            email,
          );
          sendDM(rule.slack_user_id, blocks).catch(() => {});
        }
        break;
      }
    }

    console.log(
      `Pipeline complete for email ${emailId} — score ${ranking.composite_score.toFixed(1)} (${Date.now() - pipelineStart}ms)`,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Ranking failed';
    await logStep(projectId, emailId, 'rank', 'failed', stepStart, msg);
    await supabase.from('emails').update({ status: 'error', error_message: msg }).eq('id', emailId);
    throw err;
  }
}
