export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action } = req.query;

    if (!action) {
      return res.status(400).json({ 
        status: 0, 
        message: 'action parameter is required (login, register, forgot-password, reset-password, verify-code)',
        result: null 
      });
    }

    let apiUrl;
    let logPrefix;

    switch (action) {
      case 'login':
        apiUrl = 'https://phpstack-1520234-5847937.cloudwaysapps.com/api/v1/auth/userLogin';
        logPrefix = '[Login API]';
        break;
      
      case 'register':
        apiUrl = 'https://phpstack-1520234-5847937.cloudwaysapps.com/api/v1/auth/register';
        logPrefix = '[Register API]';
        break;
      
      case 'forgot-password':
        apiUrl = 'https://phpstack-1520234-5847937.cloudwaysapps.com/api/v1/auth/forgot-password';
        logPrefix = '[Forgot Password API]';
        break;
      
      case 'reset-password':
        apiUrl = 'https://phpstack-1520234-5847937.cloudwaysapps.com/api/v1/auth/reset-password';
        logPrefix = '[Reset Password API]';
        break;
      
      case 'verify-code':
        apiUrl = 'https://phpstack-1520234-5847937.cloudwaysapps.com/api/v1/auth/verify-code';
        logPrefix = '[Verify Code API]';
        break;
      
      default:
        return res.status(400).json({ 
          status: 0, 
          message: 'Invalid action. Must be one of: login, register, forgot-password, reset-password, verify-code',
          result: null 
        });
    }
    
    console.log(`${logPrefix} Processing ${action} request`);
    console.log(`${logPrefix} API URL: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
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
    console.log(`${logPrefix} Received response from external API`);

    return res.status(200).json(data);
  } catch (error) {
    console.error(`[Auth API] Error:`, error);
    return res.status(500).json({
      status: 0,
      message: 'Internal server error',
      result: null
    });
  }
}
