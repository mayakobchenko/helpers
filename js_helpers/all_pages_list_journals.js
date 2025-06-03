//saves journal names and search link to json file for all pages at url
import { Builder, By, until } from 'selenium-webdriver'
import fs from 'fs'

(async function scrapeData() {
    const results = []
    const baseUrl = 'https://research.com/journals-rankings/neuroscience'       
    try {
        const driver = await new Builder().forBrowser('firefox').build()
        await driver.get(baseUrl)
        const anchorSelector = 'a[title="Read more"]'
        await driver.wait(until.elementsLocated(By.css(anchorSelector)), 10000)
        const linkElements = await driver.findElements(By.css(anchorSelector))
        for (const linkElement of linkElements) {
            const text = await linkElement.getText()
            const relativeLink = await linkElement.getAttribute('href') 
            const fullLink = new URL(relativeLink, baseUrl).href
            results.push({ text, link: fullLink })
        }
        await driver.quit()

        for (let page = 2; page <= 5; page++) {
            const url = baseUrl+`?page=${page}`
            const driver = await new Builder().forBrowser('firefox').build()
            await driver.get(url)
            await driver.wait(until.elementsLocated(By.css(anchorSelector)), 10000)
            const Elements = await driver.findElements(By.css(anchorSelector))
            for (const linkElement of Elements) {
                const text = await linkElement.getText()
                const relativeLink = await linkElement.getAttribute('href') 
                const fullLink = new URL(relativeLink, baseUrl).href
                results.push({ text, link: fullLink })
            }
            await driver.quit()
            console.log(`Scraped page ${page}`);
        }

        fs.writeFileSync('results_allpages.json', JSON.stringify(results, null, 2), 'utf-8')
        console.log('Results saved to json')

    } catch (error) {
        console.error('Error occurred:', error)
    }
})();
