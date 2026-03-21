import { supabase } from '../db/supabase';
import type { ClassificationResult } from './classifier';

export async function autoDiscoverContact(
  projectId: string,
  fromAddress: string,
  fromName: string | null,
  classification: ClassificationResult,
) {
  // Upsert to avoid TOCTOU race condition
  await supabase.from('media_contacts').upsert(
    {
      project_id: projectId,
      name: classification.extracted_contact.name || fromName,
      email: fromAddress,
      phone: classification.extracted_contact.phone,
      mobile: classification.extracted_contact.mobile,
      title: classification.extracted_contact.title,
      outlet: classification.outlet_name,
      beat: classification.beat_topics[0] || null,
      relationship_status: 'new',
      source: 'auto_discovered',
    },
    { onConflict: 'project_id,email', ignoreDuplicates: true },
  );
}
