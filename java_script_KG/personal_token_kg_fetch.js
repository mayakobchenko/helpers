import 'dotenv/config'

const maya_token = process.env.MAYA_EBRAIN_TOKEN
const token_maya = "Bearer " + maya_token
const myHeaders = new Headers()
myHeaders.append("Content-Type", "application/json")
myHeaders.append("Authorization", token_maya)  
myHeaders.append("Accept", '*/*')
//console.log(myHeaders);


try {
    const response = await fetch(url, {headers: myHeaders})

    const json = await response.json()


} catch (error) {
    console.error(error.message)
}