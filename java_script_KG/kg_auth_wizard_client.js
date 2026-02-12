import dotenv from 'dotenv'
dotenv.config()
import fetch from 'node-fetch'

const clientId = process.env.WIZARD_OIDC_CLIENT_ID
const clientSecret = process.env.WIZARD_OIDC_CLIENT_SECRET
console.log(clientId)

//curl -X POST "https://iam.ebrains.eu/auth/realms/hbp/protocol/openid-connect/token" -H "Content-Type: application/x-www-form-urlencoded" -d "grant_type=client_credentials" -d "client_id=ebrains-dev-wizard-maya" -d "client_secret=7xNIxEE7Hlt2xdfjQ6u8ZscEjuLirJop" -d "scope=openid group roles email profile team"
        
export async function getTokenFromServiceAccount(clientSecret) {

    const endpointURL = "https://iam.ebrains.eu/auth/realms/hbp/protocol/openid-connect/token"
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'openid group roles email profile team'
    })
    //const body = "grant_type=client_credentials&client_id=" + clientId + "&client_secret=" + clientSecret + "&scope=email%20profile%20team%20group"//"&scope=openid%20group%20roles%20email%20profile%20team"
    //const requestOptions = {method: 'post', headers: {'Content-Type': 'application/x-www-form-urlencoded'}, body: body}

    try{
        //const response = await fetch(endpointURL, requestOptions)
        const response = await fetch(endpointURL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${basic}`},
        body: params.toString()
        })
        
        const text = await response.text()
        let json
        try {json = JSON.parse(text)} catch (e) {json = null}
        
        if (!response.ok) {
            throw new Error(`OIDC client is not allowed to fetch KG token: ${response.status}`)}
        //const jsonData = await response.json()
        //console.log(json)
        if (json.access_token) {
            return json.access_token
          } else {
            throw new Error('Could not fetch KG token')}
    } catch (error) {
        throw new Error(`Failed to fetch token for KG: ${error.message}`)
    }
}

export async function getRequestOptions() {
    try{
        let token = await getTokenFromServiceAccount(clientSecret)
        const requestHeader = { 
            Accept: "*/*", 
            Authorization: "Bearer " + token, 
            'User-Agent': "python-requests/2.25.0",  //suggestions to drop this line, did not help
            'Content-Type': 'application/json',
            'Content-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive'
        }               
    const requestOptions = {headers: requestHeader}
    return requestOptions
    } catch (error) {
        throw new Error(`Failed to fetch token for KG: ${error.message}`)
    }
}
