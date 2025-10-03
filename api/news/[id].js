// API route for single news by ID
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

  let timeoutId;
  
  try {
    console.log('=== API PROXY CALLED ===');
    console.log('Method:', req.method);
    console.log('Query:', req.query);
    console.log('Body:', req.body);
    
    const { method, query, body } = req;
    const { id } = query;
    
    // Validate news ID
    if (!id) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'News ID is required',
        status: 400,
        type: 'VALIDATION_ERROR'
      });
    }
    
    // Basic UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid news ID format',
        status: 400,
        type: 'VALIDATION_ERROR'
      });
    }
    
    // Construct the target URL
    const baseUrl = process.env.API_BASE_URL || 'https://phpstack-1520234-5847937.cloudwaysapps.com/api/v1';
    let targetUrl = `${baseUrl}/news/${id}`;
    
    console.log('Base URL:', baseUrl);
    console.log('News ID:', id);
    console.log('Target URL:', targetUrl);
    
    // Add query parameters
    const queryParams = new URLSearchParams();
    Object.keys(query).forEach(key => {
      if (key !== 'id') {
        queryParams.append(key, query[key]);
      }
    });
    
    if (queryParams.toString()) {
      targetUrl += `?${queryParams.toString()}`;
    }
    
    // Create AbortController for timeout
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    // Prepare request options
    const requestOptions = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MaroKurukshetram-Web/1.0',
        'Accept': 'application/json',
      },
      signal: controller.signal,
    };

    // Add Authorization header if present in the original request
    if (req.headers.authorization) {
      requestOptions.headers['Authorization'] = req.headers.authorization;
      console.log('Authorization header added to external API request');
    }

    // Add body for POST/PUT requests
    if (body && (method === 'POST' || method === 'PUT')) {
      requestOptions.body = JSON.stringify(body);
    }

    console.log('Proxying request to:', targetUrl);
    console.log('Request method:', method);
    console.log('Request body:', body);
    console.log('Request headers:', requestOptions.headers);

    // Make the request to the external API with retry logic
    console.log('Making request to external API...');
    let response;
    let lastError;
    
    // Try up to 3 times
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`Attempt ${attempt} of 3`);
        response = await fetch(targetUrl, requestOptions);
        console.log('External API request completed');
        break; // Success, exit retry loop
      } catch (error) {
        lastError = error;
        console.error(`Attempt ${attempt} failed:`, error.message);
        
        if (attempt < 3) {
          // Wait before retrying (exponential backoff)
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s
          console.log(`Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // If all attempts failed, provide a fallback response
    if (!response) {
      console.error('All retry attempts failed, providing fallback response');
      clearTimeout(timeoutId);
      
      return res.status(503).json({
        status: 0,
        message: 'News service is temporarily unavailable. Please try again later.',
        result: null,
        error: 'SERVICE_UNAVAILABLE',
        details: {
          originalError: lastError?.message || 'All retry attempts failed',
          retryAttempts: 3
        }
      });
    }
    
    // Clear the timeout since request completed
    clearTimeout(timeoutId);
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      console.error('API response not ok:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error response body:', errorText);
      console.error('Error response length:', errorText.length);
      
      // Try to parse error response as JSON
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        console.error('Parsed error data:', errorData);
        console.error('Error data message:', errorData.message);
        console.error('Error data status:', errorData.status);
      } catch (e) {
        console.error('Failed to parse error response as JSON:', e.message);
        errorData = { message: errorText };
      }
      
      // Handle specific error cases
      if (response.status === 404) {
        return res.status(404).json({
          error: 'News not found',
          message: 'The requested news article was not found.',
          status: 404,
          type: 'NOT_FOUND',
          details: errorData
        });
      }
      
      if (response.status === 401) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required to access this news article.',
          status: 401,
          type: 'UNAUTHORIZED',
          details: errorData
        });
      }
      
      if (response.status === 403) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have permission to access this news article.',
          status: 403,
          type: 'FORBIDDEN',
          details: errorData
        });
      }
      
      // For 500 errors from external API, forward the error to frontend
      if (response.status === 500) {
        console.log('External API returned 500 error, forwarding to frontend');
        return res.status(500).json({
          status: 0,
          message: errorData.message || 'Internal server error',
          result: null,
          error: 'SERVER_ERROR',
          details: errorData
        });
      }
      
      return res.status(response.status).json({
        error: 'API request failed',
        message: errorData.message || `API returned ${response.status}: ${response.statusText}`,
        status: response.status,
        type: 'API_ERROR',
        details: errorData
      });
    }
    
    const data = await response.json();
    console.log('Response data:', data);
    console.log('Response data status:', data.status);
    console.log('Response data message:', data.message);
    console.log('Response data keys:', Object.keys(data));
    
    // Check if the response has the expected structure
    if (!data.hasOwnProperty('status')) {
      console.warn('Response does not have status field, this might cause issues');
    }
    
    res.status(response.status).json(data);
  } catch (error) {
    // Clear timeout if it exists
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    console.error('Proxy error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    // Check if it's a timeout error
    if (error.name === 'AbortError') {
      return res.status(408).json({ 
        error: 'Request timeout',
        message: 'The request took too long to complete. Please try again.',
        status: 408,
        type: 'TIMEOUT_ERROR'
      });
    }
    
    // Check if it's a network error
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'Service unavailable',
        message: 'Unable to connect to the news service. Please try again later.',
        status: 503,
        type: 'SERVICE_UNAVAILABLE'
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred',
      status: 500,
      type: 'PROXY_ERROR',
      details: {
        name: error.name,
        code: error.code
      }
    });
  }
}