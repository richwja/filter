import { Request, Response, NextFunction } from 'express';
import { supabase } from '../db/supabase';

export async function requireProjectAccess(req: Request, res: Response, next: NextFunction) {
  const projectId = (req.params as { projectId: string }).projectId;
  if (!projectId) return next();

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
