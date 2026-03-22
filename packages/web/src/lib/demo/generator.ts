import type { TriageRow } from '@/hooks/useTriageRealtime';
import type { DemoStory } from './constants';
import { DEMO_TEAM } from './constants';
import { THEMES, type EmailSeed } from './themes';

function rng(seed = 42) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x80000000;
  };
}

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

function jitter(min: number, max: number, rand: () => number): number {
  return Math.round((min + rand() * (max - min)) * 10) / 10;
}

// Generate a date within the 90-day window (Dec 22 2025 → Mar 22 2026)
// Weighted: 7d=25, 8-30d=75, 31-90d=110
function generateDate(rand: () => number, bucket: 'recent' | 'mid' | 'old'): string {
  const end = new Date('2026-03-22T18:00:00Z');
  let daysBack: number;

  if (bucket === 'recent') {
    daysBack = Math.floor(rand() * 7); // 0-6 days back
  } else if (bucket === 'mid') {
    daysBack = 7 + Math.floor(rand() * 23); // 7-29 days back
  } else {
    daysBack = 30 + Math.floor(rand() * 60); // 30-89 days back
  }

  const d = new Date(end);
  d.setDate(d.getDate() - daysBack);

  // Business-hours weighting: 80% between 08:00-18:00 UTC
  if (rand() < 0.8) {
    d.setUTCHours(8 + Math.floor(rand() * 10), Math.floor(rand() * 60), 0, 0);
  } else {
    d.setUTCHours(Math.floor(rand() * 24), Math.floor(rand() * 60), 0, 0);
  }

  return d.toISOString();
}

function assignStatus(rand: () => number, daysOld: number): string {
  const r = rand();
  if (daysOld <= 7) {
    // Recent: skew toward new
    if (r < 0.55) return 'new';
    if (r < 0.7) return 'in_progress';
    if (r < 0.82) return 'replied';
    if (r < 0.92) return 'closed';
    return 'no_action';
  }
  if (daysOld <= 30) {
    if (r < 0.3) return 'new';
    if (r < 0.5) return 'in_progress';
    if (r < 0.7) return 'replied';
    if (r < 0.88) return 'closed';
    return 'no_action';
  }
  // Old: skew toward completed
  if (r < 0.15) return 'new';
  if (r < 0.3) return 'in_progress';
  if (r < 0.55) return 'replied';
  if (r < 0.8) return 'closed';
  return 'no_action';
}

function pickAction(score: number, rand: () => number): string {
  if (score >= 8) return rand() < 0.6 ? 'respond_immediately' : 'respond_today';
  if (score >= 6) return rand() < 0.5 ? 'respond_today' : 'respond_this_week';
  if (score >= 4) return rand() < 0.6 ? 'respond_this_week' : 'schedule_briefing';
  return rand() < 0.7 ? 'no_action' : 'respond_this_week';
}

const FILLER_SEEDS: EmailSeed[] = [
  [
    null,
    'SkyComms Team',
    'hello@skycomms.io',
    'pr_agency',
    'Elevate your EV PR with SkyComms Agency',
    'PR agency pitching their automotive sector services. Mass email template.',
    'neutral',
    'pr_agency_pitch',
    1.0,
    2.0,
    1,
    2,
    [],
  ],
  [
    null,
    'EventBright Auto',
    'noreply@eventbrite.com',
    'pr_agency',
    'EV World Congress — exhibitor invitation',
    'Conference exhibitor booth invitation. Bulk marketing email.',
    'neutral',
    'event_invitation',
    1.5,
    2.5,
    1,
    2,
    [],
  ],
  [
    null,
    'GreenTech Partners',
    'info@greentechpr.com',
    'pr_agency',
    'Partnership opportunity — EV charging solutions',
    'Charging startup seeking partnership with Tesla. Generic pitch.',
    'neutral',
    'partnership_inquiry',
    2.0,
    3.0,
    1,
    2,
    [],
  ],
  [
    null,
    'AutoMedia Wire',
    'dispatch@automediawire.com',
    'pr_agency',
    'Press release — competitor announces new EV model',
    'Press release distribution about competitor product launch.',
    'neutral',
    'pr_agency_pitch',
    1.0,
    1.5,
    1,
    1,
    [],
  ],
  [
    null,
    'CleanTech Ventures',
    'outreach@cleantechvc.com',
    'pr_agency',
    'Investment opportunity — battery recycling startup',
    'VC firm pitching investment opportunity. Unsolicited.',
    'neutral',
    'partnership_inquiry',
    1.5,
    2.5,
    1,
    2,
    [],
  ],
  [
    null,
    'Auto Summit Org',
    'register@autosummit.com',
    'pr_agency',
    'Speaking invitation — Global Auto Summit, May 2026',
    'Conference speaking invitation. Standard template.',
    'neutral',
    'event_invitation',
    2.5,
    3.5,
    1,
    2,
    [],
  ],
  [
    null,
    'EVInsight Newsletter',
    'editor@evinsight.io',
    'pr_agency',
    'Sponsored content opportunity',
    'Newsletter seeking paid sponsored content placement.',
    'neutral',
    'pr_agency_pitch',
    1.0,
    2.0,
    1,
    1,
    [],
  ],
  [
    null,
    'Morgan Lewis LLP',
    'conferences@morganlewis.com',
    'pr_agency',
    'Auto litigation roundtable — panelist invitation',
    'Law firm event invitation. Niche audience.',
    'neutral',
    'event_invitation',
    2.0,
    3.0,
    1,
    2,
    [],
  ],
  [
    null,
    'Sustainability Weekly',
    'editors@sustainweekly.com',
    'freelancer',
    'ESG metrics request for annual report',
    'Small publication requesting ESG data for industry report.',
    'neutral',
    'media_inquiry',
    2.5,
    3.5,
    1,
    2,
    [],
  ],
  [
    null,
    'PR Newswire',
    'distribution@prnewswire.com',
    'pr_agency',
    'Your Q1 media monitoring report',
    'Automated media monitoring report. No action needed.',
    'neutral',
    'pr_agency_pitch',
    1.0,
    1.5,
    1,
    1,
    [],
  ],
];

const DRAFT_TEMPLATES: Record<string, string> = {
  'fsd-safety':
    'Thank you for reaching out. Tesla takes safety extremely seriously. We are happy to share publicly available safety data and connect you with our communications team for further detail.',
  'cybertruck-quality':
    'We appreciate your interest in Cybertruck. Tesla stands behind the quality of all its vehicles and is committed to continuous improvement in manufacturing and materials.',
  'musk-political':
    'Tesla is focused on its mission to accelerate the transition to sustainable energy. We let our products and results speak for themselves.',
  'earnings-stock':
    'Thank you for your inquiry. Tesla does not comment on market speculation. For the latest financial information, please refer to our investor relations page.',
  'gigafactory-expansion':
    'Tesla continues to invest in manufacturing capacity to meet growing global demand. We are excited about expanding our production footprint.',
  'labor-safety':
    "Worker safety is Tesla's top priority. We maintain rigorous safety standards and continuously invest in improvements across all our facilities.",
  'energy-division':
    'Tesla Energy is a core part of our mission. We are scaling production of Megapack and Powerwall to meet unprecedented demand for energy storage.',
  robotaxi:
    'Tesla is committed to delivering autonomous ride-hailing when our technology meets the highest safety standards. We continue to make rapid progress.',
  'model-y-refresh':
    'Thank you for your interest. The refreshed Model Y represents significant improvements across the board. We would be happy to arrange a review vehicle.',
  'china-competition':
    'Tesla competes globally on product quality, technology, and total cost of ownership. The growing EV market benefits consumers and manufacturers alike.',
  'supercharger-nacs':
    "Tesla is committed to building the world's best charging network. We welcome all EV drivers to the Supercharger network.",
  'brand-reputation':
    "Tesla's products continue to earn the highest customer satisfaction ratings in the automotive industry. We focus on building the best vehicles possible.",
};

export function generateDemoData(): { triage: TriageRow[]; stories: DemoStory[] } {
  const rand = rng(42);
  const rows: TriageRow[] = [];
  let idCounter = 1;

  const now = new Date('2026-03-22T18:00:00Z');
  const themeRowIds: Record<string, string[]> = {};

  // Distribute entries: ~25 recent, ~75 mid, ~110 old across theme seeds
  const bucketCounts = { recent: 25, mid: 75, old: 110 };
  for (const theme of THEMES) {
    themeRowIds[theme.id] = [];

    for (const seed of theme.seeds) {
      // Each seed generates 2-3 entries
      const copies = rand() < 0.4 ? 3 : 2;

      for (let c = 0; c < copies; c++) {
        const id = `t${String(idCounter).padStart(3, '0')}`;
        idCounter++;

        // Distribute across buckets proportionally
        const bucketRand = rand();
        const bucket: 'recent' | 'mid' | 'old' =
          bucketRand < bucketCounts.recent / 210
            ? 'recent'
            : bucketRand < (bucketCounts.recent + bucketCounts.mid) / 210
              ? 'mid'
              : 'old';

        const createdAt = generateDate(rand, bucket);
        const daysOld = Math.floor((now.getTime() - new Date(createdAt).getTime()) / 86400000);

        const [
          outlet,
          senderName,
          senderEmail,
          senderType,
          subject,
          summary,
          sentiment,
          category,
          scoreMin,
          scoreMax,
          riskMin,
          riskMax,
          flags,
          talkingPoints,
          draftSnippet,
        ] = seed;

        const compositeScore = jitter(scoreMin, scoreMax, rand);
        const impact = Math.round(jitter(scoreMin * 0.9, scoreMax * 1.1, rand) * 10) / 10;
        const urgency = Math.round(jitter(scoreMin * 0.8, scoreMax * 1.05, rand) * 10) / 10;
        const risk = jitter(riskMin, riskMax, rand);
        const status = assignStatus(rand, daysOld);
        const assigned = rand() < 0.25 ? pick(DEMO_TEAM, rand).id : null;

        const updatedAt = new Date(new Date(createdAt).getTime() + 60000).toISOString();
        const receivedAt = new Date(new Date(createdAt).getTime() - 120000).toISOString();

        // Vary subject slightly for copies
        const subjectVariant =
          c === 0 ? subject : c === 1 ? `Re: ${subject}` : `Follow-up: ${subject}`;

        const row: TriageRow = {
          id,
          email_id: `e${id.slice(1)}`,
          project_id: 'demo-project-001',
          category,
          sender_type: senderType,
          outlet_name: outlet,
          sentiment:
            c > 0 && rand() < 0.3 ? pick(['positive', 'neutral', 'negative'], rand) : sentiment,
          summary: c === 0 ? summary : `${summary} (follow-up correspondence)`,
          composite_score: Math.min(10, Math.max(1, compositeScore)),
          impact_score: Math.min(10, Math.max(1, impact)),
          urgency_score: Math.min(10, Math.max(1, urgency)),
          risk_score: Math.min(10, Math.max(1, risk)),
          recommended_action: pickAction(compositeScore, rand),
          flags: c === 0 ? flags : flags.filter((f) => f !== 'Deadline 24h'),
          status,
          assigned_to: assigned,
          reasoning: `Composite score ${compositeScore.toFixed(1)} based on outlet reach, topic sensitivity, and deadline pressure.`,
          talking_points: talkingPoints ?? [],
          created_at: createdAt,
          updated_at: updatedAt,
          emails: {
            subject: subjectVariant,
            from_name: senderName,
            from_address: senderEmail,
            received_at: receivedAt,
          },
        };

        // Add draft reply for high-scoring entries
        if (compositeScore >= 5 && (draftSnippet || DRAFT_TEMPLATES[theme.id])) {
          row.draft_reply_subject = `Re: ${subject}`;
          row.draft_reply_body = draftSnippet || DRAFT_TEMPLATES[theme.id];
          row.draft_reply_tone = 'professional, measured';
          row.draft_reply_requires_approval = risk >= 6;
          if (risk >= 6) {
            row.draft_reply_approval_reason = 'Sensitive topic — requires senior review';
          }
        }

        rows.push(row);
        themeRowIds[theme.id].push(id);
      }
    }
  }

  // Generate filler entries
  for (const seed of FILLER_SEEDS) {
    const copies = rand() < 0.5 ? 3 : 2;
    for (let c = 0; c < copies; c++) {
      const id = `t${String(idCounter).padStart(3, '0')}`;
      idCounter++;

      const bucket: 'recent' | 'mid' | 'old' =
        rand() < 0.2 ? 'recent' : rand() < 0.5 ? 'mid' : 'old';
      const createdAt = generateDate(rand, bucket);
      const daysOld = Math.floor((now.getTime() - new Date(createdAt).getTime()) / 86400000);

      const [
        outlet,
        senderName,
        senderEmail,
        senderType,
        subject,
        summary,
        sentiment,
        category,
        scoreMin,
        scoreMax,
        riskMin,
        riskMax,
        flags,
      ] = seed;

      const compositeScore = jitter(scoreMin, scoreMax, rand);

      rows.push({
        id,
        email_id: `e${id.slice(1)}`,
        project_id: 'demo-project-001',
        category,
        sender_type: senderType,
        outlet_name: outlet,
        sentiment,
        summary,
        composite_score: compositeScore,
        impact_score: jitter(scoreMin, scoreMax, rand),
        urgency_score: jitter(scoreMin, scoreMax, rand),
        risk_score: jitter(riskMin, riskMax, rand),
        recommended_action: 'no_action',
        flags,
        status: rand() < 0.7 ? 'no_action' : assignStatus(rand, daysOld),
        assigned_to: null,
        created_at: createdAt,
        updated_at: new Date(new Date(createdAt).getTime() + 60000).toISOString(),
        emails: {
          subject: c === 0 ? subject : `Re: ${subject}`,
          from_name: senderName,
          from_address: senderEmail,
          received_at: new Date(new Date(createdAt).getTime() - 120000).toISOString(),
        },
      });
    }
  }

  // Sort by created_at descending
  rows.sort((a, b) => b.created_at.localeCompare(a.created_at));

  // Build stories from themes
  const stories: DemoStory[] = THEMES.map((theme, i) => ({
    id: `s${i + 1}`,
    title: theme.title,
    summary: theme.summary,
    owner_id: i < 3 ? DEMO_TEAM[i % 3].id : null,
    owner_name: i < 3 ? DEMO_TEAM[i % 3].name : null,
    triage_ids: themeRowIds[theme.id],
    priority: theme.priority,
  }));

  return { triage: rows, stories };
}
