import { Router } from 'express';
import { supabase } from '../db/supabase';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/callback', async (req, res) => {
  const { access_token } = req.body;
  if (!access_token) {
    return res.status(400).json({ error: 'Missing access_token' });
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(access_token);
  if (error || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Upsert user profile
  const { data: profile } = await supabase
    .from('users')
    .upsert({ id: user.id, email: user.email! }, { onConflict: 'id' })
    .select()
    .single();

  res.json({ user: profile });
});

router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

export default router;
