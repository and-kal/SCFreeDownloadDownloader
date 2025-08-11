import puppeteer from 'puppeteer';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function followPages(url: string) {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: process.platform === 'win32'
      ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
      : '/usr/bin/google-chrome',
    userDataDir: process.platform === 'win32'
      ? `${process.env.LOCALAPPDATA}\\Google\\Chrome\\User Data`
      : `${process.env.HOME}/.config/google-chrome`,
    args: ['--no-sandbox', '--profile-directory=Default']
  });
  const page = await browser.newPage();

  // Now navigate to the target URL
  await page.goto(url, { waitUntil: 'networkidle0' });
  try {
    while (true) {
      // Scroll to bottom to trigger lazy loading
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      // Wait for potential new content to load
      await sleep(2000);

      const moreButtons = await page.$$('button.sc-button-follow');

      for (const button of moreButtons) {
        try {
          await button.click().catch(() => { });
          await sleep(500);
        } catch (error) {
          // TODO: Implement appropriate error handling logic
          // @ts-ignore
          console.log('Error processing button:', error.message);
          continue;
        }
      }
      // Check if we've reached the end (no new content loaded)
      const previousHeight = await page.evaluate('document.body.scrollHeight');
      await sleep(2000);
      const currentHeight = await page.evaluate('document.body.scrollHeight');

      if (previousHeight === currentHeight) {
        break;
      }
    }
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    await browser.close();
  }
}

// Start the download process
const soundcloudUrl = process.argv[2];
followPages(soundcloudUrl);
