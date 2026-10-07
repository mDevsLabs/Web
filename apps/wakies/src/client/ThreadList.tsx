import { useThreads } from '@copilotkit/react-core/v2';
import { MessageCircle, Plus } from 'lucide-react';
import type { Conversation, Wakie } from '../shared/types';
export function ThreadList({
  wakies,
  wakieId,
  local,
  selected,
  onSelect,
  onNew,
}: {
  wakies: Wakie[];
  wakieId: string;
  local: Conversation[];
  selected?: string;
  onSelect: (id: string) => void;
  onNew: () => void;
}) {
  const threads = useThreads({
    agentId: wakieId,
    enabled: true,
    includeArchived: false,
    limit: 20,
  });
  return (
    <section className="thread-list">
      <div className="nav-label">
        RECENT CHATS
        <button
          className="icon-button"
          onClick={onNew}
          aria-label="New conversation"
        >
          <Plus size={14} />
        </button>
      </div>
      {threads.error && (
        <p className="sidebar-error">
          Conversation sync unavailable. Check your runtime connection.
        </p>
      )}
      {local.map((thread) => {
        const remote = threads.threads.find((item) => item.id === thread.id);
        return (
          <button
            key={thread.id}
            className={`nav-item ${selected === thread.id ? 'active' : ''}`}
            onClick={() => onSelect(thread.id)}
          >
            <MessageCircle size={15} />
            <span className="thread-summary">
              <span>{remote?.name || thread.title}</span>
              <small>{wakies.find((wakie) => wakie.id === thread.wakieId)?.name}</small>
            </span>
          </button>
        );
      })}
      {!local.length && (
        <p className="sidebar-empty">Your first conversation will live here.</p>
      )}
      {threads.hasMoreThreads && (
        <button
          className="text-button"
          disabled={threads.isFetchingMoreThreads}
          onClick={() => void threads.fetchMoreThreads()}
        >
          Load more conversations
        </button>
      )}
    </section>
  );
}
