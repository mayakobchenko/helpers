// IMPORTANT: DatasetLicense should not be a part of this list because it is a manual
// entry that does not correspond with any openMINDS schema.
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url';
import { writeFile } from 'fs/promises';
import {getRequestOptions} from './kgAuthentication.js'
//import {studyTargetTerms} from './constants.js'
import {subjectProperties} from './constants.js'

const API_BASE_URL = "https://core.kg.ebrains.eu/"
const API_ENDPOINT = "v3/instances"
const QUERY_PARAMS = ["stage=RELEASED", "space=controlled", "type=https://openminds.om-i.org/types/"]  //openminds.om-i.org/types  //type=https://openminds.ebrains.eu/controlledTerms/
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const OUTPUT_DIR = path.join(__dirname, '..', 'data', 'controlledTerms')

fs.mkdir(OUTPUT_DIR, { recursive: true }, (err) => {
    if (err) {
        if (err.code === 'EEXIST') {
            console.log("Directory already exists.");
        } else {
            console.log(err);
        }
    } else {
        console.log("New directory for controlled terms successfully created.")
    }
});

export default async function fetchControlledTerms () {
    const requestOptions = await getRequestOptions()
    const MAIN_TERMS = ["PreparationType", "Technique", "ContributionType", 
                            "SemanticDataType", "ExperimentalApproach"]
    //CONTROLLED_TERMS = CONTROLLED_TERMS.concat(studyTargetTerms);
    const CONTROLLED_TERMS = MAIN_TERMS.concat(subjectProperties)

    const fetchPromises = CONTROLLED_TERMS.map(async (CONTROLLED_TERMS) => {
        //let queryUrl = API_BASE_URL + API_ENDPOINT + "?" + QUERY_PARAMS.join("&") + CONTROLLED_TERMS[i];
        const queryUrl = `${API_BASE_URL}${API_ENDPOINT}?${QUERY_PARAMS.join("&")}${CONTROLLED_TERMS}`
        try {
            await fetchInstances(queryUrl, requestOptions, CONTROLLED_TERMS)
        } catch (error) {
            console.error(`Error fetching instances for ${CONTROLLED_TERMS}:`, error)}
    });
    await Promise.all(fetchPromises);
}
async function fetchInstances(apiQueryUrl, requestOptions, controlledTerm) {
    try {
        const response = await fetch(apiQueryUrl, requestOptions)
        if (response.status === 200) {
            const data = await response.json()
            await parseAndSaveData(data, controlledTerm)
        } else { throw new Error('Error fetching instances for ' + controlledTerm + '. Status code: ' + response.status);}
    } catch (error) {
        console.log(`Error fetching instances for ${controlledTerm}:`, error);
    }
}

async function parseAndSaveData (data, instanceName) {   
    let InstanceList = [];
        try {
            for (let thisInstance of data.data) {
                let newInstance = { "identifier": thisInstance["@id"] }
                newInstance["name"] = thisInstance["https://openminds.om-i.org/props/name"]
                InstanceList.push(newInstance)
            };  
            InstanceList.sort((a, b) => a.name.localeCompare(b.name))  //sort alphabetically
            //instanceName = instanceName.charAt(0).toLowerCase() + instanceName.slice(1); // Make first letter of instance name lowercase
            //const jsonStr = JSON.stringify(resultforjson, null, 2);           
            const filename = `${instanceName}.json`;
            const filePath = path.join(OUTPUT_DIR, filename);

            await writeFile(filePath, JSON.stringify(InstanceList, null, 2));
            //await fs.promises.writeFile(filePath, jsonStr);
            console.log('File with instances for ' + instanceName + ' written successfully');
        } catch (error) {
            console.error(`Error while parsing and saving data for ${instanceName}:`, error);
        }
}

// - - - Simple api query using axios
// apiURL = "https://api.github.com/repos/HumanBrainProject/openMINDS/commits/documentation";
// axios.get( apiURL )
// .then( response => console.log(response) )

/*
// Simple API query using fetch with try/catch
const apiURL = "https://api.github.com/repos/HumanBrainProject/openMINDS/commits/documentation";

async function fetchCommits() {
    try {
        const response = await fetch(apiURL);     
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json(); // Parse the JSON response
        console.log(data); // Log the retrieved data
    } catch (error) {
        console.error('Fetch error:', error); // Handle errors
    }
}
fetchCommits();

*/ 