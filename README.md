# Popcorn Time

A favourites movie listing app built with express, libSQL, and Vue.js

The project's set up as a pnpm workspace.

Install dependencies.
```sh
pnpm install --filter ./apps/server && pnpm install --filter ./apps/client
```

## Server - `./apps/server`

The server is an express app.

Serve by running.

```sh
pnpm --filter ./apps/client dev
```

## Client - `./apps/client`

The front-end client is a Vue.js app.

Serve by running.

```sh
pnpm --filter ./apps/client dev
```