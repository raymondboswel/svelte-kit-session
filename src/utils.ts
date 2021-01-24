import { serialize } from "cookie";
import { KitSession } from "./config";

export const daysToMaxAge = (days: number = 14) => days * 24 * 60 * 60 * 1000;

export const setSessionCookie = (sessionId: string) => {
  return serialize(KitSession.options.name, sessionId, {
    secure: KitSession.options.secure,
    sameSite: KitSession.options.sameSite,
    expires: new Date(Number(new Date()) + KitSession.options.maxAge!),
    httpOnly: KitSession.options.httpOnly,
    path: KitSession.options.path,
  });
};

export const removeSessionCookie = () => {
  return serialize(KitSession.options.name, "", {
    secure: KitSession.options.secure,
    sameSite: KitSession.options.sameSite,
    maxAge: -100,
    httpOnly: KitSession.options.httpOnly,
    path: KitSession.options.path,
  });
};
