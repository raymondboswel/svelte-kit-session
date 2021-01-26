import type { Session, SessionArgsData } from "../store";
import { SessionStore } from "../store";

interface PClient {
  session: any,
  user?: any,
}

export class PrismaStore<PrismaClient extends PClient> extends SessionStore {
  client: PrismaClient;
  select: Record<string, any>;

  /** `client`: PrismaClient */
  constructor(
    client: PrismaClient,
    /** The fields you want to select from the session/user table */
    select: Record<string, any> = { id: true, data: true, userId: true }
  ) {
    super();
    this.client = client;
    this.select = select;
  }

  /** `id`: string */
  async get(id: string) {
    const session = await this.client.session.findUnique({
      where: { id },
      select: this.select,
    });
    return (session as unknown) as Session;
  }

  async getAll() {
    const sessions = await this.client.session.findMany();
    return (sessions as unknown) as any[];
  }

  async create(data: SessionArgsData): Promise<Session> {
    const session = await this.client.session.create({
      data: {
        data: data.data,
        user: {
          connect: {
            id: data.userId,
          },
        },
      },
    });
    return session as Session;
  }

  async delete(id: string) {
    try {
      await this.client.session.delete({ where: { id } });
      return true;
    } catch (error) {
      return false;
    }
  }

  async deleteAllForUser(userId: number, session: Session) {
    try {
      await this.client.session.deleteMany({
        where: { user: { id: userId }, id: { not: session.id } },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  //@ts-ignore TOOD: Fix this type error
  async set<U = any>(id: string, data: SessionArgsData) {
    const session = await this.client.session.findUnique({ where: { id } });
    if (!session) {
      return null;
    }
    const ses = await this.client.session.update({
      data: {
        data: data.data,
      },
      where: {
        id,
      },
    });
    return (ses as unknown) as Session<U>;
  }
}
