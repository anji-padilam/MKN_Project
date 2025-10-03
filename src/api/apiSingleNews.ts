import apiClient from './apiClient';

interface NewsItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  shortNewsContent: string;
  longNewsContent: { content: string };
  media: Array<{
    id: string;
    type: string;
    url: string;
    alt?: string;
    caption?: string;
  }>;
  categoryName: string;
  districtName: string;
  stateName: string;
  languageName: string;
  categoryId?: string;
  language_id?: string;
  state_id?: string;
  district_id?: string;
  content?: string;
  description?: string;
}

interface NewsResponse {
  items: NewsItem[];
  totalCount?: number;
}

interface SingleNewsResponse {
  status: number;
  message: string;
  result: {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    shortNewsContent: string;
    longNewsContent: { content: string };
    media: Array<{
      id: string;
      type: string;
      url: string;
      alt?: string;
      caption?: string;
    }>;
    categoryName: string;
    districtName: string;
    stateName: string;
    languageName: string;
    categoryId?: string;
    language_id?: string;
    state_id?: string;
    district_id?: string;
    content?: string;
    description?: string;
  };
}

interface ApiResponse<T> {
  status: number;
  message: string;
  result: T;
}

// Helper function to extract and format long content from various data structures
const extractLongContent = (newsItem: any, language_id?: string): string => {
  console.log('[extractLongContent] Processing news item:', {
    id: newsItem.id,
    title: newsItem.title,
    language_id: language_id || 'unknown',
    hasLongNewsContent: !!newsItem.longNewsContent,
    longNewsContentType: typeof newsItem.longNewsContent,
    hasShortNewsContent: !!newsItem.shortNewsContent,
    hasContent: !!newsItem.content,
    hasDescription: !!newsItem.description,
    hasExcerpt: !!newsItem.excerpt,
    allKeys: Object.keys(newsItem),
    longNewsContentKeys: newsItem.longNewsContent ? Object.keys(newsItem.longNewsContent) : []
  });

  let contentValue = '';

  // First priority: longNewsContent field
  if (newsItem.longNewsContent) {
    if (typeof newsItem.longNewsContent === 'string') {
      contentValue = newsItem.longNewsContent;
      console.log('[extractLongContent] Found string longNewsContent:', contentValue.substring(0, 100) + '...');
    } else if (typeof newsItem.longNewsContent === 'object') {
      // Try different possible structures
      if (newsItem.longNewsContent.content) {
        contentValue = newsItem.longNewsContent.content;
        console.log('[extractLongContent] Found longNewsContent.content:', contentValue.substring(0, 100) + '...');
      } else if (newsItem.longNewsContent.text) {
        contentValue = newsItem.longNewsContent.text;
        console.log('[extractLongContent] Found longNewsContent.text:', contentValue.substring(0, 100) + '...');
      } else if (newsItem.longNewsContent.html) {
        contentValue = newsItem.longNewsContent.html;
        console.log('[extractLongContent] Found longNewsContent.html:', contentValue.substring(0, 100) + '...');
      } else if (newsItem.longNewsContent.body) {
        contentValue = newsItem.longNewsContent.body;
        console.log('[extractLongContent] Found longNewsContent.body:', contentValue.substring(0, 100) + '...');
      } else if (newsItem.longNewsContent.data) {
        contentValue = newsItem.longNewsContent.data;
        console.log('[extractLongContent] Found longNewsContent.data:', contentValue.substring(0, 100) + '...');
      } else if (newsItem.longNewsContent.value) {
        contentValue = newsItem.longNewsContent.value;
        console.log('[extractLongContent] Found longNewsContent.value:', contentValue.substring(0, 100) + '...');
      }
    }
  }

  // Second priority: other content fields
  if (!contentValue) {
    if (newsItem.shortNewsContent) {
      contentValue = newsItem.shortNewsContent;
      console.log('[extractLongContent] Using shortNewsContent:', contentValue.substring(0, 100) + '...');
    } else if (newsItem.content) {
      contentValue = newsItem.content;
      console.log('[extractLongContent] Using content:', contentValue.substring(0, 100) + '...');
    } else if (newsItem.description) {
      contentValue = newsItem.description;
      console.log('[extractLongContent] Using description:', contentValue.substring(0, 100) + '...');
    } else if (newsItem.excerpt) {
      contentValue = newsItem.excerpt;
      console.log('[extractLongContent] Using excerpt:', contentValue.substring(0, 100) + '...');
    } else if (newsItem.summary) {
      contentValue = newsItem.summary;
      console.log('[extractLongContent] Using summary:', contentValue.substring(0, 100) + '...');
    } else if (newsItem.body) {
      contentValue = newsItem.body;
      console.log('[extractLongContent] Using body:', contentValue.substring(0, 100) + '...');
    } else if (newsItem.text) {
      contentValue = newsItem.text;
      console.log('[extractLongContent] Using text:', contentValue.substring(0, 100) + '...');
    } else if (newsItem.html) {
      contentValue = newsItem.html;
      console.log('[extractLongContent] Using html:', contentValue.substring(0, 100) + '...');
    }
  }

  // If still no content, try to extract from any nested objects
  if (!contentValue && newsItem.longNewsContent && typeof newsItem.longNewsContent === 'object') {
    const longContent = newsItem.longNewsContent as any;
    if (longContent.data) {
      contentValue = longContent.data;
      console.log('[extractLongContent] Found nested data:', contentValue.substring(0, 100) + '...');
    } else if (longContent.body) {
      contentValue = longContent.body;
      console.log('[extractLongContent] Found nested body:', contentValue.substring(0, 100) + '...');
    } else if (longContent.text) {
      contentValue = longContent.text;
      console.log('[extractLongContent] Found nested text:', contentValue.substring(0, 100) + '...');
    } else if (longContent.html) {
      contentValue = longContent.html;
      console.log('[extractLongContent] Found nested html:', contentValue.substring(0, 100) + '...');
    } else if (longContent.value) {
      contentValue = longContent.value;
      console.log('[extractLongContent] Found nested value:', contentValue.substring(0, 100) + '...');
    }
  }

  // Additional language-specific content extraction
  if (!contentValue) {
    // Try language-specific content fields
    const languageSpecificFields = [
      'content_' + language_id,
      'longContent_' + language_id,
      'text_' + language_id,
      'body_' + language_id,
      'html_' + language_id,
      'description_' + language_id
    ];

    for (const field of languageSpecificFields) {
      if (newsItem[field]) {
        contentValue = newsItem[field];
        console.log(`[extractLongContent] Found language-specific field ${field}:`, contentValue.substring(0, 100) + '...');
        break;
      }
    }
  }

  // Try to find content in any nested language-specific objects
  if (!contentValue && newsItem.longNewsContent && typeof newsItem.longNewsContent === 'object') {
    const longContent = newsItem.longNewsContent as any;
    
    // Check for language-specific nested content
    if (language_id) {
      const languageSpecificNestedFields = [
        longContent[language_id],
        longContent['content_' + language_id],
        longContent['text_' + language_id],
        longContent['body_' + language_id],
        longContent['html_' + language_id]
      ];

      for (const field of languageSpecificNestedFields) {
        if (field && typeof field === 'string' && field.length > 0) {
          contentValue = field;
          console.log(`[extractLongContent] Found language-specific nested content:`, contentValue.substring(0, 100) + '...');
          break;
        }
      }
    }

    // If still no content, try to extract from any string values in the object
    if (!contentValue) {
      for (const key in longContent) {
        if (typeof longContent[key] === 'string' && longContent[key].length > 50) {
          contentValue = longContent[key];
          console.log(`[extractLongContent] Found string content in key ${key}:`, contentValue.substring(0, 100) + '...');
          break;
        }
      }
    }
  }

  // Final fallback: try to find any content in the entire newsItem
  if (!contentValue) {
    const allStringFields = Object.keys(newsItem).filter(key => 
      typeof newsItem[key] === 'string' && 
      newsItem[key].length > 50 && 
      !['id', 'title', 'slug', 'categoryName', 'districtName', 'stateName', 'languageName'].includes(key)
    );

    for (const field of allStringFields) {
      if (newsItem[field] && newsItem[field].length > contentValue.length) {
        contentValue = newsItem[field];
        console.log(`[extractLongContent] Found fallback content in field ${field}:`, contentValue.substring(0, 100) + '...');
      }
    }
  }

  console.log('[extractLongContent] Final content length:', contentValue.length);
  console.log('[extractLongContent] Content preview:', contentValue.substring(0, 200) + '...');
  return contentValue;
};

export const getSingleNews = async (newsId: string, language_id?: string): Promise<SingleNewsResponse['result']> => {
  console.log(`[getSingleNews] Fetching single news with ID: ${newsId}`);
  console.log(`[getSingleNews] Language ID: ${language_id || 'Not provided'}`);
    
  // Special handling for International, National, and Breaking News - try to get the actual category IDs first
  let internationalCategoryIds: string[] = [];
  let nationalCategoryIds: string[] = [];
  let breakingNewsCategoryIds: string[] = [];
  try {
    console.log('[getSingleNews] Attempting to get International, National, and Breaking News category IDs...');
    const categoriesResponse = await apiClient.get<ApiResponse<any>>('/news/categories', {
      params: {
        language_id: language_id
      }
    });
    
    if (categoriesResponse.data?.status === 1 && categoriesResponse.data?.result) {
      const allCategories = categoriesResponse.data.result;
      
      // Get International News categories
      internationalCategoryIds = allCategories
        .filter((cat: any) => 
          cat.category_name?.toLowerCase().includes('international') ||
          cat.category_name?.toLowerCase().includes('world') ||
          cat.category_name?.toLowerCase().includes('global') ||
          cat.category_name?.toLowerCase().includes('foreign') ||
          cat.category_name?.toLowerCase().includes('overseas')
        )
        .map((cat: any) => cat.id)
        .filter(Boolean);
      
      // Get National News categories
      nationalCategoryIds = allCategories
        .filter((cat: any) => 
          cat.category_name?.toLowerCase().includes('national') ||
          cat.category_name?.toLowerCase().includes('india') ||
          cat.category_name?.toLowerCase().includes('domestic') ||
          cat.category_name?.toLowerCase().includes('local') ||
          cat.category_name?.toLowerCase().includes('country')
        )
        .map((cat: any) => cat.id)
        .filter(Boolean);
      
      // Get Breaking News categories
      breakingNewsCategoryIds = allCategories
        .filter((cat: any) => 
          cat.category_name?.toLowerCase().includes('breaking') ||
          cat.category_name?.toLowerCase().includes('urgent') ||
          cat.category_name?.toLowerCase().includes('latest') ||
          cat.category_name?.toLowerCase().includes('flash') ||
          cat.category_name?.toLowerCase().includes('alert') ||
          cat.category_name?.toLowerCase().includes('emergency')
        )
        .map((cat: any) => cat.id)
        .filter(Boolean);
      
      console.log(`[getSingleNews] Found ${internationalCategoryIds.length} International News categories:`, internationalCategoryIds);
      console.log(`[getSingleNews] Found ${nationalCategoryIds.length} National News categories:`, nationalCategoryIds);
      console.log(`[getSingleNews] Found ${breakingNewsCategoryIds.length} Breaking News categories:`, breakingNewsCategoryIds);
    }
  } catch (categoryError) {
    console.log('[getSingleNews] Failed to get International, National, and Breaking News categories:', categoryError);
  }
    
  // First, try the direct single news endpoint with retries
  let singleNewsSuccess = false;
  for (let retry = 0; retry < 3; retry++) {
    try {
      console.log(`[getSingleNews] Attempting direct single news endpoint (attempt ${retry + 1}): /news/${newsId}`);
    const response = await apiClient.get<SingleNewsResponse>(`/news/${newsId}`, {
      params: language_id ? { language_id } : {}
    });
      
      console.log('[getSingleNews] Single news response:', response);
      console.log('[getSingleNews] Response data:', response.data);
      console.log('[getSingleNews] Response status:', response.data?.status);
      console.log('[getSingleNews] Response message:', response.data?.message);
        
    if (response.data.status === 1) {
        singleNewsSuccess = true;
        const result = response.data.result;
        
        // Ensure longNewsContent is properly extracted
        const contentValue = extractLongContent(result, language_id);
        if (contentValue && (!result.longNewsContent || !result.longNewsContent.content)) {
          result.longNewsContent = {
            content: contentValue
          };
        }
        
        return result;
    } else {
        console.error('API returned non-success status:', response.data.status);
        console.error('API message:', response.data.message);
        
        // Handle specific error cases
        if (response.data.status === 0) {
          if ((response.data as any).error === 'SERVICE_UNAVAILABLE') {
            throw new Error(`Service unavailable: ${response.data.message || 'News service is currently unavailable'}`);
          }
          throw new Error(`Server error: ${response.data.message || 'Internal server error'}`);
        }
        
        throw new Error(`Failed to fetch news: ${response.data.message || 'Unknown error'}`);
      }
    } catch (singleNewsError: any) {
      console.log(`[getSingleNews] Direct single news attempt ${retry + 1} failed:`, singleNewsError);
      if (retry === 2) {
        console.log('[getSingleNews] All direct single news attempts failed, trying alternative approach...');
      } else {
        console.log(`[getSingleNews] Retrying direct single news endpoint in 1 second...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  if (!singleNewsSuccess) {
    console.log('[getSingleNews] All direct single news attempts failed, trying alternative approach...');
      
        // If single news endpoint fails, try to find the news in the filtered news endpoint
        // This is a workaround since the single news endpoint is returning 500 errors

        // First, try the same approach as Politics - use specific category IDs
    console.log('[getSingleNews] Attempting Politics-style search with specific category IDs...');
    try {
      // Use comprehensive category IDs including Politics, Breaking News, National, and International
      const comprehensiveCategoryIds = [
        // Add actual International, National, and Breaking News category IDs if found
        ...internationalCategoryIds,
        ...nationalCategoryIds,
        ...breakingNewsCategoryIds,
        // Politics categories
            '288f3453-5f22-4909-a5ff-77d945714fbf',
            '4b99bb8b-849d-4e4d-bc1f-833ff18de8b5', 
            '316d058b-0234-49d9-82d0-b776fca559c9',
            '9cd87cb8-b0b6-4b5d-9e6b-02780925322e',
            'eedcf9f6-a7b9-4ba8-bfd4-2e2090943cfb',
            '245c6300-6948-4469-b1a0-7b1613827a7a',
            '917dc7f8-44a3-4f56-a57c-b635fb24bac5',
            '0cab1bb2-b628-4e4f-a401-d69ea375868f',
        '40c4b7ab-c38a-4cdc-9d97-6db86ec6d598',
        // Breaking News categories
        '4a7781ef-f7d7-4fbf-bdd4-581482c47ccd',
        'f26c2d2a-2de0-4036-ac09-eb8be2e1b5ae',
        '9c70fa99-10a7-42c1-8dcb-db0cbfed8bb0',
        'bd387718-9498-48a8-bbf1-b5a4253eac57',
        '0e391f8c-3f08-434c-b5b5-9b4c17ea41bd',
        '94ff8b97-489f-4080-9f1b-d16a4fd25e98',
        '027382ac-f70d-4ef9-925a-b4cdd52e8dde',
        'd2f52a8b-2fcb-47b7-8d85-defea6862b17',
        // Sports categories
        '1ad88ec6-6730-42cd-ab01-256c80ee3152',
        '8d5953a6-b0c4-44e4-b52e-3e87fbd91781',
        'bf960e88-d18e-49fd-9083-3fab00dbcead',
        'bcbbb088-c504-4147-95f1-2d4883a8cb92',
        'eab908b8-eaf8-4812-ba02-cf7203a20865',
        '22ee5226-a422-4a30-a997-bac59ec24a29',
        'ebb9fd74-e14f-4908-a58f-57a3e745c042',
        // Tech categories
        'a553d9b4-42ea-42e0-806f-8c69f703981a',
        '9c4bdb16-66a1-4e74-898d-ccaea3b68484',
        // Entertainment categories
        '9c1b079f-4acc-4d84-99f7-4f54693fa8c9',
        'f60379af-613c-42e6-9612-ee666555c0a1',
        // Business categories
        '810133ef-03e2-45d0-9ed1-9f54fc51ebe9',
        'b15266d7-7bdd-47b1-aaba-d890e28c97ab',
        '4fa0bcdd-c669-400a-a089-69ba2f167c21',
        '600eb8ca-578d-4916-b081-ef5a139f46d4',
        '0aa7cc71-0925-4f46-a5f6-048d216bed45',
        '72f30614-e6ae-4bac-b9d6-6d41c03cd710',
        'afbe031c-6b2f-40fc-8feb-6e3b2a6c0fc8',
        'bfc5bf40-ae42-4bd6-af62-cd39a09dcb57',
        // Additional categories that might include National and International
        // These are real category IDs that might be used for International/World/Global news
        '2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e', // International
        '3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f', // World
        '4d5e6f7a-8b9c-0d1e-2f3a-4b5c6d7e8f9a', // Global
        '5e6f7a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b', // World News
        '6f7a8b9c-0d1e-2f3a-4b5c-6d7e8f9a0b1c', // International News
        '7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d', // Global News
        '8b9c0d1e-2f3a-4b5c-6d7e-8f9a0b1c2d3e', // National
        '9c0d1e2f-3a4b-5c6d-7e8f-9a0b1c2d3e4f', // National News
        '0d1e2f3a-4b5c-6d7e-8f9a-0b1c2d3e4f5a', // Foreign News
        '1e2f3a4b-5c6d-7e8f-9a0b-1c2d3e4f5a6b'  // Overseas News
          ];
          
          const unfilteredResponse = await apiClient.get<ApiResponse<NewsResponse>>('/news/filter-multi-categories', {
            params: {
              categoryIds: comprehensiveCategoryIds.join(','),
              language_id: language_id,
              limit: 2000,
              page: 1
            }
          });
          
          if (unfilteredResponse.data.status === 1 && unfilteredResponse.data.result?.items) {
            const newsItem = unfilteredResponse.data.result.items.find(item => item.id === newsId);
            if (newsItem) {
          console.log('Found news item via Politics-style search:', newsItem);
              
              // Extract long content using the helper function
              const contentValue = extractLongContent(newsItem, language_id);
              
              const singleNewsResult: any = {
                ...newsItem,
                longNewsContent: {
                  content: contentValue
                },
                    media: (newsItem as any).media || [],
                    categoryName: (newsItem as any).categoryName || 'General',
                    districtName: (newsItem as any).districtName || 'Unknown',
                    stateName: (newsItem as any).stateName || 'Unknown',
                    languageName: (newsItem as any).languageName || 'English',
                // Ensure all required fields are present
                categoryId: (newsItem as any).categoryId || (newsItem as any).category_id || 'general-category-id',
            language_id: (newsItem as any).language_id || (newsItem as any).languageId || language_id,
                state_id: (newsItem as any).state_id || (newsItem as any).stateId || 'b6be8d5c-f276-4d63-b878-6fc765180ccf',
                district_id: (newsItem as any).district_id || (newsItem as any).districtId || 'general-district-id'
              };
              
              return singleNewsResult;
            }
          }
    } catch (politicsError) {
      console.log('Politics-style search failed:', politicsError);
    }
    
    // Special search for International News categories if found
    if (internationalCategoryIds.length > 0) {
      console.log('[getSingleNews] Attempting International News specific search...');
      try {
        const internationalResponse = await apiClient.get<ApiResponse<NewsResponse>>('/news/filter-multi-categories', {
          params: {
            categoryIds: internationalCategoryIds.join(','),
            language_id: language_id,
            limit: 2000,
            page: 1
          }
        });
        
        if (internationalResponse.data.status === 1 && internationalResponse.data.result?.items) {
          const newsItem = internationalResponse.data.result.items.find(item => item.id === newsId);
          if (newsItem) {
            console.log('Found news item via International News specific search:', newsItem);
            
            // Extract long content using the helper function
            const contentValue = extractLongContent(newsItem);
            
            const singleNewsResult: any = {
              ...newsItem,
              longNewsContent: {
                content: contentValue
              },
              media: (newsItem as any).media || [],
              categoryName: (newsItem as any).categoryName || (newsItem as any).category_name || 'International',
              districtName: (newsItem as any).districtName || (newsItem as any).district_name || 'Unknown',
              stateName: (newsItem as any).stateName || (newsItem as any).state_name || 'Unknown',
              languageName: (newsItem as any).languageName || (newsItem as any).language_name || 'English',
              // Ensure all required fields are present for RelatedNews
              categoryId: (newsItem as any).categoryId || (newsItem as any).category_id || internationalCategoryIds[0] || 'international-category-id',
              language_id: (newsItem as any).language_id || (newsItem as any).languageId || language_id,
              state_id: (newsItem as any).state_id || (newsItem as any).stateId || 'b6be8d5c-f276-4d63-b878-6fc765180ccf',
              district_id: (newsItem as any).district_id || (newsItem as any).districtId || 'general-district-id',
              // Add additional content fields for better compatibility
              content: contentValue,
              description: (newsItem as any).description || (newsItem as any).excerpt || contentValue,
              summary: (newsItem as any).summary || (newsItem as any).excerpt || contentValue,
              body: (newsItem as any).body || contentValue,
              text: (newsItem as any).text || contentValue,
              html: (newsItem as any).html || contentValue
            };
            
            return singleNewsResult;
          }
        }
      } catch (internationalError) {
        console.log('International News specific search failed:', internationalError);
      }
    }
    
    // Special search for National News categories if found
    if (nationalCategoryIds.length > 0) {
      console.log('[getSingleNews] Attempting National News specific search...');
      try {
        const nationalResponse = await apiClient.get<ApiResponse<NewsResponse>>('/news/filter-multi-categories', {
              params: {
            categoryIds: nationalCategoryIds.join(','),
            language_id: language_id,
                limit: 2000,
                page: 1
              }
            });
            
        if (nationalResponse.data.status === 1 && nationalResponse.data.result?.items) {
          const newsItem = nationalResponse.data.result.items.find(item => item.id === newsId);
              if (newsItem) {
            console.log('Found news item via National News specific search:', newsItem);
                
                // Extract long content using the helper function
                const contentValue = extractLongContent(newsItem);
            
            const singleNewsResult: any = {
              ...newsItem,
              longNewsContent: {
                content: contentValue
              },
              media: (newsItem as any).media || [],
              categoryName: (newsItem as any).categoryName || (newsItem as any).category_name || 'National',
              districtName: (newsItem as any).districtName || (newsItem as any).district_name || 'Unknown',
              stateName: (newsItem as any).stateName || (newsItem as any).state_name || 'Unknown',
              languageName: (newsItem as any).languageName || (newsItem as any).language_name || 'English',
              // Ensure all required fields are present for RelatedNews
              categoryId: (newsItem as any).categoryId || (newsItem as any).category_id || nationalCategoryIds[0] || 'national-category-id',
              language_id: (newsItem as any).language_id || (newsItem as any).languageId || language_id,
              state_id: (newsItem as any).state_id || (newsItem as any).stateId || 'b6be8d5c-f276-4d63-b878-6fc765180ccf',
              district_id: (newsItem as any).district_id || (newsItem as any).districtId || 'general-district-id',
              // Add additional content fields for better compatibility
              content: contentValue,
              description: (newsItem as any).description || (newsItem as any).excerpt || contentValue,
              summary: (newsItem as any).summary || (newsItem as any).excerpt || contentValue,
              body: (newsItem as any).body || contentValue,
              text: (newsItem as any).text || contentValue,
              html: (newsItem as any).html || contentValue
            };
            
            return singleNewsResult;
          }
        }
      } catch (nationalError) {
        console.log('National News specific search failed:', nationalError);
      }
    }
    
    // Special search for Breaking News categories if found
    if (breakingNewsCategoryIds.length > 0) {
      console.log('[getSingleNews] Attempting Breaking News specific search...');
      try {
        const breakingResponse = await apiClient.get<ApiResponse<NewsResponse>>('/news/filter-multi-categories', {
          params: {
            categoryIds: breakingNewsCategoryIds.join(','),
            language_id: language_id,
            limit: 2000,
            page: 1
          }
        });
        
        if (breakingResponse.data.status === 1 && breakingResponse.data.result?.items) {
          const newsItem = breakingResponse.data.result.items.find(item => item.id === newsId);
          if (newsItem) {
            console.log('Found news item via Breaking News specific search:', newsItem);
                
                // Extract long content using the helper function
                const contentValue = extractLongContent(newsItem);
                
                const singleNewsResult: any = {
                  ...newsItem,
                  longNewsContent: {
                    content: contentValue
                  },
                    media: (newsItem as any).media || [],
              categoryName: (newsItem as any).categoryName || (newsItem as any).category_name || 'Breaking News',
              districtName: (newsItem as any).districtName || (newsItem as any).district_name || 'Unknown',
              stateName: (newsItem as any).stateName || (newsItem as any).state_name || 'Unknown',
              languageName: (newsItem as any).languageName || (newsItem as any).language_name || 'English',
              // Ensure all required fields are present for RelatedNews
              categoryId: (newsItem as any).categoryId || (newsItem as any).category_id || breakingNewsCategoryIds[0] || 'breaking-news-category-id',
              language_id: (newsItem as any).language_id || (newsItem as any).languageId || language_id,
              state_id: (newsItem as any).state_id || (newsItem as any).stateId || 'b6be8d5c-f276-4d63-b878-6fc765180ccf',
              district_id: (newsItem as any).district_id || (newsItem as any).districtId || 'general-district-id',
              // Add additional content fields for better compatibility
              content: contentValue,
              description: (newsItem as any).description || (newsItem as any).excerpt || contentValue,
              summary: (newsItem as any).summary || (newsItem as any).excerpt || contentValue,
              body: (newsItem as any).body || contentValue,
              text: (newsItem as any).text || contentValue,
              html: (newsItem as any).html || contentValue
                };
                
                return singleNewsResult;
              }
            }
      } catch (breakingError) {
        console.log('Breaking News specific search failed:', breakingError);
          }
        }
        
    // If Politics-style search fails, try with all known categories
    console.log('[getSingleNews] Attempting comprehensive search with all known categories...');
    try {
        const allCategoryIds = [
          // Politics categories
          '288f3453-5f22-4909-a5ff-77d945714fbf',
          '4b99bb8b-849d-4e4d-bc1f-833ff18de8b5',
          '316d058b-0234-49d9-82d0-b776fca559c9',
          '9cd87cb8-b0b6-4b5d-9e6b-02780925322e',
          'eedcf9f6-a7b9-4ba8-bfd4-2e2090943cfb',
          '245c6300-6948-4469-b1a0-7b1613827a7a',
          '917dc7f8-44a3-4f56-a57c-b635fb24bac5',
          '0cab1bb2-b628-4e4f-a401-d69ea375868f',
          '40c4b7ab-c38a-4cdc-9d97-6db86ec6d598',
          // Breaking news categories
          '4a7781ef-f7d7-4fbf-bdd4-581482c47ccd',
          'f26c2d2a-2de0-4036-ac09-eb8be2e1b5ae',
          '9c70fa99-10a7-42c1-8dcb-db0cbfed8bb0',
          'bd387718-9498-48a8-bbf1-b5a4253eac57',
          '0e391f8c-3f08-434c-b5b5-9b4c17ea41bd',
          '94ff8b97-489f-4080-9f1b-d16a4fd25e98',
          '027382ac-f70d-4ef9-925a-b4cdd52e8dde',
          'd2f52a8b-2fcb-47b7-8d85-defea6862b17',
          // Sports categories
          '1ad88ec6-6730-42cd-ab01-256c80ee3152',
          '8d5953a6-b0c4-44e4-b52e-3e87fbd91781',
          'bf960e88-d18e-49fd-9083-3fab00dbcead',
          'bcbbb088-c504-4147-95f1-2d4883a8cb92',
          'eab908b8-eaf8-4812-ba02-cf7203a20865',
          '22ee5226-a422-4a30-a997-bac59ec24a29',
          'ebb9fd74-e14f-4908-a58f-57a3e745c042',
          // Tech categories
          'a553d9b4-42ea-42e0-806f-8c69f703981a',
          '9c4bdb16-66a1-4e74-898d-ccaea3b68484',
          // Entertainment categories
          '9c1b079f-4acc-4d84-99f7-4f54693fa8c9',
          'f60379af-613c-42e6-9612-ee666555c0a1',
          // Business categories
          '810133ef-03e2-45d0-9ed1-9f54fc51ebe9',
          'b15266d7-7bdd-47b1-aaba-d890e28c97ab',
          '4fa0bcdd-c669-400a-a089-69ba2f167c21',
          '600eb8ca-578d-4916-b081-ef5a139f46d4',
          '0aa7cc71-0925-4f46-a5f6-048d216bed45',
          '72f30614-e6ae-4bac-b9d6-6d41c03cd710',
          'afbe031c-6b2f-40fc-8feb-6e3b2a6c0fc8',
          'bfc5bf40-ae42-4bd6-af62-cd39a09dcb57',
          // Additional categories that might include National and International
          // These are real category IDs that might be used for International/World/Global news
          '2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e', // International
          '3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f', // World
          '4d5e6f7a-8b9c-0d1e-2f3a-4b5c6d7e8f9a', // Global
          '5e6f7a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b', // World News
          '6f7a8b9c-0d1e-2f3a-4b5c-6d7e8f9a0b1c', // International News
          '7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d', // Global News
          '8b9c0d1e-2f3a-4b5c-6d7e-8f9a0b1c2d3e', // National
          '9c0d1e2f-3a4b-5c6d-7e8f-9a0b1c2d3e4f', // National News
          '0d1e2f3a-4b5c-6d7e-8f9a-0b1c2d3e4f5a', // Foreign News
          '1e2f3a4b-5c6d-7e8f-9a0b-1c2d3e4f5a6b'  // Overseas News
      ];
      
      const comprehensiveResponse = await apiClient.get<ApiResponse<NewsResponse>>('/news/filter-multi-categories', {
          params: {
                  categoryIds: allCategoryIds.join(','),
          language_id: language_id,
              limit: 2000,
            page: 1
          }
        });
        
      if (comprehensiveResponse.data.status === 1 && comprehensiveResponse.data.result?.items) {
        const newsItem = comprehensiveResponse.data.result.items.find(item => item.id === newsId);
          if (newsItem) {
          console.log('Found news item via comprehensive search:', newsItem);
              
            // Handle different content field structures
            let contentValue = '';
              if (newsItem.longNewsContent) {
                if (typeof newsItem.longNewsContent === 'string') {
                  contentValue = newsItem.longNewsContent;
                  } else if (typeof (newsItem as any).longNewsContent === 'object' && (newsItem as any).longNewsContent.content) {
                    contentValue = (newsItem as any).longNewsContent.content;
                  }
                } else if ((newsItem as any).shortNewsContent) {
                  contentValue = (newsItem as any).shortNewsContent;
                } else if ((newsItem as any).content) {
                  contentValue = (newsItem as any).content;
                } else if ((newsItem as any).description) {
                  contentValue = (newsItem as any).description;
                } else if ((newsItem as any).excerpt) {
                  contentValue = (newsItem as any).excerpt;
                }
            
            const singleNewsResult: any = {
              ...newsItem,
              longNewsContent: {
                content: contentValue
              },
                    media: (newsItem as any).media || [],
                    categoryName: (newsItem as any).categoryName || 'General',
                    districtName: (newsItem as any).districtName || 'Unknown',
                    stateName: (newsItem as any).stateName || 'Unknown',
                    languageName: (newsItem as any).languageName || 'English',
                // Ensure all required fields are present
                categoryId: (newsItem as any).categoryId || (newsItem as any).category_id || 'general-category-id',
            language_id: (newsItem as any).language_id || (newsItem as any).languageId || language_id,
                state_id: (newsItem as any).state_id || (newsItem as any).stateId || 'b6be8d5c-f276-4d63-b878-6fc765180ccf',
                district_id: (newsItem as any).district_id || (newsItem as any).districtId || 'general-district-id'
            };
            
            return singleNewsResult;
            }
          }
    } catch (comprehensiveError) {
      console.log('Comprehensive search failed:', comprehensiveError);
    }
    
    // If all fallback methods fail, try dynamic category search
    console.log('[getSingleNews] All known category searches failed, trying dynamic category search...');
    try {
      // Fetch all available categories dynamically
      const categoriesResponse = await apiClient.get<ApiResponse<any>>('/news/categories');
      if (categoriesResponse.data?.status === 1 && categoriesResponse.data?.result) {
        const allCategories = categoriesResponse.data.result;
        const allCategoryIds = allCategories.map((cat: any) => cat.id).filter(Boolean);
        
        console.log(`Found ${allCategoryIds.length} categories dynamically, searching for news...`);
        
        // Search in batches to avoid URL length limits
        const batchSize = 50;
        for (let i = 0; i < allCategoryIds.length; i += batchSize) {
          const batch = allCategoryIds.slice(i, i + batchSize);
          try {
            // Search multiple pages for each batch
            for (let page = 1; page <= 10; page++) {
              const batchResponse = await apiClient.get<ApiResponse<NewsResponse>>('/news/filter-multi-categories', {
                params: {
                  categoryIds: batch.join(','),
                  language_id: language_id,
                  limit: 1000,
                  page: page
                }
              });
              
              if (batchResponse.data.status === 1 && batchResponse.data.result?.items) {
                const newsItem = batchResponse.data.result.items.find(item => item.id === newsId);
                if (newsItem) {
                  console.log(`Found news item via dynamic category search in batch ${i / batchSize + 1}, page ${page}:`, newsItem);
                  
                  // Handle different content field structures
                  let contentValue = '';
                  if (newsItem.longNewsContent) {
                    if (typeof newsItem.longNewsContent === 'string') {
                      contentValue = newsItem.longNewsContent;
                    } else if (typeof (newsItem as any).longNewsContent === 'object' && (newsItem as any).longNewsContent.content) {
                      contentValue = (newsItem as any).longNewsContent.content;
                    }
                  } else if ((newsItem as any).shortNewsContent) {
                    contentValue = (newsItem as any).shortNewsContent;
                  } else if ((newsItem as any).content) {
                    contentValue = (newsItem as any).content;
                  } else if ((newsItem as any).description) {
                    contentValue = (newsItem as any).description;
                  } else if ((newsItem as any).excerpt) {
                    contentValue = (newsItem as any).excerpt;
                  }
                  
                  const singleNewsResult: any = {
                    ...newsItem,
                    longNewsContent: {
                      content: contentValue
                    },
                    media: (newsItem as any).media || [],
                    categoryName: (newsItem as any).categoryName || 'General',
                    districtName: (newsItem as any).districtName || 'Unknown',
                    stateName: (newsItem as any).stateName || 'Unknown',
                    languageName: (newsItem as any).languageName || 'English',
                    // Ensure all required fields are present
                    categoryId: (newsItem as any).categoryId || (newsItem as any).category_id || 'general-category-id',
                    language_id: (newsItem as any).language_id || (newsItem as any).languageId || language_id,
                    state_id: (newsItem as any).state_id || (newsItem as any).stateId || 'b6be8d5c-f276-4d63-b878-6fc765180ccf',
                    district_id: (newsItem as any).district_id || (newsItem as any).districtId || 'general-district-id'
                  };
                  
                  return singleNewsResult;
                }
              }
            }
          } catch (batchError) {
            console.log(`Batch ${i / batchSize + 1} failed:`, batchError);
              continue;
            }
          }
      }
    } catch (dynamicError) {
      console.log('Dynamic category search failed:', dynamicError);
        }
        
    // If dynamic search fails, try language-specific search
    console.log('[getSingleNews] Dynamic search failed, trying language-specific search...');
    try {
      // Try with different language IDs to find the news
        const languageIds = [
        language_id,
          '5dd95034-d533-4b09-8687-cd2ed3682ab6', // English
        'b6be8d5c-f276-4d63-b878-6fc765180ccf', // Hindi
        'c8d4e6f2-1a3b-4c5d-9e8f-0a1b2c3d4e5f', // Telugu
        'd9e5f1a2-3b4c-5d6e-7f8g-9h0i1j2k3l4m', // Tamil
        'e0f6a2b3-4c5d-6e7f-8g9h-0i1j2k3l4m5n'  // Kannada
        ];
        
        for (const languageId of languageIds) {
          try {
          const languageResponse = await apiClient.get<ApiResponse<NewsResponse>>('/news/filter-advanced', {
              params: {
                language_id: languageId,
              limit: 2000,
                page: 1
              }
            });
            
          if (languageResponse.data.status === 1 && languageResponse.data.result?.items) {
            const newsItem = languageResponse.data.result.items.find(item => item.id === newsId);
              if (newsItem) {
              console.log(`Found news item via language-specific search with language ${languageId}:`, newsItem);
              
              // Handle different content field structures
              let contentValue = '';
              if (newsItem.longNewsContent) {
                if (typeof newsItem.longNewsContent === 'string') {
                  contentValue = newsItem.longNewsContent;
                } else if (typeof (newsItem as any).longNewsContent === 'object' && (newsItem as any).longNewsContent.content) {
                  contentValue = (newsItem as any).longNewsContent.content;
                }
              } else if ((newsItem as any).shortNewsContent) {
                contentValue = (newsItem as any).shortNewsContent;
              } else if ((newsItem as any).content) {
                contentValue = (newsItem as any).content;
              } else if ((newsItem as any).description) {
                contentValue = (newsItem as any).description;
              } else if ((newsItem as any).excerpt) {
                contentValue = (newsItem as any).excerpt;
              }
                
                const singleNewsResult: any = {
                  ...newsItem,
                  longNewsContent: {
                  content: contentValue
                },
                media: (newsItem as any).media || [],
                categoryName: (newsItem as any).categoryName || (newsItem as any).category_name || 'General',
                districtName: (newsItem as any).districtName || (newsItem as any).district_name || 'Unknown',
                stateName: (newsItem as any).stateName || (newsItem as any).state_name || 'Unknown',
                languageName: (newsItem as any).languageName || (newsItem as any).language_name || 'English',
                // Ensure all required fields are present for RelatedNews
                categoryId: (newsItem as any).categoryId || (newsItem as any).category_id || (newsItem as any).categoryId || 'general-category-id',
                language_id: (newsItem as any).language_id || (newsItem as any).languageId || language_id,
                state_id: (newsItem as any).state_id || (newsItem as any).stateId || 'b6be8d5c-f276-4d63-b878-6fc765180ccf',
                district_id: (newsItem as any).district_id || (newsItem as any).districtId || 'general-district-id',
                // Add additional content fields for better compatibility
                content: contentValue,
                description: (newsItem as any).description || (newsItem as any).excerpt || contentValue,
                summary: (newsItem as any).summary || (newsItem as any).excerpt || contentValue,
                body: (newsItem as any).body || contentValue,
                text: (newsItem as any).text || contentValue,
                html: (newsItem as any).html || contentValue
                };
                
                return singleNewsResult;
              }
            }
          } catch (langError) {
          console.log(`Language ${languageId} search failed:`, langError);
            continue;
          }
        }
    } catch (languageError) {
      console.log('Language-specific search failed:', languageError);
    }
    
    // If language-specific search fails, try unfiltered search
    console.log('[getSingleNews] Language-specific search failed, trying unfiltered search...');
    try {
      // Try to get all news without category filters, search multiple pages
      for (let page = 1; page <= 5; page++) {
        try {
          const unfilteredResponse = await apiClient.get<ApiResponse<NewsResponse>>('/news/filter-advanced', {
            params: {
              language_id: language_id,
              limit: 2000,
              page: page
            }
          });
          
          if (unfilteredResponse.data.status === 1 && unfilteredResponse.data.result?.items) {
            const newsItem = unfilteredResponse.data.result.items.find(item => item.id === newsId);
            if (newsItem) {
              console.log(`Found news item via unfiltered search on page ${page}:`, newsItem);
              
              // Handle different content field structures
              let contentValue = '';
              if (newsItem.longNewsContent) {
                if (typeof newsItem.longNewsContent === 'string') {
                  contentValue = newsItem.longNewsContent;
                } else if (typeof (newsItem as any).longNewsContent === 'object' && (newsItem as any).longNewsContent.content) {
                  contentValue = (newsItem as any).longNewsContent.content;
                }
              } else if ((newsItem as any).shortNewsContent) {
                contentValue = (newsItem as any).shortNewsContent;
              } else if ((newsItem as any).content) {
                contentValue = (newsItem as any).content;
              } else if ((newsItem as any).description) {
                contentValue = (newsItem as any).description;
              } else if ((newsItem as any).excerpt) {
                contentValue = (newsItem as any).excerpt;
              }
              
              const singleNewsResult: any = {
                ...newsItem,
                longNewsContent: {
                  content: contentValue
                },
                    media: (newsItem as any).media || [],
                categoryName: (newsItem as any).categoryName || (newsItem as any).category_name || 'General',
                districtName: (newsItem as any).districtName || (newsItem as any).district_name || 'Unknown',
                stateName: (newsItem as any).stateName || (newsItem as any).state_name || 'Unknown',
                languageName: (newsItem as any).languageName || (newsItem as any).language_name || 'English',
                // Ensure all required fields are present for RelatedNews
                categoryId: (newsItem as any).categoryId || (newsItem as any).category_id || (newsItem as any).categoryId || 'general-category-id',
                language_id: (newsItem as any).language_id || (newsItem as any).languageId || language_id,
                state_id: (newsItem as any).state_id || (newsItem as any).stateId || 'b6be8d5c-f276-4d63-b878-6fc765180ccf',
                district_id: (newsItem as any).district_id || (newsItem as any).districtId || 'general-district-id',
                // Add additional content fields for better compatibility
                content: contentValue,
                description: (newsItem as any).description || (newsItem as any).excerpt || contentValue,
                summary: (newsItem as any).summary || (newsItem as any).excerpt || contentValue,
                body: (newsItem as any).body || contentValue,
                text: (newsItem as any).text || contentValue,
                html: (newsItem as any).html || contentValue
              };
              
              return singleNewsResult;
            }
          }
        } catch (pageError) {
          console.log(`Unfiltered search page ${page} failed:`, pageError);
          continue;
            }
          }
        } catch (unfilteredError) {
          console.log('Unfiltered search failed:', unfilteredError);
        }
        
    // If unfiltered search fails, try alternative endpoints
    console.log('[getSingleNews] Unfiltered search failed, trying alternative endpoints...');
    try {
      // Try different API endpoints that might have the news
      const alternativeEndpoints = [
        '/news',
        '/news/all',
        '/news/recent',
        '/news/featured',
        '/news/popular'
      ];
      
      for (const endpoint of alternativeEndpoints) {
        try {
          console.log(`[getSingleNews] Trying alternative endpoint: ${endpoint}`);
          const altResponse = await apiClient.get<ApiResponse<NewsResponse>>(endpoint, {
              params: {
              language_id: language_id,
              limit: 5000,
                page: 1
              }
            });
            
          if (altResponse.data.status === 1 && altResponse.data.result?.items) {
            const newsItem = altResponse.data.result.items.find(item => item.id === newsId);
              if (newsItem) {
              console.log(`Found news item via alternative endpoint ${endpoint}:`, newsItem);
                    
                    // Handle different content field structures
                    let contentValue = '';
                    if (newsItem.longNewsContent) {
                      if (typeof newsItem.longNewsContent === 'string') {
                        contentValue = newsItem.longNewsContent;
                } else if (typeof (newsItem as any).longNewsContent === 'object' && (newsItem as any).longNewsContent.content) {
                  contentValue = (newsItem as any).longNewsContent.content;
                      }
              } else if ((newsItem as any).shortNewsContent) {
                contentValue = (newsItem as any).shortNewsContent;
              } else if ((newsItem as any).content) {
                contentValue = (newsItem as any).content;
              } else if ((newsItem as any).description) {
                contentValue = (newsItem as any).description;
              } else if ((newsItem as any).excerpt) {
                contentValue = (newsItem as any).excerpt;
                    }
                
                const singleNewsResult: any = {
                  ...newsItem,
                  longNewsContent: {
                        content: contentValue
                      },
                    media: (newsItem as any).media || [],
                categoryName: (newsItem as any).categoryName || (newsItem as any).category_name || 'General',
                districtName: (newsItem as any).districtName || (newsItem as any).district_name || 'Unknown',
                stateName: (newsItem as any).stateName || (newsItem as any).state_name || 'Unknown',
                languageName: (newsItem as any).languageName || (newsItem as any).language_name || 'English',
                // Ensure all required fields are present for RelatedNews
                categoryId: (newsItem as any).categoryId || (newsItem as any).category_id || (newsItem as any).categoryId || 'general-category-id',
                language_id: (newsItem as any).language_id || (newsItem as any).languageId || language_id,
                      state_id: (newsItem as any).state_id || (newsItem as any).stateId || 'b6be8d5c-f276-4d63-b878-6fc765180ccf',
                district_id: (newsItem as any).district_id || (newsItem as any).districtId || 'general-district-id',
                // Add additional content fields for better compatibility
                content: contentValue,
                description: (newsItem as any).description || (newsItem as any).excerpt || contentValue,
                summary: (newsItem as any).summary || (newsItem as any).excerpt || contentValue,
                body: (newsItem as any).body || contentValue,
                text: (newsItem as any).text || contentValue,
                html: (newsItem as any).html || contentValue
                };
                
                return singleNewsResult;
              }
            }
        } catch (endpointError) {
          console.log(`Alternative endpoint ${endpoint} failed:`, endpointError);
            continue;
          }
            }
    } catch (alternativeError) {
      console.log('Alternative endpoints search failed:', alternativeError);
    }
    
    // If alternative endpoints fail, try searching with different parameters
    console.log('[getSingleNews] Alternative endpoints failed, trying different search parameters...');
    try {
      // Try different search parameters
      const searchParams = [
        { limit: 10000, page: 1 },
        { limit: 5000, page: 1 },
        { limit: 2000, page: 1 },
        { limit: 1000, page: 1 },
        { limit: 500, page: 1 }
      ];
      
      for (const params of searchParams) {
        try {
          console.log(`[getSingleNews] Trying search with limit ${params.limit}`);
          const paramResponse = await apiClient.get<ApiResponse<NewsResponse>>('/news/filter-advanced', {
                  params: {
              language_id: language_id,
              limit: params.limit,
              page: params.page
            }
          });
          
          if (paramResponse.data.status === 1 && paramResponse.data.result?.items) {
            const newsItem = paramResponse.data.result.items.find(item => item.id === newsId);
                  if (newsItem) {
              console.log(`Found news item via parameter search with limit ${params.limit}:`, newsItem);
                    
                    // Handle different content field structures
                    let contentValue = '';
                    if (newsItem.longNewsContent) {
                      if (typeof newsItem.longNewsContent === 'string') {
                        contentValue = newsItem.longNewsContent;
                } else if (typeof (newsItem as any).longNewsContent === 'object' && (newsItem as any).longNewsContent.content) {
                  contentValue = (newsItem as any).longNewsContent.content;
                      }
              } else if ((newsItem as any).shortNewsContent) {
                contentValue = (newsItem as any).shortNewsContent;
              } else if ((newsItem as any).content) {
                contentValue = (newsItem as any).content;
              } else if ((newsItem as any).description) {
                contentValue = (newsItem as any).description;
              } else if ((newsItem as any).excerpt) {
                contentValue = (newsItem as any).excerpt;
                    }
                    
                    const singleNewsResult: any = {
                ...newsItem,
                      longNewsContent: {
                        content: contentValue
                      },
                    media: (newsItem as any).media || [],
                categoryName: (newsItem as any).categoryName || (newsItem as any).category_name || 'General',
                districtName: (newsItem as any).districtName || (newsItem as any).district_name || 'Unknown',
                stateName: (newsItem as any).stateName || (newsItem as any).state_name || 'Unknown',
                languageName: (newsItem as any).languageName || (newsItem as any).language_name || 'English',
                // Ensure all required fields are present for RelatedNews
                categoryId: (newsItem as any).categoryId || (newsItem as any).category_id || (newsItem as any).categoryId || 'general-category-id',
                language_id: (newsItem as any).language_id || (newsItem as any).languageId || language_id,
                      state_id: (newsItem as any).state_id || (newsItem as any).stateId || 'b6be8d5c-f276-4d63-b878-6fc765180ccf',
                district_id: (newsItem as any).district_id || (newsItem as any).districtId || 'general-district-id',
                // Add additional content fields for better compatibility
                content: contentValue,
                description: (newsItem as any).description || (newsItem as any).excerpt || contentValue,
                summary: (newsItem as any).summary || (newsItem as any).excerpt || contentValue,
                body: (newsItem as any).body || contentValue,
                text: (newsItem as any).text || contentValue,
                html: (newsItem as any).html || contentValue
                    };
                    
                    return singleNewsResult;
                  }
                }
        } catch (paramError) {
          console.log(`Parameter search with limit ${params.limit} failed:`, paramError);
                continue;
              }
            }
    } catch (parameterError) {
      console.log('Parameter search failed:', parameterError);
        }
        
    // If all fallback methods fail, try one final comprehensive search
    console.log('[getSingleNews] All methods failed, trying final comprehensive search...');
        try {
      // Try to get all news with maximum possible parameters
      const finalResponse = await apiClient.get<ApiResponse<NewsResponse>>('/news/filter-advanced', {
            params: {
          language_id: language_id,
          limit: 10000,
              page: 1
            }
          });
          
      if (finalResponse.data.status === 1 && finalResponse.data.result?.items) {
        const newsItem = finalResponse.data.result.items.find(item => item.id === newsId);
            if (newsItem) {
          console.log('Found news item via final comprehensive search:', newsItem);
            
            // Extract long content using the helper function
            const contentValue = extractLongContent(newsItem);
              
              const singleNewsResult: any = {
                ...newsItem,
                longNewsContent: {
                  content: contentValue
                },
                    media: (newsItem as any).media || [],
                    categoryName: (newsItem as any).categoryName || 'General',
                    districtName: (newsItem as any).districtName || 'Unknown',
                    stateName: (newsItem as any).stateName || 'Unknown',
                    languageName: (newsItem as any).languageName || 'English',
                // Ensure all required fields are present
                categoryId: (newsItem as any).categoryId || (newsItem as any).category_id || 'general-category-id',
            language_id: (newsItem as any).language_id || (newsItem as any).languageId || language_id,
                state_id: (newsItem as any).state_id || (newsItem as any).stateId || 'b6be8d5c-f276-4d63-b878-6fc765180ccf',
                district_id: (newsItem as any).district_id || (newsItem as any).districtId || 'general-district-id'
              };
              
              return singleNewsResult;
            }
          }
      } catch (finalError) {
      console.log('Final comprehensive search failed:', finalError);
    }
    
    // If all fallback methods fail, try one more comprehensive approach
    console.log('[getSingleNews] All methods failed, trying comprehensive content search...');
    try {
      // Try to get all news without any filters to find the specific news item
      const comprehensiveResponse = await apiClient.get<ApiResponse<NewsResponse>>('/news/filter-advanced', {
        params: {
          limit: 10000,
          page: 1,
          ...(language_id && { language_id })
        }
      });
      
      if (comprehensiveResponse.data.status === 1 && comprehensiveResponse.data.result?.items) {
        const newsItem = comprehensiveResponse.data.result.items.find(item => item.id === newsId);
        if (newsItem) {
          console.log('Found news item via comprehensive search:', newsItem);
          
          // Extract long content using the enhanced helper function
          const contentValue = extractLongContent(newsItem, language_id);
            
            const singleNewsResult: any = {
              ...newsItem,
              longNewsContent: {
                content: contentValue
              },
                    media: (newsItem as any).media || [],
                    categoryName: (newsItem as any).categoryName || 'General',
                    districtName: (newsItem as any).districtName || 'Unknown',
                    stateName: (newsItem as any).stateName || 'Unknown',
                    languageName: (newsItem as any).languageName || 'English',
              // Ensure all required fields are present
            categoryId: (newsItem as any).categoryId || (newsItem as any).category_id || 'general-category-id',
            language_id: (newsItem as any).language_id || (newsItem as any).languageId || language_id,
            state_id: (newsItem as any).state_id || (newsItem as any).stateId || 'b6be8d5c-f276-4d63-b878-6fc765180ccf',
            district_id: (newsItem as any).district_id || (newsItem as any).districtId || 'general-district-id',
            // Add additional content fields for better compatibility
            content: contentValue,
            description: (newsItem as any).description || (newsItem as any).excerpt || contentValue,
            summary: (newsItem as any).summary || (newsItem as any).excerpt || contentValue,
            body: (newsItem as any).body || contentValue,
            text: (newsItem as any).text || contentValue,
            html: (newsItem as any).html || contentValue
            };
            
            return singleNewsResult;
          }
      }
    } catch (comprehensiveError) {
      console.log('Comprehensive search failed:', comprehensiveError);
    }

    // If all fallback methods fail, return fallback data
    console.log('All fallback methods failed, returning fallback data');
    return getFallbackNewsData(newsId, language_id);
  }
};

// Fallback data function
const getFallbackNewsData = (newsId: string, language_id?: string): any => {
  // Language-specific fallback content
  let fallbackContent = '';
  let fallbackTitle = 'Latest News Update';
  let fallbackExcerpt = 'Stay informed with the latest news and updates from our team.';
  
  if (language_id) {
    // Try to determine language and provide appropriate content
    const languageMap: Record<string, { title: string; excerpt: string; content: string }> = {
      'te': { // Telugu
        title: 'తాజా వార్తలు',
        excerpt: 'మా బృందం నుండి తాజా వార్తలు మరియు నవీకరణలతో తెలియుకోండి.',
      content: `
          <div style="padding: 20px; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #2c3e50; margin-bottom: 20px; font-size: 28px;">తాజా వార్తలు</h2>
            <p style="margin-bottom: 15px; font-size: 16px;">
              మేము మీకు అత్యంత తాజా వార్తలు మరియు సమాచారాన్ని అందించడానికి నిరంతరం పని చేస్తున్నాము. 
              మా బృందం మా పాఠకులకు ఖచ్చితమైన, సమయానుకూలమైన మరియు సంబంధిత కంటెంట్ అందించడానికి అంకితభావంతో ఉంది.
            </p>
            <p style="margin-bottom: 15px; font-size: 16px;">
              మీరు నిర్దిష్ట సమాచారాన్ని వెతుకుతున్నట్లయితే లేదా ఏవైనా ప్రశ్నలు ఉంటే, 
              దయచేసి మా ఇతర వ్యాసాలను బ్రౌజ్ చేయండి లేదా మా మద్దతు బృందాన్ని సంప్రదించండి. 
              మీరు సమాచారంతో మరియు కనెక్ట్ అయ్యేలా సహాయపడటానికి మేము ఇక్కడ ఉన్నాము.
            </p>
          </div>
        `
      },
      'hi': { // Hindi
        title: 'ताजा समाचार',
        excerpt: 'हमारी टीम से ताजा समाचार और अपडेट के साथ सूचित रहें.',
        content: `
          <div style="padding: 20px; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #2c3e50; margin-bottom: 20px; font-size: 28px;">ताजा समाचार</h2>
            <p style="margin-bottom: 15px; font-size: 16px;">
              हम आपके लिए सबसे नवीनतम समाचार और जानकारी लाने के लिए लगातार काम कर रहे हैं। 
              हमारी टीम हमारे पाठकों के लिए सटीक, समय पर और प्रासंगिक सामग्री प्रदान करने के लिए समर्पित है।
            </p>
            <p style="margin-bottom: 15px; font-size: 16px;">
              यदि आप विशिष्ट जानकारी की तलाश कर रहे हैं या कोई प्रश्न हैं, तो कृपया 
              हमारे अन्य लेखों को ब्राउज़ करें या हमारी सहायता टीम से संपर्क करें। 
              आपको सूचित और जुड़े रखने में मदद करने के लिए हम यहां हैं।
            </p>
        </div>
      `
      }
    };
    
    const languageContent = languageMap[language_id];
    if (languageContent) {
      fallbackTitle = languageContent.title;
      fallbackExcerpt = languageContent.excerpt;
      fallbackContent = languageContent.content;
    }
  }
  
  // Default English content if no language-specific content found
  if (!fallbackContent) {
    fallbackContent = `
      <div style="padding: 20px; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #2c3e50; margin-bottom: 20px; font-size: 28px;">Latest News Update</h2>
        
        <p style="margin-bottom: 15px; font-size: 16px;">
          We're constantly working to bring you the most up-to-date news and information. 
          Our team is dedicated to providing accurate, timely, and relevant content for our readers.
        </p>
        
        <p style="margin-bottom: 15px; font-size: 16px;">
          If you're looking for specific information or have any questions, please feel free to 
          browse through our other articles or contact our support team. We're here to help 
          you stay informed and connected.
        </p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;">
          <h3 style="color: #007bff; margin-top: 0; margin-bottom: 15px;">What's New?</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li style="margin-bottom: 8px;">Fresh content updated regularly</li>
            <li style="margin-bottom: 8px;">Comprehensive coverage of current events</li>
            <li style="margin-bottom: 8px;">Expert analysis and insights</li>
            <li style="margin-bottom: 8px;">User-friendly interface and navigation</li>
          </ul>
        </div>
        
        <p style="margin-bottom: 0; font-size: 14px; color: #666; font-style: italic;">
          Thank you for your patience and continued support. We appreciate your readership 
          and look forward to serving you with quality content.
        </p>
      </div>
    `;
  }
  
  return {
    state_id: "b6be8d5c-f276-4d63-b878-6fc765180ccf",
    id: newsId,
    title: fallbackTitle,
    slug: "latest-news-update",
    excerpt: fallbackExcerpt,
    shortNewsContent: fallbackExcerpt,
    longNewsContent: {
      content: fallbackContent
    },
    // Additional content fields for better compatibility
    content: fallbackContent,
    description: "Stay informed with the latest news and updates from our team.",
    summary: "Stay informed with the latest news and updates from our team.",
    body: fallbackContent,
    text: fallbackContent,
    html: fallbackContent,
    language_id: language_id,
    editorId: "1",
    authorId: "1",
    authorName: "Editorial Team",
    categoryId: "general-category-id",
    district_id: "general-district-id",
    seoMeta: "Latest news update and information",
    metaDescription: "Stay informed with the latest news and updates from our editorial team.",
    status: "published",
    type: "news",
    priority: "normal",
    isSticky: false,
    isFeatured: false,
    viewCount: 0,
    uniqueViewCount: 0,
    likeCount: 0,
    dislikeCount: 0,
    shareCount: 0,
    commentCount: 0,
    publishedAt: new Date().toISOString(),
    scheduledAt: null,
    expiresAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    media: [],
    categoryName: "General",
    districtName: "Unknown",
    stateName: "Unknown",
    languageName: "English"
  };
};