export default async function handler(req, res) {
  // 1. Enable CORS for your mobile
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 2. Safely grab the EXACT query string you typed in the URL
    const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    const targetUrl = 'https://gsearch.gaana.com/vichitih/go/v2/' + queryString;

    // 3. Pretend to be a real Chrome browser from the main Gaana website
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Origin': 'https://gaana.com',
        'Referer': 'https://gaana.com/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site',
        'Connection': 'keep-alive'
      }
    });

    // 4. Get the exact text Gaana responded with
    const data = await response.text();

    // Log it so you can view it in the Vercel Dashboard later
    console.log("Gaana Status Code:", response.status);
    console.log("Gaana Response Preview:", data.substring(0, 300));

    // 5. Send back the exact Content-Type Gaana sent. 
    // If they sent HTML (an error/captcha), your browser will now display it instead of going blank.
    const contentType = response.headers.get('content-type') || 'text/plain';
    res.setHeader('Content-Type', contentType);
    res.status(response.status).send(data);

  } catch (error) {
    res.status(500).json({ error: 'Proxy crashed', details: error.message });
  }
}
