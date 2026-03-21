import { Request, Response, NextFunction } from 'express';
import { supabase } from '../db/supabase';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function requireProjectAccess(req: Request, res: Response, next: NextFunction) {
  const projectId = req.params.projectId as string | undefined;
  if (!projectId) {
    return res.status(400).json({ error: 'Missing project ID' });
  }
  if (!UUID_RE.test(projectId)) {
    return res.status(400).json({ error: 'Invalid project ID format' });
  }

  // Admins can access all projects
  if (req.user?.role === 'admin') return next();

  const { data } = await supabase
    .from('project_members')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', req.user!.id)
    .maybeSingle();

  if (!data) {
    return res.status(403).json({ error: 'Not a member of this project' });
  }

  next();
}
