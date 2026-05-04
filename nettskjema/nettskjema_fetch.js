import {fetchTokenNettskjema} from './tokenFetcher.js'
import {fetchSubmission, fetchAnswers} from './fetchNettskjemaData.js'

const tokenNettskjema = await fetchTokenNettskjema()
console.log('token:', tokenNettskjema)
const submissionId = 33464654
//https://nettskjema.no/api/v3/form/submission/33464654
//https://nettskjema.no/apidoc

const submissionData = await fetchSubmission(submissionId, tokenNettskjema)
console.log(submissionData)

const answerData = await fetchAnswers(submissionData, 'Title')
console.log('Title: ', answerData)

const summary = 'Brief summary'
const answerSummary = await fetchAnswers(submissionData, summary)
console.log(summary, ': ', answerSummary)