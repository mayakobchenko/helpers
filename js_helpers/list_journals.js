//saves journal names and search link to json file
import { Builder, By, until } from 'selenium-webdriver'
import fs from 'fs'

(async function scrapeData() {
    const driver = await new Builder().forBrowser('firefox').build() // Use 'chrome' for Chrome browser
    try {
        const baseUrl = 'https://research.com/journals-rankings/neuroscience'
        await driver.get(baseUrl)
        const anchorSelector = 'a[title="Read more"]'
        await driver.wait(until.elementsLocated(By.css(anchorSelector)), 10000)
        const linkElements = await driver.findElements(By.css(anchorSelector))

        const results = []
        for (const linkElement of linkElements) {
            const text = await linkElement.getText()
            const relativeLink = await linkElement.getAttribute('href') 
            const fullLink = new URL(relativeLink, baseUrl).href
            results.push({ text, link: fullLink })
        }

        fs.writeFileSync('results.json', JSON.stringify(results, null, 2), 'utf-8')
        console.log('Results saved to results.json')
    } catch (error) {
        console.error('Error occurred:', error)} 
        finally { await driver.quit() }
})()
