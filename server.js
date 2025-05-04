const express = require("express");
const puppeteer = require("puppeteer");
const app = express();

app.get("/get-stream", async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl || !targetUrl.startsWith("http")) {
    return res.status(400).json({ error: "Missing or invalid 'url' parameter" });
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    let streamUrl = null;

    page.on("response", async (response) => {
      const url = response.url();
      if (url.endsWith(".m3u8") && !streamUrl) {
        streamUrl = url;
      }
    });

    await page.goto(targetUrl, {
      waitUntil: "networkidle2",
      timeout: 0
    });

    await page.waitForTimeout(10000); // wait 10 seconds for the m3u8 to appear

    await browser.close();

    if (streamUrl) {
      res.json({ m3u8: streamUrl });
    } else {
      res.status(404).json({ error: "Stream not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error processing the page" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
