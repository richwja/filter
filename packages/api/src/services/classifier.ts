import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

export interface ClassificationResult {
  category: string;
  sender_type: string;
  outlet_name: string | null;
  beat_topics: string[];
  is_deadline_driven: boolean;
  estimated_deadline: string | null;
  sentiment: string;
  summary: string;
  requires_response: boolean;
  touches_sensitive_topic: boolean;
  extracted_contact: {
    name: string | null;
    phone: string | null;
    mobile: string | null;
    title: string | null;
  };
  confidence: number;
}

const CLASSIFICATION_SYSTEM_PROMPT = `You are Filter, an expert press inbox classifier for communications agencies. Your job is to analyse inbound emails to a press office and produce a structured classification that powers an automated triage system.

## Your Role
You are the first stage of a two-stage pipeline. Your classification determines whether an email proceeds to detailed ranking (by a more powerful model) or gets filtered out immediately. Accuracy here is critical — a false negative (filtering a real media inquiry) is far worse than a false positive (letting spam through to ranking).

## Classification Dimensions

### Category
Classify into exactly one:
- **media_inquiry**: A journalist, editor, or producer asking questions, requesting comment, or seeking information for a story they are writing or producing. This is the highest-value category.
- **interview_request**: Explicit request to interview a specific person or spokesperson.
- **press_release_pitch**: Someone sending a press release or story pitch TO the inbox (not from the client).
- **event_invitation**: Invitations to conferences, panels, roundtables, briefings, launches.
- **partnership_inquiry**: Business development, sponsorship, collaboration proposals.
- **pr_agency_pitch**: A PR agency pitching their client or services.
- **spam**: Unsolicited commercial email, SEO pitches, link building requests.
- **newsletter**: Regular newsletter or digest subscriptions.
- **internal**: Internal team communications that ended up in the press inbox.
- **auto_reply**: Out-of-office replies, delivery confirmations, read receipts.
- **other**: Anything that doesn't fit above. Use sparingly.

### Sender Type
journalist | editor | producer | freelancer | pr_agency | analyst | government | unknown

### Sentiment
positive | neutral | negative | urgent

### Deadline Detection
Set is_deadline_driven=true if the email contains ANY time pressure. Parse estimated_deadline as ISO date when possible.

### Sensitive Topic Detection
Set touches_sensitive_topic=true if the email references legal proceedings, personnel issues, financial difficulties, safety incidents, political controversies, or any client-flagged sensitive topics.

### Contact Extraction
Extract from the email signature: name, phone, mobile, title.

### Confidence
Float 0-1: 0.9+ clear-cut, 0.7-0.9 confident with some ambiguity, 0.5-0.7 genuinely ambiguous, <0.5 very uncertain.

## Edge Cases
- Forwarded emails: classify based on ORIGINAL sender's intent
- Multiple topics: pick PRIMARY reason, list all in beat_topics
- Mixed sentiment: if professional but tough questions = neutral; if time-pressed = urgent regardless
- Thread replies: classify based on LATEST message

## Few-Shot Examples

### Example 1: Clear Media Inquiry
Subject: "Comment request — upcoming feature on urban air mobility"
Body: "Hi, I'm working on a feature for the Financial Times about the future of urban air mobility. Could I get a comment from your CEO about the regulatory landscape? My deadline is Friday 5pm GMT."
→ category: media_inquiry, sender_type: journalist, sentiment: neutral, is_deadline_driven: true, confidence: 0.95

### Example 2: Spam
Subject: "Boost your press coverage with our AI tool"
Body: "Hi there! We help companies like yours get 10x more media coverage..."
→ category: spam, sender_type: unknown, sentiment: neutral, is_deadline_driven: false, confidence: 0.98

### Example 3: Hostile Inquiry
Subject: "Allegations of environmental violations"
Body: "We have documents suggesting your client has been dumping waste in violation of EPA regulations. We are publishing tomorrow. Please respond by 6pm today."
→ category: media_inquiry, sender_type: journalist, sentiment: urgent, is_deadline_driven: true, touches_sensitive_topic: true, confidence: 0.95

### Example 4: Auto-reply
Subject: "Re: Interview request"
Body: "Thank you for your email. I am currently out of the office until March 25th..."
→ category: auto_reply, sender_type: unknown, sentiment: neutral, confidence: 0.99

## Output Format
Return ONLY valid JSON matching the schema. No markdown fencing, no explanation text, just the JSON object.`;

function extractJson(text: string): string {
  // Strip markdown code fencing if present
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();

  // Try to extract JSON object
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) return objMatch[0];

  return text;
}

const DEFAULT_CONTACT = { name: null, phone: null, mobile: null, title: null };

export async function classifyEmail(
  subject: string,
  body: string,
  fromAddress: string,
  fromName: string | null,
  sensitiveTopics?: string[],
): Promise<ClassificationResult> {
  // TODO: Inject project.config.categories into classification prompt
  // to allow per-project category customisation

  const sensitiveContext = sensitiveTopics?.length
    ? `\n\nClient-flagged sensitive topics: ${sensitiveTopics.join(', ')}`
    : '';

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: CLASSIFICATION_SYSTEM_PROMPT + sensitiveContext,
    messages: [
      {
        role: 'user',
        content: `Classify this email.\n\nFrom: ${fromName ? `${fromName} <${fromAddress}>` : fromAddress}\nSubject: ${subject}\nBody:\n${body?.slice(0, 4000) || '(empty)'}`,
      },
    ],
  });

  if (!message.content.length || message.content[0].type !== 'text') {
    throw new Error('Empty response from classifier');
  }

  const raw = extractJson(message.content[0].text);
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Classifier returned invalid JSON: ${message.content[0].text.slice(0, 200)}`);
  }

  // Validate required fields with safe defaults
  return {
    category: (parsed.category as string) || 'other',
    sender_type: (parsed.sender_type as string) || 'unknown',
    outlet_name: (parsed.outlet_name as string) || null,
    beat_topics: Array.isArray(parsed.beat_topics) ? parsed.beat_topics : [],
    is_deadline_driven: !!parsed.is_deadline_driven,
    estimated_deadline: (parsed.estimated_deadline as string) || null,
    sentiment: (parsed.sentiment as string) || 'neutral',
    summary: (parsed.summary as string) || '',
    requires_response: parsed.requires_response !== false,
    touches_sensitive_topic: !!parsed.touches_sensitive_topic,
    extracted_contact: {
      ...DEFAULT_CONTACT,
      ...((parsed.extracted_contact as Record<string, string | null>) || {}),
    },
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
  };
}
