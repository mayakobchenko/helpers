import dotenv from 'dotenv'
dotenv.config({ path: './.env' })

//const clientId = process.env.OIDC_CLIENT_ID;
//const clientSecret = process.env.CLIENT_SECRET;
const clientId = process.env.WIZARD_OIDC_CLIENT_ID
const clientSecret = process.env.WIZARD_OIDC_CLIENT_SECRET
const my_token = process.env.MAYA_EBRAIN_TOKEN

export async function getRequestOptions() {
    try {
        //console.log(clientSecret)
        //console.log(clientId)
        //let token = await getTokenFromServiceAccount(clientSecret)
        const token = my_token
        const requestHeader = { 
            Accept: "*/*", 
            Authorization: "Bearer " + token, 
            'User-Agent': "python-requests/2.25.0",
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
        
export async function getTokenFromServiceAccount(clientSecret) {
    const endpointURL = "https://iam.ebrains.eu/auth/realms/hbp/protocol/openid-connect/token"
    const body = "grant_type=client_credentials&client_id=" + clientId + "&client_secret=" + clientSecret + "&scope=openid%20group%20roles%20email%20profile%20team"
    const requestOptions = {
	    method: 'post',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
	    body: body}
    try{
        const response = await fetch(endpointURL, requestOptions)
        if (!response.ok) {
            throw new Error(`OIDC client is not allowed to fetch KG token: ${response.status}`)}
        const jsonData = await response.json()
        if (jsonData.access_token) {
            return jsonData.access_token
          } else {
            throw new Error('Could not fetch KG token')}
    } catch (error) {
        throw new Error(`Failed to fetch token for KG: ${error.message}`)
    }
}


