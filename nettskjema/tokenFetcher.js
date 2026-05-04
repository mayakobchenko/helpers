//fetches token to access nettskjema v3 using client secret and client id
//https://api.nettskjema.no/v3/swagger-ui/index.html#/Submission%20with%20answers/getSubmission

import dotenv from 'dotenv'
dotenv.config({ path: '../.env' })

const clientId = process.env.NETTSKJEMA_CLIENT_ID
const clientSecret = process.env.NETTSKJEMA_CLIENT_SECRET
const tokenEndpointUrl = process.env.TOKEN_ENDPOINT_URL

export async function fetchTokenNettskjema() {
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')  
    try {
        const response = await fetch(tokenEndpointUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${basicAuth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                'grant_type': 'client_credentials'
            }).toString(),
        });
        const data = await response.json()
        if (!response.ok) {
            throw new Error(data.error || 'Failed to retrieve nettskjema token')
        }
        const nettskjema_token = data.access_token
        return nettskjema_token
    } catch (error) {
        throw new Error(`Failed to fetch nettskjema token: ${error.message}`)
    }
}
