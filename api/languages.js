export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiUrl = 'https://phpstack-1520234-5847937.cloudwaysapps.com/api/v1/news/languages';
    
    console.log(`[Languages API] Fetching languages from: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`[Languages API] API request failed: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({
        status: 0,
        message: `API request failed: ${response.statusText}`,
        result: null
      });
    }

    const data = await response.json();
    console.log(`[Languages API] Received ${data.result?.length || 0} languages from external API`);

    if (data.status === 1 && data.result) {
      // Filter out deleted and inactive languages
      const activeLanguages = data.result.filter(language => 
        language.is_active === 1 && language.is_deleted === 0
      );
      
      console.log(`[Languages API] Returning ${activeLanguages.length} active languages`);
      
      return res.status(200).json({
        status: 1,
        message: 'Languages fetched successfully',
        result: activeLanguages
      });
    } else {
      console.error(`[Languages API] API returned error: ${data.message}`);
      return res.status(400).json({
        status: 0,
        message: data.message || 'Failed to fetch languages',
        result: null
      });
    }
  } catch (error) {
    console.error('[Languages API] Error:', error);
    return res.status(500).json({
      status: 0,
      message: 'Internal server error',
      result: null
    });
  }
}