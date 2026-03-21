import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { supabase } from '../db/supabase';
import { processEmail } from '../pipeline/processor';

const router = Router();

function verifyMailgunSignature(timestamp: string, token: string, signature: string): boolean {
  if (!timestamp || !token || !signature) return false;
  const signingKey = process.env.MAILGUN_WEBHOOK_SIGNING_KEY;
  if (!signingKey) return false;

  const hmac = crypto.createHmac('sha256', signingKey);
  hmac.update(timestamp + token);
  const digest = hmac.digest('hex');

  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}

router.post('/mailgun/inbound', async (req: Request, res: Response) => {
  const { timestamp, token, signature } = req.body ?? {};
  if (!verifyMailgunSignature(timestamp, token, signature)) {
    return res.status(403).json({ error: 'Invalid signature' });
  }

  const {
    sender,
    recipient,
    subject,
    'body-plain': bodyText,
    'body-html': bodyHtml,
    'Message-Id': messageId,
    Date: receivedDate,
    To: toAddresses,
    Cc: ccAddresses,
  } = req.body;

  // Look up project by receiving address
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('receiving_address', recipient)
    .eq('status', 'active')
    .single();

  if (!project) {
    console.warn(`No active project for recipient: ${recipient}`);
    return res.status(200).json({ message: 'No matching project' });
  }

  // Parse sender "Name <email>" format
  const senderMatch = sender?.match(/^(.+?)\s*<(.+?)>$/);
  const fromName = senderMatch ? senderMatch[1].trim() : null;
  const fromAddress = senderMatch ? senderMatch[2] : sender;

  const { data: email, error } = await supabase
    .from('emails')
    .insert({
      project_id: project.id,
      message_id: messageId || `mg-${Date.now()}`,
      from_address: fromAddress,
      from_name: fromName,
      to_addresses: toAddresses ? toAddresses.split(',').map((s: string) => s.trim()) : [],
      cc_addresses: ccAddresses ? ccAddresses.split(',').map((s: string) => s.trim()) : [],
      subject,
      body_text: bodyText,
      body_html: bodyHtml,
      received_at: receivedDate ? new Date(receivedDate).toISOString() : new Date().toISOString(),
      status: 'ingested',
    })
    .select('id')
    .single();

  if (error) {
    // Duplicate message_id = already processed, return 200
    if (error.code === '23505') {
      return res.status(200).json({ message: 'Already processed' });
    }
    console.error('Failed to store email:', error.message);
    return res.status(500).json({ error: 'Failed to store email' });
  }

  // Trigger pipeline async
  processEmail(email.id, project.id).catch((err) =>
    console.error(`Pipeline error for email ${email.id}:`, err.message),
  );

  res.status(200).json({ message: 'Accepted', email_id: email.id });
});

export default router;
