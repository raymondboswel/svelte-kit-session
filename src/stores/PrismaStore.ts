import type { Session, SessionArgsData } from "../store";
import { SessionStore } from "../store";

export class PrismaStore extends SessionStore {

  client: any;

  /** `client`: PrismaClient */
  constructor(client: any) {
    super();
    this.client = client;
  }

  /** `id`: string, `select`: Select the Fields from the session table via select { id: true ... } */
  async get(id: string, select?: Record<string, any>) {
    if (!select) {
      select = {
        id: true,
        data: true,
        userId: true,
      };
    }
    const session = await this.client.session.findUnique({
      where: { id },
      select,
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
