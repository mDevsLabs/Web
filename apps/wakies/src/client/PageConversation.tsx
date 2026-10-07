import { useEffect, useRef, useState } from 'react';
import { ArrowUp, ChevronDown, X, MessageCircle } from 'lucide-react';
import type { Conversation, WorkspaceState } from '../shared/types';
import type { Page } from '../server/pages';
import { Chat } from './Chat';
import { PageChatRequests } from './page-chat-requests';
import { api } from './api';
export function PageConversation({
  page,
  workspace,
  paused,
  beforeChat,
  onRefresh,
  onSchedule,
  onSettings,
  onCreateWakie,
  onOpenChange,
}: {
  page: Page;
  workspace: WorkspaceState;
  paused: boolean;
  beforeChat: () => Promise<boolean>;
  onRefresh: () => void;
  onSchedule: (id: string) => void;
  onSettings: () => void;
  onCreateWakie: () => void;
  onOpenChange: (value: boolean) => void;
}) {
  const wakies = workspace.wakies.filter((wakie) =>
    wakie.spaceIds.includes(page.spaceId),
  );
  const [wakieId, setWakieId] = useState('');
  const wakie = wakies.find((wakie) => wakie.id === wakieId) ?? wakies[0];
  const [thread, setThread] = useState<Conversation>();
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const requests = useRef(new PageChatRequests());
  const scope = `${page.id}:${wakie?.id ?? ''}`;
  requests.current.select(scope);
  useEffect(() => {
    setThread(undefined);
    setPending(undefined);
    setBusy(false);
    onOpenChange(false);
  }, [scope, onOpenChange]);
  useEffect(() => {
    const current = requests.current;
    return () => current.select('');
  }, []);
  const open = async () => {
    if (!wakie || busy) return;
    setBusy(true);
    setError('');
    const prompt = draft.trim();
    await requests.current.run(
      scope,
      async () => {
        if (!(await beforeChat()))
          throw new Error(
            'Save or resolve your document changes before starting page chat.',
          );
        return api<Conversation>(
          `/spaces/${page.spaceId}/pages/${page.id}/conversation`,
          'POST',
          { wakieId: wakie.id },
        );
      },
      {
        success: (next) => {
          setThread(next);
          setPending(prompt || undefined);
          setDraft('');
          onOpenChange(true);
          onRefresh();
        },
        failure: (e) =>
          setError(
            e instanceof Error ? e.message : 'Could not open page chat.',
          ),
        settled: () => setBusy(false),
      },
    );
  };
  if (thread && wakie && thread.wakieId === wakie.id)
    return (
      <aside className="document-chat-panel" aria-label="Page conversation">
        <div className="document-chat-heading">
          <span>
            <MessageCircle size={16} /> Page conversation
          </span>
          <button
            className="document-icon"
            aria-label="Close page chat"
            onClick={() => {
              setThread(undefined);
              onOpenChange(false);
            }}
          >
            <X size={17} />
          </button>
        </div>
        <Chat
          key={thread.id}
          thread={thread}
          wakie={wakie}
          initialPrompt={pending}
          onConsumed={() => setPending(undefined)}
          voiceReady={workspace.setup.voice}
          calls={workspace.calls.filter((call) => call.threadId === thread.id)}
          paused={paused}
          onSaved={onRefresh}
          onSchedule={() => onSchedule(thread.id)}
        />
      </aside>
    );
  if (!wakie)
    return (
      <div className="document-chat-setup">
        <span>Add a specialist to work with this Space.</span>
        <button onClick={onCreateWakie}>Create specialist</button>
      </div>
    );
  if (workspace.setup.missing.length)
    return (
      <div className="document-chat-setup">
        <span>Connect your assistant to chat about this page.</span>
        <button onClick={onSettings}>Set up assistant</button>
      </div>
    );
  return (
    <div className="document-chat-dock">
      {error && <p role="alert">{error}</p>}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void open();
        }}
      >
        <label className="sr-only" htmlFor="page-prompt">
          Ask about this page
        </label>
        <input
          id="page-prompt"
          placeholder="Ask about this page…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={paused || busy}
        />
        <div className="document-chat-dock-bottom">
          <label>
            <select
              aria-label="Page specialist"
              disabled={busy}
              value={wakie.id}
              onChange={(e) => setWakieId(e.target.value)}
            >
              {wakies.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <ChevronDown size={12} />
          </label>
          <span>{paused ? 'Assistant paused' : 'Uses this saved page'}</span>
          <button
            type="submit"
            aria-label="Send to page assistant"
            disabled={busy || paused}
          >
            <ArrowUp size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
