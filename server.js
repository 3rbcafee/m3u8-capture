const puppeteer = require("puppeteer-core");
const chrome = require("chrome-aws-lambda");

app.get("/get-stream", async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).json({ error: "URL parameter is missing" });
  }

  try {
    const decodedUrl = decodeURIComponent(targetUrl);
    console.log("Decoded URL:", decodedUrl);

    // Launch Puppeteer with chrome-aws-lambda's Chromium
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: await chrome.executablePath,
      args: chrome.args.concat([
        "--no-sandbox", // Disable sandbox for serverless environments
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage", // Avoid shared memory usage (important for serverless)
        "--single-process" // Use single process for better memory management
      ]),
      defaultViewport: chrome.defaultViewport,
    });

    const page = await browser.newPage();

    let m3u8Links = [];

    page.on("response", async (response) => {
      const url = response.url();
      if (url.includes(".m3u8")) {
        console.log("Found m3u8 link:", url);
        m3u8Links.push(url);
      }
    });

    await page.goto(decodedUrl, { waitUntil: "domcontentloaded" });

    const startTime = Date.now();
    while (m3u8Links.length === 0 && Date.now() - startTime < 10000) {
      await page.waitForTimeout(500);
    }

    if (m3u8Links.length > 0) {
      console.log("m3u8 link found:", m3u8Links[0]);
      res.json({ m3u8: m3u8Links[0] });
    } else {
      console.log("No m3u8 link found.");
      res.status(404).json({ error: "m3u8 link not found" });
    }

    await browser.close();
  } catch (error) {
    console.error("Error fetching m3u8 link:", error);
    res.status(500).json({ error: "Failed to fetch m3u8 link", details: error.message });
  }
});
