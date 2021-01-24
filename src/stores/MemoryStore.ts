import { KitSession } from "../config";
import { Session, SessionArgsData, SessionStore } from "../store";
import { daysToMaxAge } from "../utils";

export class MemoryStore extends SessionStore {
  sessions: Session[];

  constructor() {
    super();
    this.sessions = [];
  }

  get(id: string) {
    return this.sessions.find((ses) => ses.id === id);
  }

  getAll() {
    return this.sessions;
  }

  create(data: SessionArgsData): Session {
    const session = {
      id: this.createId(),
      data: {
        ...data,
        maxAge: Date.now() + (KitSession.options.maxAge ?? daysToMaxAge()),
      },
      userId: data.userId,
    };
    this.sessions.push(session);
    return session;
  }

  delete(id: string) {
    this.sessions = this.sessions.filter((ses) => ses.id !== id);
    return true;
  }

  deleteAllForUser(userId: number) {
    this.sessions = this.sessions.filter((ses) => ses.userId !== userId);
    return true;
  }

  set(id: string, data: SessionArgsData) {
    const sessionIndex = this.sessions.findIndex((ses) => ses.id === id);
    if (sessionIndex === -1) {
      return null;
    }
    const session = this.sessions[sessionIndex];
    this.sessions[sessionIndex] = {
      id: session.id,
      userId: data.userId,
      data: {
        ...data,
        maxAge: Date.now() + (KitSession.options.maxAge ?? daysToMaxAge()),
      },
    };
    return this.sessions[sessionIndex];
  }
}
