# svelte-kit-session

_🛠 SvelteKit serverside cookie sessions with various adapters/stores (Memory, Prisma, etc.)_

## Installation

This is a [Node.js](https://nodejs.org/en/) module available through the
[npm registry](https://www.npmjs.com/). Installation is done using the
[`npm install` command](https://docs.npmjs.com/getting-started/installing-npm-packages-locally):

```sh
$ npm install svelte-kit-session
```

## API

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
