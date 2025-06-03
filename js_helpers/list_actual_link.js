//link to journals are under search page, Official website button
//issue website blocking the script
import fs from 'fs'
import { Builder, By, until } from 'selenium-webdriver'
//const firefoxOptions = new firefox.Options();
//firefoxOptions.setPreference("browser.download.folderList", 2);
//firefoxOptions.setPreference("browser.download.dir", "/path/to/download/directory"); // Update to your desired download path
//firefoxOptions.setPreference("browser.download.manager.showWhenStarting", false);
//firefoxOptions.setPreference("browser.helperApps.neverAsk.saveToDisk", "application/pdf, application/octet-stream"); // Add file types you expect to download

function wait(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds))}

(async function scrapeOfficialLinks() {
    const journalsData = JSON.parse(fs.readFileSync('results.json', 'utf-8'))
    const driver = await new Builder().forBrowser('firefox').build(); // Use 'chrome' for Chrome browser
    //const driver = await new Builder().forBrowser('firefox').setFirefoxOptions(firefoxOptions).build()
    const results = []
    try {
        for (const journal of journalsData) {
            const { text, link } = journal
            try {
                await driver.get(link)
                const officialWebsiteSelector = 'a.button[title="Official website"]'
                await driver.wait(until.elementLocated(By.css(officialWebsiteSelector)), 5000)
                const officialLinkElement = await driver.findElement(By.css(officialWebsiteSelector))
                await officialLinkElement.click()
                //await driver.executeScript(`window.open('${officialLink}', '_blank');`)
                await wait(Math.random() * 6000 +2000)

                const handles = await driver.getAllWindowHandles()
                if (handles.length > 1) {
                    await driver.switchTo().window(handles[1])
                    await wait(14000)
                    const officialLink = await driver.getCurrentUrl()
                    await driver.close()
                    await driver.switchTo().window(handles[0])
                    results.push({ text, officialLink })
                    console.log(`Scraped Official link for ${text}: ${officialLink}`)
                } else {
                    console.warn('No new tab opened after clicking the Official Website button.')}
                await driver.close()
            } catch (innerError) {
                console.error(`Failed to process ${text} (${link}): ${innerError.message}`)}           
            //await driver.wait(until.urlIs(officialLinkElement.getAttribute('href')), 5000)          
            //const officialLink = await officialLinkElement.getAttribute('href')
            await wait(Math.random() * 6000 + 14000)
        }
        fs.writeFileSync('websites.json', JSON.stringify(results, null, 2), 'utf-8')
        console.log('Results saved to output.json')

    } catch (error) {
        console.error('Error occurred:', error)
    } finally {
        await driver.quit()
    }
})();
