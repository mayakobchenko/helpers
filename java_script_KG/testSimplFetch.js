import {getRequestOptions} from './fetchTokenKG.js'
import 'dotenv/config'
import {modifyUrlPath} from './changeUrl.js'

const maya_token = process.env.MAYA_EBRAIN_TOKEN
const token_maya = "Bearer " + maya_token
const wizard_token = await getRequestOptions()
const wizardHeaders = new Headers()
wizardHeaders.append("Content-Type", "application/json")
wizardHeaders.append("Authorization", wizard_token)
wizardHeaders.append("Accept", '*/*')
//console.log(wizardHeaders);

const url = "https://core.kg.ebrains.eu/v3/queries/de7e79ae-5b67-47bf-b8b0-8c4fa830348e/instances?stage=IN_PROGRESS&instanceId=54719155-54c7-4456-8987-36b7d5dce071";

const myHeaders = new Headers();
myHeaders.append("Content-Type", "application/json");
myHeaders.append("Authorization", token_maya);    
myHeaders.append("Accept", '*/*');
//console.log(myHeaders);

/*getDataVersionIdFromUrl = () => {
    const queryString = window.location.search;
    let ticketNumber = new URLSearchParams(queryString).get('TicketNumber');
    return ticketNumber;
  }*/

try {
    const response = await fetch(url, {headers: myHeaders});
    const response_wizard = await fetch (url, {headers: wizardHeaders});

    const json = await response.json();
    console.log('the id of the requested dataset version:');
    console.log(json['data'][0]['id']);
    const originalUrl = json['data'][0]['id'];

    const modifiedUrl = modifyUrlPath(originalUrl);
    console.log(modifiedUrl); 

//https://search.kg.ebrains.eu/instances/54719155-54c7-4456-8987-36b7d5dce071
// Output the modified URL
    console.log(url.toString());

    const custodianDatasetVersion = json['data'][0]['custodian'];
    console.log('custodian of the dataset version to check if empty:', custodianDatasetVersion);
    if (custodianDatasetVersion.length === 0) {
        console.log('the dataset version does not have a separate custodian');
        //const datasetMain = json['data'][0]['dataset'][0];
        //console.log('dataset');
        //console.log(datasetMain);
        const datasetCustodian = json['data'][0]['dataset'][0]['custodian'];               
        //console.log('custodian of the dataset', datasetCustodian);
        const foundObject = datasetCustodian.find(obj => obj.contactInformation.length !== 0);
        console.log('I found the email of the custodian:', foundObject);
        console.log(foundObject['givenName']);
    } else {
        console.log('take the custodian of the dataset version');
    }


    //console.log('email of the dataset custodian');
    //console.log(json['data'][0]['dataset'][0]['custodian'][1]['contactInformation'][0]);

    //console.log(json['data'][0]['id']);

    //console.log('json wizard');
    //const json_wizard = await response_wizard.json();
    //console.log(json_wizard);
    //console.log(json_wizard['data']);
} catch (error) {
    console.error(error.message);
}