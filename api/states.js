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
    const { language_id } = req.query;

    if (!language_id) {
      return res.status(400).json({ 
        status: 0, 
        message: 'language_id parameter is required',
        result: null 
      });
    }

    const apiUrl = `https://phpstack-1520234-5847937.cloudwaysapps.com/api/v1/news/states?language_id=${language_id}`;
    
    console.log(`[States API] Fetching states for language_id: ${language_id}`);
    console.log(`[States API] API URL: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`[States API] API request failed: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({
        status: 0,
        message: `API request failed: ${response.statusText}`,
        result: null
      });
    }

    const data = await response.json();
    console.log(`[States API] Received ${data.result?.length || 0} states from external API`);

    if (data.status === 1 && data.result) {
      // Filter out deleted and inactive states
      const activeStates = data.result.filter(state => 
        state.is_active === 1 && state.is_deleted === 0
      );
      
      console.log(`[States API] Returning ${activeStates.length} active states`);
      
      return res.status(200).json({
        status: 1,
        message: 'States fetched successfully',
        result: activeStates
      });
    } else {
      console.error(`[States API] API returned error: ${data.message}`);
      return res.status(400).json({
        status: 0,
        message: data.message || 'Failed to fetch states',
        result: null
      });
    }
  } catch (error) {
    console.error('[States API] Error:', error);
    return res.status(500).json({
      status: 0,
      message: 'Internal server error',
      result: null
    });
  }
}