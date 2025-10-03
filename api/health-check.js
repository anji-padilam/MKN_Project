// Health check endpoint to test external API connectivity
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const baseUrl = process.env.API_BASE_URL || 'https://phpstack-1520234-5847937.cloudwaysapps.com/api/v1';
    const testUrl = `${baseUrl}/news/test-connection`;
    
    console.log('Testing connection to:', testUrl);
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MaroKurukshetram-Web/1.0',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    console.log('Health check response status:', response.status);
    
    res.status(200).json({
      status: 'ok',
      externalApi: {
        url: baseUrl,
        reachable: response.ok,
        status: response.status,
        statusText: response.statusText
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Health check error:', error);
    
    res.status(200).json({
      status: 'error',
      externalApi: {
        url: process.env.API_BASE_URL || 'https://phpstack-1520234-5847937.cloudwaysapps.com/api/v1',
        reachable: false,
        error: error.message,
        code: error.code
      },
      timestamp: new Date().toISOString()
    });
  }
}







