import { parse } from "cookie";
import { CookieOptions, KitSession } from "./config";
import { Session, SessionArgsData } from "./store";
import { createTemporarySession, daysToMaxAge } from "./utils";

export const __INTERNAL_SVKIT_SESSION__ = "__INTERNAL_SVKIT_SESSION__";

export async function initializeSession(
  headers: Record<string, any>,
  opts: CookieOptions
): Promise<Session> {
  if (!KitSession.options.store) {
    KitSession.options = Object.assign(KitSession.options, opts);
  }

  const cookies = !headers.cookie ? {} : parse(headers.cookie);
  const cookie = cookies[opts.name];

  if (!cookie) {
    return createTemporarySession();
  }

  const session = await getSession(cookie);

  if (session == null) {
    return createTemporarySession();
  }

  if (session.data.maxAge! < Date.now()) {
    await removeSession(session);
    return createTemporarySession();
  }

  session.temporary = false;
  return session;
}
export function removeAllSessionsForUser(userId: number, session: Session) {
  if (!session || session.temporary || !userId) {
    return;
  }
  return KitSession.options.store!.deleteAllForUser(userId, session);
}
export function removeSession(session: Session) {
  if (!session || session.temporary) {
    return;
  }
  return KitSession.options.store!.delete(session.id);
}
export function getAllSessions() {
  return KitSession.options.store!.getAll();
}
export async function getSession(id: string) {
  const session = await KitSession.options.store!.get(id);
  if (typeof session?.data === "string") {
    session.data = JSON.parse(session.data);
  }
  return session;
}
export async function createSession(args: SessionArgsData) {
  if (typeof args.data !== "string") {
    args.data = JSON.stringify({
      ...args.data,
      maxAge: Date.now() + (KitSession.options.maxAge ?? daysToMaxAge()),
    });
  }
  const session = await KitSession.options.store!.create(args);
  return session as Session;
}
export async function setSession(session: Session, data: SessionArgsData) {
  if (!session || session.temporary) {
    return;
  }
  await KitSession.options.store!.set(session.id, data);
}
