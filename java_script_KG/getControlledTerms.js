import dotenv from 'dotenv'
import {getRequestOptions} from './kgAuthentication.js'
import fetch from 'node-fetch'

dotenv.config()
//const maya_token = process.env.MAYA_EBRAIN_TOKEN;
//const token_maya = "Bearer " + maya_token;
//const myHeaders = new Headers();
//myHeaders.append("Content-Type", "application/json");
//myHeaders.append("Authorization", token_maya);    
//myHeaders.append("Accept", '*/*');
//const mayaHeaders = {headers: myHeaders};

 //for testing - personal KG token (copy-pasted from https://editor.kg.ebrains.eu/)
//mayaHeaders - for personal KG token, requestOptions - for dedicated service account
const requestOptions = await getRequestOptions();
//console.log(requestOptions);
//const {nameCustodian, surnameCustodian, emailCustodian} = await contactInfoKG(queryID, datasetID, mayaHeaders);
const queryID = 'de7e79ae-5b67-47bf-b8b0-8c4fa830348e';
const datasetID = '4df8c324-af31-4cfc-a8af-a7ebf1d59fa1';
//https://search.kg.ebrains.eu/instances/4df8c324-af31-4cfc-a8af-a7ebf1d59fa1
async function fetchKGjson(queryID, datasetID, headers) {
    const API_BASE_URL = "https://core.kg.ebrains.eu/";
    const API_ENDPOINT = "v3/queries/";
    const QUERY_PARAMS = ["stage=IN_PROGRESS", "instanceId="];
    const queryUrl = API_BASE_URL + API_ENDPOINT + `${queryID}` + "/instances?" + QUERY_PARAMS.join("&") + `${datasetID}`;
    const results = [];
    try {
        const response = await fetch(queryUrl, headers); 
        if (!response.ok) {
            throw new Error('Error connecting to KG: ' + response.status);
        } 
        const data = await response.json();
        results.push(data);   
    } catch (error) {
        throw new Error(`Problem fetching info from KG: ${error.message}`);
    }
    return results; 
}
const dataKG = await fetchKGjson(queryID, datasetID, requestOptions);
const result_kg = dataKG[0]['data'][0]['dataset'][0]['custodian']; 
//console.log("successfully got info from KG", result_kg);

//---------------------------------from the bench
const API_BASE_URL = "https://core.kg.ebrains.eu/";
const API_ENDPOINT = "v3/instances";
const QUERY_PARAMS = ["stage=RELEASED", "space=controlled", "type=https://openminds.ebrains.eu/controlledTerms/"];
/*let CONTROLLED_TERMS = ["PreparationType", "Technique", "ContributionType", 
                        "SemanticDataType", "ExperimentalApproach"];*/
let CONTROLLED_TERMS = ["ExperimentalApproach"];

async function fetchControlledTerms(headers, i) {
    let queryUrl = API_BASE_URL + API_ENDPOINT + "?" + QUERY_PARAMS.join("&") + CONTROLLED_TERMS[i];
    const results = [];
    try {
        const response = await fetch(queryUrl, headers); 
        if (!response.ok) {
            throw new Error('Error connecting to KG: ' + response.status);
        } 
        const data = await response.json();
        results.push(data);   
    } catch (error) {
        throw new Error(`Problem fetching controlled terms from KG: ${error.message}`);
    }
    return results; 
}

try {
    let requestResult = [];
    for (let i = 0; i < CONTROLLED_TERMS.length; i++) { 
        const dataControledTerms = await fetchControlledTerms(requestOptions, i);
        console.log(i);
        requestResult.push(dataControledTerms[0]['data'][0]);     
        console.log(requestResult);
    }
} catch (error) {
    console.log(error);
}
