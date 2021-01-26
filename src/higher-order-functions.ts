import { ServerFunction, ServerContext } from "./config";
import {
  createSession,
  removeSession,
  __INTERNAL_SVKIT_SESSION__,
} from "./session";
import { InternalSession, Session } from "./store";
import { setSessionCookie, removeSessionCookie, signCookie, getSecret } from "./utils";

export const withNewSession = <Ctx = any>(fn: ServerFunction<Ctx>) => async (
  context: ServerContext,
  params: { session?: any }
) => {
  const sfData = await fn(context, params as any);
  const sfSession = sfData?.session as InternalSession;
  const internalSession = sfSession[__INTERNAL_SVKIT_SESSION__];
  if (!internalSession) {
    return sfData;
  }
  const session = await createSession({
    data: internalSession.data,
    userId: internalSession.userId,
  });
  const secret = getSecret();
  const val = signCookie(session.id, secret);
  if (!sfData.headers) {
    sfData.headers = {
      "Set-Cookie": setSessionCookie(val),
    };
  } else {
    sfData.headers!["Set-Cookie"] = setSessionCookie(val);
  }
  return {
    ...sfData,
    session: undefined,
  };
};

export const withDeleteSession = <Ctx = { session?: Session }>(
  fn: ServerFunction<Ctx>
) => async (context: ServerContext, params: { session: Session }) => {
  const sfData = await fn(context, (params as unknown) as Ctx);
  let sessionId = sfData.session?.id
    ? sfData.session.id
    : params?.session?.id
    ? params.session.id
    : undefined;
  if (!sessionId) {
    return sfData;
  }
  await removeSession({ id: sessionId } as Session);
  if (!sfData.headers) {
    sfData.headers = {
      "Set-Cookie": removeSessionCookie(),
    };
  } else {
    sfData.headers!["Set-Cookie"] = removeSessionCookie();
  }
  return {
    ...sfData,
    session: undefined,
  };
};