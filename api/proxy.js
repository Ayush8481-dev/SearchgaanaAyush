export default async function handler(req, res) {
  // 1. Enable CORS for your mobile frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const urlObj = new URL(req.url, `http://${req.headers.host}`);
    
    // 2. The exact gsearch URL you requested
    const targetUrl = 'https://gsearch.gaana.com/vichitih/go/v2/' + urlObj.search;

    // 3. Trick #1: Pretend to be the official Android App (Bypasses most IP blocks)
    let response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 10; Pixel 3a Build/QQ3A.200805.001)',
        'Accept': 'application/json, text/plain, */*',
        'deviceType': 'GaanaAndroidApp',
        'appVersion': 'V5'
      }
    });

    let text = await response.text();

    // 4. Trick #2 (Learned from GaanaPy): 
    // If gsearch STILL blocks Vercel's IP and returns a blank page, smoothly fallback to the internal api.gaana.com!
    if (!text || text.trim() === "") {
        const userQuery = urlObj.searchParams.get('query') || 'Hello';
        
        // This is the hidden endpoint GaanaPy uses that does not block Vercel Data Centers
        const fallbackUrl = `https://api.gaana.com/index.php?type=search&subtype=search_song&content_filter=2&key=${encodeURIComponent(userQuery)}`;
        
        response = await fetch(fallbackUrl, {
             method: 'GET',
             headers: {
                 'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 10; Pixel 3a Build/QQ3A.200805.001)',
                 'deviceType': 'GaanaAndroidApp',
                 'appVersion': 'V5'
             }
        });
        
        text = await response.text();
    }

    // 5. Send the raw JSON back to your screen
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(text);

  } catch (error) {
    res.status(500).json({ success: false, error: 'Proxy code crashed', details: error.message });
  }
}
