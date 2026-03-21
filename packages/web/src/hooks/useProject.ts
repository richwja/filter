import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

export interface Project {
  id: string;
  name: string;
  slug: string;
  status: string;
  receiving_address: string | null;
  slack_channel_id: string | null;
  created_at: string;
}

const STORAGE_KEY = 'filter_current_project';

export function useProject() {
  const { session } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }

    fetch('/api/projects', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => r.json())
      .then(({ projects: list }) => {
        setProjects(list ?? []);
        const savedId = localStorage.getItem(STORAGE_KEY);
        const saved = list?.find((p: Project) => p.id === savedId);
        setCurrentProject(saved ?? list?.[0] ?? null);
      })
      .finally(() => setLoading(false));
  }, [session]);

  const switchProject = useCallback(
    (id: string) => {
      const p = projects.find((proj) => proj.id === id);
      if (p) {
        setCurrentProject(p);
        localStorage.setItem(STORAGE_KEY, id);
      }
    },
    [projects],
  );

  return { projects, currentProject, switchProject, loading };
}
