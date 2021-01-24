import { v4 as uuid } from "@lukeed/uuid/secure";

export interface SessionData<U = any> {
  data: Record<any, any>;
  maxAge: number;
}

export interface SessionArgsData {
  userId?: number;
  data: Record<any, any>;
}

export interface Session<U = any> {
  id: string;
  data: SessionData<U>;
  userId?: number;
  user?: U;
  create?: () => Session<U>;
  remove?: () => boolean;
  refresh?: () => Session<U>;
}

export abstract class SessionStore {
  constructor() {}

  public createId() {
    return uuid();
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

  abstract deleteAllForUser(userId: number): boolean | Promise<boolean>;
}
