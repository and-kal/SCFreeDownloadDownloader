import puppeteer from 'puppeteer';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function downloadSongs(url: string) {
  // this will not work, because SC will detect suspicious behaviour...
  /*
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Go to SoundCloud first
  await page.goto('https://soundcloud.com', { waitUntil: 'networkidle0' });

  // Wait for manual login
  console.log('Please log in to SoundCloud manually. You have 30 seconds...');
  await sleep(30000);
  */
  // ...thus using the user's Chrome installation, where they're already logged in
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
      try {
        await button.click().catch(() => { });
        await sleep(500);
      } catch (error) {
        // TODO: Implement appropriate error handling logic
        // @ts-ignore
        console.log('Error processing button:', error.message);
        continue;
      }
      // Check if download button exists in dropdown
      const downloadButton = await page.$('button.sc-button-download');
      if (downloadButton) {
        try {
          const client = await page.createCDPSession()
          // Enable download behavior
          await client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: './downloads'
          });
          await downloadButton.click().catch(() => { });
          await sleep(1000); // Wait for download dialog
        }
        catch (error) {
          console.error('An error occurred during the download:', error);
          // TODO: Implement appropriate error handling logic
        } finally {
          await browser.close();
        }
        // Close dropdown by clicking outside
        await page.mouse.click(0, 0);
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

  await browser.close();
}

// Start the download process
const soundcloudUrl = process.argv[2];
downloadSongs(soundcloudUrl);
