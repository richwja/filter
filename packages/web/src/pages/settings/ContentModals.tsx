import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

interface AddContentModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  token: string;
  onSuccess: () => void;
}

export function AddContentModal({
  open,
  onClose,
  projectId,
  token,
  onSuccess,
}: AddContentModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    try {
      await fetch(`/api/projects/${projectId}/content/press-releases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content, source_url: sourceUrl || undefined }),
      });
      onSuccess();
      setTitle('');
      setContent('');
      setSourceUrl('');
      onClose();
    } catch (err) {
      console.error('Failed to add content:', err);
    }
    setSaving(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed inset-4 z-50 mx-auto my-auto flex max-h-[80vh] max-w-lg flex-col rounded-2xl bg-white shadow-2xl">
          <div className="border-b border-gray-200 px-6 py-5">
            <Dialog.Title className="text-lg font-semibold text-gray-900 tracking-heading">
              Add content
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-gray-500">
              Add a press release, blog post, or other media material.
            </Dialog.Description>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto">
            <div className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-pink-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Content</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  rows={6}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 leading-relaxed focus:border-pink-600 focus:outline-none resize-y"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Source URL <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <input
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://…"
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-pink-600 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !title.trim() || !content.trim()}
                className="inline-flex items-center gap-1.5 rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-pink-700 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add content'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

interface AddSampleModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  token: string;
  onSuccess: () => void;
}

const SAMPLE_TYPES = [
  { value: 'press_statement', label: 'Press statement' },
  { value: 'email_reply', label: 'Email reply' },
  { value: 'comment', label: 'Comment' },
  { value: 'decline', label: 'Decline' },
  { value: 'holding_statement', label: 'Holding statement' },
];

export function AddSampleModal({
  open,
  onClose,
  projectId,
  token,
  onSuccess,
}: AddSampleModalProps) {
  const [label, setLabel] = useState('');
  const [content, setContent] = useState('');
  const [sampleType, setSampleType] = useState('press_statement');
  const [tone, setTone] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim() || !content.trim()) return;
    setSaving(true);
    try {
      await fetch(`/api/projects/${projectId}/content/writing-samples`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          label,
          content,
          sample_type: sampleType,
          tone: tone || undefined,
        }),
      });
      onSuccess();
      setLabel('');
      setContent('');
      setSampleType('press_statement');
      setTone('');
      onClose();
    } catch (err) {
      console.error('Failed to add sample:', err);
    }
    setSaving(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed inset-4 z-50 mx-auto my-auto flex max-h-[80vh] max-w-lg flex-col rounded-2xl bg-white shadow-2xl">
          <div className="border-b border-gray-200 px-6 py-5">
            <Dialog.Title className="text-lg font-semibold text-gray-900 tracking-heading">
              Add writing sample
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-gray-500">
              Add an example of your client's communication style.
            </Dialog.Description>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto">
            <div className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Label</label>
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  required
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-pink-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Content</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  rows={6}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 leading-relaxed focus:border-pink-600 focus:outline-none resize-y"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Type</label>
                  <select
                    value={sampleType}
                    onChange={(e) => setSampleType(e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-pink-600 focus:outline-none"
                  >
                    {SAMPLE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Tone <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <input
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    placeholder="e.g. formal, empathetic"
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-pink-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !label.trim() || !content.trim()}
                className="inline-flex items-center gap-1.5 rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-pink-700 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add sample'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
