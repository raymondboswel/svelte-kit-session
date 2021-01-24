import { ServerFunction, ServerContext } from "./config";
import { createSession, removeSession } from "./session";
import { setSessionCookie, removeSessionCookie } from "./utils";

export const withNewSession = <Ctx = any>(fn: ServerFunction<Ctx>) => async (
  context: ServerContext,
  params: Ctx
) => {
  const sfData = await fn(context, params);
  if (!sfData.session || Object.keys(sfData.session.data).length === 0) {
    return sfData;
  }
  const session = await createSession({
    data: sfData.session.data,
    userId: sfData.session?.userId,
  });
  if (!sfData.headers) {
    sfData.headers = {
      "Set-Cookie": setSessionCookie(session.id),
    };
  } else {
    sfData.headers!["Set-Cookie"] = setSessionCookie(session.id);
  }

  return {
    ...sfData,
    session: undefined,
  };
};

export const withDeleteSession = <Ctx = any>(fn: ServerFunction) => async (
  context: ServerContext,
  params: Ctx
) => {
  const sfData = await fn(context, params);
  if (!sfData.session?.id) {
    return sfData;
  }
  await removeSession(sfData.session.id);
  if (!sfData.headers) {
    sfData.headers = {
      "Set-Cookie": removeSessionCookie(),
    };
  }
  sfData.headers!["Set-Cookie"] = removeSessionCookie();
  return {
    ...sfData,
    session: undefined,
  };
};
