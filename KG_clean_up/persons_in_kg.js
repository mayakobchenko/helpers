import {getRequestOptions} from 'kgAuthentication.js'
import path from 'path'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
//https://core.kg.ebrains.eu/swagger-ui/index.html#/1%20Basic/listInstances
//'https://core.kg.ebrains.eu/v3/instances?stage=RELEASED&type=https%3A%2F%2Fopenminds.ebrains.eu%2Fcore%2FPerson&space=common&from=100&size=300' 
const OPENMINDS_VOCAB = "https://openminds.ebrains.eu/vocab"
const API_BASE_URL = "https://core.kg.ebrains.eu/"
const API_ENDPOINT = "v3/instances"
const QUERY_PARAMS = ["stage=RELEASED", "space=common", "type=https://openminds.ebrains.eu/core/"]

async function getPersonsfromKG() {
    const TYPE_NAME = "Person"
    const queryUrl = `${API_BASE_URL}${API_ENDPOINT}?${QUERY_PARAMS.join("&")}${TYPE_NAME}`
    const properties = ["familyName", "givenName"]
    try {
        let personKG =[]
        const requestOptions = await getRequestOptions()
        //console.log(queryUrl)
        const response = await fetch(queryUrl, requestOptions)
        //console.log(response)
        if (response.status === 200) {
            const data = await response.json()
            let typeInstanceList = []
            for (let thisInstance of data.data) {
                let newInstance = { "identifier": thisInstance["@id"] }
                let isEmpty = true
                for (let propertyName of properties) {
                    const vocabName = `${OPENMINDS_VOCAB}/${propertyName}`
                    if (thisInstance[vocabName] !== undefined) {
                        isEmpty = false
                        newInstance[propertyName] = thisInstance[vocabName]
                    }
                }
                if (!isEmpty) {
                    typeInstanceList.push(newInstance)
                }
            }
            personKG.push(typeInstanceList)
        } else { throw new Error('Error fetching instances for contributors. Status code: ' + response.status)}
      console.log(personKG)
    } catch (error) {
      console.error('Error fetching contributors from KG', error.message)
    }
  }