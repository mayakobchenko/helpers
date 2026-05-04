// typeSpecification object should contain the following properties:
// - openMindsType // short name for the openminds type, e.g: "Person"
// - typeProperties // list of properties to save for this type, e.g: ["familyName", "givenName"]
// - space // Optional, defaults to "common" (KG space to search for instances)
// https://core.kg.ebrains.eu/swagger-ui

import fs from 'fs'
import path from 'path'
//import { getRequestOptions } from './kgAuthentication.js'
import {getRequestOptions} from './kg_auth_wizard_client.js'
import { fileURLToPath } from 'url'

const maya_token = process.env.MAYA_EBRAIN_TOKEN
const token_maya = "Bearer " + maya_token
const myHeaders = new Headers()
myHeaders.append("Content-Type", "application/json")
myHeaders.append("Authorization", token_maya)  
//myHeaders.append("Accept", '*/*')
myHeaders.append('User-Agent', 'python-requests/2.25.0')
myHeaders.append('Content-Encoding', 'gzip, deflate')
myHeaders.append('Connection', 'keep-alive')


const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const OUTPUT_DIR = path.join(__dirname, '..', 'data', 'kg-instances')
const OPENMINDS_VOCAB = "https://openminds.om-i.org/props"
const API_BASE_URL = "https://core.kg.ebrains.eu/"
const API_ENDPOINT = "v3/instances"

fs.mkdir(OUTPUT_DIR, { recursive: true }, (err) => {
    if (err) {
        if (err.code === 'EEXIST') {console.log("Directory already exists.")} 
        else {console.log(err)}
    } else {console.log("New directory successfully created.")}})

export const fetchCoreSchemaInstances = async (typeSpecifications) => {
    //const requestOptions = { headers: myHeaders }
    const requestOptions = await getRequestOptions()

    const fetchPromises = typeSpecifications.map(async (typeSpecification) => {
        const spaceName = typeSpecification.space !== undefined ? typeSpecification.space : "common"
        const QUERY_PARAMS = ["stage=RELEASED", `space=${spaceName}`, "type=https://openminds.om-i.org/types/"]
        const TYPE_NAME = typeSpecification.openMindsType
        const queryUrl = `${API_BASE_URL}${API_ENDPOINT}?${QUERY_PARAMS.join("&")}${TYPE_NAME}`
        try {
            await fetchInstances(queryUrl, requestOptions, TYPE_NAME, typeSpecification.typeProperties)
        } catch (error) {
            console.error(`Error fetching instances for ${TYPE_NAME}:`, error)
        }
    });
    await Promise.all(fetchPromises)
}

async function fetchInstances(apiQueryUrl, requestOptions, typeName, propertyNames) {
    try {
        const response = await fetch(apiQueryUrl, requestOptions)
        if (response.status === 200) {
            const data = await response.json()
            console.log(data.data)
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
        if (typeName == "Person") {
            orcidData = await loadJsonFile(path.join(OUTPUT_DIR, `ORCID.json`))
            console.log(orcidData)
        }
        for (let thisInstance of data.data) {
            let newInstance = { "uuid": thisInstance["@id"] }
            let isEmpty = true
            for (let propertyName of propertyNameList) {
                const vocabName = `${OPENMINDS_VOCAB}/${propertyName}`
                if (thisInstance[vocabName] !== undefined) {
                    isEmpty = false
                    if (typeName == "Person" && propertyName == "digitalIdentifier") {
                        const findOrcid = orcidData.find(entry => entry.uuid === thisInstance[`${OPENMINDS_VOCAB}/digitalIdentifier`]["@id"])
                        if (findOrcid !== undefined) {newInstance["orcid"] = findOrcid["identifier"]}
                      } else {newInstance[propertyName] = thisInstance[vocabName]} 
                    //newInstance[propertyName] = thisInstance[vocabName]
                }
            }
            if (!isEmpty) {
                typeInstanceList.push(newInstance)}
        }
        const jsonStr = JSON.stringify(typeInstanceList, null, 2);
        const filename = `${typeName}.json`
        const filePath = path.join(OUTPUT_DIR, filename)
        await fs.promises.writeFile(filePath, jsonStr)
        console.log('File with instances for ' + typeName + ' written successfully')
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

/*
async function getORCID() {
    const TYPE_NAME = "ORCID"
    const QUERY_PARAMS = ["stage=RELEASED", "space=common", "type=https://openminds.ebrains.eu/core/"]
    const queryUrl = `${API_BASE_URL}${API_ENDPOINT}?${QUERY_PARAMS.join("&")}${TYPE_NAME}`
    const properties = ["identifier"]
    try {
        let orcidKG =[]
        const requestOptions = await getRequestOptions()
        const response = await fetch(queryUrl, requestOptions)
        if (response.status === 200) {
            const data = await response.json()
            let typeInstanceList = []
            for (let thisInstance of data.data) {
                let newInstance = { "uuid": thisInstance["@id"] }
                let isEmpty = true
                for (let propertyName of properties) {
                    const vocabName = `${OPENMINDS_VOCAB}/${propertyName}`
                    if (thisInstance[vocabName] !== undefined) {
                      isEmpty = false
                      if (propertyName == "digitalIdentifier") {
                        newInstance["orcid_uuid"] = thisInstance[vocabName]["@id"]
                      } else {newInstance[propertyName] = thisInstance[vocabName]}              
                    }
                }
                if (!isEmpty) {
                    typeInstanceList.push(newInstance)
                }
            }
            orcidKG.push(typeInstanceList)
        } else { throw new Error('Error fetching instances for contributors. Status code: ' + response.status)}
      //console.log(orcidKG)
    } catch (error) {
      console.error('Error:', error.message)
    }
  }
  */