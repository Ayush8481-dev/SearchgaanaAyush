export default async function handler(req, res) {
  // 1. Enable CORS so your mobile app can read the data
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 2. Extract your custom parameters
    // Note: It is best to use a "?" in your URL like: /app/?query=Hello
    let { 
      query, 
      type = 'all', 
      language = 'English,hindi,bhojpuri', 
      limit = 10, 
      offset = 0 
    } = req.query;

    // Safety net: Just in case you forget the "?" in the URL (e.g., /app/query=Hello)
    if (!query && req.url.includes('query=')) {
       const paramString = req.url.substring(req.url.indexOf('query='));
       const rawParams = new URLSearchParams(paramString);
       query = rawParams.get('query');
       type = rawParams.get('type') || type;
       language = rawParams.get('language') || language;
       limit = rawParams.get('limit') || limit;
       offset = rawParams.get('offset') || offset;
    }

    // Stop if no query is provided
    if (!query) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing query. Use format: /app/?query=songname" 
      });
    }

    // 3. Map your simple 'type' parameters to Gaana's actual Android subtypes
    let subtype = '';
    const reqType = type.toLowerCase().trim();
    
    if (reqType === 'tracks') subtype = 'search_song';
    else if (reqType === 'album') subtype = 'search_album';
    else if (reqType === 'playlist') subtype = 'search_playlist';
    else if (reqType === 'artist') subtype = 'search_artist';
    // If 'all', we leave subtype empty, which tells Gaana to search everything.

    // 4. Build the secret Gaana Android App API URL (Unblockable)
    const gaanaUrl = new URL('https://api.gaana.com/index.php');
    gaanaUrl.searchParams.append('type', 'search'); // Main action
    
    if (subtype) {
      gaanaUrl.searchParams.append('subtype', subtype); // Search specific type
    }
    
    gaanaUrl.searchParams.append('key', query); // The search text
    gaanaUrl.searchParams.append('usrLang', language); // e.g. English,Hindi,Bhojpuri
    gaanaUrl.searchParams.append('limit', limit);
    gaanaUrl.searchParams.append('limit_offset', offset); // Gaana pagination
    gaanaUrl.searchParams.append('startIndex', offset);   // Backup pagination fallback

    // 5. Fetch pretending to be the Official Android App
    const response = await fetch(gaanaUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 10; Pixel 3a Build/QQ3A.200805.001)',
        'Accept': 'application/json, text/plain, */*',
        'deviceType': 'GaanaAndroidApp',
        'appVersion': 'V5'
      }
    });

    const data = await response.text();
    
    // 6. Return the pure JSON data directly to your frontend
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(data);

  } catch (error) {
    return res.status(500).json({ success: false, error: 'API crashed', details: error.message });
  }
}
