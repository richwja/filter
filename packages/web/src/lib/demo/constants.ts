import type { UserProfile } from '@/hooks/useAuth';
import type { Project } from '@/hooks/useProject';

export interface DemoStory {
  id: string;
  title: string;
  summary: string;
  owner_id: string | null;
  owner_name: string | null;
  triage_ids: string[];
  priority: 'high' | 'medium' | 'low';
}

export const DEMO_TEAM = [
  { id: 'demo-user-001', name: 'Richard Appleton', email: 'richard@milltownpartners.com' },
  { id: 'demo-user-002', name: 'Sophie Martinez', email: 'sophie@milltownpartners.com' },
  { id: 'demo-user-003', name: 'James Chen', email: 'james@milltownpartners.com' },
];

export const DEMO_USER: UserProfile = {
  id: 'demo-user-001',
  email: 'richard@milltownpartners.com',
  name: 'Richard Appleton',
  role: 'admin',
  org_id: 'demo-org-001',
  slack_user_id: null,
};

export const DEMO_PROJECT: Project = {
  id: 'demo-project-001',
  name: 'Tesla',
  slug: 'tesla',
  status: 'active',
  receiving_address: 'tesla@filter.milltownpartners.com',
  slack_channel_id: null,
  created_at: '2025-12-22T00:00:00Z',
};
