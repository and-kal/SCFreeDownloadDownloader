import puppeteer from 'puppeteer';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function downloadSongs(url: string) {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Go to SoundCloud first
  await page.goto('https://soundcloud.com', { waitUntil: 'networkidle0' });

  // Wait for manual login
  console.log('Please log in to SoundCloud manually. You have 30 seconds...');
  await sleep(30000);

  // Now navigate to the target URL
  await page.goto(url, { waitUntil: 'networkidle0' });

  while (true) {
    // Scroll to bottom to trigger lazy loading
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    // Wait for potential new content to load
    await sleep(2000);

    // Find all "More" buttons
    const moreButtons = await page.$$('button.sc-button-more');

    for (const button of moreButtons) {
      // Click "More" button
      await button.click();
      await sleep(500);

      // Check if download button exists in dropdown
      const downloadButton = await page.$('button.sc-button-download');
      if (downloadButton) {
        // Enable download behavior
        const client = await page.createCDPSession()
        await client.send('Page.setDownloadBehavior', {
          behavior: 'allow',
          downloadPath: './downloads'
        });

        await downloadButton.click();
      }

      // Close dropdown by clicking outside
      await page.mouse.click(0, 0);
    }

    // Check if we've reached the end (no new content loaded)
    const previousHeight = await page.evaluate('document.body.scrollHeight');
    await sleep(2000);
    const currentHeight = await page.evaluate('document.body.scrollHeight');

    if (previousHeight === currentHeight) {
      break;
    }
  }

  await browser.close();
}

// Start the download process
const soundcloudUrl = process.argv[2];
downloadSongs(soundcloudUrl);
