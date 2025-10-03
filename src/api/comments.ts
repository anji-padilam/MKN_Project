import apiClient from "./apiClient";
import { Comment, CommentResponse, CommentRequest, PostCommentRequest } from "./apiTypes";

// Post a comment to a news article
export async function postComment(newsId: string, commentData: PostCommentRequest): Promise<Comment> {
  console.log('Posting comment with data:', {
    newsId,
    commentData,
    url: `/news/${newsId}/comments`
  });
  
  // Include newsId in the request body as well
  const requestData = {
    ...commentData,
    newsId: newsId
  };
  
  try {
    const response = await apiClient.post<Comment>(`/news/${newsId}/comments`, requestData);
    return response.data;
  } catch (error: any) {
    console.error('Error posting comment:', error);
    throw error;
  }
}

// Get all comments for a news article with pagination and sorting
export async function getComments(
  newsId: string, 
  page: number = 1
): Promise<CommentResponse> {
  console.log('Fetching comments with data:', {
    newsId,
    page,
    url: `/news/${newsId}/comments`
  });
  
  try {
    console.log('Making API call to:', `/news/${newsId}/comments`);
    console.log('With parameters:', { page });
    
    const response = await apiClient.get<CommentResponse>(`/news/${newsId}/comments`, {
      params: { 
        page
      }
    });
    console.log('Comments response:', response.data);
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    console.log('Full response object:', response);
    
    // Check if response.data has the expected structure
    if (response.data) {
      console.log('Response data structure:', {
        hasSuccess: 'success' in response.data,
        hasMessage: 'message' in response.data,
        hasData: 'data' in response.data,
        dataKeys: Object.keys(response.data),
        commentsArray: response.data.data?.comments || 'No comments array',
        commentsLength: response.data.data?.comments?.length || 0
      });
    }
    
    return response.data;
  } catch (error: any) {
    // Log the error details for debugging
    console.log('API Error Details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      data: error.response?.data,
      message: error.message
    });
    
    // If it's a 404 error, the API endpoint might not exist yet - handle silently
    if (error.response?.status === 404 || error.status === 404 || error.type === 'NOT_FOUND') {
      console.log('404 Error - API endpoint not found, using fallback');
      return {
        success: true,
        message: 'Comments API not yet implemented',
        data: {
          comments: [],
          totalCount: 0,
          hasMore: false,
          currentPage: 1,
          totalPages: 0
        }
      };
    }
    
    // For other errors, log them and throw
    console.error('Error in getComments:', error);
    
    // Log more details about the error
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      console.error('Request was made but no response received:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    
    throw error;
  }
}

// Get comments with CommentRequest object
export async function getCommentsWithRequest(request: CommentRequest): Promise<CommentResponse> {
  const { newsId, page = 1 } = request;
  return getComments(newsId, page);
}

// Get comment count for a news article
export async function getCommentCount(newsId: string): Promise<number> {
  console.log('Fetching comment count for newsId:', newsId);
  
  try {
    // First try the dedicated count endpoint
    const response = await apiClient.get<{ total: number }>(`/news/${newsId}/comments/count`);
    console.log('Comment count response:', response.data);
    return response.data.total || 0;
  } catch (error) {
    console.log('Count API not available, using comments API fallback');
    // Fallback: get count from comments API (this is more reliable)
    try {
      const commentsResponse = await getComments(newsId, 1, 1); // Just get 1 comment to get total count
      console.log('Comment count from comments API:', commentsResponse.data.totalCount);
      return commentsResponse.data.totalCount || 0;
    } catch (fallbackError) {
      console.error('Fallback comment count also failed:', fallbackError);
      return 0;
    }
  }
}
