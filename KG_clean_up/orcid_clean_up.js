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
    const spaceName = "common"
    const stage = "IN_PROGRESS"   //"IN_PROGRESS"  "RELEASED" 
    const QUERY_PARAMS = [`stage=${stage}`, `space=${spaceName}`, "type=https://openminds.ebrains.eu/core/"]
    const TYPE_NAME = "ORCID"
    const queryUrl = `${API_BASE_URL}${API_ENDPOINT}?${QUERY_PARAMS.join("&")}${TYPE_NAME}`
    const propertyNames = ["identifier"]
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
           // console.log(data.data)
            await parseAndSaveData(data, typeName, propertyNames)
        } else { throw new Error('Error fetching instances for ' + typeName + '. Status code: ' + response.status)}
    } catch (error) {
        console.log(`Error fetching instances for ${typeName}:`, error)
    }
}

async function parseAndSaveData(data, typeName, propertyNameList) {
    let typeInstanceList = []
    try {
        for (let thisInstance of data.data) {
            let newInstance = { "uuid": thisInstance["@id"] }
            for (let propertyName of propertyNameList) {
                const vocabName = `${OPENMINDS_VOCAB}/${propertyName}`
                if (thisInstance[vocabName] !== undefined) {
                    newInstance[propertyName] = thisInstance[vocabName]}}
                typeInstanceList.push(newInstance)
        }
        const jsonStr = JSON.stringify(typeInstanceList, null, 2)
        const filename = `${typeName}.json`
        const filePath = path.join(OUTPUT_DIR, filename)
        await fs.promises.writeFile(filePath, jsonStr)
        console.log('File with instances for ' + typeName + ' written successfully');
    } catch (error) {
        console.error(`Error while parsing and saving data for ${typeName}:`, error)}
}

await fetchCoreSchemaInstances()