import { supabase } from '../db/supabase';
import type { ClassificationResult } from './classifier';

export interface ContextPacket {
  sender_profile: Record<string, unknown> | null;
  recent_interactions: Record<string, unknown>[];
  matched_press_releases: Record<string, unknown>[];
  writing_samples: Record<string, unknown>[];
  client_context: string | null;
  sensitive_topics: string[];
  scoring_weights: Record<string, number>;
}

export async function enrichEmail(
  _emailId: string,
  projectId: string,
  classification: ClassificationResult,
  fromAddress: string,
): Promise<ContextPacket> {
  // Run independent lookups in parallel
  const [contactResult, releasesResult, samplesResult, projectResult] = await Promise.all([
    supabase
      .from('media_contacts')
      .select('*')
      .eq('project_id', projectId)
      .eq('email', fromAddress)
      .maybeSingle(),

    supabase
      .from('press_releases')
      .select('id, title, summary, topics, spokesperson, published_at')
      .eq('project_id', projectId)
      .eq('status', 'published')
      .overlaps(
        'topics',
        classification.beat_topics.length ? classification.beat_topics : ['__none__'],
      )
      .limit(5),

    supabase.from('writing_samples').select('*').eq('project_id', projectId).limit(3),

    supabase
      .from('projects')
      .select('client_context, sensitive_topics, scoring_weights')
      .eq('id', projectId)
      .single(),
  ]);

  // Interaction history requires the contact ID — sequential
  let recentInteractions: Record<string, unknown>[] = [];
  if (contactResult.data?.id) {
    const { data } = await supabase
      .from('interaction_history')
      .select('*')
      .eq('contact_id', contactResult.data.id)
      .order('occurred_at', { ascending: false })
      .limit(5);
    recentInteractions = (data as Record<string, unknown>[]) ?? [];
  }

  return {
    sender_profile: contactResult.data as Record<string, unknown> | null,
    recent_interactions: recentInteractions,
    matched_press_releases: (releasesResult.data as Record<string, unknown>[]) ?? [],
    writing_samples: (samplesResult.data as Record<string, unknown>[]) ?? [],
    client_context: projectResult.data?.client_context ?? null,
    sensitive_topics: projectResult.data?.sensitive_topics ?? [],
    scoring_weights: projectResult.data?.scoring_weights ?? {
      urgency: 0.4,
      impact: 0.35,
      risk: 0.25,
    },
  };
}
