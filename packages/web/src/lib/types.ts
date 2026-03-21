import type { Session } from '@supabase/supabase-js';
import type { UserProfile } from '@/hooks/useAuth';
import type { Project } from '@/hooks/useProject';

export interface AppContext {
  user: UserProfile;
  session: Session;
  currentProject: Project | null;
}
