import * as fs from 'fs'
import * as http from 'http'
import * as https from 'https'
import * as path from 'path'

const CATALOG_PATH = path.resolve(
  __dirname,
  '../schemastore/src/api/json/catalog.json',
)
const LOCAL_SCHEMAS_DIR = path.resolve(
  __dirname,
  '../schemastore/src/schemas/json',
)
const OUTPUT_SCHEMAS_DIR = path.resolve(__dirname, '../schemas')
const SCHEMASTORE_OUT_DIR = path.resolve(
  OUTPUT_SCHEMAS_DIR,
  'www.schemastore.org',
)
const PACKAGE_JSON_PATH = path.resolve(__dirname, '../package.json')

const SCHEMASTORE_HOSTS = new Set([
  'www.schemastore.org',
  'json.schemastore.org',
  'schemastore.org',
])

interface CatalogEntry {
  name: string
  description?: string
  fileMatch?: string[]
  url: string
  versions?: Record<string, string>
}

interface Catalog {
  schemas: CatalogEntry[]
}

function urlToDestPath(url: string): string {
  const parsed = new URL(url)
  const segments = parsed.pathname.split('/').filter(Boolean)
  return path.join(OUTPUT_SCHEMAS_DIR, parsed.hostname, ...segments)
}

function urlToRelativePath(url: string): string {
  const parsed = new URL(url)
  const segments = parsed.pathname.split('/').filter(Boolean)
  return './schemas/' + [parsed.hostname, ...segments].join('/')
}

function isSchemaStoreHost(url: string): boolean {
  return SCHEMASTORE_HOSTS.has(new URL(url).hostname)
}

function bulkCopyLocalSchemas(): void {
  fs.mkdirSync(SCHEMASTORE_OUT_DIR, { recursive: true })
  const files = fs
    .readdirSync(LOCAL_SCHEMAS_DIR)
    .filter(f => f.endsWith('.json'))
  for (const file of files) {
    fs.copyFileSync(
      path.join(LOCAL_SCHEMAS_DIR, file),
      path.join(SCHEMASTORE_OUT_DIR, file),
    )
  }
  console.log(`Bulk-copied ${files.length} local schemastore schemas`)
}

function download(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http
    proto.get
    const req = proto.get(url, { timeout: 15000 }, res => {
      if (
        res.statusCode &&
        res.statusCode >= 300 &&
        res.statusCode < 400 &&
        res.headers.location
      ) {
        download(res.headers.location, dest).then(resolve, reject)
        return
      }
      if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`))
        return
      }
      fs.mkdirSync(path.dirname(dest), { recursive: true })
      const file = fs.createWriteStream(dest)
      res.pipe(file)
      file.on('finish', () => file.close(() => resolve()))
      file.on('error', reject)
    })
    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error(`Timeout: ${url}`))
    })
  })
}

async function downloadWithRetry(
  url: string,
  dest: string,
  retries = 3,
): Promise<boolean> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await download(url, dest)
      return true
    } catch (err) {
      if (attempt === retries) {
        console.warn(`  SKIP (${(err as Error).message}): ${url}`)
        return false
      }
      await new Promise(r => setTimeout(r, attempt * 1000))
    }
  }
  return false
}

async function processBatch(
  entries: CatalogEntry[],
  jsonValidation: Array<{ fileMatch: string; url: string }>,
  stats: { ok: number; skip: number },
): Promise<void> {
  await Promise.all(
    entries.map(async entry => {
      const dest = urlToDestPath(entry.url)

      // schemastore.org files are already bulk-copied; just verify presence
      if (isSchemaStoreHost(entry.url)) {
        if (!fs.existsSync(dest)) {
          console.warn(`  SKIP (local file missing): ${path.basename(dest)}`)
          stats.skip++
          return
        }
      } else {
        const ok = await downloadWithRetry(entry.url, dest)
        if (!ok) {
          stats.skip++
          return
        }
      }

      // Safety net: only add to jsonValidation if the file actually exists on disk
      if (!fs.existsSync(dest)) {
        console.warn(`  SKIP (file not on disk after write): ${dest}`)
        stats.skip++
        return
      }

      stats.ok++
      const relPath = urlToRelativePath(entry.url)
      for (const match of entry.fileMatch!) {
        jsonValidation.push({ fileMatch: match, url: relPath })
      }
    }),
  )
}

async function main(): Promise<void> {
  bulkCopyLocalSchemas()

  const catalog: Catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf-8'))
  const entries = catalog.schemas.filter(
    e => e.url && e.fileMatch && e.fileMatch.length > 0,
  )

  console.log(`Processing ${entries.length} catalog entries with fileMatch...`)

  const jsonValidation: Array<{ fileMatch: string; url: string }> = []
  const stats = { ok: 0, skip: 0 }

  const BATCH_SIZE = 20
  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE)
    process.stdout.write(`\r  ${i}/${entries.length} processed...`)
    await processBatch(batch, jsonValidation, stats)
  }
  process.stdout.write(
    `\r  ${entries.length}/${entries.length} processed.   \n`,
  )

  const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf-8'))
  pkg.contributes.jsonValidation = jsonValidation
  fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(pkg, null, 2) + '\n')

  console.log(
    `\nDone: ${stats.ok} schemas with fileMatch bundled, ${stats.skip} skipped`,
  )
  console.log(
    `Generated ${jsonValidation.length} jsonValidation entries in package.json`,
  )
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
