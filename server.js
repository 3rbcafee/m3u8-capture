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
      args: chrome.args,
      defaultViewport: chrome.defaultViewport,
    });

    const page = await browser.newPage();

    // Array to store the m3u8 links
    let m3u8Links = [];

    // Intercept network requests and filter for m3u8 requests
    page.on("response", async (response) => {
      const url = response.url();
      if (url.includes(".m3u8")) {
        console.log("Found m3u8 link:", url); // Log the m3u8 link
        m3u8Links.push(url);
      }
    });

    // Visit the page and wait for the necessary requests
    await page.goto(decodedUrl, { waitUntil: "domcontentloaded" });

    // Try to find a specific element that indicates page has loaded completely
    // If you know a specific selector that indicates the m3u8 link is ready, use it
    // For example: await page.waitForSelector("div#video-player", { timeout: 10000 });

    // Wait for m3u8 link to appear in the network response (timeout after 10 seconds)
    const startTime = Date.now();
    while (m3u8Links.length === 0 && Date.now() - startTime < 10000) {
      await page.waitForTimeout(500); // Check every 500ms for new network response
    }

    // Check if any m3u8 link has been captured
    if (m3u8Links.length > 0) {
      console.log("m3u8 link found:", m3u8Links[0]);
      res.json({ m3u8: m3u8Links[0] }); // Return the first m3u8 link
    } else {
      console.log("No m3u8 link found.");
      res.status(404).json({ error: "m3u8 link not found" });
    }

    // Close the browser after capturing the m3u8 link
    await browser.close();
  } catch (error) {
    console.error("Error fetching m3u8 link:", error);
    res.status(500).json({ error: "Failed to fetch m3u8 link", details: error.message });
  }
});
