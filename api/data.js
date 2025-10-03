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
    const { type, language_id, state_id } = req.query;

    if (!type) {
      return res.status(400).json({ 
        status: 0, 
        message: 'type parameter is required (categories, languages, states, districts)',
        result: null 
      });
    }

    let apiUrl;
    let logPrefix;

    switch (type) {
      case 'categories':
        if (!language_id) {
          return res.status(400).json({ 
            status: 0, 
            message: 'language_id parameter is required for categories',
            result: null 
          });
        }
        apiUrl = `https://phpstack-1520234-5847937.cloudwaysapps.com/api/v1/news/categories?language_id=${language_id}`;
        logPrefix = '[Categories API]';
        break;
      
      case 'languages':
        apiUrl = 'https://phpstack-1520234-5847937.cloudwaysapps.com/api/v1/news/languages';
        logPrefix = '[Languages API]';
        break;
      
      case 'states':
        if (!language_id) {
          return res.status(400).json({ 
            status: 0, 
            message: 'language_id parameter is required for states',
            result: null 
          });
        }
        apiUrl = `https://phpstack-1520234-5847937.cloudwaysapps.com/api/v1/news/states?language_id=${language_id}`;
        logPrefix = '[States API]';
        break;
      
      case 'districts':
        if (!language_id) {
          return res.status(400).json({ 
            status: 0, 
            message: 'language_id parameter is required for districts',
            result: null 
          });
        }
        if (!state_id) {
          return res.status(400).json({ 
            status: 0, 
            message: 'state_id parameter is required for districts',
            result: null 
          });
        }
        apiUrl = `https://phpstack-1520234-5847937.cloudwaysapps.com/api/v1/news/districts?language_id=${language_id}&state_id=${state_id}`;
        logPrefix = '[Districts API]';
        break;
      
      case 'local-mandis':
        apiUrl = `https://phpstack-1520234-5847937.cloudwaysapps.com/api/v1/local-mandis`;
        logPrefix = '[Local Mandis API]';
        break;
      
      case 'health-check':
        // Health check functionality
        const baseUrl = process.env.API_BASE_URL || 'https://phpstack-1520234-5847937.cloudwaysapps.com/api/v1';
        const testUrl = `${baseUrl}/news/test-connection`;
        
        try {
          const healthResponse = await fetch(testUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'MaroKurukshetram-Web/1.0',
              'Accept': 'application/json',
            },
            signal: AbortSignal.timeout(10000)
          });
          
          return res.status(200).json({
            status: 'ok',
            externalApi: {
              url: baseUrl,
              reachable: healthResponse.ok,
              status: healthResponse.status,
              statusText: healthResponse.statusText
            },
            timestamp: new Date().toISOString()
          });
        } catch (healthError) {
          return res.status(200).json({
            status: 'error',
            externalApi: {
              url: baseUrl,
              reachable: false,
              error: healthError.message,
              code: healthError.code
            },
            timestamp: new Date().toISOString()
          });
        }
      
      default:
        return res.status(400).json({ 
          status: 0, 
          message: 'Invalid type. Must be one of: categories, languages, states, districts, local-mandis, health-check',
          result: null 
        });
    }
    
    console.log(`${logPrefix} Fetching ${type} for language_id: ${language_id || 'N/A'}`);
    console.log(`${logPrefix} API URL: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`${logPrefix} API request failed: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({
        status: 0,
        message: `API request failed: ${response.statusText}`,
        result: null
      });
    }

    const data = await response.json();
    console.log(`${logPrefix} Received ${data.result?.length || 0} ${type} from external API`);

    if (data.status === 1 && data.result) {
      let processedData = data.result;
      
      // Apply specific filtering for categories
      if (type === 'categories') {
        processedData = data.result.filter(category => 
          category.is_active === 1 && category.is_deleted === 0
        );
        console.log(`${logPrefix} Returning ${processedData.length} active categories`);
      }
      
      return res.status(200).json({
        status: 1,
        message: `${type.charAt(0).toUpperCase() + type.slice(1)} fetched successfully`,
        result: processedData
      });
    } else {
      console.error(`${logPrefix} API returned error: ${data.message}`);
      return res.status(400).json({
        status: 0,
        message: data.message || `Failed to fetch ${type}`,
        result: null
      });
    }
  } catch (error) {
    console.error(`[Data API] Error:`, error);
    return res.status(500).json({
      status: 0,
      message: 'Internal server error',
      result: null
    });
  }
}
