import type { ISessionStore, SessionMessage, GameStateSnapshot } from "../contracts/session.contracts.js";

/**
 * Abstract Base Class for Deterministic Session State Store.
 * Provides immutable frame-perfect snapshotting and state rewind/replay.
 */
export abstract class AbstractSessionStore implements ISessionStore {
  protected messages: SessionMessage[];

  constructor(initialMessages: SessionMessage[] = []) {
    this.messages = [...initialMessages];
  }

  addMessage(message: Omit<SessionMessage, "timestamp">): SessionMessage {
    const fullMessage: SessionMessage = {
      ...message,
      timestamp: Date.now(),
    };
    this.messages.push(fullMessage);
    return fullMessage;
  }

  getMessages(): readonly SessionMessage[] {
    return this.messages;
  }

  clear(): void {
    this.messages.length = 0;
  }

  abstract createSnapshot(frameIndex: number): GameStateSnapshot;
  abstract rewindToSnapshot(snapshot: GameStateSnapshot): void;
}
