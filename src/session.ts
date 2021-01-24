import { parse } from "cookie";
import { CookieOptions, KitSession } from "./config";
import { SessionArgsData } from "./store";

export async function initializeSession(
  headers: Record<string, any>,
  opts: CookieOptions
) {
  KitSession.options = Object.assign(KitSession.options, opts);

  const cookies = parse(headers.cookie ?? "");
  const cookie = cookies[opts.name];

  if (!cookie) {
    return;
  }

  const session = await getSession(cookie);

  if (session == null) {
    return;
  }
  if (session.data.maxAge < Date.now()) {
    removeSession(session.id);
    return;
  }

  return session;
}

export function removeAllSessionsForUser(userId: number) {
  return KitSession.options.store!.deleteAllForUser(userId);
}
export function removeSession(id: string) {
  return KitSession.options.store!.delete(id);
}
export function getAllSessions() {
  return KitSession.options.store!.getAll();
}
export function getSession(id: string) {
  return KitSession.options.store!.get(id);
}
export function createSession(args: SessionArgsData) {
  return KitSession.options.store!.create(args);
}
export function setSession(id: string, data: SessionArgsData) {
  return KitSession.options.store!.set(id, data);
}
