import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: 'admin' | 'user';
  org_id: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const token = header.slice(7);
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const {
    data: { user: authUser },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !authUser) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const { data: profile } = await supabase
    .from('users')
    .select('id, email, name, role, org_id')
    .eq('id', authUser.id)
    .single();

  if (!profile) {
    return res.status(401).json({ error: 'User profile not found' });
  }

  req.user = profile as AuthUser;
  next();
}
