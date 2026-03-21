interface SlackBlock {
  type: string;
  text?: { type: string; text: string; emoji?: boolean };
  fields?: { type: string; text: string }[];
  elements?: { type: string; text: string }[];
}

const SLACK_TOKEN = process.env.SLACK_BOT_TOKEN;

async function slackApi(
  method: string,
  body: Record<string, unknown>,
): Promise<{ ok: boolean; error?: string; channel?: { id: string } }> {
  if (!SLACK_TOKEN) {
    console.warn('SLACK_BOT_TOKEN not configured, skipping Slack API call');
    return { ok: false, error: 'not_configured' };
  }

  try {
    const res = await fetch(`https://slack.com/api/${method}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SLACK_TOKEN}`,
      },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as { ok: boolean; error?: string; channel?: { id: string } };
    if (!data.ok) console.error(`Slack ${method} error:`, data.error);
    return data;
  } catch (err) {
    console.error(`Slack ${method} network error:`, err);
    return { ok: false, error: 'network_error' };
  }
}

export async function postToChannel(channelId: string, blocks: SlackBlock[]) {
  return slackApi('chat.postMessage', { channel: channelId, blocks });
}

export async function sendDM(slackUserId: string, blocks: SlackBlock[]) {
  const conv = await slackApi('conversations.open', { users: slackUserId });
  if (!conv.ok || !conv.channel?.id) return;
  return slackApi('chat.postMessage', { channel: conv.channel.id, blocks });
}

export function buildTriageNotification(
  triage: {
    composite_score: number;
    summary: string;
    recommended_action: string;
    flags: string[];
    category: string;
  },
  email: { subject: string; from_name: string | null; from_address: string },
): SlackBlock[] {
  const score = triage.composite_score.toFixed(1);
  const flags = triage.flags.length ? triage.flags.join(' · ') : 'None';
  const sender = email.from_name
    ? `${email.from_name} (${email.from_address})`
    : email.from_address;

  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: `New email — Score ${score}`, emoji: true },
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*From:*\n${sender}` },
        { type: 'mrkdwn', text: `*Category:*\n${triage.category}` },
        { type: 'mrkdwn', text: `*Subject:*\n${email.subject}` },
        { type: 'mrkdwn', text: `*Flags:*\n${flags}` },
      ],
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*Summary:* ${triage.summary}` },
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*Action:* ${triage.recommended_action.replace(/_/g, ' ')}` },
    },
  ];
}
