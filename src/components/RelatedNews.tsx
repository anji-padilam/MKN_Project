import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getFilteredNews } from "../api/news";
import { NewsItem } from "../api/apiTypes";
import apiClient from "../api/apiClient";
import { useDynamicData } from '../contexts/DynamicDataContext';

interface RelatedNewsProps {
  categoryId: string;
  language_id: string;
  state_id: string;
  district_id: string;
  currentNewsId?: string;
}

const RelatedNews: React.FC<RelatedNewsProps> = ({
  categoryId,
  language_id,
  state_id,
  district_id,
  currentNewsId,
}) => {
  const navigate = useNavigate();
  const [relatedNews, setRelatedNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Get dynamic data from context
  const { 
    categories, 
    selectedLanguage, 
    selectedState, 
    selectedDistrict,
    getCurrentLanguageId,
    getCurrentStateId,
    getCurrentDistrictId
  } = useDynamicData();

  // Use dynamic data if available, otherwise fall back to props
  const currentLanguageId = getCurrentLanguageId() || language_id;
  const currentStateId = getCurrentStateId() || state_id;
  const currentDistrictId = getCurrentDistrictId() || district_id;

  useEffect(() => {
    const fetchRelatedNews = async () => {
      try {
        setLoading(true);
        console.log('Fetching related news with params:', {
          currentLanguageId,
          categoryId,
          currentStateId,
          currentDistrictId,
          currentNewsId
        });
        
        // Try multiple approaches to find related news
        let relatedItems: any[] = [];
        
        // Approach 1: Try with all parameters if available
        if (categoryId && currentLanguageId && currentStateId && currentDistrictId) {
          try {
        const newsData = await getFilteredNews({
          language_id: currentLanguageId,
          categoryId,
          state_id: currentStateId,
          district_id: currentDistrictId,
          page: 1,
        });

        console.log('Related news API response:', newsData);

        if (newsData?.items && Array.isArray(newsData.items)) {
              relatedItems = newsData.items
            .filter((n) => n.id !== currentNewsId)
            .slice(0, 8);
              console.log(`Found ${relatedItems.length} related news items via getFilteredNews`);
            }
          } catch (err) {
            console.log('getFilteredNews failed:', err);
          }
        }
        
        // Approach 2: If no items found, try with just category and language
        if (relatedItems.length === 0 && categoryId && currentLanguageId) {
          try {
            console.log('Trying with just category and language...');
            const alternativeResponse = await apiClient.get('/news/filter-multi-categories', {
              params: {
                categoryIds: categoryId,
                language_id: currentLanguageId,
                limit: 8,
                page: 1
              }
            });
            
            if (alternativeResponse.data?.status === 1 && alternativeResponse.data?.result?.items) {
              relatedItems = alternativeResponse.data.result.items
                .filter((n: any) => n.id !== currentNewsId)
                .slice(0, 8);
              console.log(`Found ${relatedItems.length} related news items via category+language search`);
            }
          } catch (altError) {
            console.log('Category+language search failed:', altError);
          }
        }
        
        // Approach 3: If still no items, try with just language and known category IDs
        if (relatedItems.length === 0 && currentLanguageId) {
          try {
            console.log('Trying with language and known category IDs...');
            // Use dynamic category IDs from context
            const knownCategoryIds = categories.map(cat => cat.id);
            
            const languageResponse = await apiClient.get('/news/filter-multi-categories', {
              params: {
                categoryIds: knownCategoryIds.join(','),
                language_id: currentLanguageId,
                limit: 8,
                page: 1
              }
            });
            
            if (languageResponse.data?.status === 1 && languageResponse.data?.result?.items) {
              relatedItems = languageResponse.data.result.items
                .filter((n: any) => n.id !== currentNewsId)
                .slice(0, 8);
              console.log(`Found ${relatedItems.length} related news items via language+category search`);
            }
          } catch (langError) {
            console.log('Language+category search failed:', langError);
          }
        }
        
        // Approach 4: If still no items, try with broader search using known category IDs
        if (relatedItems.length === 0) {
          try {
            console.log('Trying broader search with known category IDs...');
            // Use dynamic category IDs from context for broader search
            const knownCategoryIds = categories.map(cat => cat.id);
            
            const broaderResponse = await apiClient.get('/news/filter-multi-categories', {
              params: {
                categoryIds: knownCategoryIds.join(','),
                language_id: language_id,
                limit: 8,
                page: 1
              }
            });
            
            if (broaderResponse.data?.status === 1 && broaderResponse.data?.result?.items) {
              relatedItems = broaderResponse.data.result.items
                .filter((n: any) => n.id !== currentNewsId)
                .slice(0, 8);
              console.log(`Found ${relatedItems.length} related news items via broader search`);
            }
          } catch (broaderError) {
            console.log('Broader search failed:', broaderError);
          }
        }
        
        // Approach 5: If still no items, try to get categories dynamically and search
        if (relatedItems.length === 0) {
          try {
            console.log('Trying dynamic category search...');
            const currentLanguageId = language_id || getCurrentLanguageId();
            
            const categoriesResponse = await apiClient.get('/news/categories', {
              params: {
                language_id: currentLanguageId
              }
            });
            
            if (categoriesResponse.data?.status === 1 && categoriesResponse.data?.result) {
              const allCategories = categoriesResponse.data.result;
              const allCategoryIds = allCategories.map((cat: any) => cat.id).filter(Boolean);
              
              if (allCategoryIds.length > 0) {
                console.log(`Found ${allCategoryIds.length} categories dynamically, searching for related news...`);
                
                const dynamicResponse = await apiClient.get('/news/filter-multi-categories', {
                  params: {
                    categoryIds: allCategoryIds.slice(0, 10).join(','), // Use first 10 categories
                    language_id: currentLanguageId,
                    limit: 8,
                    page: 1
                  }
                });
                
                if (dynamicResponse.data?.status === 1 && dynamicResponse.data?.result?.items) {
                  relatedItems = dynamicResponse.data.result.items
                    .filter((n: any) => n.id !== currentNewsId)
                    .slice(0, 8);
                  console.log(`Found ${relatedItems.length} related news items via dynamic category search`);
                }
              }
            }
          } catch (dynamicError) {
            console.log('Dynamic category search failed:', dynamicError);
          }
        }
        
        // Approach 6: Final fallback with comprehensive known category IDs
        if (relatedItems.length === 0) {
          try {
            console.log('Trying final fallback with comprehensive category IDs...');
            // Use dynamic category IDs from context for final fallback
            const comprehensiveCategoryIds = categories.map(cat => cat.id);
            
            const finalResponse = await apiClient.get('/news/filter-multi-categories', {
              params: {
                categoryIds: comprehensiveCategoryIds.join(','),
                language_id: language_id,
                limit: 8,
                page: 1
              }
            });
            
            if (finalResponse.data?.status === 1 && finalResponse.data?.result?.items) {
              relatedItems = finalResponse.data.result.items
                .filter((n: any) => n.id !== currentNewsId)
                .slice(0, 8);
              console.log(`Found ${relatedItems.length} related news items via final fallback search`);
            }
          } catch (finalError) {
            console.log('Final fallback search failed:', finalError);
          }
        }
        
        setRelatedNews(relatedItems);
        
      } catch (err) {
        console.error("Error fetching related news:", err);
        setRelatedNews([]);
      } finally {
        setLoading(false);
      }
    };
    
    // Always try to fetch related news, even with missing parameters
      fetchRelatedNews();
  }, [categoryId, currentLanguageId, currentStateId, currentDistrictId, currentNewsId, categories]);

  const handleClick = (news: NewsItem) => {
    navigate(`/news/${news.id}`);
  };

  if (loading) {
    return (
      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Related Entertainment Updates:</h2>
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!relatedNews.length) {
    return null;
  }

  return (
    <div className="mt-10">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Related News Updates:</h2>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {relatedNews.map((news) => (
          <div
            key={news.id}
            className="flex-shrink-0 w-48 cursor-pointer"
            onClick={() => handleClick(news)}
          >
            {/* Image */}
            <div className="w-full h-32 rounded-md overflow-hidden bg-gray-200">
              {news.media?.[0]?.mediaUrl ? (
                <img
                  src={news.media[0].mediaUrl}
                  alt={news.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                  <span className="text-2xl">📰</span>
                </div>
              )}
            </div>
            {/* Title */}
            <h3 className="text-sm font-medium text-gray-800 dark:text-white mt-2 line-clamp-2">
              {news.title}
            </h3>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RelatedNews;