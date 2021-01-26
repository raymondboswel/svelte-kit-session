# svelte-kit-session

_🛠 SvelteKit serverside cookie sessions with various adapters/stores (Memory, Prisma, etc.)_

## Installation

This is a [Node.js](https://nodejs.org/en/) module available through the
[npm registry](https://www.npmjs.com/). Installation is done using the
[`npm install` command](https://docs.npmjs.com/getting-started/installing-npm-packages-locally):

```sh
$ npm install svelte-kit-session
```

## Setup

**setup/index.ts**

```ts
// File setup/index.js || setup/index.ts
import { initializeSession, MemoryStore, daysToMaxAge } from "svelte-kit-session";
import type { Session, SessionStore } from "svelte-kit-session";

let store = new MemoryStore();

export const prepare = async (headers: Record<string, string>) => {

  // Initialize the session
  const session = await initializeSession(headers, {
    name: "kit.session" /** The Name of the Session Cookie  */,
    store /** The SessionStore (Memory, Prisma, Redis etc.)  */ ,
    /** secure: false, Default: Prod -> true Dev -> false */,
    httpOnly: true /** Default */,
    path: "/" /** Default */,
    /** maxAge: daysToMaxAge(14) */,
    sameSite: "strict" /** Default */,
    signed: false, /** Default */,
    /** keys: ["SOME_SECRET_KEY"],  */
  });

  // You can load the user with the session from the database here and set it to to context too.
  // This is important for the session to work
  return { context: { session /** user: user */ } };
};

export async function getSession(context: {
  session: Session /** user: User */,
}) {
  // This will seed the svelte kit session store.
  return {
    user: context?.user,
  };
}
```

## Higher Order Functions -> Server Routes

##### These HOCS are just wrappers around the utility functions.

#### `withNewSession`

Creates a new Session and sets the client cookie, you need to pass the session from the params into the return

```ts
// file routes/login.ts

import { withNewSession } from "svelte-kit-session";
import type { ServerFunction } from "svelte-kit-session";

export const post: ServerFunction = withNewSession<{ session: any; db: any }>(
  async (ctx, { session, db }) => {
    const { email, password } = ctx.body;

    const user = await db.user.findUnique({ where: { email } });

    const verifyPassword = await verify(user.password, password);

    /**
     *
     * You need to set your session data into the session.data object
     * If you set a id or user_id oder userId the store will receive
     * these foreign key as userId so it can create a relation to the user
     *
     */
    session.data = {
      email: user.email,
      username: user.username,
      id: user.id,
    };

    /** Pass the session in the return */
    return {
      body: {
        ok: true,
      },
      session,
    };
  }
);
```

#### `withDeleteSession`

Removes the current session from the store and deletes the client cookie

```ts
// file routes/login.ts

import { withDeleteSession } from "svelte-kit-session";
import type { ServerFunction } from "svelte-kit-session";

export const post: ServerFunction = withDeleteSession((ctx, params) => {
  return {
    body: {
      ok: true,
    },
  };
});
```

## Utilities

#### `removeAllSessionsForUser(userId: number, session: Session)`

This will remove all sessions for the user but the current, e.g. to implement sign out from all devices.

#### `removeSession(session: Session)`

This will remove the current session from the store, you need to manually remove the cookie if you like to remove it.

```ts
// file routes/logout.ts

import { removeSession, removeSessionCookie } from "svelte-kit-session";
import type { ServerFunction } from "svelte-kit-session";

export const post: ServerFunction = async function (ctx, { session }) {
  await removeSession(session);

  return {
    headers: {
      "Set-Cookie": removeSessionCookie(),
    },
    body: {
      ok: true,
    },
  };
};
```

#### `getAllSessions()`

Returns all sessions

#### `getSession(id: string)`

Retrieves the session with the given id from the store

#### `createSession({ userId, data }: { userId: number, data: any })`

Creates and saves a new session to the store, returns the saved session. You need to manually send the cookie to the client with this approach.

```ts
// file routes/login.ts

import { createSession, setSessionCookie } from "svelte-kit-session";
import type { ServerFunction } from "svelte-kit-session";

export const post: ServerFunction = async function (ctx) {
  const session = await createSession({
    userId: 1,
    data: { email: "kit@session.com" },
  });

  return {
    headers: {
      /** Creates the cookie string from the options
       *  specified in the initializeSession function,
       * also signs it if you selected signed: true */
      "Set-Cookie": setSessionCookie(session.id),
    },
    body: {
      ok: true,
    },
  };
};
```

#### `setSession(session: Session, { data }: { data: any })`

Updates the given session with the new data

## Stores

#### [MemoryStore](./src/stores/MemoryStore.ts)

##### <span style="color: red">Please use this store only in development, it will not scale past one process.</span>

#### [PrismaStore](./src/stores/PrismaStore.ts)

The following schema was used for the prisma store, i recommend to implement it the same or look at the PrismaStore source code to change it to your needs.

```
model User {
  id        Int       @id @default(autoincrement())
  Session   Session[]
}

model Session {
  id        String   @id @default(uuid())
  data      Json?
  user      User?    @relation(fields: [userId], references: [id])
  userId    Int?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

```ts
import { PrismaClient } from "@prisma/client";
import { initializeSession, PrismaStore } from "svelte-kit-session";
const db = new PrismaClient({ log: ["error", "query", "warn"] });

let SessionStore = new PrismaStore(db, {
  id: true,
  userId: true,
  data: true,
  user: {
    select: {
      id: true,
      email: true,
      username: true,
    },
  },
});

export const prepare = async (headers: Record<string, string>) => {
  const session = await initializeSession(headers, {
    name: "kit.session",
    store: SessionStore,
    signed: true,
    keys: ["SOME_SECRET_KEY"],
  });
  return { context: { db, session, user: session?.user ?? null } };
};
```

#### [RedisStore](./src/stores/RedisStore.ts)

```ts

import { promisify } from "util";
import { initializeSession } from "svelte-kit-session";
import redis from "redis";
import { RedisStore } from "svelte-kit-session";

let redisClient = redis.createClient({});

const getAsync = promisify(redisClient.get).bind(redisClient);
const setAsync = promisify(redisClient.set).bind(redisClient);
const delAsync = promisify(redisClient.del).bind(redisClient);

const client = {
  get: getAsync,
  set: setAsync,
  del: delAsync,
};

let SessionStore = new RedisStore(redisClient);

export const prepare = async (headers: Record<string, string>) => {
  const session = await initializeSession(headers, {
    name: "kit.session",
    store: SessionStore,
    signed: true,
    keys: ["SOME_SECRET_KEY"],
  });
  return { context: { client, session, user: session?.user ?? null } };
};


```

- [ ] PostgresStore
- [ ] MysqlStore

#### If you'd like to add your own store to this list please open a pull request.

```ts
import { KitSession } from "svelte-kit-session";
import { Session, SessionArgsData, SessionStore } from "svelte-kit-session";

/**
 *
 * KitSession.options contains all the cookie options, max age, etc.
 *
 */

export class ExampleStore extends SessionStore {
  constructor() {
    super();
  }
  get(id: string) {
    // Return session by id;
    const session = {};
    return session;
  }
  getAll() {
    const session = [];
    // Return all sessions
    return [];
  }
  create(data: SessionArgsData): Session {
    const id = KitSession.options.store?.createId(); // Create a unique id,
    const sessionData = data.data; // Json stringified payload
    const userId = data.userId; // Optional userId for references,
    const session = {
      id,
      data: sessionData,
      userId,
    };
    // Save the session into Redis, PG, MYSQL, ... and return it
    return session;
  }
  delete(id: string) {
    // Delete the session
    return true; // || false;
  }
  deleteAllForUser(userId: number, session: Session) {
    // Delete all sessions but the current for the current user, only possible if a userId was referenced.
    return true; // || false;
  }
  set(id: string, data: SessionArgsData) {
    const session = {};
    // Update the session and return it;
    return this.sessions[sessionIndex];
  }
}
```

#### If you like to contribute, feel free to do so. 
#### If you have issues or want changes/features open an issue and i will look into it.
