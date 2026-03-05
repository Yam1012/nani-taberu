// Vercel Serverless Function — Google Places Nearby Search proxy
// API key is stored in Vercel environment variable: GOOGLE_PLACES_KEY
module.exports = async (req, res) => {
  // CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { lat, lng, keyword, radius = '1500' } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ status: 'ERROR', error: 'lat and lng are required' });
  }

  const apiKey = process.env.GOOGLE_PLACES_KEY;
  if (!apiKey) {
    return res.status(500).json({ status: 'ERROR', error: 'API key not configured' });
  }

  const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
  url.searchParams.set('location', `${lat},${lng}`);
  url.searchParams.set('radius', radius);
  url.searchParams.set('type', 'restaurant');
  url.searchParams.set('language', 'ja');
  if (keyword) url.searchParams.set('keyword', keyword);
  url.searchParams.set('key', apiKey);

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      return res.status(502).json({ status: 'ERROR', error: `Upstream HTTP ${response.status}` });
    }
    const data = await response.json();
    // Cache for 5 minutes on Vercel edge, serve stale for 10 min
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ status: 'ERROR', error: error.message });
  }
};
