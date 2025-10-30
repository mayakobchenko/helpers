import fs from 'fs'
import path from 'path'
import {getRequestOptions} from './kgAuthentication.js'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const OUTPUT_DIR = path.join(__dirname, '..', 'data', 'kg-instances')
const OPENMINDS_VOCAB = "https://openminds.ebrains.eu/vocab"
const API_BASE_URL = "https://core.kg.ebrains.eu/"
const API_ENDPOINT = "v3/instances"
    
fs.mkdir(OUTPUT_DIR, { recursive: true }, (err) => {
    if (err) {
        if (err.code === 'EEXIST') {console.log("Directory already exists.")} 
        else {console.log(err)}
    } else { console.log("New directory successfully created.") }
})
    
const fetchCoreSchemaInstances = async () => {
    const requestOptions = await getRequestOptions()
    const spaceName = "common"//"common"
    const stage = "IN_PROGRESS" //"RELEASED"   //"IN_PROGRESS"
    const QUERY_PARAMS = [`stage=${stage}`, `space=${spaceName}`, "type=https://openminds.ebrains.eu/core/"]
    const TYPE_NAME = "Person"
    const queryUrl = `${API_BASE_URL}${API_ENDPOINT}?${QUERY_PARAMS.join("&")}${TYPE_NAME}`
    console.log(queryUrl)
    const propertyNames = ["familyName", "givenName", "digitalIdentifier"]
        try {
            await fetchInstances(queryUrl, requestOptions, TYPE_NAME, propertyNames)
        } catch (error) {
            console.error(`Error fetching instances for ${TYPE_NAME}:`, error)}
}

async function fetchInstances(apiQueryUrl, requestOptions, typeName, propertyNames) {
    try {
        const response = await fetch(apiQueryUrl, requestOptions)
        if (response.status === 200) {
            const data = await response.json()
            await parseAndSaveData(data, typeName, propertyNames)
        } else { throw new Error('Error fetching instances for ' + typeName + '. Status code: ' + response.status)}
    } catch (error) {
        console.log(`Error fetching instances for ${typeName}:`, error)
    }
}

async function parseAndSaveData(data, typeName, propertyNameList) {
    let typeInstanceList = []
    try {
        let orcidData
        let orcidReleased
        let orcidInProgress
            if (typeName == "Person") {
                orcidReleased = await loadJsonFile(path.join(OUTPUT_DIR, `ORCID_released.json`))
                orcidInProgress = await loadJsonFile(path.join(OUTPUT_DIR, `ORCID_in_progress.json`))
            orcidData = [...orcidReleased, ...orcidInProgress]
        }
        
        for (let thisInstance of data.data) {
            let newInstance = { "identifier": thisInstance["@id"] }
            for (let propertyName of propertyNameList) {
                const vocabName = `${OPENMINDS_VOCAB}/${propertyName}`
            if (thisInstance[vocabName] !== undefined) {
                if (typeName == "Person" && propertyName == "digitalIdentifier") {
                    const findOrcid = orcidData.find(entry => entry.uuid === thisInstance[`${OPENMINDS_VOCAB}/digitalIdentifier`]["@id"])
                    if (findOrcid !== undefined) {newInstance["orcid"] = findOrcid["identifier"]}
                } else { newInstance[propertyName] = thisInstance[vocabName] }}
            }

            typeInstanceList.push(newInstance)

        }
        const jsonStr = JSON.stringify(typeInstanceList, null, 2)
        const filename = `${typeName}.json`;
        const filePath = path.join(OUTPUT_DIR, filename)
        await fs.promises.writeFile(filePath, jsonStr)
        console.log('File with instances for ' + typeName + ' written successfully');
    } catch (error) {
        console.error(`Error while parsing and saving data for ${typeName}:`, error)}
}

async function loadJsonFile(filePath) {
    try {
        const data = await fs.promises.readFile(filePath, 'utf8')
        const jsonData = JSON.parse(data)
        return jsonData
    } catch (err) {
        console.error('Error reading the file:', err)
        throw err
    }
}

await fetchCoreSchemaInstances()