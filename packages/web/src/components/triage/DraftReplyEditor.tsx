import { useState } from 'react';
import { Copy, ExternalLink, Check, ShieldAlert } from 'lucide-react';

interface DraftReplyEditorProps {
  subject: string;
  body: string;
  tone?: string;
  requiresApproval?: boolean;
  toEmail: string;
}

export function DraftReplyEditor({
  subject: initialSubject,
  body: initialBody,
  tone,
  requiresApproval,
  toEmail,
}: DraftReplyEditorProps) {
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleOpenInGmail() {
    const mailto = `mailto:${encodeURIComponent(toEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailto, '_blank');
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-surface-950 tracking-heading">Draft reply</h4>
        <div className="flex items-center gap-2">
          {tone && <span className="text-xs text-surface-600">Tone: {tone}</span>}
          {requiresApproval && (
            <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-[11px] font-medium text-amber-400">
              <ShieldAlert className="h-3 w-3" />
              Requires approval
            </span>
          )}
        </div>
      </div>

      <input
        type="text"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        className="w-full rounded-md border border-surface-300 bg-surface px-3 py-2 text-sm text-surface-900 placeholder:text-surface-500 focus:border-pink-600 focus:outline-none"
        placeholder="Subject"
      />

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={8}
        className="w-full rounded-md border border-surface-300 bg-surface px-3 py-2 text-sm text-surface-900 placeholder:text-surface-500 focus:border-pink-600 focus:outline-none resize-y"
      />

      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-md border border-surface-300 bg-surface px-3 py-1.5 text-sm font-medium text-surface-800 transition-colors hover:bg-surface-100"
        >
          {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
        <button
          onClick={handleOpenInGmail}
          className="inline-flex items-center gap-1.5 rounded-md bg-pink-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-pink-700"
        >
          <ExternalLink className="h-4 w-4" />
          Open in Gmail
        </button>
      </div>
    </div>
  );
}
