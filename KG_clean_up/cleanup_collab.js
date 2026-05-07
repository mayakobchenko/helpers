//dry run (DRY_RUN = true, the default)
// actual cleanup — set DRY_RUN = false
//The deletion order matters — states are deleted before their parent subjects/samples, subjects before persons, to avoid dangling references
import dotenv from 'dotenv'
dotenv.config({ path: './.env' })

// ── config ────────────────────────────────────────────────────────────────────

const MY_TOKEN  = process.env.MAYA_EBRAIN_TOKEN
const SPACE     = 'collab-d-724d4af0-fe28-4032-8837-120b0d64a81c'
const DSV_UUID  = '724d4af0-fe28-4032-8837-120b0d64a81c'
const KG_BASE   = 'https://core.kg.ebrains.eu/v3'
const KG_PREFIX = 'https://kg.ebrains.eu/api/instances/'

const DRY_RUN   = true   // ← set to false to actually delete

// ── types to clean up ─────────────────────────────────────────────────────────

const TYPES_TO_DELETE = [
  'SubjectState',
  'TissueSampleState',
  'Subject',
  'SubjectGroup',
  'TissueSample',
  'TissueSampleCollection',
  'Person',
]

// ── request helpers ───────────────────────────────────────────────────────────

const headers = {
  'Accept':        '*/*',
  'Authorization': `Bearer ${MY_TOKEN}`,
  'Content-Type':  'application/json',
}

async function kgGet(url) {
  const resp = await fetch(url, { headers })
  if (!resp.ok) throw new Error(`GET ${url} → ${resp.status} ${await resp.text().catch(() => '')}`)
  return resp.json()
}

async function kgDelete(uuid) {
  const url  = `${KG_BASE}/instances/${uuid}?space=${SPACE}`
  if (DRY_RUN) {
    console.log(`  [DRY RUN] would DELETE ${KG_PREFIX}${uuid}`)
    return true
  }
  const resp = await fetch(url, { method: 'DELETE', headers })
  if (resp.ok) {
    console.log(`  DELETED ${KG_PREFIX}${uuid}`)
    return true
  } else {
    console.error(`  ERROR deleting ${uuid}: ${resp.status} ${await resp.text().catch(() => '')}`)
    return false
  }
}

// ── fetch all instances of a type from the collab space ───────────────────────

async function fetchAllOfType(typeName) {
  const instances = []
  let   from      = 0
  const size      = 100

  while (true) {
    const url  = (
      `${KG_BASE}/instances` +
      `?stage=IN_PROGRESS` +
      `&space=${SPACE}` +
      `&type=https://openminds.om-i.org/types/${typeName}` +
      `&size=${size}&from=${from}`
    )
    const body  = await kgGet(url)
    const items = body.data || []
    instances.push(...items)
    console.log(`  fetched ${instances.length}/${body.total ?? '?'} ${typeName}…`)
    if (items.length < size) break
    from += size
  }
  return instances
}

// ── delete all instances of a given type ─────────────────────────────────────

async function deleteAllOfType(typeName) {
  console.log(`\n── ${typeName} ──`)
  let instances
  try {
    instances = await fetchAllOfType(typeName)
  } catch (err) {
    console.error(`  Could not fetch ${typeName}: ${err.message}`)
    return 0
  }

  console.log(`  Found ${instances.length} ${typeName} instances`)
  let deleted = 0

  for (const item of instances) {
    const uuid = item['@id'].split('/').pop()
    const label = (
      item['https://openminds.om-i.org/props/lookupLabel'] ||
      item['https://openminds.om-i.org/props/givenName']   ||
      item['https://openminds.om-i.org/props/familyName']  ||
      uuid
    )
    console.log(`  ${typeName}: ${label} (${uuid})`)
    const ok = await kgDelete(uuid)
    if (ok) deleted++
  }

  return deleted
}

// ── fetch and display the DatasetVersion ─────────────────────────────────────

async function inspectDatasetVersion() {
  console.log('\n══════════════════════════════════════════════════')
  console.log('DATASET VERSION INSPECTION')
  console.log('══════════════════════════════════════════════════')

  // ── fetch the DatasetVersion instance ────────────────────────────────────
  const dsvUrl = `${KG_BASE}/instances/${DSV_UUID}?stage=IN_PROGRESS`
  let dsv
  try {
    const body = await kgGet(dsvUrl)
    dsv = body.data
  } catch (err) {
    console.error(`Could not fetch DatasetVersion: ${err.message}`)
    return
  }

  console.log('\n── DatasetVersion fields ──')
  const V = 'https://openminds.om-i.org/props/'
  console.log(`  fullName:    ${dsv[`${V}fullName`] ?? '(none)'}`)
  console.log(`  description: ${(dsv[`${V}description`] ?? '').slice(0, 80)}…`)
  console.log(`  space:       ${dsv['https://core.kg.ebrains.eu/vocab/meta/space'] ?? '(none)'}`)

  // ── find parent Dataset via isVersionOf ───────────────────────────────────
  const isVersionOf = dsv[`${V}isVersionOf`]
  if (isVersionOf) {
    const datasetRef = Array.isArray(isVersionOf) ? isVersionOf[0] : isVersionOf
    const datasetUrl = datasetRef['@id']
    const datasetUUID = datasetUrl.split('/').pop()
    console.log(`\n── Parent Dataset ──`)
    console.log(`  @id:  ${datasetUrl}`)
    console.log(`  uuid: ${datasetUUID}`)

    try {
      const datasetBody = await kgGet(`${KG_BASE}/instances/${datasetUUID}?stage=IN_PROGRESS`)
      const ds = datasetBody.data
      console.log(`  fullName: ${ds[`${V}fullName`] ?? '(none)'}`)
    } catch (err) {
      console.warn(`  Could not fetch parent Dataset: ${err.message}`)
    }
  } else {
    console.log('\n── Parent Dataset ──')
    console.log('  isVersionOf field not found — searching for Dataset that references this DSV…')

    // fallback: search for a Dataset whose hasVersion points to this DSV
    try {
      const searchUrl = (
        `${KG_BASE}/instances` +
        `?stage=IN_PROGRESS` +
        `&space=${SPACE}` +
        `&type=https://openminds.om-i.org/types/Dataset` +
        `&size=10&from=0`
      )
      const searchBody = await kgGet(searchUrl)
      const datasets   = searchBody.data || []
      console.log(`  Found ${datasets.length} Dataset instance(s) in collab space:`)
      for (const ds of datasets) {
        const dsUuid = ds['@id'].split('/').pop()
        const name   = ds[`${V}fullName`] ?? '(no name)'
        console.log(`    uuid: ${dsUuid}  name: ${name}`)
      }
    } catch (err) {
      console.warn(`  Could not search for Dataset: ${err.message}`)
    }
  }

  // ── print full raw JSON for reference ─────────────────────────────────────
  console.log('\n── Full DatasetVersion JSON ──')
  console.log(JSON.stringify(dsv, null, 2))
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!MY_TOKEN) {
    console.error('ERROR: MAYA_EBRAIN_TOKEN is not set in .env')
    process.exit(1)
  }

  console.log(`${ DRY_RUN ? '[DRY RUN] ' : '' }Cleaning up space: ${SPACE}`)
  console.log('════════════════════════════════════════════════════════\n')

  // ── step 1: inspect the DatasetVersion and find parent Dataset ───────────
  await inspectDatasetVersion()

  // ── step 2: delete instances in safe order ────────────────────────────────
  // States first (they reference subjects), then subjects, then persons
  console.log('\n══════════════════════════════════════════════════')
  console.log(`${ DRY_RUN ? '[DRY RUN] ' : '' }CLEANUP`)
  console.log('══════════════════════════════════════════════════')

  let totalDeleted = 0
  for (const typeName of TYPES_TO_DELETE) {
    const count = await deleteAllOfType(typeName)
    totalDeleted += count
  }

  console.log('\n════════════════════════════════════════════════════════')
  console.log(`${ DRY_RUN ? '[DRY RUN] ' : '' }TOTAL instances ${ DRY_RUN ? 'to be ' : '' }deleted: ${totalDeleted}`)
  if (DRY_RUN) {
    console.log('\nThis was a DRY RUN — nothing was deleted.')
    console.log('Set DRY_RUN = false at the top of the script to perform actual cleanup.')
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})