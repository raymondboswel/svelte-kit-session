import { parse } from "cookie";
import { CookieOptions, KitSession } from "./config";
import { Session, SessionArgsData } from "./store";
import { createTemporarySession, daysToMaxAge, signedCookie } from "./utils";

export const __INTERNAL_SVKIT_SESSION__ = "__INTERNAL_SVKIT_SESSION__";

export async function initializeSession(
  headers: Record<string, any>,
  opts: CookieOptions,
  select: Record<string, boolean> = {}
): Promise<Session> {
  if (!KitSession.options.store) {
    KitSession.options = Object.assign(KitSession.options, opts);
  }

  const { signed, keys, name, store } = KitSession.options;

  if (!store) {
    throw new Error("Please use a Session Store.");
  }

  const cookies = !headers.cookie ? {} : parse(headers.cookie);
  let cookie: string = cookies[name];

  if (!cookie || cookie.length === 0) {
    return createTemporarySession();
  }

  if (signed) {
    if (keys && keys.length === 0) {
      throw new Error("[keys] required for signed cookie sessions");
    }
    const secrets = !keys || Array.isArray(keys) ? keys || [] : [keys];
    if (secrets.length !== 0) {
      const sgndCookie = signedCookie(cookie, secrets);
      if (sgndCookie) {
        cookie = sgndCookie;
      } else {
        return createTemporarySession();
      }
    }
  }

  const session = await getSession(cookie, select);

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
export async function getSession(
  id: string,
  select: Record<string, boolean> = {}
) {
  const session = await KitSession.options.store!.get(id, select);
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
