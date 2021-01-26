import { serialize } from "cookie";
import { KitSession } from "./config";
import { __INTERNAL_SVKIT_SESSION__ } from "./session";

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

export const createTemporarySession = (): any => {
  const session = {
    id: null,
    temporary: true,
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
