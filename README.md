# Payload + Vercel Blob `addRandomSuffix`: the answer carries a URL that does not exist

Minimal reproduction on Payload 3.90.2: with `@payloadcms/storage-vercel-blob` and `addRandomSuffix: true`, the answer of a create, and of a file replacement, carries the new `filename` with the `url` of the name before the suffix. That URL gives 404. The database is right, and a later read gives the right `url`.

The only changes from the `blank` template are the storage plugin in `src/payload.config.ts`, `fixtures/` and `scripts/check.ts`.

## Steps

1. `cp .env.example .env` and fill in `DATABASE_URL`, `PAYLOAD_SECRET` and a Vercel Blob `BLOB_READ_WRITE_TOKEN` (a public store).
2. `pnpm install`
3. `pnpm check` creates a document and replaces its file. Each time, it fetches the `url` of the answer and the `url` of a later read:

```
DEAD  create   answer      HTTP 404  photo-D2Ap3L30Q4GueEBLM5kWlAYEErlBZB.jpg  https://<store>.public.blob.vercel-storage.com/photo.jpg
ok    create   later read  HTTP 200  photo-D2Ap3L30Q4GueEBLM5kWlAYEErlBZB.jpg  https://<store>.public.blob.vercel-storage.com/photo-D2Ap3L30Q4GueEBLM5kWlAYEErlBZB.jpg
DEAD  replace  answer      HTTP 404  photo-LuZRYeK418OOLu6JRa9wUEZUaffBeI.jpg  https://<store>.public.blob.vercel-storage.com/photo.jpg
ok    replace  later read  HTTP 200  photo-LuZRYeK418OOLu6JRa9wUEZUaffBeI.jpg  https://<store>.public.blob.vercel-storage.com/photo-LuZRYeK418OOLu6JRa9wUEZUaffBeI.jpg
```

Each run leaves one file in the store: the replacement deletes the first one. A `POST /api/media` with a file answers the same way.

## Why

The adapter's `handleUpload` sets the new name on the document it was given, and returns the whole document:

```js
if (result.filename) {
    data.filename = result.filename;
}
return data;
```

That document already holds a `url` built from the first name. `plugin-cloud-storage`'s `afterChange` hook merges what `handleUpload` returns, saves it, and returns `{ ...doc, ...uploadMetadata }`. So the answer has the new `filename` and the old `url`. On a read, the `url` is built again from the stored `filename`, and it is right.

The collection here has `disablePayloadAccessControl: true`, so that `url` is the file's URL in the store and the script can fetch it with no server running.
