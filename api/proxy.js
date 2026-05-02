export default async function handler(req, res) {
  // 1. Enable CORS so your browser/app doesn't block the request
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 2. Setup the target Gaana API URL
    const targetUrl = new URL('https://gsearch.gaana.com/vichitih/go/v2/');
    
    // 3. Forward all the queries (?query=Hello&content_filter=2...) automatically
    Object.keys(req.query).forEach(key => {
      targetUrl.searchParams.append(key, req.query[key]);
    });

    // 4. Fetch the data from Gaana, pretending to be a real browser
    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://gaana.com',
        'Referer': 'https://gaana.com/'
      }
    });

    // 5. Send the exact response back to you
    const data = await response.text();
    res.setHeader('Content-Type', 'application/json');
    res.status(response.status).send(data);

  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data', details: error.message });
  }
}
