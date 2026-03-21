import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface TriageRow {
  id: string;
  email_id: string;
  project_id: string;
  category: string;
  sender_type: string;
  outlet_name: string | null;
  sentiment: string;
  summary: string;
  composite_score: number | null;
  impact_score: number | null;
  urgency_score: number | null;
  risk_score: number | null;
  recommended_action: string | null;
  flags: string[];
  status: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  reasoning?: string;
  talking_points?: string[];
  draft_reply_subject?: string;
  draft_reply_body?: string;
  draft_reply_tone?: string;
  draft_reply_requires_approval?: boolean;
  draft_reply_approval_reason?: string;
  is_new?: boolean;
  // Joined email fields
  emails?: {
    subject: string;
    from_name: string | null;
    from_address: string;
    received_at: string;
  };
}

export function useTriageRealtime(projectId: string | undefined) {
  const [results, setResults] = useState<TriageRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInitial = useCallback(async () => {
    if (!projectId) return;

    const { data } = await supabase
      .from('triage_results')
      .select('*, emails!inner(subject, from_name, from_address, received_at)')
      .eq('project_id', projectId)
      .order('composite_score', { ascending: false })
      .limit(100);

    setResults(data ?? []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`triage_${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'triage_results',
          filter: `project_id=eq.${projectId}`,
        },
        async (payload) => {
          // Fetch the full row with email join
          const { data } = await supabase
            .from('triage_results')
            .select('*, emails!inner(subject, from_name, from_address, received_at)')
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setResults((prev) => [{ ...data, is_new: true }, ...prev]);
            // Clear highlight after 5s
            setTimeout(() => {
              setResults((prev) =>
                prev.map((r) => (r.id === data.id ? { ...r, is_new: false } : r)),
              );
            }, 5000);
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'triage_results',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          setResults((prev) =>
            prev.map((r) => (r.id === payload.new.id ? { ...r, ...payload.new } : r)),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  return { results, loading };
}
