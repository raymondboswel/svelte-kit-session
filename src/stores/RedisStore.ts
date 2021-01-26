import { promisify } from "util";
import { SessionStore } from "..";
import { KitSession } from "../config";
import { SessionArgsData, Session } from "../store";

interface RedisOptions {
  prefix?: string;
  scanCount?: number;
}

export class RedisStore extends SessionStore {
  client: any;
  prefix: string;
  ttl: number;
  scanCount: number;
  getAsync: (key: string) => Promise<any>;
  mgetAsync: (keys: string[]) => Promise<any>;
  delAsync: (key: string | string[]) => Promise<any>;
  setAsync: (...args: any[]) => Promise<any>;
  scanAsync: (...args: any[]) => Promise<any>;

  constructor(client: any, opts: RedisOptions = {}) {
    super();
    this.client = client;
    this.prefix = opts.prefix == null ? "sess:" : opts.prefix;
    this.scanCount = Number(opts.scanCount) || 100;
    this.ttl = KitSession.options.maxAge!;
    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setAsync = promisify(this.client.set).bind(this.client);
    this.delAsync = promisify(this.client.del).bind(this.client);
    this.scanAsync = promisify(this.client.scan).bind(this.client);
    this.mgetAsync = promisify(this.client.mget).bind(this.client);
  }
  async get(id: string) {
    let key = this.prefix + id;
    try {
      const data = await this.getAsync(key);
      const parsed = JSON.parse(data);
      return parsed;
    } catch (error) {
      return null;
    }
  }
  async getAll() {
    let prefixLen = this.prefix.length;
    const keys = await this._getAllKeys();

    if (!keys || keys.length === 0) {
      return [];
    }

    const sessions = await this.mgetAsync(keys);
    let result: any[];
    try {
      result = sessions.reduce((accum: any[], data: any, index: number) => {
        if (!data) return accum;
        data = JSON.parse(data);
        data.id = keys[index].substr(prefixLen);
        accum.push(data);
        return accum;
      }, []);
    } catch (error) {
      return [];
    }
    // Return all sessions
    return result;
  }
  async create(data: SessionArgsData): Promise<Session> {
    const id = KitSession.options.store?.createId()!;
    const userId = data.userId;
    const session = {
      id,
      data: data.data,
      userId,
    };
    let args: any[] = [this.prefix + session.id];
    const value = session.data;
    args.push(value);
    args.push("EX", this.ttl);
    await this.setAsync(args);
    return session;
  }
  async delete(id: string) {
    // Delete the session
    await this.delAsync(this.prefix + id);
    return true; // || false;
  }
  async deleteAllForUser(userId: number, session: Session) {
    let prefixLen = this.prefix.length;
    const keys = await this._getAllKeys();
    if (!keys || keys.length === 0) {
      return false;
    }
    const sessions = await this.mgetAsync(keys);
    let toDelete: any[] = [];
    try {
      sessions.forEach((data: string, index: number) => {
        if (!data) return;
        const dt = JSON.parse(data);
        dt.id = keys[index].substr(prefixLen);
        if (dt.id === session.id) {
          return;
        }
        if (dt.userId) {
          if (Number(dt.userId) === userId) {
            toDelete.push(this.prefix + dt.id);
          }
        }
      });
    } catch (error) {
      return false;
    }
    await this.delAsync(toDelete);
    return true;
  }
  async set(id: string, data: SessionArgsData) {
    const userId = data.userId;
    const session = {
      id,
      data: data.data,
      userId,
    };
    let args: any[] = [this.prefix + session.id];
    const value = session.data;
    args.push(value);
    args.push("EX", this.ttl);
    await this.setAsync(args);
    return session;
  }

  async _scanKeys(
    keys: any = {},
    cursor: any,
    pattern: string,
    count: number
  ): Promise<string[]> {
    let args = [cursor, "match", pattern, "count", count];
    const data = await this.scanAsync(args);
    let [nextCursorId, scanKeys] = data;

    for (let key of scanKeys) {
      keys[key] = true;
    }
    // This can be a string or a number. We check both.
    if (Number(nextCursorId) !== 0) {
      return this._scanKeys(keys, nextCursorId, pattern, count);
    }
    return Object.keys(keys);
  }

  async _getAllKeys() {
    let pattern = this.prefix + "*";
    return this._scanKeys({}, 0, pattern, this.scanCount);
  }
}
