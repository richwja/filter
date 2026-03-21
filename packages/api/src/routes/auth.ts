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
    error: authError,
  } = await supabase.auth.getUser(access_token);
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (!user.email) {
    return res.status(400).json({ error: 'User has no email address' });
  }

  const { data: profile, error: upsertError } = await supabase
    .from('users')
    .upsert({ id: user.id, email: user.email }, { onConflict: 'id' })
    .select()
    .single();

  if (upsertError || !profile) {
    return res.status(500).json({ error: 'Failed to create user profile' });
  }

  res.json({ user: profile });
});

router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

export default router;
