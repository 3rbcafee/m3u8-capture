const puppeteer = require("puppeteer");

app.get("/get-stream", async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).json({ error: "URL parameter is missing" });
  }

  try {
    const decodedUrl = decodeURIComponent(targetUrl);

    // Launch Puppeteer browser instance
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Array to store the m3u8 links
    let m3u8Links = [];

    // Intercept network requests and filter for m3u8 requests
    page.on("response", async (response) => {
      const url = response.url();
      // Check if the URL contains .m3u8 (you can refine this further based on your target)
      if (url.includes(".m3u8")) {
        m3u8Links.push(url); // Save the m3u8 URL
      }
    });

    // Visit the page and wait for the necessary requests
    await page.goto(decodedUrl, { waitUntil: "domcontentloaded" });

    // Wait for some time to allow the m3u8 request to be captured
    await page.waitForTimeout(5000); // Adjust time as necessary to allow m3u8 link to be fetched

    // Close the browser after capturing the m3u8 link
    await browser.close();

    // If we found m3u8 links, return them
    if (m3u8Links.length > 0) {
      res.json({ m3u8: m3u8Links[0] }); // Return the first m3u8 link (you can adjust if there are multiple)
    } else {
      res.status(404).json({ error: "m3u8 link not found" });
    }
  } catch (error) {
    console.error("Error fetching m3u8 link:", error);
    res.status(500).json({ error: "Failed to fetch m3u8 link" });
  }
});
