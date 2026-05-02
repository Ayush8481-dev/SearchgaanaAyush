export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // 1. Safely extract your parameters
    let query = req.query.query;
    let type = req.query.type || 'all';
    let language = req.query.language || 'English,hindi,bhojpuri';
    let limit = req.query.limit || 10;
    let offset = req.query.offset || 0;

    // Safety net: In case you use /app/query=Hello instead of /app/?query=Hello
    if (!query && req.url.includes('query=')) {
       const paramStr = req.url.substring(req.url.indexOf('query='));
       const urlParams = new URLSearchParams(paramStr);
       query = urlParams.get('query');
       type = urlParams.get('type') || type;
       language = urlParams.get('language') || language;
       limit = urlParams.get('limit') || limit;
       offset = urlParams.get('offset') || offset;
    }

    if (!query) {
      return res.status(400).json({ error: "Missing query. Please provide a search term." });
    }

    const reqType = type.toLowerCase().trim();

    // 2. Map types for Web API
    const gsearchIncludes = {
      all: 'allItems', tracks: 'track', album: 'album', playlist: 'playlist', artist: 'artist'
    };
    const includeType = gsearchIncludes[reqType] || 'allItems';

    // 3. ATTEMPT 1: GSearch Web API (Supports Limits & Languages)
    const gsearchUrl = `https://gsearch.gaana.com/vichitih/go/v2/?geoLocation=GLOBAL&query=${encodeURIComponent(query)}&content_filter=2&include=${includeType}&isRegSrch=0&webVersion=mix&rType=web&startIndex=${offset}&usrLang=${encodeURIComponent(language)}`;

    let response = await fetch(gsearchUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://gaana.com',
        'Referer': 'https://gaana.com/'
        // CRITICAL FIX: Intentionally left out Accept-Encoding to prevent the "Blank Text" Vercel bug!
      }
    });

    let text = await response.text();

    // If Web API successfully returns data without giving the 0-count error
    if (text && text.trim().startsWith('{') && !text.includes('"user-token-status": 0')) {
       const json = JSON.parse(text);
       if ((json[includeType] && json[includeType] !== null) || json.count > 0 || json.data) {
           res.setHeader('Content-Type', 'application/json');
           return res.status(200).send(text);
       }
    }

    // 4. ATTEMPT 2: Fallback to Mobile API (Unblockable)
    // Map types for Mobile API
    const mobileIncludes = {
      tracks: 'search_song', album: 'search_album', playlist: 'search_playlist', artist: 'search_artist'
    };
    const subtype = mobileIncludes[reqType] || '';

    const mobileUrl = new URL('https://api.gaana.com/index.php');
    mobileUrl.searchParams.append('type', 'search');
    if (subtype) mobileUrl.searchParams.append('subtype', subtype);
    mobileUrl.searchParams.append('content_filter', '2');
    mobileUrl.searchParams.append('key', query);
    // CRITICAL FIX: Do NOT append language or limits here! It crashes the mobile API.

    response = await fetch(mobileUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 10; Pixel 3a Build/QQ3A.200805.001)',
        'deviceType': 'GaanaAndroidApp',
        'appVersion': 'V5'
      }
    });

    text = await response.text();
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(text);

  } catch (error) {
    return res.status(500).json({ error: 'API crashed', details: error.message });
  }
}
