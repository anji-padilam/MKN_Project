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
    const { state_id } = req.query;

    if (!state_id) {
      return res.status(400).json({ 
        status: 0, 
        message: 'state_id parameter is required',
        result: null 
      });
    }

    const apiUrl = `https://phpstack-1520234-5847937.cloudwaysapps.com/api/v1/news/districts?state_id=${state_id}`;
    
    console.log(`[Districts API] Fetching districts for state_id: ${state_id}`);
    console.log(`[Districts API] API URL: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`[Districts API] API request failed: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({
        status: 0,
        message: `API request failed: ${response.statusText}`,
        result: null
      });
    }

    const data = await response.json();
    console.log(`[Districts API] Received ${data.result?.length || 0} districts from external API`);

    if (data.status === 1 && data.result) {
      // Filter out deleted and inactive districts
      const activeDistricts = data.result.filter(district => 
        district.is_active === 1 && district.is_deleted === 0
      );
      
      console.log(`[Districts API] Returning ${activeDistricts.length} active districts`);
      
      return res.status(200).json({
        status: 1,
        message: 'Districts fetched successfully',
        result: activeDistricts
      });
    } else {
      console.error(`[Districts API] API returned error: ${data.message}`);
      return res.status(400).json({
        status: 0,
        message: data.message || 'Failed to fetch districts',
        result: null
      });
    }
  } catch (error) {
    console.error('[Districts API] Error:', error);
    return res.status(500).json({
      status: 0,
      message: 'Internal server error',
      result: null
    });
  }
}