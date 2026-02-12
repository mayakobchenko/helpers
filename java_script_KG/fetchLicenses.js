// https://core.kg.ebrains.eu/swagger-ui

import {getRequestOptions} from './kg_auth_wizard_client.js'

const OPENMINDS_VOCAB = "https://openminds.ebrains.eu/vocab"

export async function fetchLicenses () {
    const requestOptions = await getRequestOptions()
    const API_BASE_URL = "https://core.kg.ebrains.eu/"
    const API_ENDPOINT = "v3/instances"
    const QUERY_PARAMS = ["stage=RELEASED", "space=controlled", "type=https://openminds.ebrains.eu/core/License"]
    const queryUrl = `${API_BASE_URL}${API_ENDPOINT}?${QUERY_PARAMS.join("&")}`
    const propertyNameList = ["fullName", "shortName", "legalCode", "webpage"]
    //webpage can be array

    try {
        const response = await fetch(queryUrl, requestOptions)
        console.log(response)
        if (response.status === 200) {
            const data = await response.json()
            //parseAndSaveData(data, propertyNameList)
            console.log('licenses:', data)
        } 
        else { throw new Error('Error fetching licenses', response.status)}
    } catch (error) {
        console.error(`Error fetching licenses from KG:`, error)}
}

async function parseAndSaveData(data, propertyNameList) {
    let LicensesList = []
    try {
        for (let thisInstance of data.data) {
            let newInstance = { "identifier": thisInstance["@id"] };
            let isEmpty = true;
            for (let propertyName of propertyNameList) {
                const vocabName = `${OPENMINDS_VOCAB}/${propertyName}`
                if (thisInstance[vocabName] !== undefined) {
                    isEmpty = false
                    newInstance[propertyName] = thisInstance[vocabName]}}
            if (!isEmpty) {
                LicensesList.push(newInstance)}
        }
        const jsonStr = JSON.stringify(LicensesList, null, 2)
        console.log(jsonStr)
    } catch (error) {
        console.error(`Error while parsing and saving data for licenses`, error)}
}

fetchLicenses ()