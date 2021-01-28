import { createId } from "./utils";

export interface SessionData {
  maxAge?: number;
  [key: string]: any;
}

export interface SessionArgsData {
  userId?: number;
  data: any;
}

export interface Session<U = any> {
  id: string;
  data: SessionData;
  temporary?: boolean;
  status?: "needs-deletion" | "temporary" | "active" | 'needs-save';
  userId?: number;
  user?: U;
  [key: string]: any;
}

export interface InternalSession {
  __INTERNAL_SVKIT_SESSION__?: { id: string; data: any; userId: number };
}

export abstract class SessionStore {
  constructor() {}

  public createId() {
    return createId();
  }

  abstract set<U = any>(
    id: string,
    data: SessionArgsData
  ): Session<U> | Promise<Session<U>> | undefined | null;

  abstract create<U = any>(
    data: SessionArgsData
  ): Session<U> | Promise<Session<U>>;

  abstract get<U = any>(
    id: string
  ): Session<U> | Promise<Session<U>> | null | undefined;

  abstract getAll<U = any>(): Session<U>[] | Promise<Session<U>[]>;

  abstract delete(id: string): boolean | Promise<boolean>;

  abstract deleteAllForUser(
    userId: number,
    session: Session
  ): boolean | Promise<boolean>;
}
