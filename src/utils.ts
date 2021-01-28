import { serialize } from "cookie";
import { KitSession } from "./config";
import signature from "cookie-signature";
import { __INTERNAL_SVKIT_SESSION__ } from "./session";
import { v4 as uuid } from "@lukeed/uuid/secure";

export const daysToMaxAge = (days: number = 14) => days * 24 * 60 * 60 * 1000;

export const createId = uuid;

export const setSessionCookie = (sessionId: string) => {
  if (KitSession.options.signed) {
    const secret = getSecret();
    sessionId = signCookie(sessionId, secret);
  }
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

export const getSecret = () => {
  const secret = KitSession?.options?.keys?.[0] ?? "";
  if (secret.length === 0) {
    throw new Error("[keys] required for signed cookie sessions");
  }
  return secret;
};

export const createTemporarySession = (): any => {
  const session = {
    id: null,
    temporary: true,
    status: 'new',
    data: "",
  };
  return new Proxy(session, {
    set: function (target: any, key, value) {
      target[key] = value;
      if (
        target[__INTERNAL_SVKIT_SESSION__] ||
        key === "temporary" ||
        key === "id" ||
        key === "user"
      ) {
        return false;
      }
      if (key === "data") {
        target[__INTERNAL_SVKIT_SESSION__] = {
          id: target?.id ?? KitSession.options.store?.createId(),
          data: JSON.stringify({
            ...value,
            maxAge: Date.now() + (KitSession.options.maxAge ?? daysToMaxAge()),
          }),
          userId: value?.id
            ? value.id
            : value?.userId
            ? value.userId
            : value.user_id
            ? value.user_id
            : undefined,
        };
      }
      return true;
    },
  });
};

export function signedCookie(str: string, secret: string | string[]) {
  if (typeof str !== "string") {
    return undefined;
  }

  if (str.substr(0, 2) !== "s:") {
    return str;
  }

  var secrets = !secret || Array.isArray(secret) ? secret || [] : [secret];

  for (var i = 0; i < secrets.length; i++) {
    var val = signature.unsign(str.slice(2), secrets[i]);

    if (val !== false) {
      return val;
    }
  }

  return false;
}

export function signCookie(str: string, secret: string) {
  return "s:" + signature.sign(str, secret);
}
