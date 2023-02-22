# Popcorn Time

A favourites movie listing app built with express, libSQL, and Vue.js

The project's set up as a pnpm workspace.

Install dependencies.
```sh
pnpm install --filter ./apps/server && pnpm install --filter ./apps/client
```

## Server - `./apps/server`

The server is an express app.

Set up the `apps/server/.env` file with the environment variables needed (there is an example in `apps/server/.sample.env`),
then serve by running:

```sh
pnpm --filter ./apps/server dev
```

## Client - `./apps/client`

The front-end client is a Vue.js app.

Set up the `apps/client/.env` file with the environment variables needed (there is an example in `apps/client/.sample.env`),
then serve by running:

```sh
pnpm --filter ./apps/client dev
```
