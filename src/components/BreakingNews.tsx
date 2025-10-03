import React, { useState, useEffect } from "react";
import Slider, { CustomArrowProps } from "react-slick";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useDynamicData } from '../contexts/DynamicDataContext';
import { fetchNewsByCategory } from '@/services/api';

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// -------- Types --------
interface NewsItem {
  id: string;
  title: string;
  slug: string;
  shortNewsContent?: string;
  categoryName?: string;
  media?: {
    id: string;
    mediaUrl: string;
    altText?: string;
    caption?: string;
  }[];
}

// -------- Custom Arrows --------
const PrevArrow: React.FC<CustomArrowProps> = ({ onClick }) => {
  const { t } = useTranslation();
  return (
    <button
      onClick={onClick}
      className="absolute left-0 top-1/2 -translate-y-1/2 z-30 bg-white dark:bg-gray-800 hover:bg-red-500 text-red-500 hover:text-white rounded-full w-12 h-12 lg:w-14 lg:h-14 flex items-center justify-center shadow-xl border-2 border-red-500 transition-all duration-300 hover:scale-110 hover:shadow-2xl"
      style={{ marginLeft: "-20px" }}
      aria-label={t("featured.prevSlide")}
    >
      <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
    </button>
  );
};

const NextArrow: React.FC<CustomArrowProps> = ({ onClick }) => {
  const { t } = useTranslation();
  return (
    <button
      onClick={onClick}
      className="absolute right-0 top-1/2 -translate-y-1/2 z-30 bg-white dark:bg-gray-800 hover:bg-red-500 text-red-500 hover:text-white rounded-full w-12 h-12 lg:w-14 lg:h-14 flex items-center justify-center shadow-xl border-2 border-red-500 transition-all duration-300 hover:scale-110 hover:shadow-2xl"
      style={{ marginRight: "-20px" }}
      aria-label={t("featured.nextSlide")}
    >
      <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
};

// -------- Breaking News Component --------
const BreakingNews: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Get dynamic data from context
  const {
    selectedLanguage,
    categories,
    getCurrentLanguageId,
    getCategoryIdsByType,
  } = useDynamicData();

  const [breakingNews, setBreakingNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const language_id = getCurrentLanguageId();

  const fetchBreakingNews = async () => {
    if (!language_id || !categories.length) return;

    setLoading(true);
    setError(null);

    try {
      // Get breaking news category IDs dynamically using the context function
      const breakingCategoryIds = getCategoryIdsByType('breaking');

      if (!breakingCategoryIds || breakingCategoryIds.length === 0) {
        console.log('[BreakingNews] No breaking news categories found');
        setBreakingNews([]);
        return;
      }

      console.log('[BreakingNews] Found breaking news categories:', breakingCategoryIds);

      // Fetch news for all breaking news categories
      const allNews = [];
      for (const categoryId of breakingCategoryIds) {
        const news = await fetchNewsByCategory(language_id, categoryId, 6, 1);
        allNews.push(...news);
      }
      
      setBreakingNews(allNews.slice(0, 6)); // Take only first 6 items
      console.log('[BreakingNews] Fetched breaking news:', allNews.length, 'items');
    } catch (err) {
      console.error('[BreakingNews] Error fetching breaking news:', err);
      setError('Failed to fetch breaking news');
      setBreakingNews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBreakingNews();
  }, [language_id, categories]);

  // 👉 Navigate on card click
  const handleCardClick = (newsId: string) => {
    navigate(`/news/${newsId}`);
  };

  const settings = {
    dots: false,
    infinite: true,
    speed: 800,
    autoplay: true,
    autoplaySpeed: 5000,
    arrows: true,
    slidesToShow: 1,
    slidesToScroll: 1,
    prevArrow: <PrevArrow />,
    nextArrow: <NextArrow />,
    responsive: [
      {
        breakpoint: 1400,
        settings: {
          slidesToShow: 4,
          slidesToScroll: 1,
          arrows: true,
          dots: false
        }
      },
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
          arrows: true,
          dots: false
        }
      },
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          arrows: true,
          dots: false
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          arrows: false,
          dots: true
        }
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          arrows: false,
          dots: true
        }
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          arrows: false,
          dots: true
        }
      },
    ],
  };

  if (loading) {
    return (
      <section className="featured-post-area pt-12 pb-8 font-mandali">
        <div className="container mx-auto px-8 lg:px-12">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            <span className="ml-4 text-lg text-gray-700 dark:text-gray-300">
              {t("loadingNews") || "Loading breaking news..."}
            </span>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="featured-post-area pt-12 pb-8 font-mandali">
        <div className="container mx-auto px-8 lg:px-12">
          <div className="text-center py-6">
            <p className="text-red-500 text-lg">{t("fetchError") || error}</p>
          </div>
        </div>
      </section>
    );
  }

  if (!breakingNews || breakingNews.length === 0) {
    return (
      <section className="featured-post-area pt-12 pb-8 font-mandali">
        <div className="container mx-auto px-8 lg:px-12">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {t("headings.breakingNews")}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {t("labels.noNewsAvailable") || "No breaking news available at the moment."}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="featured-post-area pt-8 sm:pt-12 pb-6 sm:pb-8 font-mandali">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 relative">
        <Slider {...settings}>
          {breakingNews.map((item: NewsItem) => (
            <div
              key={item.id}
              className="px-1 sm:px-2 relative cursor-pointer"
              onClick={() => handleCardClick(item.id)}
            >
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transform transition-transform duration-300 hover:scale-[1.02]">
                {item.media && item.media.length > 0 && (
                  <div className="relative overflow-hidden">
                    <img
                      src={item.media[0].mediaUrl}
                      alt={item.title}
                      className="w-full h-48 sm:h-64 md:h-80 lg:h-96 object-cover transition-transform duration-300 hover:scale-105"
                    />
                    {/* <div className="absolute top-2 sm:top-4 left-2 sm:left-4">
                      <span className="bg-red-600 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">
                        {t("labels.breaking") || "BREAKING"}
                      </span>
                    </div> */}
                  </div>
                )}
                <div className="p-3 sm:p-4 md:p-6">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 line-clamp-2 hover:text-red-600 transition-colors duration-200">
                    {item.title}
                  </h3>
                  {/* <p className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-3">
                    {item.shortNewsContent}
                  </p> */}
                  <div className="flex flex-row items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>
                      {item.categoryName && (
                        <span className="font-semibold mr-1 bg-red-600 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                          {item.categoryName}
                        </span>
                      )}
                    </span>
                    <span className="text-xs">
                      {new Date().toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </div>
    </section>
  );
};

export default BreakingNews;