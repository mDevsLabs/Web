export type QueuedMessage = { id: string; text: string };
type Snapshot = {
  pending: readonly QueuedMessage[];
  running: boolean;
  paused: boolean;
};

/** Port OpenMuse : une génération à la fois, avec une file temporaire contrôlable. */
export class ConversationQueue {
  private state: Snapshot = { paused: false, pending: [], running: false };
  private readonly listeners = new Set<() => void>();
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  private update(patch: Partial<Snapshot>) {
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) listener();
  }
  enqueue(message: QueuedMessage) {
    this.update({ pending: [...this.state.pending, message] });
  }
  remove(id: string) {
    this.update({
      pending: this.state.pending.filter((message) => message.id !== id),
    });
  }
  /** Restaure en tête un message refusé avant exécution. */
  restore(message: QueuedMessage) {
    this.update({
      pending: [
        message,
        ...this.state.pending.filter((queued) => queued.id !== message.id),
      ],
    });
  }
  pause() {
    this.update({ paused: true });
  }
  resume() {
    this.update({ paused: false });
  }
  async flush(send: (message: QueuedMessage) => Promise<void>) {
    if (this.state.running || this.state.paused) return;
    this.update({ running: true });
    try {
      while (this.state.pending.length && !this.state.paused) {
        const [message, ...pending] = this.state.pending;
        this.update({ pending });
        await send(message);
      }
    } catch (error) {
      // Le message échoué est déjà dans le transcript ; aucun rejeu implicite.
      this.update({ paused: true });
      throw error;
    } finally {
      this.update({ running: false });
    }
  }
}
