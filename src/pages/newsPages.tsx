import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Clock,
    Share2,
    ThumbsUp,
    MessageCircle,
    Heart,
    User,
    Eye,
    MapPin,
    Tag,
    Send,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getSingleNews } from "../api/apiSingleNews";
import apiClient from "../api/apiClient";
import { postComment, getComments, getCommentsWithRequest, getCommentCount } from "../api/comments";
import { Comment, CommentResponse, CommentRequest } from "../api/apiTypes";
import RelatedNews from "../components/RelatedNews";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { formatTimeAgo } from "@/utils/timeUtils";
import { useDynamicData } from "../contexts/DynamicDataContext";

interface SingleNewsData {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    shortNewsContent: string;
    longNewsContent: { content: string } | string | any; // Allow various structures
    content?: string; // Additional content field that may exist in some data structures
    description?: string; // Additional description field that may exist in some data structures
    summary?: string; // Additional summary field
    body?: string; // Additional body field
    text?: string; // Additional text field
    html?: string; // Additional html field
    media: Array<{
        id: string;
        mediaType: string;
        mediaUrl: string;
        caption: string;
    }>;
    categoryId: string;
    categoryName: string;
    district_id: string;
    districtName: string;
    state_id: string;
    stateName: string;
    language_id: string;
    languageName: string;
    likeCount?: number;
    commentCount?: number;
    viewCount?: number;
    shareCount?: number;
    createdAt?: string;
    publishedAt?: string | null;
    authorId?: string | null;
    authorName?: string;
    editorId?: string | null;
    source?: string | null;
    sourceUrl?: string | null;
    readTime?: number | null;
}


// Convert YouTube URL into embeddable URL
const getYouTubeEmbedUrl = (url: string): string | null => {
    try {
        const parsedUrl = new URL(url);

        if (parsedUrl.hostname.includes("youtu.be")) {
            return `https://www.youtube.com/embed/${parsedUrl.pathname.slice(1)}`;
        }

        if (parsedUrl.hostname.includes("youtube.com")) {
            if (parsedUrl.pathname === "/watch") {
                return `https://www.youtube.com/embed/${parsedUrl.searchParams.get("v")}`;
            }
            if (parsedUrl.pathname.startsWith("/shorts/")) {
                return `https://www.youtube.com/embed/${parsedUrl.pathname.split("/")[2]}`;
            }
        }

        return null;
    } catch {
        return null;
    }
};

const NewsPage = () => {
    const { newsId } = useParams<{ newsId: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [newsData, setNewsData] = useState<SingleNewsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Get dynamic data from context
    const { 
        selectedLanguage, 
        selectedState, 
        selectedDistrict,
        getCurrentLanguageId,
        getCurrentStateId,
        getCurrentDistrictId
    } = useDynamicData();
    const [isLiked, setIsLiked] = useState(false); // UI state for like button (like Facebook/Instagram)
    const [isSaved, setIsSaved] = useState(false);
    const [likeCount, setLikeCount] = useState(0); // PUBLIC: Like count visible to everyone (like Facebook/Instagram)
    const [liking, setLiking] = useState(false);
    const [userLiked, setUserLiked] = useState(false); // PRIVATE: User's like status - only visible to logged-in user
    
    // Comment count state (similar to likes)
    const [commentCount, setCommentCount] = useState(0);
    
    // Debug comment count changes
    useEffect(() => {
        console.log('🔄 Comment count changed:', commentCount);
    }, [commentCount]);
    
    // Comment state
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [commentsError, setCommentsError] = useState<string | null>(null);

    const [newComment, setNewComment] = useState("");
    const [postingComment, setPostingComment] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [commentSortBy, setCommentSortBy] = useState<'newest' | 'oldest' | 'most_liked'>('newest');
    const [commentsPagination, setCommentsPagination] = useState({
        page: 1,
        perPage: 10, // Show 10 comments per page
        total: 0,
        totalPages: 0
    });


    // Fetch likes data using GET endpoint
    // This works exactly like Facebook/Instagram: public like count, private user status
    const fetchLikes = async (newsId: string) => {
        try {
            console.log('=== FETCHING LIKES (GET) ===');
            console.log('News ID:', newsId);
            console.log('API Endpoint: GET /news/' + newsId + '/likes');
            
            const response = await apiClient.get(`/news/${newsId}/likes`);
            console.log('Fetch Likes API Response:', response.data);
            
            const data = response.data as any;
            console.log('Response structure:', data);
            
            // Handle your specific API response format
            if (data?.status === 1 && data?.result?.success) {
                // Try different possible response structures
                let totalLikes, isLikedByUser;
                
                if (data?.result?.data) {
                    // Structure: { status: 1, result: { success: true, data: { totalLikes, isLikedByUser } } }
                    totalLikes = data.result.data.totalLikes;
                    isLikedByUser = data.result.data.isLikedByUser;
                    console.log('Using data.result.data structure for fetch');
                } else if (data?.result) {
                    // Structure: { status: 1, result: { totalLikes, isLikedByUser } }
                    totalLikes = data.result.totalLikes;
                    isLikedByUser = data.result.isLikedByUser;
                    console.log('Using data.result structure for fetch');
                } else {
                    // Fallback: use defaults
                    totalLikes = 0;
                    isLikedByUser = false;
                    console.log('Using defaults for fetch');
                }
                
                console.log('API data received:', { totalLikes, isLikedByUser });
                
                // Public like count - visible to everyone
                setLikeCount(totalLikes || 0);
                
                // Private user like status - only for logged-in user
                const token = localStorage.getItem('token');
                if (token) {
                    setUserLiked(isLikedByUser || false);
                    setIsLiked(isLikedByUser || false); // For UI state
                } else {
                    setUserLiked(false);
                    setIsLiked(false);
                }
                
                console.log('✅ Likes loaded successfully - Public Count:', totalLikes || 0, 'User liked (private):', isLikedByUser || false);
            } else {
                console.log('❌ Invalid API response structure, using defaults');
                console.log('Expected format: { status: 1, result: { success: true, data: { totalLikes, isLikedByUser } } }');
                console.log('Actual response:', data);
                setLikeCount(0);
                setIsLiked(false);
                setUserLiked(false);
            }
        } catch (error) {
            console.error("❌ Error fetching likes:", error);
            console.log('Setting default values due to error');
            setLikeCount(0);
            setIsLiked(false);
        }
    };

    // Monitor state changes for debugging
    useEffect(() => {
        console.log('🔄 State changed - isLiked:', isLiked, 'likeCount:', likeCount, 'userLiked:', userLiked);
    }, [isLiked, likeCount, userLiked]);

    // Fetch comment count using GET endpoint (similar to likes)
    const fetchCommentCount = async (newsId: string) => {
        try {
            console.log('=== FETCHING COMMENT COUNT (GET) ===');
            console.log('News ID:', newsId);
            console.log('API Endpoint: GET /news/' + newsId + '/comments/count');
            
            const count = await getCommentCount(newsId);
            console.log('Comment count received:', count);
            
            setCommentCount(count);
        } catch (error) {
            console.error('Error fetching comment count:', error);
            setCommentCount(0);
        }
    };

    // Fetch comments for the news article with new API structure
    const fetchComments = async (newsId: string, page: number = 1) => {
        try {
            setCommentsLoading(true);
            setCommentsError(null);
            
            console.log('=== FETCHING COMMENTS ===');
            console.log('News ID:', newsId);
            console.log('Page:', page);
            console.log('Per Page:', commentsPagination.perPage);
            
            const response = await getComments(newsId, page);
            console.log('Comments response:', response);
            console.log('Response structure:', {
                success: response.success,
                message: response.message,
                hasData: !!response.data,
                commentsCount: response.data?.comments?.length || 0,
                totalCount: response.data?.totalCount || 0
            });
            
            // Debug the actual response structure
            console.log('Raw response keys:', Object.keys(response));
            console.log('Response.data keys:', response.data ? Object.keys(response.data) : 'No data');
            console.log('Response.result keys:', (response as any).result ? Object.keys((response as any).result) : 'No result');
            console.log('Response.result.data keys:', (response as any).result?.data ? Object.keys((response as any).result.data) : 'No result.data');
            console.log('Comments array in result.data:', (response as any).result?.data?.comments);
            console.log('Comments array length in result.data:', (response as any).result?.data?.comments?.length);
            
            // Check if this is a fallback response
            if (response.message === 'Comments API not yet implemented') {
                console.log('Using fallback response - API not implemented yet');
                setComments([]);
                setCommentsPagination({
                    page: 1,
                    perPage: commentsPagination.perPage,
                    total: 0,
                    totalPages: 0
                });
                setCommentCount(0);
            } else if (response.success && response.data) {
                console.log('Processing successful API response');
                
                // Handle different possible response structures
                let commentsArray = [];
                let totalCount = 0;
                let currentPage = page;
                let totalPages = 0;
                
                // Check if comments are in response.data.comments (our expected structure)
                if (response.data.comments && Array.isArray(response.data.comments)) {
                    commentsArray = response.data.comments;
                    totalCount = response.data.totalCount || 0;
                    currentPage = response.data.currentPage || page;
                    totalPages = response.data.totalPages || 0;
                    console.log('Using response.data.comments structure');
                }
                // Check if the entire response is the comments array
                else if (Array.isArray(response)) {
                    commentsArray = response;
                    totalCount = response.length;
                    console.log('Using direct response array structure');
                }
                
                console.log('Final comments array:', commentsArray);
                console.log('Final total count:', totalCount);
                
                // Debug user information in comments
                if (commentsArray.length > 0) {
                    console.log('=== COMMENT DEBUG INFO ===');
                    console.log('First comment structure:', commentsArray[0]);
                    console.log('First comment keys:', Object.keys(commentsArray[0]));
                    
                    // Check for any field that might contain user information
                    const firstComment = commentsArray[0];
                    const possibleUserFields = Object.keys(firstComment).filter(key => 
                        key.toLowerCase().includes('user') || 
                        key.toLowerCase().includes('author') || 
                        key.toLowerCase().includes('name') || 
                        key.toLowerCase().includes('created') ||
                        key.toLowerCase().includes('by') ||
                        key.toLowerCase().includes('first') ||
                        key.toLowerCase().includes('last') ||
                        key.toLowerCase().includes('display') ||
                        key.toLowerCase().includes('nickname') ||
                        key.toLowerCase().includes('username') ||
                        key.toLowerCase().includes('profile') ||
                        key.toLowerCase().includes('person')
                    );
                    
                    console.log('Possible user-related fields:', possibleUserFields);
                    console.log('Values for user-related fields:', 
                        possibleUserFields.reduce((acc, key) => {
                            acc[key] = firstComment[key];
                            return acc;
                        }, {})
                    );
                    
                    // Check if there's a user object or nested structure
                    const nestedObjects = Object.keys(firstComment).filter(key => 
                        typeof firstComment[key] === 'object' && firstComment[key] !== null
                    );
                    console.log('Nested objects:', nestedObjects);
                    nestedObjects.forEach(key => {
                        console.log(`${key} object:`, firstComment[key]);
                        if (firstComment[key] && typeof firstComment[key] === 'object') {
                            console.log(`${key} keys:`, Object.keys(firstComment[key]));
                            // Check if this nested object has name fields
                            const nameFields = Object.keys(firstComment[key]).filter(nestedKey => 
                                nestedKey.toLowerCase().includes('name') || 
                                nestedKey.toLowerCase().includes('first') ||
                                nestedKey.toLowerCase().includes('last') ||
                                nestedKey.toLowerCase().includes('display') ||
                                nestedKey.toLowerCase().includes('nickname') ||
                                nestedKey.toLowerCase().includes('username') ||
                                nestedKey.toLowerCase().includes('profile') ||
                                nestedKey.toLowerCase().includes('person')
                            );
                            if (nameFields.length > 0) {
                                console.log(`${key} name fields:`, nameFields);
                                nameFields.forEach(nameField => {
                                    console.log(`${key}.${nameField}:`, firstComment[key][nameField]);
                                });
                            }
                        }
                    });
                    
                    // Check all string fields that might contain names
                    const stringFields = Object.keys(firstComment).filter(key => 
                        typeof firstComment[key] === 'string' && 
                        firstComment[key].length > 0 &&
                        !key.toLowerCase().includes('id') &&
                        !key.toLowerCase().includes('content') &&
                        !key.toLowerCase().includes('created') &&
                        !key.toLowerCase().includes('updated') &&
                        !key.toLowerCase().includes('email') &&
                        !key.toLowerCase().includes('phone') &&
                        !key.toLowerCase().includes('url') &&
                        !key.toLowerCase().includes('token') &&
                        !key.toLowerCase().includes('hash') &&
                        !key.toLowerCase().includes('key') &&
                        !key.toLowerCase().includes('secret') &&
                        !key.toLowerCase().includes('password') &&
                        !key.toLowerCase().includes('salt')
                    );
                    console.log('String fields that might contain names:', stringFields);
                    stringFields.forEach(field => {
                        console.log(`${field}:`, firstComment[field]);
                    });
                    
                    // Check if there's a user object with different structure
                    const userFields = Object.keys(firstComment).filter(key => 
                        key.toLowerCase().includes('user') && typeof firstComment[key] === 'object'
                    );
                    
                    console.log('User-related object fields:', userFields);
                    userFields.forEach(userField => {
                        const userObj = firstComment[userField];
                        console.log(`${userField} object:`, userObj);
                        if (userObj && typeof userObj === 'object') {
                            console.log(`${userField} keys:`, Object.keys(userObj));
                            // Check if this user object has name fields
                            const nameFields = Object.keys(userObj).filter(nestedKey => 
                                nestedKey.toLowerCase().includes('name') || 
                                nestedKey.toLowerCase().includes('first') ||
                                nestedKey.toLowerCase().includes('last') ||
                                nestedKey.toLowerCase().includes('display') ||
                                nestedKey.toLowerCase().includes('nickname') ||
                                nestedKey.toLowerCase().includes('username') ||
                                nestedKey.toLowerCase().includes('profile') ||
                                nestedKey.toLowerCase().includes('person')
                            );
                            if (nameFields.length > 0) {
                                console.log(`${userField} name fields:`, nameFields);
                                nameFields.forEach(nameField => {
                                    console.log(`${userField}.${nameField}:`, userObj[nameField]);
                                });
                            }
                        }
                    });
                    
                    // Check if there's an author object with different structure
                    const authorFields = Object.keys(firstComment).filter(key => 
                        key.toLowerCase().includes('author') && typeof firstComment[key] === 'object'
                    );
                    
                    console.log('Author-related object fields:', authorFields);
                    authorFields.forEach(authorField => {
                        const authorObj = firstComment[authorField];
                        console.log(`${authorField} object:`, authorObj);
                        if (authorObj && typeof authorObj === 'object') {
                            console.log(`${authorField} keys:`, Object.keys(authorObj));
                            // Check if this author object has name fields
                            const nameFields = Object.keys(authorObj).filter(nestedKey => 
                                nestedKey.toLowerCase().includes('name') || 
                                nestedKey.toLowerCase().includes('first') ||
                                nestedKey.toLowerCase().includes('last') ||
                                nestedKey.toLowerCase().includes('display') ||
                                nestedKey.toLowerCase().includes('nickname') ||
                                nestedKey.toLowerCase().includes('username') ||
                                nestedKey.toLowerCase().includes('profile') ||
                                nestedKey.toLowerCase().includes('person')
                            );
                            if (nameFields.length > 0) {
                                console.log(`${authorField} name fields:`, nameFields);
                                nameFields.forEach(nameField => {
                                    console.log(`${authorField}.${nameField}:`, authorObj[nameField]);
                                });
                            }
                        }
                    });
                    
                    // Check if there's a profile object with different structure
                    const profileFields = Object.keys(firstComment).filter(key => 
                        key.toLowerCase().includes('profile') && typeof firstComment[key] === 'object'
                    );
                    
                    console.log('Profile-related object fields:', profileFields);
                    profileFields.forEach(profileField => {
                        const profileObj = firstComment[profileField];
                        console.log(`${profileField} object:`, profileObj);
                        if (profileObj && typeof profileObj === 'object') {
                            console.log(`${profileField} keys:`, Object.keys(profileObj));
                            // Check if this profile object has name fields
                            const nameFields = Object.keys(profileObj).filter(nestedKey => 
                                nestedKey.toLowerCase().includes('name') || 
                                nestedKey.toLowerCase().includes('first') ||
                                nestedKey.toLowerCase().includes('last') ||
                                nestedKey.toLowerCase().includes('display') ||
                                nestedKey.toLowerCase().includes('nickname') ||
                                nestedKey.toLowerCase().includes('username') ||
                                nestedKey.toLowerCase().includes('profile') ||
                                nestedKey.toLowerCase().includes('person')
                            );
                            if (nameFields.length > 0) {
                                console.log(`${profileField} name fields:`, nameFields);
                                nameFields.forEach(nameField => {
                                    console.log(`${profileField}.${nameField}:`, profileObj[nameField]);
                                });
                            }
                        }
                    });
                    
                    // Check if there's a person object with different structure
                    const personFields = Object.keys(firstComment).filter(key => 
                        key.toLowerCase().includes('person') && typeof firstComment[key] === 'object'
                    );
                    
                    console.log('Person-related object fields:', personFields);
                    personFields.forEach(personField => {
                        const personObj = firstComment[personField];
                        console.log(`${personField} object:`, personObj);
                        if (personObj && typeof personObj === 'object') {
                            console.log(`${personField} keys:`, Object.keys(personObj));
                            // Check if this person object has name fields
                            const nameFields = Object.keys(personObj).filter(nestedKey => 
                                nestedKey.toLowerCase().includes('name') || 
                                nestedKey.toLowerCase().includes('first') ||
                                nestedKey.toLowerCase().includes('last') ||
                                nestedKey.toLowerCase().includes('display') ||
                                nestedKey.toLowerCase().includes('nickname') ||
                                nestedKey.toLowerCase().includes('username') ||
                                nestedKey.toLowerCase().includes('profile') ||
                                nestedKey.toLowerCase().includes('person')
                            );
                            if (nameFields.length > 0) {
                                console.log(`${personField} name fields:`, nameFields);
                                nameFields.forEach(nameField => {
                                    console.log(`${personField}.${nameField}:`, personObj[nameField]);
                                });
                            }
                        }
                    });
                    
                    console.log('=== END COMMENT DEBUG ===');
                }
                
                // If it's the first page, replace comments; otherwise append
                if (page === 1) {
                    setComments(commentsArray);
                } else {
                    setComments(prev => [...prev, ...commentsArray]);
                }
                
                setCommentsPagination({
                    page: currentPage,
                    perPage: commentsPagination.perPage,
                    total: totalCount,
                    totalPages: totalPages
                });
                
                // Update comment count from the response
                setCommentCount(totalCount);
                console.log('Comments updated:', {
                    commentsCount: commentsArray.length,
                    totalCount: totalCount
                });
            } else if ((response as any).status === 1 && (response as any).result) {
                console.log('Processing API response with status/result structure');
                
                // Handle the actual API response structure: {status: 1, message: '...', result: {...}}
                let commentsArray = [];
                let totalCount = 0;
                let currentPage = page;
                let totalPages = 0;
                
                // Check if comments are in response.result.data.comments (actual API structure)
                if ((response as any).result.data && (response as any).result.data.comments && Array.isArray((response as any).result.data.comments)) {
                    commentsArray = (response as any).result.data.comments;
                    totalCount = (response as any).result.data.total || (response as any).result.data.comments.length;
                    currentPage = (response as any).result.data.page || page;
                    totalPages = (response as any).result.data.totalPages || 1;
                    console.log('Using response.result.data.comments structure');
                }
                // Check if comments are in response.result.comments (fallback)
                else if ((response as any).result.comments && Array.isArray((response as any).result.comments)) {
                    commentsArray = (response as any).result.comments;
                    totalCount = (response as any).result.totalCount || (response as any).result.comments.length;
                    currentPage = (response as any).result.currentPage || page;
                    totalPages = (response as any).result.totalPages || 1;
                    console.log('Using response.result.comments structure');
                }
                // Check if comments are directly in response.result
                else if (Array.isArray((response as any).result)) {
                    commentsArray = (response as any).result;
                    totalCount = (response as any).result.length;
                    console.log('Using direct response.result array structure');
                }
                
                console.log('Final comments array:', commentsArray);
                console.log('Final total count:', totalCount);
                
                // If it's the first page, replace comments; otherwise append
                if (page === 1) {
                    setComments(commentsArray);
                } else {
                    setComments(prev => [...prev, ...commentsArray]);
                }
                
                setCommentsPagination({
                    page: currentPage,
                    perPage: commentsPagination.perPage,
                    total: totalCount,
                    totalPages: totalPages
                });
                
                // Update comment count from the response
                setCommentCount(totalCount);
                console.log('Comments updated:', {
                    commentsCount: commentsArray.length,
                    totalCount: totalCount
                });
            } else {
                console.log('Unexpected response format:', response);
                setComments([]);
                setCommentsPagination({
                    page: 1,
                    perPage: commentsPagination.perPage,
                    total: 0,
                    totalPages: 0
                });
                setCommentCount(0);
            }
        } catch (error) {
            console.error("Error fetching comments:", error);
            setCommentsError("Failed to load comments");
            setComments([]);
        } finally {
            setCommentsLoading(false);
        }
    };

    // Handle comment like
    const handleCommentLike = async (commentId: string) => {
        try {
            // TODO: Implement comment like API call
            console.log('Liking comment:', commentId);
            // This would call an API to like/unlike a comment
            // For now, just log the action
        } catch (error) {
            console.error('Error liking comment:', error);
        }
    };

    // Post a new comment
    const handlePostComment = async () => {
        if (!newsId || !newComment.trim() || postingComment) return;

        // Check if user is authenticated
        const token = localStorage.getItem('token');
        if (!token) {
            toast({
                title: "Authentication Required",
                description: "Please log in to post comments.",
                variant: "destructive",
            });
            return;
        }

        try {
            setPostingComment(true);
            
            const commentData = {
                content: newComment.trim()
            };
            
            console.log('Sending comment data:', commentData);
            console.log('News ID:', newsId);
            
            const newCommentData = await postComment(newsId, commentData);
            console.log('Comment posted successfully:', newCommentData);
            
            // Clear the input
            setNewComment("");
            
            // Refresh comments from server to get the latest data
            console.log('Refreshing comments after posting...');
            await fetchComments(newsId, 1);
            
            toast({
                title: "Comment Posted!",
                description: "Your comment has been posted successfully.",
            });
        } catch (error: any) {
            console.error("Error posting comment:", error);
            console.error("Error response data:", error?.response?.data);
            console.error("Error status:", error?.response?.status);
            
            let errorMessage = "Failed to post comment. Please try again.";
            if (error?.response?.status === 401) {
                errorMessage = "Please log in to post comments.";
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            } else if (error?.response?.status === 403) {
                errorMessage = "You don't have permission to post comments.";
            } else if (error?.response?.status === 422) {
                errorMessage = "Invalid comment data. Please check your input and try again.";
                console.error("422 Error details:", error?.response?.data);
            }
            
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setPostingComment(false);
        }
    };

    // Load more comments (pagination) - like likes system
    const loadMoreComments = async () => {
        if (commentsPagination.page < commentsPagination.totalPages && !commentsLoading) {
            console.log('=== LOADING MORE COMMENTS ===');
            console.log('Current page:', commentsPagination.page);
            console.log('Total pages:', commentsPagination.totalPages);
            
            await fetchComments(newsId!, commentsPagination.page + 1);
        }
    };


    // Function to extract username from comment object
    const getUsername = (comment: any) => {
        console.log('🔍 Getting username for comment:', comment);
        
        // Check all possible user-related fields (prioritize name fields)
        const nameFields = [
            'userName', 'user_name', 'name', 'author', 'author_name', 
            'created_by', 'createdBy', 'first_name', 'last_name', 'full_name',
            'display_name', 'nickname', 'username', 'user_display_name',
            'user_nickname', 'user_username', 'author_name', 'author_display_name',
            'profile_name', 'person_name', 'user_profile_name', 'author_profile_name',
            'user_full_name', 'author_full_name', 'profile_full_name', 'person_full_name',
            'firstName', 'lastName', 'fullName', 'displayName', 'userName'
        ];
        
        // Check direct fields first
        for (const field of nameFields) {
            if (comment[field] && typeof comment[field] === 'string' && comment[field].trim()) {
                console.log(`✅ Found username in field '${field}':`, comment[field]);
                return comment[field].trim();
            }
        }
        
        // Check nested user object
        if (comment.user && typeof comment.user === 'object') {
            console.log('🔍 Checking nested user object:', comment.user);
            for (const field of nameFields) {
                if (comment.user[field] && typeof comment.user[field] === 'string' && comment.user[field].trim()) {
                    console.log(`✅ Found username in user.${field}:`, comment.user[field]);
                    return comment.user[field].trim();
                }
            }
        }
        
        // Check if there's a user object with different structure
        const userFields = Object.keys(comment).filter(key => 
            key.toLowerCase().includes('user') && typeof comment[key] === 'object'
        );
        
        console.log('🔍 Found user-related object fields:', userFields);
        
        for (const userField of userFields) {
            const userObj = comment[userField];
            console.log(`🔍 Checking ${userField} object:`, userObj);
            if (userObj && typeof userObj === 'object') {
                for (const field of nameFields) {
                    if (userObj[field] && typeof userObj[field] === 'string' && userObj[field].trim()) {
                        console.log(`✅ Found username in ${userField}.${field}:`, userObj[field]);
                        return userObj[field].trim();
                    }
                }
            }
        }
        
        // Check if there's an author object with different structure
        const authorFields = Object.keys(comment).filter(key => 
            key.toLowerCase().includes('author') && typeof comment[key] === 'object'
        );
        
        console.log('🔍 Found author-related object fields:', authorFields);
        
        for (const authorField of authorFields) {
            const authorObj = comment[authorField];
            console.log(`🔍 Checking ${authorField} object:`, authorObj);
            if (authorObj && typeof authorObj === 'object') {
                for (const field of nameFields) {
                    if (authorObj[field] && typeof authorObj[field] === 'string' && authorObj[field].trim()) {
                        console.log(`✅ Found username in ${authorField}.${field}:`, authorObj[field]);
                        return authorObj[field].trim();
                    }
                }
            }
        }
        
        // Check if there's a profile object with different structure
        const profileFields = Object.keys(comment).filter(key => 
            key.toLowerCase().includes('profile') && typeof comment[key] === 'object'
        );
        
        console.log('🔍 Found profile-related object fields:', profileFields);
        
        for (const profileField of profileFields) {
            const profileObj = comment[profileField];
            console.log(`🔍 Checking ${profileField} object:`, profileObj);
            if (profileObj && typeof profileObj === 'object') {
                for (const field of nameFields) {
                    if (profileObj[field] && typeof profileObj[field] === 'string' && profileObj[field].trim()) {
                        console.log(`✅ Found username in ${profileField}.${field}:`, profileObj[field]);
                        return profileObj[field].trim();
                    }
                }
            }
        }
        
        // Check if there's a person object with different structure
        const personFields = Object.keys(comment).filter(key => 
            key.toLowerCase().includes('person') && typeof comment[key] === 'object'
        );
        
        console.log('🔍 Found person-related object fields:', personFields);
        
        for (const personField of personFields) {
            const personObj = comment[personField];
            console.log(`🔍 Checking ${personField} object:`, personObj);
            if (personObj && typeof personObj === 'object') {
                for (const field of nameFields) {
                    if (personObj[field] && typeof personObj[field] === 'string' && personObj[field].trim()) {
                        console.log(`✅ Found username in ${personField}.${field}:`, personObj[field]);
                        return personObj[field].trim();
                    }
                }
            }
        }
        
        // Check for any string field that looks like a name (not an ID)
        const stringFields = Object.keys(comment).filter(key => 
            typeof comment[key] === 'string' && 
            comment[key].length > 0 &&
            !key.toLowerCase().includes('id') &&
            !key.toLowerCase().includes('content') &&
            !key.toLowerCase().includes('created') &&
            !key.toLowerCase().includes('updated') &&
            !key.toLowerCase().includes('email') &&
            !key.toLowerCase().includes('phone') &&
            !key.toLowerCase().includes('url') &&
            !key.toLowerCase().includes('token') &&
            !key.toLowerCase().includes('hash') &&
            !key.toLowerCase().includes('key') &&
            !key.toLowerCase().includes('secret') &&
            !key.toLowerCase().includes('password') &&
            !key.toLowerCase().includes('salt')
        );
        
        console.log('🔍 Checking string fields that might contain names:', stringFields);
        for (const field of stringFields) {
            const value = comment[field].trim();
            // Check if it looks like a name (contains letters and possibly spaces)
            if (value && /^[a-zA-Z\s]+$/.test(value) && value.length > 1) {
                console.log(`✅ Found potential name in field '${field}':`, value);
                return value;
            }
        }
        
        // Last resort: check if there's a combination of first_name and last_name
        if (comment.first_name && comment.last_name) {
            const fullName = `${comment.first_name} ${comment.last_name}`.trim();
            console.log(`✅ Found full name from first_name + last_name:`, fullName);
            return fullName;
        }
        
        // Check camelCase firstName and lastName
        if (comment.firstName && comment.lastName) {
            const fullName = `${comment.firstName} ${comment.lastName}`.trim();
            console.log(`✅ Found full name from firstName + lastName:`, fullName);
            return fullName;
        }
        
        // Check nested first_name and last_name
        if (comment.user && comment.user.first_name && comment.user.last_name) {
            const fullName = `${comment.user.first_name} ${comment.user.last_name}`.trim();
            console.log(`✅ Found full name from user.first_name + user.last_name:`, fullName);
            return fullName;
        }
        
        // Check nested camelCase firstName and lastName
        if (comment.user && comment.user.firstName && comment.user.lastName) {
            const fullName = `${comment.user.firstName} ${comment.user.lastName}`.trim();
            console.log(`✅ Found full name from user.firstName + user.lastName:`, fullName);
            return fullName;
        }
        
        // Check author first_name and last_name
        if (comment.author && comment.author.first_name && comment.author.last_name) {
            const fullName = `${comment.author.first_name} ${comment.author.last_name}`.trim();
            console.log(`✅ Found full name from author.first_name + author.last_name:`, fullName);
            return fullName;
        }
        
        // Check author camelCase firstName and lastName
        if (comment.author && comment.author.firstName && comment.author.lastName) {
            const fullName = `${comment.author.firstName} ${comment.author.lastName}`.trim();
            console.log(`✅ Found full name from author.firstName + author.lastName:`, fullName);
            return fullName;
        }
        
        // Check profile first_name and last_name
        if (comment.profile && comment.profile.first_name && comment.profile.last_name) {
            const fullName = `${comment.profile.first_name} ${comment.profile.last_name}`.trim();
            console.log(`✅ Found full name from profile.first_name + profile.last_name:`, fullName);
            return fullName;
        }
        
        // Check profile camelCase firstName and lastName
        if (comment.profile && comment.profile.firstName && comment.profile.lastName) {
            const fullName = `${comment.profile.firstName} ${comment.profile.lastName}`.trim();
            console.log(`✅ Found full name from profile.firstName + profile.lastName:`, fullName);
            return fullName;
        }
        
        // Check person first_name and last_name
        if (comment.person && comment.person.first_name && comment.person.last_name) {
            const fullName = `${comment.person.first_name} ${comment.person.last_name}`.trim();
            console.log(`✅ Found full name from person.first_name + person.last_name:`, fullName);
            return fullName;
        }
        
        // Check person camelCase firstName and lastName
        if (comment.person && comment.person.firstName && comment.person.lastName) {
            const fullName = `${comment.person.firstName} ${comment.person.lastName}`.trim();
            console.log(`✅ Found full name from person.firstName + person.lastName:`, fullName);
            return fullName;
        }
        
        console.log('❌ No username found, using Anonymous User');
        return 'Anonymous User';
    };

    // Function to get avatar initial
    const getAvatarInitial = (comment: any) => {
        const username = getUsername(comment);
        if (username === 'Anonymous User') return 'A';
        if (username.startsWith('User ')) return username.slice(-1);
        return username.charAt(0).toUpperCase();
    };

    useEffect(() => {
        const fetchNews = async () => {
            if (!newsId) {
                setError("No news ID provided");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                window.scrollTo(0, 0);

                console.log('Starting to fetch news...');
                const data = await getSingleNews(newsId, getCurrentLanguageId());
                console.log('News data fetched successfully:', data);
                console.log('News data structure:', {
                    hasTitle: !!data.title,
                    hasContent: !!(data.longNewsContent?.content || data.shortNewsContent),
                    hasMedia: !!(data.media && data.media.length > 0),
                    hasCategoryId: !!data.categoryId,
                    hasLanguageId: !!data.language_id,
                    hasStateId: !!data.state_id,
                    hasDistrictId: !!data.district_id,
                    categoryName: data.categoryName,
                    languageName: data.languageName,
                    stateName: data.stateName,
                    districtName: data.districtName,
                    longNewsContentType: typeof data.longNewsContent,
                    longNewsContentKeys: data.longNewsContent ? Object.keys(data.longNewsContent) : [],
                    contentLength: data.longNewsContent?.content?.length || 0,
                    shortContentLength: data.shortNewsContent?.length || 0
                });
                
                // Check if this is fallback data and retry if needed
                if (data.title === "Loading News Article...") {
                    console.log('Fallback data detected, retrying in 2 seconds...');
                    setTimeout(async () => {
                        try {
                            console.log('Retrying news fetch...');
                            const retryData = await getSingleNews(newsId, getCurrentLanguageId());
                            if (retryData.title !== "Loading News Article...") {
                                console.log('Retry successful, updating with real data');
                                setNewsData(retryData as unknown as SingleNewsData);
                                setIsSaved(false);
                                
                                // Fetch likes and comments for real data
                                await fetchLikes(newsId);
                                await fetchCommentCount(newsId);
                                await fetchComments(newsId, 1);
                            }
                        } catch (retryError) {
                            console.log('Retry failed, keeping fallback data');
                        }
                    }, 2000);
                }
                
                
                setNewsData(data as unknown as SingleNewsData);
                setIsSaved(false);

                // Check if content is missing and retry if needed
                const hasLongContent = data.longNewsContent?.content && data.longNewsContent.content.length > 0;
                const hasShortContent = data.shortNewsContent && data.shortNewsContent.length > 0;
                const hasAnyContent = data.content || data.description || data.excerpt;
                
                if (!hasLongContent && !hasShortContent && !hasAnyContent) {
                    console.log('[SingleNewsPage] No content found, implementing aggressive retry strategy...');
                    
                    // First retry after 2 seconds
                    setTimeout(async () => {
                        try {
                            console.log('[SingleNewsPage] Retry 1: Attempting news fetch for content...');
                            const retryData = await getSingleNews(newsId, getCurrentLanguageId());
                            const retryHasLongContent = retryData.longNewsContent?.content && retryData.longNewsContent.content.length > 0;
                            const retryHasShortContent = retryData.shortNewsContent && retryData.shortNewsContent.length > 0;
                            const retryHasAnyContent = retryData.content || retryData.description || retryData.excerpt;
                            
                            if (retryHasLongContent || retryHasShortContent || retryHasAnyContent) {
                                console.log('[SingleNewsPage] Retry 1 successful, updating with content data');
                                setNewsData(retryData as unknown as SingleNewsData);
                                return;
                            }
                            
                            // Second retry after 5 seconds with English language fallback
                            setTimeout(async () => {
                                try {
                                    console.log('[SingleNewsPage] Retry 2: Attempting with English language fallback...');
                                    const englishRetryData = await getSingleNews(newsId, 'en');
                                    const englishHasLongContent = englishRetryData.longNewsContent?.content && englishRetryData.longNewsContent.content.length > 0;
                                    const englishHasShortContent = englishRetryData.shortNewsContent && englishRetryData.shortNewsContent.length > 0;
                                    const englishHasAnyContent = englishRetryData.content || englishRetryData.description || englishRetryData.excerpt;
                                    
                                    if (englishHasLongContent || englishHasShortContent || englishHasAnyContent) {
                                        console.log('[SingleNewsPage] Retry 2 successful with English fallback, updating with content data');
                                        setNewsData(englishRetryData as unknown as SingleNewsData);
                                        return;
                                    }
                                    
                                    // Third retry after 8 seconds with no language filter
                                    setTimeout(async () => {
                                        try {
                                            console.log('[SingleNewsPage] Retry 3: Attempting without language filter...');
                                            const noLangRetryData = await getSingleNews(newsId);
                                            const noLangHasLongContent = noLangRetryData.longNewsContent?.content && noLangRetryData.longNewsContent.content.length > 0;
                                            const noLangHasShortContent = noLangRetryData.shortNewsContent && noLangRetryData.shortNewsContent.length > 0;
                                            const noLangHasAnyContent = noLangRetryData.content || noLangRetryData.description || noLangRetryData.excerpt;
                                            
                                            if (noLangHasLongContent || noLangHasShortContent || noLangHasAnyContent) {
                                                console.log('[SingleNewsPage] Retry 3 successful without language filter, updating with content data');
                                                setNewsData(noLangRetryData as unknown as SingleNewsData);
                                            } else {
                                                console.log('[SingleNewsPage] All retry attempts failed, content may not be available');
                                            }
                                        } catch (retry3Error) {
                                            console.log('[SingleNewsPage] Retry 3 failed:', retry3Error);
                                        }
                                    }, 8000);
                                    
                                } catch (retry2Error) {
                                    console.log('[SingleNewsPage] Retry 2 failed:', retry2Error);
                                }
                            }, 5000);
                            
                        } catch (retry1Error) {
                            console.log('[SingleNewsPage] Retry 1 failed:', retry1Error);
                        }
                    }, 2000);
                }

                // Fetch current likes data from API
                await fetchLikes(newsId);
                
                // Fetch comment count from API (similar to likes)
                console.log('=== FETCHING COMMENT COUNT ON PAGE LOAD ===');
                await fetchCommentCount(newsId);
                
                // Fetch comments for the news article
                console.log('=== FETCHING COMMENTS ON PAGE LOAD ===');
                await fetchComments(newsId, 1);
            } catch (err) {
                // This should rarely be reached now since we provide fallback data
                // Only log if it's not a handled news error
                if (!err.isNewsError) {
                    console.error('Error in fetchNews:', err);
                }
                setError("Failed to load news article. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, [newsId]);

    // Re-extract content when language changes
    useEffect(() => {
        if (newsData && newsData.id) {
            console.log('[SingleNewsPage] Language changed, re-extracting content...');
            // The content will be re-extracted automatically when the component re-renders
            // due to the enhanced extractContentFromNewsData function
        }
    }, [getCurrentLanguageId()]);

    const handleShare = async () => {
        if (!newsData) return;
        const shareData = {
            title: newsData.title,
            text: newsData.excerpt || newsData.title,
            url: window.location.href,
        };
        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
            } catch {
                fallbackShare();
            }
        } else {
            fallbackShare();
        }
    };

    const fallbackShare = () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href);
            alert("Link copied to clipboard!");
        } else {
            const textArea = document.createElement("textarea");
            textArea.value = window.location.href;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand("copy");
                alert("Link copied to clipboard!");
            } catch {
                alert("Unable to copy link");
            }
            document.body.removeChild(textArea);
        }
    };

    const handleLike = async () => {
        if (!newsId || liking) return;

        // Check if user is authenticated
        const token = localStorage.getItem('token');
        if (!token) {
            toast({
                title: "Authentication Required",
                description: "Please log in to like articles.",
                variant: "destructive",
            });
            return;
        }

        console.log('=== LIKE BUTTON CLICKED ===');
        console.log('Current state before:', { isLiked, likeCount });
        console.log('JWT Token present:', !!token);

        // Store original state for potential rollback
        const originalIsLiked = isLiked;
        const originalLikeCount = likeCount;
        const originalUserLiked = userLiked;

        try {
            setLiking(true);
            
            // Calculate new state
            const newIsLiked = !isLiked;
            const newLikeCount = newIsLiked ? likeCount + 1 : Math.max(0, likeCount - 1);
            
            console.log('Calculating new state:', { newIsLiked, newLikeCount });
            console.log('Action:', newIsLiked ? 'ADDING LIKE' : 'REMOVING LIKE (DISLIKE)');
            
            // Update frontend immediately for better UX
            setIsLiked(newIsLiked);
            setUserLiked(newIsLiked);
            setLikeCount(newLikeCount);
            console.log('Frontend updated immediately:', { isLiked: newIsLiked, userLiked: newIsLiked, likeCount: newLikeCount });

            // Send to your API with proper format
            try {
                let response;
                
                if (newIsLiked) {
                    // User wants to LIKE - use POST to toggle like
                    const requestData = {
                        newsId: newsId,
                        totalLikes: newLikeCount,
                        isLikedByUser: newIsLiked
                    };
                    
                    console.log('Sending to API:', requestData);
                    console.log('API Endpoint: POST /news/' + newsId + '/likes');
                    console.log('Operation: TOGGLE LIKE');
                    
                    response = await apiClient.post(`/news/${newsId}/likes`, requestData);
                } else {
                    // User wants to UNLIKE - use DELETE to remove like
                    console.log('API Endpoint: DELETE /news/' + newsId + '/likes');
                    console.log('Operation: REMOVE LIKE');
                    
                    response = await apiClient.delete(`/news/${newsId}/likes`);
                }
                
                console.log('API Response:', response.data);

                // Process your specific API response structure
                if (response.data) {
                    const data = response.data as any;
                    console.log('Response structure:', data);
                    console.log('Full result object:', data?.result);
                    
                    // Check for your exact API response format
                    if (data?.status === 1 && data?.result?.success) {
                        // Try different possible response structures
                        let totalLikes, isLikedByUser;
                        
                        if (data?.result?.data) {
                            // Structure: { status: 1, result: { success: true, data: { totalLikes, isLikedByUser } } }
                            totalLikes = data.result.data.totalLikes;
                            isLikedByUser = data.result.data.isLikedByUser;
                            console.log('Using data.result.data structure');
                        } else if (data?.result) {
                            // Structure: { status: 1, result: { totalLikes, isLikedByUser } }
                            totalLikes = data.result.totalLikes;
                            isLikedByUser = data.result.isLikedByUser;
                            console.log('Using data.result structure');
                        } else {
                            // Fallback: use optimistic update
                            totalLikes = newLikeCount;
                            isLikedByUser = newIsLiked;
                            console.log('Using optimistic update as fallback');
                        }
                        
                        console.log('Parsed values:', { totalLikes, isLikedByUser });
                        
                        // Update with API data (API is source of truth)
                        setLikeCount(totalLikes || newLikeCount);
                        setIsLiked(isLikedByUser !== undefined ? isLikedByUser : newIsLiked);
                        setUserLiked(isLikedByUser !== undefined ? isLikedByUser : newIsLiked);
                        console.log('Updated with API data - Final count:', totalLikes || newLikeCount, 'User liked:', isLikedByUser !== undefined ? isLikedByUser : newIsLiked);
                        
                        // Show success feedback
                        const finalCount = totalLikes || newLikeCount;
                        const finalLiked = isLikedByUser !== undefined ? isLikedByUser : newIsLiked;
                        const action = finalLiked ? "liked" : "unliked";
                        toast({
                            title: finalLiked ? "👍 Liked!" : "👎 Disliked",
                            description: finalLiked 
                                ? `You liked this article! (${finalCount} total likes)` 
                                : `You disliked this article! (${finalCount} total likes)`,
                        });
                    } else {
                        console.log('API response format not recognized, keeping frontend count');
                        // Keep the optimistic update if API response is invalid
                        console.log('Keeping optimistic update - Count:', newLikeCount, 'User liked:', newIsLiked);
                        
                        // Show success feedback with optimistic data
                        const action = newIsLiked ? "liked" : "unliked";
                        toast({
                            title: newIsLiked ? "👍 Liked!" : "👎 Disliked",
                            description: newIsLiked 
                                ? `You liked this article! (${newLikeCount} total likes)` 
                                : `You disliked this article! (${newLikeCount} total likes)`,
                        });
                    }
                } else {
                    console.log('No API response, keeping frontend count');
                }
            } catch (apiError: any) {
                console.error('API call failed:', apiError);
                console.log('Reverting to original state due to API error');
                
                // Revert to original state on API failure
                setIsLiked(originalIsLiked);
                setUserLiked(originalUserLiked);
                setLikeCount(originalLikeCount);
                
                // Handle specific error types
                let errorMessage = "Failed to update like. Please try again.";
                if (apiError?.response?.status === 401) {
                    errorMessage = "Please log in to like articles.";
                    // Clear invalid token
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                } else if (apiError?.response?.status === 403) {
                    errorMessage = "You don't have permission to like articles.";
                } else if (apiError?.type === 'NETWORK_ERROR') {
                    errorMessage = "Network error. Please check your connection.";
                }
                
                // Show user feedback
                toast({
                    title: "Error",
                    description: errorMessage,
                    variant: "destructive",
                });
            }

            console.log('=== LIKE ACTION COMPLETED ===');
        } catch (error) {
            console.error("Unexpected error:", error);
            // Revert to original state on unexpected error
            setIsLiked(originalIsLiked);
            setUserLiked(originalUserLiked);
            setLikeCount(originalLikeCount);
        } finally {
            setLiking(false);
        }
    };

    // Remove like specifically using DELETE endpoint
    const removeLike = async (newsId: string) => {
        try {
            console.log('=== REMOVING LIKE (DELETE) ===');
            console.log('News ID:', newsId);
            console.log('API Endpoint: DELETE /news/' + newsId + '/likes');
            
            const response = await apiClient.delete(`/news/${newsId}/likes`);
            console.log('Remove Like API Response:', response.data);
            
            const data = response.data as any;
            
            if (data?.status === 1 && data?.result?.success) {
                // Refresh likes data after successful removal
                await fetchLikes(newsId);
                
                toast({
                    title: "Success",
                    description: "Like removed successfully!",
                });
            } else {
                console.log('Invalid response structure for remove like');
                toast({
                    title: "Error",
                    description: "Failed to remove like. Please try again.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error removing like:", error);
            toast({
                title: "Error",
                description: "Failed to remove like. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleSave = () => {
        setIsSaved(!isSaved);
    };

    if (loading) {
        return (
            <>
                <Header />
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent mx-auto mb-6"></div>
                        <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">Loading news article...</p>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    if (error || !newsData) {
        return (
            <>
                <Header />
                <div className="min-h-screen flex items-center justify-center flex-col bg-gray-50 dark:bg-gray-900 px-4">
                    <div className="text-center max-w-md">
                        <div className="text-5xl sm:text-6xl mb-6">😞</div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-4">
                            Oops! Something went wrong
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-8">{error || "News article not found"}</p>
                        <Button onClick={() => navigate("/")} className="bg-red-500 hover:bg-red-600">
                            Go Home
                        </Button>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    const youtubeEmbedUrl = newsData.sourceUrl ? getYouTubeEmbedUrl(newsData.sourceUrl) : null;

    // Enhanced content extraction function for better language support
    const extractContentFromNewsData = (newsData: any, languageId?: string): string => {
        console.log('[SingleNewsPage] Extracting content from newsData:', {
            id: newsData.id,
            title: newsData.title,
            languageId: languageId || 'unknown',
            hasLongNewsContent: !!newsData.longNewsContent,
            longNewsContentType: typeof newsData.longNewsContent,
            longNewsContentKeys: newsData.longNewsContent ? Object.keys(newsData.longNewsContent) : [],
            hasShortNewsContent: !!newsData.shortNewsContent,
            hasContent: !!newsData.content,
            hasDescription: !!newsData.description,
            hasExcerpt: !!newsData.excerpt,
            allKeys: Object.keys(newsData)
        });

        let content = "";

        // First priority: longNewsContent field (various structures)
        if (newsData.longNewsContent) {
            if (typeof newsData.longNewsContent === 'string') {
                content = newsData.longNewsContent;
                console.log('[SingleNewsPage] Found string longNewsContent:', content.substring(0, 100) + '...');
            } else if (typeof newsData.longNewsContent === 'object') {
                // Try different possible structures in order of preference
                const possibleFields = ['content', 'text', 'html', 'body', 'data', 'value'];
                for (const field of possibleFields) {
                    if (newsData.longNewsContent[field] && typeof newsData.longNewsContent[field] === 'string') {
                        content = newsData.longNewsContent[field];
                        console.log(`[SingleNewsPage] Found longNewsContent.${field}:`, content.substring(0, 100) + '...');
                        break;
                    }
                }
            }
        }

        // Second priority: other content fields
        if (!content) {
            const contentFields = [
                'shortNewsContent',
                'content',
                'description',
                'excerpt',
                'summary',
                'body',
                'text',
                'html'
            ];

            for (const field of contentFields) {
                if (newsData[field] && typeof newsData[field] === 'string' && newsData[field].length > 0) {
                    content = newsData[field];
                    console.log(`[SingleNewsPage] Found ${field}:`, content.substring(0, 100) + '...');
                    break;
                }
            }
        }

        // Third priority: language-specific content fields
        if (!content && languageId) {
            const languageSpecificFields = [
                `content_${languageId}`,
                `longContent_${languageId}`,
                `text_${languageId}`,
                `body_${languageId}`,
                `html_${languageId}`,
                `description_${languageId}`,
                `excerpt_${languageId}`,
                `summary_${languageId}`
            ];

            for (const field of languageSpecificFields) {
                if (newsData[field] && typeof newsData[field] === 'string' && newsData[field].length > 0) {
                    content = newsData[field];
                    console.log(`[SingleNewsPage] Found language-specific field ${field}:`, content.substring(0, 100) + '...');
                    break;
                }
            }
        }

        // Fourth priority: try to find content in nested language-specific objects
        if (!content && newsData.longNewsContent && typeof newsData.longNewsContent === 'object' && languageId) {
            const longContent = newsData.longNewsContent as any;
            
            // Check for language-specific nested content
            const languageSpecificNestedFields = [
                longContent[languageId],
                longContent[`content_${languageId}`],
                longContent[`text_${languageId}`],
                longContent[`body_${languageId}`],
                longContent[`html_${languageId}`]
            ];

            for (const field of languageSpecificNestedFields) {
                if (field && typeof field === 'string' && field.length > 0) {
                    content = field;
                    console.log(`[SingleNewsPage] Found language-specific nested content:`, content.substring(0, 100) + '...');
                    break;
                }
            }
        }

        // Fifth priority: try to find any string content in the entire newsData
        if (!content) {
            const allStringFields = Object.keys(newsData).filter(key => 
                typeof newsData[key] === 'string' && 
                newsData[key].length > 50 && 
                !['id', 'title', 'slug', 'categoryName', 'districtName', 'stateName', 'languageName', 'authorName'].includes(key)
            );

            for (const field of allStringFields) {
                if (newsData[field] && newsData[field].length > content.length) {
                    content = newsData[field];
                    console.log(`[SingleNewsPage] Found fallback content in field ${field}:`, content.substring(0, 100) + '...');
                }
            }
        }

        // If still no content, try to generate fallback content
        if (!content) {
            console.log('[SingleNewsPage] No content found, generating fallback content...');
            const fallbackContent = `
                <div style="padding: 20px; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #2c3e50; margin-bottom: 20px; font-size: 28px;">${newsData.title || 'News Article'}</h2>
                    
                    <p style="margin-bottom: 15px; font-size: 16px;">
                        ${newsData.excerpt || newsData.description || 'This news article is currently being processed. Please check back later for the full content.'}
                    </p>
                    
                    ${newsData.excerpt || newsData.description ? `
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;">
                            <h3 style="color: #007bff; margin-top: 0; margin-bottom: 15px;">Article Summary</h3>
                            <p style="margin: 0; font-size: 14px; color: #666;">
                                ${newsData.excerpt || newsData.description}
                            </p>
                        </div>
                    ` : ''}
                    
                    <p style="margin-bottom: 0; font-size: 14px; color: #666; font-style: italic;">
                        Thank you for your patience. We're working to bring you the complete article content.
                    </p>
                </div>
            `;
            content = fallbackContent;
            console.log('[SingleNewsPage] Generated fallback content with length:', content.length);
        }

        console.log('[SingleNewsPage] Final content length:', content.length);
        return content;
    };

    // Get content using the enhanced extraction function
    const content = extractContentFromNewsData(newsData, getCurrentLanguageId());
    
    console.log('Content processing:', {
        hasLongNewsContent: !!newsData.longNewsContent?.content,
        hasShortNewsContent: !!newsData.shortNewsContent,
        hasContent: !!newsData.content,
        hasDescription: !!newsData.description,
        hasExcerpt: !!newsData.excerpt,
        finalContent: content,
        contentLength: content.length
    });
    
    // Check if content is HTML (contains HTML tags)
    const isHtmlContent = content.includes('<') && content.includes('>');
    
    let previewContent, remainingContent;
    
    if (isHtmlContent) {
        // For HTML content, extract text content for preview
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        const textContent = tempDiv.textContent || tempDiv.innerText || '';
        previewContent = textContent.split(" ").slice(0, 70).join(" ") + "...";
        remainingContent = content; // Keep HTML for full content
    } else {
        // For plain text content
        previewContent = content.split(" ").slice(0, 70).join(" ") + "...";
        remainingContent = content.split(" ").slice(40).join(" ");
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
            <Header />
            <main className="flex-grow px-4 sm:px-6 lg:px-16 py-6">
                <div className="max-w-5xl mx-auto">
                    <article className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                        <div className="p-4 sm:p-6 lg:p-10">
                            {/* Title */}
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
                                {newsData.title}
                            </h1>

                            {/* Excerpt */}
                            {newsData.excerpt && (
                                <div className="bg-gray-50 dark:bg-gray-700 border-l-4 border-red-500 p-3 sm:p-4 mb-6 rounded-r-lg">
                                    <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 italic">
                                        {newsData.excerpt}
                                    </p>
                                </div>
                            )}

                            {/* YouTube */}
                            {youtubeEmbedUrl && (
                                <div className="mb-6 sm:mb-8">
                                    <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden shadow-lg">
                                        <iframe
                                            src={youtubeEmbedUrl}
                                            title="YouTube video player"
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            className="w-full h-56 sm:h-72 md:h-96"
                                        ></iframe>
                                    </div>
                                </div>
                            )}

                            {/* Meta Info */}
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-6">
                                <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    <span>{formatTimeAgo(newsData.publishedAt || newsData.createdAt)}</span>
                                </div>
                                <span className="hidden sm:inline text-gray-300 dark:text-gray-600">•</span>
                                <div className="flex items-center gap-1">
                                    <Tag className="h-4 w-4" />
                                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium">
                                        {newsData.categoryName}
                                    </span>
                                </div>
                                <span className="hidden sm:inline text-gray-300 dark:text-gray-600">•</span>
                                <div className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    <span className="truncate max-w-[120px] sm:max-w-none">
                                        {newsData.districtName}, {newsData.stateName}
                                    </span>
                                </div>
                                {/* <div className="flex items-center gap-1 ml-auto">
                                    <Eye className="h-4 w-4" />
                                    <span>{newsData.viewCount?.toLocaleString() || 0} views</span>
                                </div> */}
                            </div>

                            {/* Preview Content */}
                <div className="text-gray-800 dark:text-gray-200 leading-relaxed mb-6 text-sm sm:text-base" style={{ textAlign: "justify" }}>
                    {previewContent}
                </div>

                            {/* Main Image */}
                            {newsData.media?.[0]?.mediaUrl && (
                                <div className="relative h-48 sm:h-64 md:h-80 lg:h-[500px] bg-gray-200 dark:bg-gray-700 overflow-hidden mb-6 rounded-lg">
                                    <img
                                        src={newsData.media[0].mediaUrl}
                                        alt={newsData.title}
                                        className="w-full h-full object-cover"
                                    />
                                    {newsData.media[0].caption && (
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 sm:p-3">
                                            <p className="text-xs sm:text-sm">{newsData.media[0].caption}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Remaining Content */}
                <div className="text-gray-800 dark:text-gray-200 leading-relaxed mb-8 text-sm sm:text-base" style={{ textAlign: "justify" }}>
                    {content ? (
                        isHtmlContent ? (
                            <div dangerouslySetInnerHTML={{ __html: remainingContent }} />
                        ) : (
                            remainingContent
                        )
                    ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <p>Content is being loaded...</p>
                            <p className="text-sm mt-2">Please wait while we fetch the full article content.</p>
                        </div>
                    )}
                </div>

                            {/* Extra Images */}
                            {newsData.media && newsData.media.length > 1 && (
                                <div className="mb-8">
                                    <h3 className="text-base sm:text-lg font-semibold mb-4 text-gray-900 dark:text-white">More Images</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {newsData.media.slice(1).map((media, index) => (
                                            <div key={media.id} className="relative rounded-lg overflow-hidden">
                                                <img
                                                    src={media.mediaUrl}
                                                    alt={media.caption || `Additional image ${index + 1}`}
                                                    className="w-full h-40 sm:h-56 md:h-64 object-cover"
                                                />
                                                {media.caption && (
                                                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2">
                                                        <p className="text-xs sm:text-sm">{media.caption}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Action Bar */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 pt-6 border-t border-gray-200 dark:border-gray-600">
                                <div className="flex items-center gap-1 sm:gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            console.log('👍 Like button clicked! Current state:', { isLiked, likeCount, userLiked });
                                            handleLike();
                                        }}
                                        disabled={liking || !localStorage.getItem('token')}
                                        title={!localStorage.getItem('token') ? "Please log in to like articles" : (isLiked ? "Click to dislike this article" : "Click to like this article")}
                                        className={`transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 ${
                                            isLiked 
                                                ? "bg-blue-100 text-blue-700 border border-blue-300 font-semibold" 
                                                : "hover:bg-gray-50"
                                        } ${liking ? "opacity-50 cursor-not-allowed" : ""} ${!localStorage.getItem('token') ? "opacity-60" : ""}`}
                                    >
                                        <ThumbsUp className={`h-4 w-4 mr-1 ${isLiked ? "fill-current text-blue-600" : ""} ${liking ? "animate-pulse" : ""}`} />
                                        {liking ? "..." : likeCount.toLocaleString()}
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => setShowComments(!showComments)}
                                        className="hover:bg-blue-50 hover:text-blue-600"
                                    >
                                        <MessageCircle className="h-4 w-4 mr-1" />
                                        {commentCount.toLocaleString()}
                                    </Button>
                                    {/* <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleSave}
                                        className={`hover:bg-pink-50 hover:text-pink-600 ${isSaved ? "bg-pink-50 text-pink-600" : ""}`}
                                    >
                                        <Heart className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
                                    </Button> */}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleShare}
                                    className="w-full sm:w-auto hover:bg-green-50 hover:text-green-600 hover:border-green-300"
                                >
                                    <Share2 className="h-4 w-4 mr-2" />
                                    Share Article
                                </Button>
                            </div>
                        </div>
                    </article>

                    {/* Comments Section */}
                    {showComments && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mt-6">
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
                                    <MessageCircle className="h-5 w-5 mr-2" />
                                    Comments ({commentCount} total)
                                </h3>
                                <div className="flex items-center gap-2">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Showing {comments.length} of {commentCount} comments
                                    </p>
                                    {commentCount > 5 && (
                                        <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full">
                                            Scroll to see more
                                        </span>
                                    )}
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => fetchComments(newsId!, 1)}
                                            size="sm"
                                            variant="outline"
                                            disabled={commentsLoading}
                                            className="text-xs"
                                        >
                                            {commentsLoading ? "Loading..." : "Refresh"}
                                        </Button>
                                        {/* <Button
                                            onClick={async () => {
                                                console.log('=== MANUAL API TEST ===');
                                                try {
                                                    const response = await fetch(`/api/news/${newsId}/comments?page=1`, {
                                                        headers: {
                                                            'Authorization': `Bearer ${localStorage.getItem('token')}`,
                                                            'Content-Type': 'application/json'
                                                        }
                                                    });
                                                    const data = await response.json();
                                                    console.log('Direct fetch response:', data);
                                                    console.log('Response status:', response.status);
                                                } catch (error) {
                                                    console.error('Direct fetch error:', error);
                                                }
                                            }}
                                            size="sm"
                                            variant="outline"
                                            className="text-xs"
                                        >
                                            Test API
                                        </Button> */}
                                    </div>
                                </div>
                            </div>

                            {/* Comment Info */}
                            <div className="mb-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Comments</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Sorted by newest first
                                    </p>
                                </div>
                            </div>

                            {/* Comment Input */}
                            <div className="mb-6">
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <Textarea
                                            placeholder="Write a comment..."
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            className="min-h-[80px] resize-none"
                                            disabled={postingComment}
                                        />
                                    </div>
                                    <Button
                                        onClick={handlePostComment}
                                        disabled={!newComment.trim() || postingComment}
                                        className="self-end"
                                    >
                                        {postingComment ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Send className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {/* Comments List */}
                            {commentsLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                    <span className="text-gray-600 dark:text-gray-400">Loading comments...</span>
                                </div>
                            ) : commentsError ? (
                                <div className="text-center py-8 text-red-600">
                                    <p>{commentsError}</p>
                                    <Button 
                                        variant="outline" 
                                        onClick={() => fetchComments(newsId!, 1)}
                                        className="mt-2"
                                    >
                                        Try Again
                                    </Button>
                                </div>
                            ) : (comments || []).length === 0 ? (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No comments yet. Be the first to comment!</p>
                                </div>
                            ) : (
                                <div className="max-h-80 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                                    {(comments || []).map((comment) => (
                                        <div key={comment.id} className="border-b border-gray-100 dark:border-gray-700 pb-4 last:border-b-0">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                    {comment.userAvatar ? (
                                                        <img
                                                            src={comment.userAvatar}
                                                            alt={comment.userName || 'User'}
                                                            className="w-10 h-10 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="text-white font-semibold text-sm">
                                                            {getAvatarInitial(comment)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="font-semibold text-gray-900 dark:text-white text-sm">
                                                            {getUsername(comment)}
                                                        </span>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            {formatTimeAgo(comment.createdAt || comment.created_at)}
                                                        </span>
                                                        {comment.isEdited && (
                                                            <span className="text-xs text-gray-400 dark:text-gray-500">
                                                                (edited)
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed mb-2">
                                                        {comment.content}
                                                    </p>
                                                    
                                                    {/* Comment Actions */}
                                                    <div className="flex items-center gap-4 mt-2">
                                                        {/* <button 
                                                            onClick={() => handleCommentLike(comment.id)}
                                                            className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                                        >
                                                            <ThumbsUp className="h-3 w-3" />
                                                            <span>{comment.likeCount || 0}</span>
                                                        </button> */}
                                                        {comment.replyCount > 0 && (
                                                            <button className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                                                                {comment.replyCount} {comment.replyCount === 1 ? 'reply' : 'replies'}
                                                            </button>
                                                        )}
                                                        <span className="text-xs text-gray-400 dark:text-gray-500">
                                                            {comment.isApproved ? '✓ Approved' : 'Pending'}
                                                        </span>
                                                    </div>
                                                    
                                                    {/* Replies */}
                                                    {comment.replies && comment.replies.length > 0 && (
                                                        <div className="mt-3 ml-4 space-y-3">
                                                            {comment.replies.map((reply) => (
                                                                <div key={reply.id} className="flex items-start gap-2">
                                                                    <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                                        {reply.userAvatar ? (
                                                                            <img
                                                                                src={reply.userAvatar}
                                                                                alt={reply.userName || 'User'}
                                                                                className="w-6 h-6 rounded-full object-cover"
                                                                            />
                                                                        ) : (
                                                                            <span className="text-white font-semibold text-xs">
                                                                                {getAvatarInitial(reply)}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <span className="font-semibold text-gray-900 dark:text-white text-xs">
                                                                                {getUsername(reply)}
                                                                            </span>
                                                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                                {formatTimeAgo(reply.createdAt || reply.created_at)}
                                                                            </span>
                                                                            {reply.isEdited && (
                                                                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                                                                    (edited)
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <p className="text-gray-800 dark:text-gray-200 text-xs leading-relaxed">
                                                                            {reply.content}
                                                                        </p>
                                                                        <div className="flex items-center gap-2 mt-1">
                                                                            <button 
                                                                                onClick={() => handleCommentLike(reply.id)}
                                                                                className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                                                            >
                                                                                <ThumbsUp className="h-3 w-3" />
                                                                                <span>{reply.likeCount || 0}</span>
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Load More Button */}
                                    {commentsPagination.page < commentsPagination.totalPages && (
                                        <div className="text-center pt-4">
                                            <Button
                                                variant="outline"
                                                onClick={loadMoreComments}
                                                disabled={commentsLoading}
                                                className="w-full sm:w-auto"
                                            >
                                                {commentsLoading ? (
                                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                ) : null}
                                                Load More Comments ({commentCount - comments.length} remaining)
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Related News */}
                    {newsData.categoryId && (
                        <RelatedNews
                            categoryId={newsData.categoryId}
                            language_id={getCurrentLanguageId() || newsData.language_id}
                            state_id={getCurrentStateId() || newsData.state_id}
                            district_id={getCurrentDistrictId() || newsData.district_id}
                            currentNewsId={newsData.id}
                        />
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default NewsPage;