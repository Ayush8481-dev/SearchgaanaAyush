export default async function handler(req, res) {
  // 1. Enable CORS for your mobile frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 2. Build the correct Gaana URL dynamically and safely grab your queries
    const urlObj = new URL(req.url, `http://${req.headers.host}`);
    const targetUrl = 'https://gsearch.gaana.com/vichitih/go/v2/' + urlObj.search;

    // 3. Fetch with strict Gaana App Headers
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'deviceType': 'GaanaWebApp',
        'appVersion': 'V5',
        'Origin': 'https://gaana.com',
        'Referer': 'https://gaana.com/',
        'Accept-Language': 'en-IN,en;q=0.9,hi-IN;q=0.8,hi;q=0.7'
      }
    });

    const status = response.status;
    const text = await response.text();

    // 4. If Gaana returns an empty page, show a JSON error instead of a white screen
    if (!text || text.trim() === "") {
      return res.status(status).json({
         success: false,
         error: "Gaana returned a totally blank response. They might require a Cookie or Token.",
         statusCode: status,
         requestedUrl: targetUrl
      });
    }

    // 5. If it worked, send the raw JSON Gaana data back to you
    res.setHeader('Content-Type', 'application/json');
    res.status(status).send(text);

  } catch (error) {
    res.status(500).json({ success: false, error: 'Proxy code crashed', details: error.message });
  }
}
