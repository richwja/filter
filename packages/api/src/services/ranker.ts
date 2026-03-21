import Anthropic from '@anthropic-ai/sdk';
import type { ClassificationResult } from './classifier';
import type { ContextPacket } from './enricher';

const anthropic = new Anthropic();

export interface RankingResult {
  impact_score: number;
  urgency_score: number;
  risk_score: number;
  composite_score: number;
  recommended_action: string;
  recommended_owner_role: string;
  reasoning: string;
  talking_points: string[];
  draft_reply: {
    subject: string;
    body: string;
    tone_used: string;
    requires_approval: boolean;
    approval_reason: string | null;
  };
  flags: string[];
  follow_up_suggestion: string | null;
}

const RANKING_SYSTEM_PROMPT = `You are Filter's ranking engine, the strategic intelligence layer of an automated press inbox triage system. You receive a classified email with organisational context and must produce a detailed assessment.

## Scoring Rubrics

### Impact Score (1-10): "How much does this matter to the client?"
9-10: Tier 1 national/international outlet. Front-page potential.
7-8: Major trade press or influential regional outlet. Key beat reporter.
5-6: Mid-tier outlet or respectable trade publication.
3-4: Niche publication, small podcast, local paper.
1-2: Minimal impact. Very small audience.

### Urgency Score (1-10): "How quickly must we act?"
9-10: Deadline within hours. Breaking news. Crisis-adjacent.
7-8: Deadline within 24-48 hours. Active story being filed.
5-6: Deadline this week. Feature piece with reasonable timeline.
3-4: No explicit deadline but would benefit from timely response.
1-2: No time pressure.

### Risk Score (1-10): "What could go wrong?"
9-10: Active legal matter, regulatory investigation, crisis. Wrong response could create a crisis.
7-8: Sensitive topic, journalist known for critical coverage.
5-6: Moderate sensitivity. Standard competitive dynamics.
3-4: Low sensitivity. Routine inquiry, positive angle.
1-2: Negligible risk.

### Recommended Action
respond_immediately | respond_today | respond_this_week | schedule_briefing | forward_to_spokesperson | decline_politely | monitor_only | no_action

### Flags — apply ALL that match:
Tier 1, Deadline 24h, VIP, Sensitive, New Contact, Follow-up

### Draft Reply
Write a professional reply. Set requires_approval=true if: topic is sensitive, risk_score ≥ 7, reply makes factual claims, or includes quotes.

## Output Format
Return ONLY valid JSON. No markdown fencing, no explanation text, just the JSON object.`;

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) return objMatch[0];
  return text;
}

function clampScore(val: unknown): number {
  const n = Number(val);
  if (isNaN(n)) return 5;
  return Math.max(1, Math.min(10, Math.round(n)));
}

export async function rankEmail(
  email: { subject: string; body_text: string; from_name: string | null; from_address: string },
  classification: ClassificationResult,
  context: ContextPacket,
): Promise<RankingResult> {
  const weights = context.scoring_weights;

  const userMessage = `## Scoring Weights
urgency: ${weights.urgency}, impact: ${weights.impact}, risk: ${weights.risk}

## Email
From: ${email.from_name ? `${email.from_name} <${email.from_address}>` : email.from_address}
Subject: ${email.subject}
Body:
${email.body_text?.slice(0, 6000) || '(empty)'}

## Classification (from Stage 1)
${JSON.stringify(classification, null, 2)}

## Sender Profile
${context.sender_profile ? JSON.stringify(context.sender_profile, null, 2) : 'No existing profile — this is a new contact.'}

## Recent Interactions
${context.recent_interactions.length ? JSON.stringify(context.recent_interactions, null, 2) : 'No prior interactions.'}

## Matched Press Releases
${context.matched_press_releases.length ? JSON.stringify(context.matched_press_releases, null, 2) : 'No matching press releases.'}

## Writing Samples
${context.writing_samples.length ? JSON.stringify(context.writing_samples, null, 2) : 'No writing samples available. Use professional, neutral tone.'}

## Client Context
${context.client_context || 'No client context provided.'}

## Sensitive Topics
${context.sensitive_topics.length ? context.sensitive_topics.join(', ') : 'None flagged.'}`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6-20250514',
    max_tokens: 2048,
    system: RANKING_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });

  if (!message.content.length || message.content[0].type !== 'text') {
    throw new Error('Empty response from ranker');
  }

  const raw = extractJson(message.content[0].text);
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Ranker returned invalid JSON: ${message.content[0].text.slice(0, 200)}`);
  }

  // Clamp scores and recalculate composite server-side
  const impact = clampScore(parsed.impact_score);
  const urgency = clampScore(parsed.urgency_score);
  const risk = clampScore(parsed.risk_score);
  const composite =
    urgency * (weights.urgency ?? 0.4) +
    impact * (weights.impact ?? 0.35) +
    risk * (weights.risk ?? 0.25);

  const draftReply = (parsed.draft_reply as Record<string, unknown>) || {};

  return {
    impact_score: impact,
    urgency_score: urgency,
    risk_score: risk,
    composite_score: Math.round(composite * 10) / 10,
    recommended_action: (parsed.recommended_action as string) || 'respond_this_week',
    recommended_owner_role: (parsed.recommended_owner_role as string) || '',
    reasoning: (parsed.reasoning as string) || '',
    talking_points: Array.isArray(parsed.talking_points) ? parsed.talking_points : [],
    draft_reply: {
      subject: (draftReply.subject as string) || `Re: ${email.subject}`,
      body: (draftReply.body as string) || '',
      tone_used: (draftReply.tone_used as string) || 'professional',
      requires_approval: !!draftReply.requires_approval,
      approval_reason: (draftReply.approval_reason as string) || null,
    },
    flags: Array.isArray(parsed.flags) ? parsed.flags : [],
    follow_up_suggestion: (parsed.follow_up_suggestion as string) || null,
  };
}
