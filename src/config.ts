import { CookieSerializeOptions } from "cookie";
import { URLSearchParams } from "url";
import { SessionStore } from "./store";
import { daysToMaxAge } from "./utils";

export interface CookieOptions extends CookieSerializeOptions {
  name: string;
  store?: SessionStore;
}

export const IS_DEV = process.env?.NODE_ENV === "development";

export class KitSession {
  public static options: CookieOptions = {
    name: "session",
    secure: !IS_DEV,
    httpOnly: true,
    path: "/",
    maxAge: daysToMaxAge(),
    sameSite: "strict",
  };
}

export interface ServerContext {
  host: string;
  path: string;
  headers: Record<string, string>;
  query: URLSearchParams;
  body: Record<string, any>;
  params: Record<string, any>;
}

export interface ServerFunctionReturnType {
  body: Record<string, any>;
  headers?: Record<string, any>;
  status?: number;
  session?: {
    id?: string;
    data: Record<any, any>;
    userId?: number;
  };
}

export type ServerFunction<Ctx = any> = (
  context: ServerContext,
  params: Ctx
) => ServerFunctionReturnType | Promise<ServerFunctionReturnType>;
