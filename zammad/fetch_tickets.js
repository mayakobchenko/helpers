import dotenv        from 'dotenv'

dotenv.config()

const ZAMMAD_TOKEN       = process.env.MAYA_ZAMMAD_TOKEN
const ZAMMAD_BASE        = 'https://support.humanbrainproject.eu'
const ZAMMAD_HEADERS     = {
  headers: new Headers({
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${ZAMMAD_TOKEN}`,
    'Accept':        '*/*'
  })
}


// ── GET /api/zammad/zammadinfo ────────────────────────────────────────────────
// Looks up a Zammad ticket by ticket number and extracts the dataset version ID
// and nettskjema submission ID from the ticket title and first article body.

async function getZammadInfo(TicketNumber) {
  try {
    const searchUrl  = `${ZAMMAD_BASE}/api/v1/tickets/search?query=${ticketNumber}`
    const searchResp = await fetch(searchUrl, ZAMMAD_HEADERS)
    if (!searchResp.ok) {
      throw new Error(`Error searching for ticket: ${searchResp.status}`)
    }
    const searchData = await searchResp.json()

    const ticketId   = Array.isArray(searchData.tickets) && searchData.tickets.length > 1
      ? searchData.tickets[0]
      : searchData.tickets

    const ticketInfo = searchData.assets?.Ticket?.[ticketId]
    if (!ticketInfo) {
      throw new Error(`Ticket ${ticketNumber} not found in Zammad`)
    }

    const articleIds = ticketInfo.article_ids || []
    console.log(`found articles ids in the zammad ticket : ${articleIds}`)

    // ── extract collab/dataset version ID from first article body ─────────────
    let collabId         = null
    let datasetVersionId = null

    if (articleIds.length > 0) {
      const articleUrl  = `${ZAMMAD_BASE}/api/v1/ticket_articles/${articleIds[0]}`
      const articleResp = await fetch(articleUrl, ZAMMAD_HEADERS)
      if (!articleResp.ok) {
        throw new Error(`Error fetching article: ${articleResp.status}`)
      }
      const articleData = await articleResp.json()
      collabId          = articleData.body
      
      console.log(`Extracted collab id: ${collabId}`)

      const matchCollab = collabId?.match(/d-([0-9a-fA-F-]{36})/)
      if (matchCollab) {
        datasetVersionId = matchCollab[1]
        console.log(`Extracted datasetVersionId: ${datasetVersionId}`)
      }
    }

    // ── extract nettskjema submission ID from ticket title ────────────────────
    const dataTitle   = ticketInfo.title || ''
    const SEARCH_TITLE = 'EBRAINS Curation Request Accepted'
    const isTicket    = dataTitle.includes(SEARCH_TITLE)

    let submissionId  = 0
    if (isTicket) {
      const match = dataTitle.match(/(?<=Ref\.?\s+)\d+/)
      if (match) {
        submissionId = parseInt(match[0], 10)
        console.log(`Nettskjema submission ID: ${submissionId}`)
      }
    } else {
      console.log(`No nettskjema ID found in ticket title: "${dataTitle}"`)
    }

  } catch (error) {
    console.log(`Error fetching Zammad info: ${error.message}`)
  }
}


getZammadInfo(4827809)