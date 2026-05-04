//import fetchControlledTerms from './fetchControlledTerms.js'
import {fetchCoreSchemaInstances} from './fetchCoreSchemaInstances.js'
//import { fetchLicenses } from './fetchLicenses.js'

const configObject = [
    {
        openMindsType: "ORCID",
        typeProperties: ["identifier"]
    },
    {
        openMindsType: "Person",
        typeProperties: ["familyName", "givenName", "digitalIdentifier"] //@id  /&digitalIdentifier
    },
    {
        openMindsType: "Organization",
        typeProperties: ["fullName"]
    },
    {
        openMindsType: "Consortium",
        typeProperties: ["fullName"]
    },
    {
        openMindsType: "Funding",
        typeProperties: ["awardTitle", "awardNumber", "funder"]
    },
]

export default async function fetchDataFromKg() {
    try {
        //await fetchLicenses()
        await fetchCoreSchemaInstances(configObject)
        //await fetchControlledTerms()
    } catch (error) {
        console.log("error running fetchCoreSchemaInstances", error)
    }
}

fetchDataFromKg()