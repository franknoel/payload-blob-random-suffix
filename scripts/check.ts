// Creates a document and replaces its file. Each time, fetches the `url` of the answer and the
// `url` of a later read.
import path from 'path'
import { getPayload } from 'payload'

import config from '../src/payload.config'

const payload = await getPayload({ config })
const filePath = path.resolve('fixtures', 'photo.jpg')

const report = async (step: string, source: string, doc: { filename?: null | string; url?: null | string }) => {
  const { status } = await fetch(doc.url!, { method: 'HEAD' })
  console.log([status === 200 ? 'ok' : 'DEAD', step, source, `HTTP ${status}`, doc.filename, doc.url].join('\t'))
}

const created = await payload.create({ collection: 'media', data: { alt: 'photo' }, filePath })
await report('create', 'answer', created)
await report('create', 'later read', await payload.findByID({ collection: 'media', id: created.id }))

const replaced = await payload.update({ collection: 'media', id: created.id, data: {}, filePath })
await report('replace', 'answer', replaced)
await report('replace', 'later read', await payload.findByID({ collection: 'media', id: created.id }))
process.exit(0)
