import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "../contexts/ThemeContext";
import apiClient from "../api/apiClient";
import {
  Menu,
  X,
  ChevronDown,
  Globe,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Search,
  Moon,
  Bell,
  LogOut,
  Settings,
  MoreHorizontal,
  Home,
  Shield,
  FileText,
  MessageSquare,
  UserPlus,
  Edit,
  Save,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Import the separate auth components
import Login from "./Login";
import Signup from "./Signup";

import { useDynamicData } from "../contexts/DynamicDataContext";
import { Language, State, District, Category } from "../utils/dynamicDataUtils";
import { NewsItem } from "../api/apiTypes";
import { getFilteredNews } from "../api/news";

/** Normalize language codes for i18n */
const languageCodeMap: Record<string, string> = {
  en: "en",
  te: "te",
  kn: "kn",
  ka: "kn",
  ur: "ur",
  ud: "ur",
  hi: "hi",
  ta: "ta",
};

const normalizeLanguageCode = (code: string) => {
  const lower = String(code || "").toLowerCase();
  return languageCodeMap[lower] || lower;
};

const getLanguageDirection = (lang: string) => {
  const rtlLangs = ["ar", "he", "fa", "ur"];
  return rtlLangs.includes(lang) ? "rtl" : "ltr";
};


import { formatTimeAgo } from '@/utils/timeUtils';

// Default location constants (fallbacks only)
const DEFAULT_LANGUAGE_NAME = "English";
const DEFAULT_STATE_NAME = "Telangana";
const DEFAULT_DISTRICT_NAME = "Hyderabad";

type Step = 1 | 2 | 3;
type AuthMode = "login" | "signup";

interface NavItem {
  id: string;
  name: string;
  news: NewsItem[];
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender?: string;
  dob?: string;
  status?: string;
  is_active?: boolean;
  profilePicture?: string;
  avatar?: string;
  preferences?: {
    theme: string;
    notifications: boolean;
  };
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
  role?: {
    id: string;
    role: string;
    role_type: string;
    isApproved: boolean;
    createdAt: string;
  };
  token?: string;
  isAdmin?: boolean;
}

const Header = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDarkMode, toggleTheme } = useTheme();
  
  // Get dynamic data from context
  const {
    languages,
    states,
    districts,
    categories,
    selectedLanguage,
    selectedState,
    selectedDistrict,
    selectedCategories,
    loadingLanguages,
    loadingStates,
    loadingDistricts,
    loadingCategories,
    errorLanguages,
    errorStates,
    errorDistricts,
    errorCategories,
    setLanguage,
    setState,
    setDistrict,
    setSelectedCategories,
    getCurrentLanguageId,
    getCurrentStateId,
    getCurrentDistrictId,
    getCurrentCategoryIds,
    refreshLanguages,
    refreshStates,
    refreshDistricts,
    refreshCategories,
  } = useDynamicData();

  // Debug logging for default selections
  useEffect(() => {
    console.log('[Header] Current selections:', {
      selectedLanguage: selectedLanguage?.language_name,
      selectedState: selectedState?.state_name,
      selectedDistrict: selectedDistrict?.name,
      categoriesCount: categories.length,
      loadingStates: { languages: loadingLanguages, states: loadingStates, districts: loadingDistricts, categories: loadingCategories }
    });
  }, [selectedLanguage, selectedState, selectedDistrict, categories.length, loadingLanguages, loadingStates, loadingDistricts, loadingCategories]);

  // Listen for i18n language changes to force re-render
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      console.log('[Header] i18n language changed to:', lng);
      setForceRender(prev => prev + 1);
    };

    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  // User state
  const [user, setUser] = useState<User | null>(null);

  // Nav UI
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [forceRender, setForceRender] = useState(0);

  // Wizard dialog (single popup)
  const [openDialog, setOpenDialog] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>(1);

  // Auth dialog
  const [openAuthDialog, setOpenAuthDialog] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Dialog states for profile menu items
  const [openSettingsDialog, setOpenSettingsDialog] = useState(false);
  const [openPrivacyDialog, setOpenPrivacyDialog] = useState(false);
  const [openTermsDialog, setOpenTermsDialog] = useState(false);
  const [openFeedbackDialog, setOpenFeedbackDialog] = useState(false);
  const [openInviteDialog, setOpenInviteDialog] = useState(false);
  const [openEditProfileDialog, setOpenEditProfileDialog] = useState(false);
  
  // Feedback form state
  const [feedbackData, setFeedbackData] = useState({
    subject: '',
    message: '',
    rating: 5
  });

  // Edit profile form state
  const [editProfileData, setEditProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    profilePicture: '',
    gender: '',
    dob: '',
  });
  const [editProfileLoading, setEditProfileLoading] = useState(false);
  

  // Search states for filtering
  const [languageSearch, setLanguageSearch] = useState("");
  const [stateSearch, setStateSearch] = useState("");
  const [districtSearch, setDistrictSearch] = useState("");

  // News for hover dropdowns
  const [categoryNews, setCategoryNews] = useState<Record<string, NewsItem[]>>({});
  const [loadingNews, setLoadingNews] = useState<Record<string, boolean>>({});

  // Horizontal scroll state
  const [scrollPositions, setScrollPositions] = useState<Record<string, number>>({});

  // DynamicDataContext handles initialization

  /** -----------------------------
   * Check for existing user on mount and fetch profile
   * ----------------------------- */
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem("user");
      }
    }
    
    // Fetch user profile if token exists
    if (token && !storedUser) {
      fetchUserProfile();
    }
  }, []);

  /** -----------------------------
   * Fetch user profile from API
   * ----------------------------- */
  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      console.log("Fetching user profile...");
      
      // Use apiClient instead of direct fetch to get proper proxy handling
      const response = await apiClient.get('/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log("Profile API response:", response.data);
      
      const data = response.data as any;
      
      if (data && data.status === 1 && data.result) {
        const userData = {
          id: data.result.id,
          firstName: data.result.firstName,
          lastName: data.result.lastName,
          email: data.result.email,
          phone: data.result.phone || "",
          gender: data.result.gender,
          dob: data.result.dob,
          status: data.result.status,
          is_active: data.result.is_active,
          profilePicture: data.result.profilePicture,
          avatar: data.result.avatar,
          preferences: data.result.preferences || {
            theme: "light",
            notifications: true
          },
          lastLoginAt: data.result.lastLoginAt,
          role: {
            id: data.result.role.id,
            role: data.result.role.role,
            role_type: data.result.role.roleType,
            isApproved: true,
            createdAt: data.result.createdAt,
          },
          token: token,
        };
        
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        
        console.log("Profile fetched successfully:", userData);
        
        // Show success toast
        toast({
          title: t("profile.profileUpdated"),
          description: `Welcome, ${userData.firstName}!`,
          variant: "default",
        });
      } else {
        console.error("Invalid profile response structure:", response.data);
        // Clear invalid token
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      // Clear invalid token on error
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
    }
  };


  /** -----------------------------
   * Reset to default selections function
   * ----------------------------- */
  const resetToDefaults = async () => {
    try {
      console.log('[Header] Resetting to defaults...');
      
      // Clear session storage
      sessionStorage.removeItem('selectedLanguage');
      sessionStorage.removeItem('selectedState');
      sessionStorage.removeItem('selectedDistrict');
      sessionStorage.removeItem('selectedCategories');
      
      // Clear selections in context
      setLanguage(null as any);
      setState(null as any);
      setDistrict(null as any);
      setSelectedCategories([]);
      
      // Clear category news cache
      setCategoryNews({});
      
      // Reset i18n language to English
      const englishCode = 'en';
      console.log('[Header] Changing i18n language to English');
      i18n.changeLanguage(englishCode).then(() => {
        console.log('[Header] i18n language changed to English successfully');
        document.dir = getLanguageDirection(englishCode);
        // Force re-render to update UI text
        setForceRender(prev => prev + 1);
      }).catch((error) => {
        console.error('[Header] Error changing i18n language to English:', error);
      });
      
      // Use context refresh functions to reload data
      if (refreshLanguages) {
        console.log('[Header] Refreshing languages...');
        refreshLanguages();
      }
      if (refreshStates) {
        console.log('[Header] Refreshing states...');
        refreshStates();
      }
      if (refreshDistricts) {
        console.log('[Header] Refreshing districts...');
        refreshDistricts();
      }
      if (refreshCategories) {
        console.log('[Header] Refreshing categories...');
        refreshCategories();
      }
      
      console.log('[Header] Reset to defaults completed. Default selections will be applied automatically.');
    } catch (error) {
      console.error("Error resetting to defaults:", error);
    }
  };

  // DynamicDataContext handles all initialization and data fetching

  // DynamicDataContext handles category loading automatically

  /** -----------------------------------------------
   * Auth Functions
   * ----------------------------------------------- */
  const handleLoginSuccess = (userData: any) => {
    console.log("Login success - received userData:", userData);
    
    // Handle different user data structures
    let processedUserData: User;
    
    if (userData && typeof userData === 'object') {
      // If userData has the expected structure
      if (userData.firstName) {
        processedUserData = {
          id: userData.id || '',
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          phone: userData.phone || '',
          gender: userData.gender,
          dob: userData.dob,
          status: userData.status,
          is_active: userData.is_active,
          profilePicture: userData.profilePicture,
          avatar: userData.avatar,
          preferences: userData.preferences || {
            theme: "light",
            notifications: true
          },
          lastLoginAt: userData.lastLoginAt,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt,
          role: userData.role,
          token: localStorage.getItem('token'),
        };
      } else {
        // If userData doesn't have firstName, create a minimal user object
        processedUserData = {
          id: userData.id || '',
          firstName: userData.name || userData.first_name || 'User',
          lastName: userData.last_name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          token: localStorage.getItem('token'),
        };
      }
    } else {
      // Fallback if userData is invalid
      processedUserData = {
        id: '',
        firstName: 'User',
        lastName: '',
        email: '',
        phone: '',
        token: localStorage.getItem('token'),
      };
    }
    
    setUser(processedUserData);
    localStorage.setItem("user", JSON.stringify(processedUserData));
    setOpenAuthDialog(false);
    setAuthError(null);
    
    // Fetch updated profile after login
    fetchUserProfile();
    
    // Show success toast notification
    toast({
      title: "Login Successful!",
      description: `Welcome back, ${processedUserData.firstName}!`,
      variant: "default",
    });
  };

  const handleSignupSuccess = () => {
    setAuthMode("login");
    setAuthError(null);
    
    // Show success toast notification
    toast({
      title: "Registration Successful!",
      description: "Please login with your credentials.",
      variant: "default",
    });
  };

  const handleAuthError = (error: string) => {
    setAuthError(error);
  };

  const handleLogout = () => {
    // Clear all user-related data from localStorage
    localStorage.removeItem("user");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("token");
    
    // Clear user state
    setUser(null);
    
    // Navigate to home page where login button will be visible
    navigate('/');
    resetToDefaults();
  };

  // Handler functions for profile menu dialogs
  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send feedback to your backend
    console.log('Feedback submitted:', feedbackData);
    toast({
      title: t("profile.feedbackSubmitted"),
      description: t("profile.feedbackThankYou"),
    });
    setOpenFeedbackDialog(false);
    setFeedbackData({ subject: '', message: '', rating: 5 });
  };

  const handleInviteFriends = () => {
    const shareUrl = window.location.origin;
    const shareText = t("profile.inviteMessage", { url: shareUrl });
    
    if (navigator.share) {
      navigator.share({
        title: t("common.appName"),
        text: shareText,
        url: shareUrl,
      });
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(shareText).then(() => {
        toast({
          title: t("profile.linkCopied"),
          description: t("profile.shareLinkCopied"),
        });
      });
    }
    setOpenInviteDialog(false);
  };

  // Edit profile handlers
  const handleEditProfileOpen = () => {
    if (user) {
      setEditProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        profilePicture: user.profilePicture || '',
        gender: user.gender || '',
        dob: user.dob || '',
      });
    }
    setOpenEditProfileDialog(true);
  };


  const handleEditProfileChange = (field: string, value: string) => {
    setEditProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };



  const handleEditProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditProfileLoading(true);
    
    try {
      // Here you would typically send the updated profile data to your backend
      console.log('Profile update data:', editProfileData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local user state
      if (user) {
        const updatedUser = {
          ...user,
          ...editProfileData
        };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
      
      toast({
        title: t("profile.profileUpdated"),
        description: t("profile.profileUpdatedSuccess"),
      });
      
      setOpenEditProfileDialog(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: t("profile.updateError"),
        description: t("profile.updateErrorMsg"),
        variant: "destructive",
      });
    } finally {
      setEditProfileLoading(false);
    }
  };

  /** -----------------------------------------------
   * Fetch News for Category on Hover
   * ----------------------------------------------- */
  const fetchCategoryNews = useCallback(
    async (categoryId: string) => {
      if (categoryNews[categoryId] || !selectedLanguage || !selectedState || !selectedDistrict) {
        console.log(`[Header] Skipping fetch for category ${categoryId}:`, {
          alreadyFetched: !!categoryNews[categoryId],
          hasLanguage: !!selectedLanguage,
          hasState: !!selectedState,
          hasDistrict: !!selectedDistrict
        });
        return;
      }

      console.log(`[Header] Fetching news for category ${categoryId} with:`, {
        language: selectedLanguage.language_name,
        state: selectedState.state_name,
        district: selectedDistrict.name
      });

      setLoadingNews((prev) => ({ ...prev, [categoryId]: true }));

      try {
        const newsData = await getFilteredNews({
          language_id: selectedLanguage.id,
          categoryId,
          state_id: selectedState.id,
          district_id: selectedDistrict.id,
          page: 1,
        });

        const limitedNews = newsData.items?.slice(0, 10) || [];
        console.log(`[Header] Fetched ${limitedNews.length} news items for category ${categoryId}`);

        setCategoryNews((prev) => ({
          ...prev,
          [categoryId]: limitedNews,
        }));

        setScrollPositions((prev) => ({
          ...prev,
          [categoryId]: 0,
        }));
      } catch (error) {
        console.error("Error fetching category news:", error);
        setCategoryNews((prev) => ({ ...prev, [categoryId]: [] }));
      } finally {
        setLoadingNews((prev) => ({ ...prev, [categoryId]: false }));
      }
    },
    [selectedLanguage, selectedState, selectedDistrict, categoryNews]
  );

  /** -----------------------------------------------
   * FIXED: Fetch News for Mobile Category Navigation
   * ----------------------------------------------- */
  const fetchCategoryNewsForMobile = useCallback(
    async (categoryId: string) => {
      if (!selectedLanguage || !selectedState || !selectedDistrict) return [];

      try {
        const newsData = await getFilteredNews({
          language_id: selectedLanguage.id,
          categoryId,
          state_id: selectedState.id,
          district_id: selectedDistrict.id,
          page: 1,
        });

        return newsData.items?.slice(0, 1) || []; // Get just the first news item for mobile navigation
      } catch (error) {
        console.error("Error fetching category news for mobile:", error);
        return [];
      }
    },
    [selectedLanguage, selectedState, selectedDistrict]
  );

  /** ------------------------
   * Filtered list memoization
   * ------------------------ */
  const filteredLanguages = useMemo(() => {
    const q = languageSearch.trim().toLowerCase();
    if (!q) return languages;

    // English language mappings for better search
    const englishMappings: Record<string, string[]> = {
      'telugu': ['తెలుగు', 'te', 'telugu'],
      'hindi': ['हिन्दी', 'hi', 'hindi'],
      'tamil': ['தமிழ்', 'ta', 'tamil'],
      'kannada': ['ಕನ್ನಡ', 'kn', 'kannada'],
      'urdu': ['اردو', 'ur', 'urdu'],
      'english': ['en', 'english', 'inglish']
    };

    return languages.filter((l) => {
      const language_name = l.language_name.toLowerCase();
      const languageCode = l.language_code.toLowerCase();

      // Direct search in language name and code
      if (language_name.includes(q) || languageCode.includes(q)) {
        return true;
      }

      // Search using English mappings
      for (const [englishName, variants] of Object.entries(englishMappings)) {
        if (variants.some(variant => variant.includes(q))) {
          // Check if this language matches any of the variants
          if (variants.some(variant =>
            language_name.includes(variant) ||
            languageCode.includes(variant) ||
            variant.includes(languageCode) ||
            variant.includes(language_name)
          )) {
            return true;
          }
        }
      }

      return false;
    });
  }, [languages, languageSearch]);

  const filteredStates = useMemo(() => {
    const q = stateSearch.trim().toLowerCase();
    if (!q) return states;


    // Comprehensive English to native language mappings
    const englishToNative: Record<string, string[]> = {
      'andhra pradesh': ['ఆంధ్ర ప్రదేశ్', 'आंध्र प्रदेश', 'ஆந்திரப் பிரதேசம்', 'ಆಂಧ್ರ ಪ್ರದೇಶ', 'آندھرا پردیش'],
      'arunachal pradesh': ['అరుణాచల్ ప్రదేశ్', 'अरुणाचल प्रदेश', 'அருணாசல பிரதேசம்', 'ಅರುಣಾಚಲ ಪ್ರದೇಶ', 'اروناچل پردیش'],
      'assam': ['অসম', 'असम', 'அசாம்', 'ಅಸ್ಸಾಂ', 'آسام'],
      'bihar': ['বিহার', 'बिहार', 'பீகார்', 'ಬಿಹಾರ', 'بہار'],
      'chhattisgarh': ['ছত্তিশগড়', 'छत्तीसगढ़', 'சத்தீஸ்கர்', 'ಛತ್ತೀಸ್ಗಢ', 'چھتیس گڑھ'],
      'goa': ['গোয়া', 'गोवा', 'கோவா', 'ಗೋವಾ', 'گوا'],
      'gujarat': ['গুজরাত', 'गुजरात', 'குஜராத்', 'ಗುಜರಾತ', 'گجرات'],
      'haryana': ['হরিয়ানা', 'हरियाणा', 'ஹரியானா', 'ಹರಿಯಾಣ', 'ہریانہ'],
      'himachal pradesh': ['হিমাচল প্রদেশ', 'हिमाचल प्रदेश', 'ஹிமாசல பிரதேசம்', 'ಹಿಮಾಚಲ ಪ್ರದೇಶ', 'ہماچل پردیش'],
      'jammu and kashmir': ['জম্মু ও কাশ্মীর', 'जम्मू और कश्मीर', 'ஜம்மு காஷ்மீர்', 'ಜಮ್ಮು ಕಾಶ್ಮೀರ', 'جموں و کشمیر'],
      'jharkhand': ['ঝাড়খণ্ড', 'झारखंड', 'ஜார்கண்ட்', 'ಝಾರಖಂಡ', 'جھارکھنڈ'],
      'karnataka': ['কর্ণাটক', 'कर्नाटक', 'கர்நாடகா', 'ಕರ್ನಾಟಕ', 'کرناٹک'],
      'kerala': ['কেরালা', 'केरल', 'கேரளா', 'ಕೇರಳ', 'کیرالہ'],
      'madhya pradesh': ['মধ্য প্রদেশ', 'मध्य प्रदेश', 'மத்திய பிரதேசம்', 'ಮಧ್ಯ ಪ್ರದೇಶ', 'مدھیہ پردیش'],
      'maharashtra': ['মহারাষ্ট্র', 'महाराष्ट्र', 'மகாராஷ்டிரா', 'ಮಹಾರಾಷ್ಟ್ರ', 'مہاراشٹر'],
      'manipur': ['মণিপুর', 'मणिपुर', 'மணிப்பூர்', 'ಮಣಿಪುರ', 'منی پور'],
      'meghalaya': ['মেঘালয়া', 'मेघालय', 'மேகாலயா', 'ಮೇಘಾಲಯ', 'میگھالیہ'],
      'mizoram': ['মিজোরাম', 'मिजोरम', 'மிசோரம்', 'ಮಿಜೋರಾಮ', 'میزورم'],
      'nagaland': ['নাগাল্যান্ড', 'नागालैंड', 'நாகாலாந்து', 'ನಾಗಾಲ್ಯಾಂಡ್', 'ناگالینڈ'],
      'odisha': ['ওড়িশা', 'ओडिशा', 'ஒடிசா', 'ಒಡಿಶಾ', 'اوڈیشہ'],
      'punjab': ['পাঞ্জাব', 'पंजाब', 'பஞ்சாப்', 'ಪಂಜಾಬ', 'پنجاب'],
      'rajasthan': ['রাজস্থান', 'राजस्थान', 'ராஜஸ்தான்', 'ರಾಜಸ್ಥಾನ', 'راجستھان'],
      'sikkim': ['সিকিম', 'सिक्किम', 'சிக்கிம்', 'ಸಿಕ್ಕಿಂ', 'سکم'],
      'tamil nadu': ['তামিলনাড়ু', 'तमिलनाडु', 'தமிழ்நாடு', 'ತಮಿಳುನಾಡು', 'تامل ناڈو'],
      'telangana': ['তেলেঙ্গানা', 'तेलंगाना', 'தெலங்காணா', 'ತೆಲಂಗಾಣ', 'تلنگانہ'],
      'tripura': ['ত্রিপুরা', 'त्रिपुरा', 'திரிபுரா', 'ತ್ರಿಪುರ', 'تریپورہ'],
      'uttar pradesh': ['উত্তর প্রদেশ', 'उत्तर प्रदेश', 'உத்தர பிரதேசம்', 'ಉತ್ತರ ಪ್ರದೇಶ', 'اتر پردیش'],
      'uttarakhand': ['উত্তরাখণ্ড', 'उत्तराखंड', 'உத்தராகண்ட்', 'ಉತ್ತರಾಖಂಡ', 'اتراکھنڈ'],
      'west bengal': ['পশ্চিমবঙ্গ', 'पश्चिम बंगाल', 'மேற்கு வங்காளம்', 'ಪಶ್ಚಿಮ ಬಂಗಾಳ', 'مغربی بنگال'],
      'andaman and nicobar islands': ['আন্দামান ও নিকোবর দ্বীপপুঞ্জ', 'अंडमान और निकोबार द्वीप समूह', 'அந்தமான் நிக்கோபார் தீவுகள்', 'ಅಂಡಮಾನ್ ಮತ್ತು ನಿಕೋಬಾರ್ ದ್ವೀಪಗಳು', 'جزائر انڈمان و نکوبار'],
      'chandigarh': ['চণ্ডীগড়', 'चंडीगढ़', 'சண்டிகர்', 'ಚಂಡೀಘರ್', 'چندی گڑھ'],
      'dadra and nagar haveli': ['দাদরা ও নগর হাভেলি', 'दादरा और नगर हवेली', 'தாத்ரா நகர் ஹவேலி', 'ದಾದ್ರಾ ಮತ್ತು ನಾಗರ್ ಹವೇಲಿ', 'دادرا و نگر حویلی'],
      'daman and diu': ['দামান ও দিউ', 'दमन और दीव', 'தாமன் தியு', 'ದಮನ್ ಮತ್ತು ದಿಯು', 'دمن و دیو'],
      'delhi': ['দিল্লি', 'दिल्ली', 'டெல்லி', 'ದೆಹಲಿ', 'دہلی'],
      'lakshadweep': ['লক্ষদ্বীপ', 'लक्षद्वीप', 'லட்சத்தீவு', 'ಲಕ್ಷದ್ವೀಪ', 'لکشادیپ'],
      'puducherry': ['পুদুচেরি', 'पुडुचेरी', 'புதுச்சேரி', 'ಪುದುಚೇರಿ', 'پدوچیری']
    };

    return states.filter((s) => {
      const stateName = s.state_name.toLowerCase();
      const stateCode = s.state_code?.toLowerCase() || '';

      // Direct search in state name and code
      if (stateName.includes(q) || stateCode.includes(q)) {
        return true;
      }

      // Check if search term matches any English state name
      for (const [englishName, nativeNames] of Object.entries(englishToNative)) {
        if (englishName.includes(q)) {
          // Check if this state's name matches any of the native names
          const matchesNative = nativeNames.some(nativeName =>
            stateName.includes(nativeName.toLowerCase())
          );

          if (matchesNative) {
            return true;
          }
        }
      }

      // Check if search term is a direct match for any English name
      for (const [englishName, nativeNames] of Object.entries(englishToNative)) {
        if (q === englishName) {
          const matchesNative = nativeNames.some(nativeName =>
            stateName.includes(nativeName.toLowerCase())
          );

          if (matchesNative) {
            return true;
          }
        }
      }

      // Check common abbreviations
      const abbreviations: Record<string, string[]> = {
        'ap': ['andhra', 'pradesh'],
        'ar': ['arunachal'],
        'as': ['assam'],
        'br': ['bihar'],
        'ct': ['chhattisgarh'],
        'ga': ['goa'],
        'gj': ['gujarat'],
        'hr': ['haryana'],
        'hp': ['himachal'],
        'jk': ['jammu', 'kashmir'],
        'jh': ['jharkhand'],
        'ka': ['karnataka'],
        'kl': ['kerala'],
        'mp': ['madhya', 'pradesh'],
        'mh': ['maharashtra'],
        'mn': ['manipur'],
        'ml': ['meghalaya'],
        'mz': ['mizoram'],
        'nl': ['nagaland'],
        'or': ['odisha'],
        'pb': ['punjab'],
        'rj': ['rajasthan'],
        'sk': ['sikkim'],
        'tn': ['tamil', 'nadu'],
        'tg': ['telangana'],
        'tr': ['tripura'],
        'up': ['uttar', 'pradesh'],
        'uk': ['uttarakhand'],
        'wb': ['west', 'bengal'],
        'an': ['andaman', 'nicobar'],
        'ch': ['chandigarh'],
        'dn': ['dadra', 'nagar', 'haveli'],
        'dd': ['daman', 'diu'],
        'dl': ['delhi'],
        'ld': ['lakshadweep'],
        'py': ['puducherry']
      };

      // Check abbreviations
      for (const [abbr, parts] of Object.entries(abbreviations)) {
        if (abbr === q || parts.some(part => part.includes(q))) {
          const hasMatchingPart = parts.some(part =>
            part.length > 2 && stateName.includes(part.toLowerCase())
          );
          if (hasMatchingPart) {
            return true;
          }
        }
      }

      return false;
    });
  }, [states, stateSearch]);


  const filteredDistricts = useMemo(() => {
    const q = districtSearch.trim().toLowerCase();
    if (!q) return districts;

    return districts.filter((d) => {
      const districtName = d.name.toLowerCase();

      // Direct search in district name
      if (districtName.includes(q)) {
        return true;
      }

      // Simple and effective English to native language mappings
      const englishToNative: Record<string, string> = {
        'hyderabad': 'హైదరాబాద్',
        'hyd': 'హైదరాబాద్',
        'bangalore': 'ಬೆಂಗಳೂರು',
        'bengaluru': 'ಬೆಂಗಳೂರು',
        'blr': 'ಬೆಂಗಳೂರು',
        'chennai': 'சென்னை',
        'madras': 'சென்னை',
        'mumbai': 'मुंबई',
        'bombay': 'मुंबई',
        'delhi': 'दिल्ली',
        'kolkata': 'কলকাতা',
        'calcutta': 'কলকাতা',
        'pune': 'पुणे',
        'ahmedabad': 'અમદાવાદ',
        'visakhapatnam': 'విశాఖపట్నం',
        'vizag': 'విశాఖపట్నం',
        'vijayawada': 'విజయవాడ',
        'guntur': 'గుంటూరు',
        'warangal': 'వరంగల్',
        'nizamabad': 'నిజామాబాద్',
        'karimnagar': 'కరీంనగర్',
        'khammam': 'ఖమ్మం',
        'adilabad': 'ఆదిలాబాద్',
        'mahabubnagar': 'మహబూబ్ నగర్',
        'nalgonda': 'నల్గొండ',
        'rangareddy': 'రంగారెడ్డి',
        'medak': 'మేడక్',
        'suryapet': 'సూర్యపేట',
        'miryalaguda': 'మిర్యాలగూడ',
        'jagtial': 'జగ్త్యాల్',
        'peddapalli': 'పెద్దపల్లి',
        'kamareddy': 'కామారెడ్డి',
        'siddipet': 'సిద్దిపేట',
        'sangareddy': 'సంగారెడ్డి',
        'yadadri': 'యాదాద్రి',
        'jogulamba': 'జోగులాంబ',
        'jangaon': 'జంగావోన్',
        'bhadradri': 'భద్రాద్రి',
        'mulugu': 'ములుగు',
        'jayashankar': 'జయశంకర్',
        'bhupalpally': 'భూపాలపల్లి',
        'mancherial': 'మంచిర్యాల్',
        'asifabad': 'ఆసిఫాబాద్',
        'komaram': 'కోమారం',
        'nirmal': 'నిర్మల్',
        // Additional major districts
        'mysore': 'ಮೈಸೂರು',
        'hubli': 'ಹುಬ್ಬಳ್ಳಿ',
        'coimbatore': 'கோயம்புத்தூர்',
        'kochi': 'कोच्चि',
        'trivandrum': 'तिरुवनंतपुरम',
        'surat': 'सूरत',
        'jaipur': 'जयपुर',
        'jodhpur': 'जोधपुर',
        'amritsar': 'अमृतसर',
        'chandigarh': 'चंडीगढ़',
        'nagpur': 'नागपुर',
        'indore': 'इंदौर',
        'bhopal': 'भोपाल',
        'lucknow': 'लखनऊ',
        'kanpur': 'कानपुर',
        'agra': 'आगरा',
        'varanasi': 'वाराणसी',
        'patna': 'पटना',
        'ranchi': 'रांची',
        'bhubaneswar': 'भुवनेश्वर',
        'cuttack': 'कटक',
        'guwahati': 'गुवाहाटी',
        'shillong': 'शिलांग',
        'aizawl': 'आइजोल',
        'kohima': 'कोहिमा',
        'imphal': 'इंफाल',
        'gangtok': 'गंगटोक',
        'port blair': 'पोर्ट ब्लेयर',
        'kavaratti': 'कवरत्ती',
        'daman': 'दमन',
        'silvassa': 'सिलवासा',
        'pondicherry': 'पुडुचेरी'
      };

      // Check if search term is an English name that maps to this district
      const nativeName = englishToNative[q];
      if (nativeName && districtName.includes(nativeName.toLowerCase())) {
        return true;
      }

      // Check if any English key contains the search term
      for (const [englishKey, nativeValue] of Object.entries(englishToNative)) {
        if (englishKey.includes(q) && districtName.includes(nativeValue.toLowerCase())) {
          return true;
        }
      }

      // Check if search term is a direct match for any English name
      for (const [englishKey, nativeValue] of Object.entries(englishToNative)) {
        if (q === englishKey && districtName.includes(nativeValue.toLowerCase())) {
          return true;
        }
      }

      return false;
    });
  }, [districts, districtSearch]);


  /** ---------------------------
   * Dynamic Navigation Items - Show when categories are available
   * --------------------------- */
  const navItems: NavItem[] = useMemo(() => {
    console.log('[Header] Computing navItems:', {
      categoriesLength: categories.length,
      categories: categories.map(c => c.category_name),
      categoryNewsKeys: Object.keys(categoryNews)
    });
    
    if (categories.length === 0) {
      console.log('[Header] No categories available, returning empty navItems');
      return [];
    }
    
    const items = categories.map((category) => ({
      id: category.id,
      name: category.category_name,
      news: categoryNews[category.id] || [],
    }));
    
    console.log('[Header] Created navItems:', items.map(item => ({ name: item.name, newsCount: item.news.length })));
    return items;
  }, [categories, categoryNews]);

  /** ---------------------------
   * Fetch category news when default selections are loaded
   * --------------------------- */
  useEffect(() => {
    if (selectedLanguage && selectedState && selectedDistrict && categories.length > 0) {
      console.log('[Header] Default selections loaded, fetching category news for all categories');
      // Fetch news for all categories when default selections are available
      categories.forEach(category => {
        if (!categoryNews[category.id]) {
          fetchCategoryNews(category.id);
        }
      });
    } else if (categories.length > 0 && (!selectedLanguage || !selectedState || !selectedDistrict)) {
      console.log('[Header] Categories loaded but selections not ready yet, retrying in 2 seconds...');
      // Retry after a delay if selections are not ready
      const retryTimer = setTimeout(() => {
        if (selectedLanguage && selectedState && selectedDistrict) {
          console.log('[Header] Retry: Default selections now available, fetching category news');
          categories.forEach(category => {
            if (!categoryNews[category.id]) {
              fetchCategoryNews(category.id);
            }
          });
        }
      }, 2000);
      
      return () => clearTimeout(retryTimer);
    }
  }, [selectedLanguage, selectedState, selectedDistrict, categories, fetchCategoryNews, categoryNews]);

  /** ---------------------------
   * Hover handlers
   * --------------------------- */
  const handleMouseEnter = (item: NavItem) => {
    setHoveredItem(item.name);
    if (selectedLanguage && selectedState && selectedDistrict && !categoryNews[item.id]) {
      fetchCategoryNews(item.id);
    }
  };

  const handleMouseLeave = () => setHoveredItem(null);

  /** ---------------------------
   * Category click handler - prevent navigation
   * --------------------------- */
  const handleCategoryClick = (e: React.MouseEvent, item: NavItem) => {
    e.preventDefault();
    // Optional: You can add any custom behavior here when category is clicked
    // For now, we'll just prevent navigation and keep the hover dropdown functionality
  };

  /** ---------------------------
   * FIXED: Mobile navigation handler - now navigates to news
   * --------------------------- */
  const handleMobileNavClick = async (categoryId: string, categoryName: string) => {
    // Close mobile menu first
    setIsMenuOpen(false);

    // Fetch news for this category
    const newsItems = await fetchCategoryNewsForMobile(categoryId);

    // If we have news, navigate to the first news item
    if (newsItems && newsItems.length > 0) {
      navigate(`/news/${newsItems[0].id}`);
    } else {
      // Optional: Show a message or navigate to a category page
      console.log(`No news available for ${categoryName}`);
      // You could navigate to a category listing page here if you have one
      // navigate(`/category/${categoryId}`);
    }
  };

  /** ---------------------------
   * Horizontal scroll handlers
   * --------------------------- */
  const scrollNews = (categoryId: string, direction: "left" | "right") => {
    const container = document.getElementById(`news-scroll-${categoryId}`);
    if (!container) return;

    const scrollAmount = 320;
    const currentScroll = scrollPositions[categoryId] || 0;
    const maxScroll = container.scrollWidth - container.clientWidth;

    let newScroll =
      direction === "left"
        ? Math.max(0, currentScroll - scrollAmount)
        : Math.min(maxScroll, currentScroll + scrollAmount);

    container.scrollTo({ left: newScroll, behavior: "smooth" });
    setScrollPositions((prev) => ({ ...prev, [categoryId]: newScroll }));
  };

  /** ---------------------------
   * News page handlers
   * --------------------------- */
  const openNewsPage = (news: NewsItem) => {
    setHoveredItem(null); // Close dropdown
    navigate(`/news/${news.id}`);
  };

  /** ---------------------------
   * UPDATED: Home button handler - resets to defaults and navigates to home
   * --------------------------- */
  const handleHomeClick = async () => {
    console.log('[Header] Home button clicked - resetting to defaults');
    
    // Close any open dropdowns
    setHoveredItem(null);
    setIsMenuOpen(false);

    // Immediately change i18n language to English for instant UI update
    const englishCode = 'en';
    console.log('[Header] Immediately changing i18n language to English');
    i18n.changeLanguage(englishCode);
    document.dir = getLanguageDirection(englishCode);
    
    // Navigate to home
    navigate('/');

    // Reset to default selections
    await resetToDefaults();
    
    console.log('[Header] Home button reset completed - UI should now show English');
  };

  /** ---------------------------
   * Wizard helper + search reset
   * --------------------------- */
  const goToStep = (step: Step) => {
    setCurrentStep(step);
    if (step === 1) setLanguageSearch("");
    else if (step === 2) setStateSearch("");
    else if (step === 3) setDistrictSearch("");
  };

  const handleOpenChange = (open: boolean) => {
    setOpenDialog(open);
    if (open) {
      // Reset to appropriate step based on current selections
      if (!selectedLanguage) {
        goToStep(1);
      } else if (!selectedState) {
        goToStep(2);
      } else if (!selectedDistrict) {
        goToStep(3);
      } else {
        goToStep(1); // All selected, start from language
      }
    }
  };

  const handleAuthOpenChange = (open: boolean) => {
    setOpenAuthDialog(open);
    // Don't clear error when dialog closes - let user see the error
    // Error will be cleared when user tries again or switches modes
  };

  /** --------------------
   * FIXED: Proper sequential selection flow with localStorage persistence
   * -------------------- */
  const handleLanguageSelect = async (language: Language) => {
    console.log('[Header] Language selected:', language.language_name);
    setLanguage(language);
    
    const normalizedCode = normalizeLanguageCode(language.language_code);
    if (i18n.hasResourceBundle(normalizedCode, "translation")) {
      i18n.changeLanguage(normalizedCode);
      document.dir = getLanguageDirection(normalizedCode);
    }

    // Clear dependent selections (context will handle data fetching)
    setState(null as any); // Clear state selection
    setDistrict(null as any); // Clear district selection
    setCategoryNews({});

    // Auto-move to next step after selection
    setTimeout(() => {
      if (openDialog) {
        setCurrentStep(2);
        setStateSearch("");
      }
    }, 300);
  };

  const handleStateSelect = async (state: State) => {
    console.log('[Header] State selected:', state.state_name);
    setState(state);

    // Clear dependent selections (context will handle data fetching)
    setDistrict(null as any); // Clear district selection
    setCategoryNews({});

    // Auto-move to next step after selection
    setTimeout(() => {
      if (openDialog) {
        setCurrentStep(3);
        setDistrictSearch("");
      }
    }, 300);
  };

  const handleDistrictSelect = (district: District) => {
    console.log('[Header] District selected:', district.name);
    setDistrict(district);

    // Clear category news cache when location changes
    setCategoryNews({});
  };

  const handleBack = (targetStep: Step) => {
    goToStep(targetStep);
  };

  const handleFinish = () => {
    if (!selectedDistrict || !selectedLanguage) return;

    const normalizedCode = normalizeLanguageCode(selectedLanguage.language_code);
    if (i18n.hasResourceBundle(normalizedCode, "translation")) {
      i18n.changeLanguage(normalizedCode);
    }

    setOpenDialog(false);
    setTimeout(() => setCurrentStep(1), 300);
  };

  /** -----------------------
   * Step content components
   * ----------------------- */
  const StepHeader = ({
    title,
    subtitle,
  }: {
    title: string;
    subtitle?: string;
  }) => (
    <div className="mb-4">
      <DialogHeader>
        <DialogTitle className="text-xl">{title}</DialogTitle>
      </DialogHeader>
      {subtitle ? (
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      ) : null}
    </div>
  );

  const StepFooter = ({
    showBack,
    onBack,
    onNext,
    nextLabel,
    nextDisabled,
    showNext = true,
  }: {
    showBack?: boolean;
    onBack?: () => void;
    onNext?: () => void;
    nextLabel?: string;
    nextDisabled?: boolean;
    showNext?: boolean;
  }) => (
    <div className="mt-5 flex items-center justify-between">
      <div>
        {showBack ? (
          <Button variant="outline" onClick={onBack}>
            {t("common.back")}
          </Button>
        ) : (
          <span />
        )}
      </div>
      {showNext && onNext && (
        <Button
          onClick={onNext}
          disabled={!!nextDisabled}
          className="bg-red-500 hover:bg-red-600 text-white"
        >
          {nextLabel}
        </Button>
      )}
    </div>
  );

  const renderStep1 = () => (
    <>
      <StepHeader
        title={t("wizard.selectLanguage")}
        subtitle={t("wizard.chooseLanguageSubtitle")}
      />

      <Input
        placeholder={t("common.searchLanguage")}
        value={languageSearch}
        onChange={(e) => setLanguageSearch(e.target.value)}
        className="mb-4"
      />

      <div className="max-h-[60vh] overflow-y-auto pr-1">
        {loadingLanguages ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
            <p className="mt-2">{t("common.loadingLanguages")}</p>
          </div>
        ) : filteredLanguages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">{t("common.noLanguagesFound")}</p>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 md:max-h-96">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filteredLanguages.map((lang) => (
            <label
              key={lang.id}
              className={`border rounded-lg cursor-pointer relative overflow-hidden shadow transition-all block hover:shadow-md ${selectedLanguage?.id === lang.id
                ? "border-red-500 ring-2 ring-red-200 bg-red-50 dark:bg-red-900/20 dark:ring-red-400"
                : "border-gray-300 dark:border-gray-600 hover:border-red-300 dark:hover:border-red-400"
                }`}
              onClick={() => handleLanguageSelect(lang)}
            >
              <input
                type="radio"
                name="language"
                value={lang.id}
                checked={selectedLanguage?.id === lang.id}
                onChange={() => handleLanguageSelect(lang)}
                className="absolute top-2 left-2 h-4 w-4 accent-red-500 cursor-pointer"
              />
                  <div className="flex items-center justify-center mb-2 pt-6">
                {typeof lang.icon === "string" && lang.icon.length <= 4 ? (
                      <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-lg md:text-xl border-2 border-white shadow-lg">
                    {lang.icon}
                  </div>
                ) : (
                  <img
                    src={lang.icon || "/placeholder.svg"}
                    alt={lang.language_name}
  className="w-20 h-20 md:w-24 md:h-20 rounded-full object-cover border-2 border-white shadow-md"
                  />

                )}
              </div>
                  <div className="p-2 text-center">
                    <div className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">{lang.language_name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{lang.language_code.toUpperCase()}</div>
              </div>
            </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-300">
        <p>{t("wizard.step1Instructions")}</p>
      </div>
    </>
  );

  const renderStep2 = () => (
    <>
      <StepHeader
        title={t("wizard.selectState")}
        subtitle={t("wizard.languageStateSubtitle", {
          language: selectedLanguage?.language_name || t("common.none")
        })}
      />
      <Input
        placeholder={t("common.searchState")}
        value={stateSearch}
        onChange={(e) => setStateSearch(e.target.value)}
        className="mb-4"
      />
      <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-1">
        {loadingStates ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
            <p className="mt-2">{t("common.loadingStates")}</p>
          </div>
        ) : filteredStates.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">{t("common.noStatesFound")}</p>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 md:max-h-96 space-y-2">
            {filteredStates.map((state) => (
            <Button
              key={state.id}
              onClick={() => handleStateSelect(state)}
              variant={selectedState?.id === state.id ? "default" : "outline"}
              className={`w-full justify-start transition-all ${selectedState?.id === state.id
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-400"
                }`}
            >
              {state.state_name}
            </Button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-300">
        <p>{t("wizard.step2Instructions")}</p>
      </div>

      <StepFooter
        showBack
        onBack={() => handleBack(1)}
        showNext={false}
      />
    </>
  );

  const renderStep3 = () => (
    <>
      <StepHeader
        title={t("wizard.selectDistrict")}
        subtitle={t("wizard.finalStepSubtitle", {
          language: selectedLanguage?.language_name || t("common.none"),
          state: selectedState?.state_name || t("common.none")
        })}
      />
      <Input
        placeholder={t("common.searchDistrict")}
        value={districtSearch}
        onChange={(e) => setDistrictSearch(e.target.value)}
        className="mb-4"
      />
      <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-1">
        {loadingDistricts ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
            <p className="mt-2">{t("common.loadingDistricts")}</p>
          </div>
        ) : filteredDistricts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">{t("common.noDistrictsFound")}</p>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 md:max-h-96 space-y-2">
            {filteredDistricts.map((district) => (
            <Button
              key={district.id}
              onClick={() => handleDistrictSelect(district)}
              variant={selectedDistrict?.id === district.id ? "default" : "outline"}
              className={`w-full justify-start transition-all ${selectedDistrict?.id === district.id
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-400"
                }`}
            >
              {district.name}
            </Button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-300">
        <p>{t("wizard.step3Instructions")}</p>
      </div>

      <StepFooter
        showBack
        onBack={() => handleBack(2)}
        onNext={handleFinish}
        nextLabel={t("common.save")}
        nextDisabled={!selectedDistrict}
      />
    </>
  );

  const renderCurrentStep = () => {
    if (currentStep === 1) return renderStep1();
    if (currentStep === 2) return renderStep2();
    return renderStep3();
  };

  // DynamicDataContext handles loading states

  return (
    <>
      <header className="bg-white dark:bg-gray-800 shadow-lg sticky top-0 z-50 font-mandali">
        {/* Top Categories Section - Show when categories are available and all selections are complete */}
        {categories.length > 0 && selectedLanguage && selectedState && selectedDistrict && (
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 border-b border-blue-700">
            <div className="container mx-auto px-4">
              <nav className="hidden md:flex items-center py-3 overflow-x-auto scrollbar-hide p-16">
                <div className="flex items-center space-x-8 min-w-max">
                  {/* Home Button - Always first */}
                  <div className="flex-shrink-0">
                    <button
                      onClick={handleHomeClick}
                      className="flex items-center gap-1 text-white text-large hover:text-red-500 transition-colors"
                    >
                      <Home className="h-4 w-4" />
                      {t("navigation.home")}
                    </button>
                  </div>


                  {/* Show all categories with scroll */}
                  {navItems.map((item) => (
                    <div
                      key={item.id}
                      className="relative group flex-shrink-0"
                      onMouseEnter={() => handleMouseEnter(item)}
                      onMouseLeave={handleMouseLeave}
                    >
                      <button
                        onClick={(e) => handleCategoryClick(e, item)}
                        className="flex items-center gap-1 text-white text-large hover:text-red-500 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        {item.name}
                        <ChevronDown className="h-4 w-4" />
                      </button>

                      {/* Dynamic Hover Dropdown with Horizontal Scroll */}
                      {hoveredItem === item.name && (
                        <div className="fixed left-0 top-10 w-screen bg-white dark:bg-gray-800 shadow-lg border-t border-gray-200 dark:border-gray-700 z-50">
                          {loadingNews[item.id] ? (
                            <div className="p-8 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-500"></div>
                                <div className="text-gray-500 dark:text-gray-400">{t("news.loadingNews")}</div>
                              </div>
                            </div>
                          ) : item.news.length > 0 ? (
                            <div className="relative p-4">
                              {/* Left scroll button */}
                              <button
                                onClick={() => scrollNews(item.id, 'left')}
                                className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-white dark:bg-gray-700 shadow-lg rounded-full p-2 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                disabled={(scrollPositions[item.id] || 0) <= 0}
                              >
                                <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                              </button>

                              {/* Scrollable news container */}
                              <div
                                id={`news-scroll-${item.id}`}
                                className="flex gap-4 overflow-x-hidden scroll-smooth px-12"
                                style={{ scrollBehavior: 'smooth' }}
                              >
                                {item.news.map((news, idx) => (
                                  <div
                                    key={news.id || idx}
                                    className="flex-shrink-0 w-80 relative group overflow-hidden rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                                    onClick={() => openNewsPage(news)}
                                  >
                                    {news.media?.[0]?.mediaUrl ? (
                                      <img
                                        src={news.media[0].mediaUrl}
                                        alt={news.title}
                                        className="w-full h-48 object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                                        <span className="text-gray-400">{t("news.noImage")}</span>
                                      </div>
                                    )}
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white p-4">
                                      <div className="font-semibold line-clamp-2 mb-2">{news.title}</div>
                                      <div className="flex items-center gap-4 text-xs opacity-90">
                                        {news.authorName && (
                                          <div className="flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            <span>{t("news.by")} {news.authorName}</span>
                                          </div>
                                        )}
                                        {news.publishedAt && (
                                          <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            <span>{formatTimeAgo(news.publishedAt, { t })}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Right scroll button */}
                              <button
                                onClick={() => scrollNews(item.id, 'right')}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-white dark:bg-gray-700 shadow-lg rounded-full p-2 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                              >
                                <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                              </button>
                            </div>
                          ) : (
                            <div className="p-8 text-center">
                              <div className="text-gray-500 dark:text-gray-400">
                                {!selectedLanguage || !selectedState || !selectedDistrict 
                                  ? "Loading default selections..." 
                                  : t("news.noNewsAvailable")
                                }
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </nav>
            </div>
          </div>
        )}

        {/* Main Header Section with Logo and Controls */}
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20 sm:h-20 md:h-20 lg:h-20">
            {/* Logo - Left side with increased size on mobile */}
            <div className="flex items-center">
              <div
                className="cursor-pointer flex items-center"
                onClick={() => {
                  navigate('/');
                  resetToDefaults();
                }}
              >
                <img
                  src="/lovable-uploads/3b336ab1-e951-42a8-b0c4-758eed877e6a.png"
                  alt={t("common.logoAlt")}
                  className="h-20 w-auto sm:h-16 md:h-20 lg:h-32 p-1 max-w-[200px] sm:max-w-[250px] md:max-w-[300px] lg:max-w-[350px]"
                />
              </div>
            </div>


            {/* Right Side Controls */}
            <div className="flex items-center space-x-3">
              {/* Language/Location Selector */}
              <Dialog open={openDialog} onOpenChange={handleOpenChange}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-1 hover:bg-red-50 hover:border-red-300 transition-colors"
                    data-dialog-trigger
                  >
                    <Globe className="h-4 w-4" />
                    <span className="sm:hidden text-xs">
                      {selectedLanguage && selectedState && selectedDistrict 
                        ? `${(selectedLanguage.language_name || '').substring(0, 2)}-${(selectedState.state_name || '').substring(0, 2)}-${(selectedDistrict.name || '').substring(0, 2)}`
                        : selectedLanguage 
                          ? (selectedLanguage.language_name || '').substring(0, 3) + "..."
                          : t("common.select")
                      }
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-center gap-3 text-xs mb-3">
                    <button
                      onClick={() => setCurrentStep(1)}
                      className={`px-3 py-1 rounded-full transition-all duration-200 hover:scale-105 cursor-pointer ${
                        currentStep === 1 
                          ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-medium shadow-md" 
                          : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {t("common.language")}
                    </button>
                    <ArrowRight className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                    <button
                      onClick={() => setCurrentStep(2)}
                      disabled={!selectedLanguage}
                      className={`px-3 py-1 rounded-full transition-all duration-200 hover:scale-105 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                        currentStep === 2 
                          ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-medium shadow-md" 
                          : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {t("common.state")}
                    </button>
                    <ArrowRight className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                    <button
                      onClick={() => setCurrentStep(3)}
                      disabled={!selectedState}
                      className={`px-3 py-1 rounded-full transition-all duration-200 hover:scale-105 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                        currentStep === 3 
                          ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-medium shadow-md" 
                          : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {t("common.district")}
                    </button>
                  </div>
                  <div className="pb-4">{renderCurrentStep()}</div>
                </DialogContent>
              </Dialog>

              {/* User Profile or Login Button - Show one or the other */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-white bg-transparent dark:bg-gray-800 dark:border dark:border-gray-600 rounded-lg">
                      {user.profilePicture ? (
                        <img
                          src={user.profilePicture}
                          alt={`${user.firstName} ${user.lastName}`}
                          className="w-8 h-8 rounded-full object-cover border border-red-500"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white font-semibold text-sm">
                          {user.firstName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="hidden md:inline text-sm text-gray-900 dark:text-white font-medium" style={{ color: isDarkMode ? 'white' : '#111827' }}>
                        {t("profile.hello")}, {user.firstName}
                      </span>
                      {/* <ChevronDown className="h-4 w-4" /> */}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <DropdownMenuLabel className="text-gray-900 dark:text-white">{t("profile.myAccount")}</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-600" />
                    <Dialog>
                      <DialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                          <User className="mr-2 h-4 w-4" />
                          <span>{t("profile.viewProfile")}</span>
                        </DropdownMenuItem>
                      </DialogTrigger>
                      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                        <DialogHeader>
                          <DialogTitle className="text-center text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{t("profile.profileDetails")}</DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col items-center space-y-3 sm:space-y-4 py-2 sm:py-3">
                          {/* Logo */}
                          <div className="flex justify-center">
                            <img
                              src="/lovable-uploads/3b336ab1-e951-42a8-b0c4-758eed877e6a.png"
                              alt={t("common.logoAlt")}
                              className="h-16 w-auto"
                            />
                          </div>

                          {/* User Details */}
                          <div className="w-full space-y-2">
                            <div className="text-center">
                              {user.profilePicture ? (
                                <img
                                  src={user.profilePicture}
                                  alt={`${user.firstName} ${user.lastName}`}
                                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover mx-auto mb-2 border-2 border-red-500"
                                />
                              ) : (
                                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-sm sm:text-lg mx-auto mb-2">
                                  {user.firstName.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>

                            <div className="space-y-1 sm:space-y-2">
                              <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                                <label className="text-xs font-medium text-gray-600 dark:text-gray-300 dark:text-gray-400 uppercase tracking-wide block mb-1">{t("profile.fullName")}</label>
                                <div className="text-sm font-medium text-gray-900 dark:text-white break-words">
                                  {user.firstName} {user.lastName}
                                </div>
                              </div>

                              <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                                <label className="text-xs font-medium text-gray-600 dark:text-gray-300 dark:text-gray-400 uppercase tracking-wide block mb-1">{t("profile.email")}</label>
                                <div className="text-sm font-medium text-gray-900 dark:text-white break-all">
                                  {user.email}
                                </div>
                              </div>

                              <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                                <label className="text-xs font-medium text-gray-600 dark:text-gray-300 dark:text-gray-400 uppercase tracking-wide block mb-1">{t("profile.phone")}</label>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {user.phone || "Not provided"}
                                </div>
                              </div>

                              {user.gender && (
                                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                                  <label className="text-xs font-medium text-gray-600 dark:text-gray-300 dark:text-gray-400 uppercase tracking-wide block mb-1">Gender</label>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {user.gender}
                                  </div>
                                </div>
                              )}

                              {user.dob && (
                                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                                  <label className="text-xs font-medium text-gray-600 dark:text-gray-300 dark:text-gray-400 uppercase tracking-wide block mb-1">Date of Birth</label>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {new Date(user.dob).toLocaleDateString()}
                                  </div>
                                </div>
                              )}

                              {user.status && (
                                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                                  <label className="text-xs font-medium text-gray-600 dark:text-gray-300 dark:text-gray-400 uppercase tracking-wide block mb-1">Status</label>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                      user.status === 'active' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {user.status}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {user.role && (
                                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                                  <label className="text-xs font-medium text-gray-600 dark:text-gray-300 dark:text-gray-400 uppercase tracking-wide block mb-1">Role</label>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {user.role.role}
                                  </div>
                                </div>
                              )}

                              {user.gender && (
                                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                                  <label className="text-xs font-medium text-gray-600 dark:text-gray-300 dark:text-gray-400 uppercase tracking-wide block mb-1">Gender</label>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {user.gender}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-2 mt-3">
                              <Button
                                onClick={handleEditProfileOpen}
                                className="w-full h-9 text-sm bg-blue-500 hover:bg-blue-600 text-white"
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                {t("profile.editProfile")}
                              </Button>
                              
                              <Button
                                onClick={handleLogout}
                                variant="destructive"
                                className="w-full h-9 text-sm"
                              >
                                <LogOut className="mr-2 h-4 w-4" />
                                {t("profile.logout")}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    {/* Edit Profile Dialog */}
                    <Dialog open={openEditProfileDialog} onOpenChange={setOpenEditProfileDialog}>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                        <DialogHeader>
                          <DialogTitle className="text-center text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                            {t("profile.editProfile")}
                          </DialogTitle>
                        </DialogHeader>
                        
                        <form onSubmit={handleEditProfileSubmit} className="space-y-6 py-4">
                          {/* Profile Picture Section */}
                          <div className="flex flex-col items-center space-y-4">
                            <div className="relative">
                              {editProfileData.profilePicture ? (
                                <img
                                  src={editProfileData.profilePicture}
                                  alt="Profile"
                                  className="w-20 h-20 rounded-full object-cover border-2 border-red-500"
                                />
                              ) : (
                                <div className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-2xl">
                                  {editProfileData.firstName.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            {/* <div className="text-center">
                              <Label htmlFor="profilePicture" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t("profile.profilePicture")}
                              </Label>
                              <Input
                                id="profilePicture"
                                type="url"
                                value={editProfileData.profilePicture}
                                onChange={(e) => handleEditProfileChange('profilePicture', e.target.value)}
                                placeholder="https://example.com/profile.jpg"
                                className="mt-1"
                              />
                            </div> */}
                          </div>

                          {/* Form Fields */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* First Name */}
                            <div>
                              <Label htmlFor="firstName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t("profile.firstName")} *
                              </Label>
                              <Input
                                id="firstName"
                                type="text"
                                value={editProfileData.firstName}
                                onChange={(e) => handleEditProfileChange('firstName', e.target.value)}
                                required
                                className="mt-1"
                              />
                            </div>

                            {/* Last Name */}
                            <div>
                              <Label htmlFor="lastName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t("profile.lastName")} *
                              </Label>
                              <Input
                                id="lastName"
                                type="text"
                                value={editProfileData.lastName}
                                onChange={(e) => handleEditProfileChange('lastName', e.target.value)}
                                required
                                className="mt-1"
                              />
                            </div>

                            {/* Phone */}
                            <div>
                              <Label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t("profile.phone")}
                              </Label>
                              <Input
                                id="phone"
                                type="tel"
                                value={editProfileData.phone}
                                onChange={(e) => handleEditProfileChange('phone', e.target.value)}
                                placeholder="7842407671"
                                className="mt-1"
                              />
                            </div>

                            {/* Gender */}
                            <div>
                              <Label htmlFor="gender" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t("profile.gender")}
                              </Label>
                              <Select
                                value={editProfileData.gender}
                                onValueChange={(value) => handleEditProfileChange('gender', value)}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder={t("profile.selectGender")} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Male">{t("profile.male")}</SelectItem>
                                  <SelectItem value="Female">{t("profile.female")}</SelectItem>
                                  <SelectItem value="Other">{t("profile.other")}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Date of Birth */}
                            <div className="md:col-span-2">
                              <Label htmlFor="dob" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t("profile.dateOfBirth")}
                              </Label>
                              <Input
                                id="dob"
                                type="date"
                                value={editProfileData.dob}
                                onChange={(e) => handleEditProfileChange('dob', e.target.value)}
                                className="mt-1"
                              />
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setOpenEditProfileDialog(false)}
                              className="flex-1"
                              disabled={editProfileLoading}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              {t("common.cancel")}
                            </Button>
                            <Button
                              type="submit"
                              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                              disabled={editProfileLoading}
                            >
                              {editProfileLoading ? (
                                <>
                                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                  {t("profile.updating")}
                                </>
                              ) : (
                                <>
                                  <Save className="mr-2 h-4 w-4" />
                                  {t("profile.saveChanges")}
                                </>
                              )}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                    
                    {/* Settings Dialog */}
                    <Dialog open={openSettingsDialog} onOpenChange={setOpenSettingsDialog}>
                      <DialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>{t("profile.settings")}</span>
                        </DropdownMenuItem>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                        <DialogHeader className="text-center pb-4">
                          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mb-3">
                            <Settings className="w-6 h-6 text-white" />
                          </div>
                          <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white" style={{ color: isDarkMode ? 'white' : undefined }}>{t("profile.settings")}</DialogTitle>
                          <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400 mt-1">Manage your account preferences</p>
                        </DialogHeader>
                        
                        <div className="space-y-6 py-2">
                          {/* Notifications Section */}
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                            <div className="flex items-center mb-3">
                              <Bell className="w-5 h-5 text-red-500 mr-2" />
                              <h3 className="font-semibold text-gray-900 dark:text-white" style={{ color: isDarkMode ? 'white' : undefined }}>{t("profile.notifications")}</h3>
                            </div>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-red-300 transition-colors">
                                <div className="flex items-center">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("profile.emailNotifications")}</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input type="checkbox" className="sr-only peer" defaultChecked />
                                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                                </label>
                              </div>
                              <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-red-300 transition-colors">
                                <div className="flex items-center">
                                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("profile.pushNotifications")}</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input type="checkbox" className="sr-only peer" defaultChecked />
                                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                                </label>
                              </div>
                            </div>
                          </div>
                          
                          {/* Privacy Section */}
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                            <div className="flex items-center mb-3">
                              <Shield className="w-5 h-5 text-red-500 mr-2" />
                              <h3 className="font-semibold text-gray-900 dark:text-white" style={{ color: isDarkMode ? 'white' : undefined }}>{t("profile.privacy")}</h3>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-red-300 transition-colors">
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("profile.makeProfilePublic")}</span>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                              </label>
                            </div>
                          </div>
                          
                          {/* Theme Section */}
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                            <div className="flex items-center mb-3">
                              <Moon className="w-5 h-5 text-red-500 mr-2" />
                              <h3 className="font-semibold text-gray-900 dark:text-white" style={{ color: isDarkMode ? 'white' : undefined }}>{t("profile.theme")}</h3>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-red-300 transition-colors">
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {isDarkMode ? t("profile.darkMode") : t("profile.lightMode")}
                                </span>
                              </div>
                              <button
                                onClick={toggleTheme}
                                className="flex items-center justify-center w-11 h-6 bg-gray-200 dark:bg-gray-600 rounded-full transition-colors hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                              >
                                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                                  isDarkMode ? 'translate-x-2.5' : '-translate-x-2.5'
                                }`} />
                              </button>
                            </div>
                          </div>
                          
                        </div>
                        
                        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <Button 
                            variant="outline" 
                            className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800" 
                            onClick={() => setOpenSettingsDialog(false)}
                          >
                            {t("profile.cancel")}
                          </Button>
                          <Button 
                            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white" 
                            onClick={() => setOpenSettingsDialog(false)}
                          >
                            {t("profile.saveSettings")}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    {/* Privacy Policy Dialog */}
                    <Dialog open={openPrivacyDialog} onOpenChange={setOpenPrivacyDialog}>
                      <DialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                          <Shield className="mr-2 h-4 w-4" />
                          <span>{t("profile.privacyPolicy")}</span>
                        </DropdownMenuItem>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                        <DialogHeader className="text-center pb-6">
                          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-4">
                            <Shield className="w-8 h-8 text-white" />
                          </div>
                          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">{t("profile.privacyPolicy")}</DialogTitle>
                          <div className="flex items-center justify-center mt-2">
                            <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500 dark:text-gray-400 mr-2" />
                            <span className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">{t("profile.lastUpdated")}: {new Date().toLocaleDateString()}</span>
                          </div>
                        </DialogHeader>
                        
                        <div className="space-y-6 py-2">
                          {/* Introduction */}
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
                            <div className="text-center mb-4">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Marokurukshetram News Privacy Policy</h3>
                              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
                                Please read this Privacy Policy very carefully. It contains important information about Your rights and obligations. This Privacy Policy sets out the manner in which Marokurukshetram News Private Limited ("Marokurukshetram News", "We", "Us", "Our") collects, uses, maintains, and discloses information collected from the users of our mobile application (hereinafter referred to as "You", "Your", "User").
                              </p>
                              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm mt-2">
                                By downloading, installing, or using the Marokurukshetram News App (hereinafter referred to as "App"), You consent to the use of Your personal information as outlined in this Privacy Policy.
                              </p>
                            </div>
                          </div>

                          {/* Information Collected */}
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-100 dark:border-green-800">
                            <div className="flex items-start mb-4">
                              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                                <span className="text-white font-bold text-sm">1</span>
                              </div>
                              <div>
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Information Collected from the User</h4>
                                
                                <div className="space-y-4">
                                  <div>
                                    <h5 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">1.1 Technological Data</h5>
                                    <ul className="text-gray-700 dark:text-gray-300 text-sm space-y-1 ml-4">
                                      <li>• IP Address</li>
                                      <li>• Location (only with Your permission)</li>
                                      <li>• Device Camera</li>
                                      <li>• Device Storage</li>
                                      <li>• Device Information and interaction activity with the App</li>
                                    </ul>
                                    <p className="text-gray-700 dark:text-gray-300 text-sm mt-2">
                                      The App requires access to device storage to save offline news, images, and videos. Location access helps us serve localized news. The camera may be used for features like Citizen Journalism submissions.
                                    </p>
                                  </div>

                                  <div>
                                    <h5 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">1.2 Personally Identifiable Information (PII) & Non-PII</h5>
                                    <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">We may collect:</p>
                                    <ul className="text-gray-700 dark:text-gray-300 text-sm space-y-1 ml-4">
                                      <li>• Email ID</li>
                                      <li>• Mobile Number</li>
                                      <li>• Advertiser ID</li>
                                    </ul>
                                    <p className="text-gray-700 dark:text-gray-300 text-sm mt-2">
                                      These are collected only in specific circumstances: Comments Section, Citizen Journalism, and Advertising purposes. All PII and non-PII data is securely routed through our private domains: https://v1.marokurukshetram.com and https://v2.marokurukshetram.com
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Use of Information */}
                          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-100 dark:border-purple-800">
                            <div className="flex items-start mb-4">
                              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                                <span className="text-white font-bold text-sm">2</span>
                              </div>
                              <div>
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Use of Collected Information</h4>
                                <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">Your information may be used to:</p>
                                <ul className="text-gray-700 dark:text-gray-300 text-sm space-y-1 ml-4">
                                  <li>• Enable login and authenticate Your access</li>
                                  <li>• Personalize Your news and app experience</li>
                                  <li>• Send important updates, administrative emails, and policy changes</li>
                                  <li>• Respond to inquiries, feedback, or support requests</li>
                                  <li>• Send promotional updates (with an option to unsubscribe)</li>
                                  <li>• Prevent fraudulent activity or violations of our Terms & Conditions</li>
                                </ul>
                              </div>
                            </div>
                          </div>

                          {/* Data Protection */}
                          <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-6 border border-orange-100 dark:border-orange-800">
                            <div className="flex items-start mb-4">
                              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                                <span className="text-white font-bold text-sm">3</span>
                              </div>
                              <div>
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Data Protection</h4>
                                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                                  We adopt appropriate technical and organizational measures to safeguard Your information against unauthorized access, alteration, or disclosure. Data is encrypted and securely stored in our databases. However, no system is 100% secure. Users are encouraged to safeguard their devices and login credentials.
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Sharing Information */}
                          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-xl p-6 border border-teal-100 dark:border-teal-800">
                            <div className="flex items-start mb-4">
                              <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                                <span className="text-white font-bold text-sm">4</span>
                              </div>
                              <div>
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Sharing of Personal Information</h4>
                                <ul className="text-gray-700 dark:text-gray-300 text-sm space-y-1 ml-4">
                                  <li>• We do not sell or trade Your information</li>
                                  <li>• Aggregated demographic information (non-identifiable) may be shared with trusted affiliates, advertisers, or partners</li>
                                  <li>• Information may be disclosed if required by law, national security, or legal processes</li>
                                  <li>• In case of merger, acquisition, or sale of assets, user information may be transferred to the new entity</li>
                                </ul>
                              </div>
                            </div>
                          </div>

                          {/* User Choices */}
                          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-indigo-100 dark:border-indigo-800">
                            <div className="flex items-start mb-4">
                              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                                <span className="text-white font-bold text-sm">5</span>
                              </div>
                              <div>
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">User Choices</h4>
                                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                                  You may opt-out of promotional emails at any time by following the unsubscribe instructions provided in the email. You may still receive essential communications (account, security, or legal updates).
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Advertisements */}
                          <div className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-xl p-6 border border-pink-100 dark:border-pink-800">
                            <div className="flex items-start mb-4">
                              <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                                <span className="text-white font-bold text-sm">6</span>
                              </div>
                              <div>
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">User Privacy & Advertisements</h4>
                                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                                  The App displays advertisements sourced from multiple networks. Some ads may be personalized. Users are advised to verify authenticity of products/services before making purchases. We disclaim responsibility for issues arising from third-party advertisements, websites, or apps accessed through the App.
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Policy Changes */}
                          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-xl p-6 border border-yellow-100 dark:border-yellow-800">
                            <div className="flex items-start mb-4">
                              <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                                <span className="text-white font-bold text-sm">7</span>
                              </div>
                              <div>
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Changes to this Policy</h4>
                                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                                  Marokurukshetram News may revise this Privacy Policy from time to time. The updated version will always be available at: https://marokurukshetram.com/privacy_policy.html. Continued use of the App after updates implies Your acceptance of the revised policy.
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Acceptance */}
                          <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 rounded-xl p-6 border border-gray-100 dark:border-gray-800">
                            <div className="flex items-start mb-4">
                              <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                                <span className="text-white font-bold text-sm">8</span>
                              </div>
                              <div>
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Acceptance of Policy</h4>
                                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                                  By using this App, You confirm Your acceptance of this Privacy Policy. If You do not agree, please discontinue using the App.
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Contact Us */}
                          <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl p-6 border border-emerald-100 dark:border-emerald-800">
                            <div className="flex items-start mb-4">
                              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                                <MessageSquare className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Contact Us</h4>
                                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                                  For any queries regarding this Privacy Policy or App practices, please contact:
                                </p>
                                <p className="text-gray-700 dark:text-gray-300 text-sm mt-2 font-medium">
                                  © Marokurukshetram News Private Limited.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-center pt-6 border-t border-gray-200 dark:border-gray-700">
                          <Button 
                            className="px-8 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700" 
                            onClick={() => setOpenPrivacyDialog(false)}
                          >
                            {t("profile.close")}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    {/* Terms and Conditions Dialog */}
                    <Dialog open={openTermsDialog} onOpenChange={setOpenTermsDialog}>
                      <DialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                          <FileText className="mr-2 h-4 w-4" />
                          <span>{t("profile.termsConditions")}</span>
                        </DropdownMenuItem>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                        <DialogHeader className="text-center pb-6">
                          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-white" />
                          </div>
                          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">{t("profile.termsConditions")}</DialogTitle>
                          <div className="flex items-center justify-center mt-2">
                            <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500 dark:text-gray-400 mr-2" />
                            <span className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">{t("profile.lastUpdated")}: {new Date().toLocaleDateString()}</span>
                          </div>
                        </DialogHeader>
                        
                        <div className="space-y-6 py-2">
                          {/* Acceptance of Terms */}
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-100 dark:border-green-800">
                            <div className="flex items-start mb-4">
                              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                                <span className="text-white font-bold text-sm">1</span>
                              </div>
                              <div>
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t("profile.acceptanceOfTerms")}</h4>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                  {t("profile.termsInfo1")}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {/* User Obligations */}
                          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
                            <div className="flex items-start mb-4">
                              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                                <span className="text-white font-bold text-sm">2</span>
                              </div>
                              <div>
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t("profile.userObligations")}</h4>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                  {t("profile.termsInfo2")}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Prohibited Uses */}
                          <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-red-100 dark:border-red-800">
                            <div className="flex items-start mb-4">
                              <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                                <span className="text-white font-bold text-sm">3</span>
                              </div>
                              <div>
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t("profile.prohibitedUses")}</h4>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                  {t("profile.termsInfo3")}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Liability */}
                          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-purple-100 dark:border-purple-800">
                            <div className="flex items-start mb-4">
                              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                                <Shield className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t("profile.liability")}</h4>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                  {t("profile.termsInfo4")}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-center pt-6 border-t border-gray-200 dark:border-gray-700">
                          <Button 
                            className="px-8 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700" 
                            onClick={() => setOpenTermsDialog(false)}
                          >
                            {t("profile.close")}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    {/* Feedback Dialog */}
                    <Dialog open={openFeedbackDialog} onOpenChange={setOpenFeedbackDialog}>
                      <DialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                          <MessageSquare className="mr-2 h-4 w-4" />
                          <span>{t("profile.feedback")}</span>
                        </DropdownMenuItem>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                        <DialogHeader className="text-center pb-6">
                          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mb-4">
                            <MessageSquare className="w-8 h-8 text-white" />
                          </div>
                          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">{t("profile.feedback")}</DialogTitle>
                          <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400 mt-2">Help us improve by sharing your thoughts</p>
                        </DialogHeader>
                        
                        <form onSubmit={handleFeedbackSubmit} className="space-y-6 py-2">
                          {/* Subject Field */}
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                              <FileText className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                              {t("profile.subject")}
                            </label>
                            <Input
                              type="text"
                              value={feedbackData.subject}
                              onChange={(e) => setFeedbackData({...feedbackData, subject: e.target.value})}
                              placeholder={t("profile.feedbackSubjectPlaceholder")}
                              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              required
                            />
                          </div>
                          
                          {/* Rating Section */}
                          <div className="space-y-3">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                              <span className="text-yellow-500 mr-2">★</span>
                              {t("profile.rating")}
                            </label>
                            <div className="flex justify-center space-x-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setFeedbackData({...feedbackData, rating: star})}
                                  className={`text-3xl transition-all duration-200 hover:scale-110 ${
                                    star <= feedbackData.rating 
                                      ? 'text-yellow-400 drop-shadow-sm' 
                                      : 'text-gray-300 hover:text-yellow-200'
                                  }`}
                                >
                                  ★
                                </button>
                              ))}
                            </div>
                            <div className="text-center">
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {feedbackData.rating === 1 && "Poor"}
                                {feedbackData.rating === 2 && "Fair"}
                                {feedbackData.rating === 3 && "Good"}
                                {feedbackData.rating === 4 && "Very Good"}
                                {feedbackData.rating === 5 && "Excellent"}
                              </span>
                            </div>
                          </div>
                          
                          {/* Message Field */}
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                              <MessageSquare className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                              {t("profile.message")}
                            </label>
                            <textarea
                              value={feedbackData.message}
                              onChange={(e) => setFeedbackData({...feedbackData, message: e.target.value})}
                              placeholder={t("profile.feedbackMessagePlaceholder")}
                              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-white h-32 resize-none"
                              required
                            />
                            <div className="text-right">
                              <span className="text-xs text-gray-400">
                                {feedbackData.message.length}/500 characters
                              </span>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex gap-3 pt-4 border-t border-gray-200">
                            <Button 
                              type="button" 
                              variant="outline" 
                              className="flex-1" 
                              onClick={() => setOpenFeedbackDialog(false)}
                            >
                              {t("profile.cancel")}
                            </Button>
                            <Button 
                              type="submit" 
                              className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                            >
                              {t("profile.submitFeedback")}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                    
                    {/* Invite Friends Dialog */}
                    <Dialog open={openInviteDialog} onOpenChange={setOpenInviteDialog}>
                      <DialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                          <UserPlus className="mr-2 h-4 w-4" />
                          <span>{t("profile.inviteFriends")}</span>
                        </DropdownMenuItem>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                        <DialogHeader className="text-center pb-6">
                          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center mb-4 relative">
                            <UserPlus className="w-10 h-10 text-white" />
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-white">+</span>
                            </div>
                          </div>
                          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">{t("profile.inviteFriends")}</DialogTitle>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{t("profile.inviteDescription")}</p>
                        </DialogHeader>
                        
                        <div className="space-y-6 py-2">
                          {/* Share Options */}
                          <div className="space-y-4">
                            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                              <Button 
                                onClick={handleInviteFriends} 
                                className="w-full h-14 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-lg"
                              >
                                <MessageSquare className="mr-3 h-5 w-5" />
                                {t("profile.shareViaMessage")}
                              </Button>
                              <p className="text-xs text-blue-600 text-center mt-2">Share via WhatsApp, SMS, or other messaging apps</p>
                            </div>
                            
                            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                              <Button 
                                onClick={handleInviteFriends} 
                                variant="outline" 
                                className="w-full h-14 border-2 border-green-500 text-green-600 hover:bg-green-50 font-semibold text-lg"
                              >
                                <FileText className="mr-3 h-5 w-5" />
                                {t("profile.copyLink")}
                              </Button>
                              <p className="text-xs text-green-600 text-center mt-2">Copy link to share anywhere</p>
                            </div>
                          </div>
                          
                          {/* Benefits Section */}
                          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                            <h4 className="font-semibold text-gray-900 mb-3 text-center">Why invite friends?</h4>
                            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                                <span>Stay connected with your network</span>
                              </div>
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-pink-500 rounded-full mr-3"></div>
                                <span>Get the latest news together</span>
                              </div>
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div>
                                <span>Share important updates</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Note */}
                          <div className="text-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 rounded-lg p-3">
                              {t("profile.inviteNote")}
                            </p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-600" />
                    
                    <DropdownMenuItem onClick={handleLogout} className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>{t("profile.logout")}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Dialog open={openAuthDialog} onOpenChange={handleAuthOpenChange}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white transition-colors">
                      {t("auth.login")}
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-center">
                        {authMode === "login" ? t("auth.login") : t("auth.signup")}
                      </DialogTitle>
                    </DialogHeader>

                    {authError && (
                      <div className="p-3 text-red-500 text-sm bg-red-50 border border-red-200 rounded-md mb-4">
                        {authError}
                      </div>
                    )}

                    <div className="pb-4">
                      {authMode === "login" ? (
                        <Login
                          onSuccess={handleLoginSuccess}
                          onSwitchToSignup={() => {
                            setAuthMode("signup");
                            setAuthError(null);
                          }}
                          onError={handleAuthError}
                          onClearError={() => setAuthError(null)}
                        />
                      ) : (
                        <Signup
                          onSuccess={handleSignupSuccess}
                          onSwitchToLogin={() => {
                            setAuthMode("login");
                            setAuthError(null);
                          }}
                          onError={handleAuthError}
                          onClearError={() => setAuthError(null)}
                        />
                      )}
                    </div>

                  </DialogContent>
                </Dialog>
              )}

              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="relative z-50 p-2 hover:bg-gray-50 transition-colors"
                >
                  {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Menu Overlay */}
          {isMenuOpen && (
            <div className="md:hidden fixed top-16 left-0 right-0 bg-white dark:bg-gray-800 shadow-lg border-t border-gray-200 dark:border-gray-700 z-50 max-h-[calc(100vh-4rem)] overflow-y-auto">
              <div className="p-4 space-y-4">
                {/* Mobile Step Indicator */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between text-xs gap-2 sm:gap-0">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        selectedLanguage 
                          ? "bg-green-500 text-white" 
                          : "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400"
                      }`}>
                        1
                      </div>
                      <span className={`text-xs ${selectedLanguage ? "text-green-600 dark:text-green-400 font-medium" : "text-gray-500 dark:text-gray-400"}`}>
                        {selectedLanguage ? selectedLanguage.language_name.substring(0, 8) + "..." : t("common.language")}
                      </span>
                    </div>
                    <ArrowRight className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        selectedState 
                          ? "bg-green-500 text-white" 
                          : "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400"
                      }`}>
                        2
                      </div>
                      <span className={`text-xs ${selectedState ? "text-green-600 dark:text-green-400 font-medium" : "text-gray-500 dark:text-gray-400"}`}>
                        {selectedState ? selectedState.state_name.substring(0, 8) + "..." : t("common.state")}
                      </span>
                    </div>
                    <ArrowRight className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        selectedDistrict 
                          ? "bg-green-500 text-white" 
                          : "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400"
                      }`}>
                        3
                      </div>
                      <span className={`text-xs ${selectedDistrict ? "text-green-600 dark:text-green-400 font-medium" : "text-gray-500 dark:text-gray-400"}`}>
                        {selectedDistrict ? selectedDistrict.name.substring(0, 8) + "..." : t("common.district")}
                      </span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>{selectedLanguage && selectedState && selectedDistrict ? "100%" : selectedLanguage && selectedState ? "66%" : selectedLanguage ? "33%" : "0%"}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-red-500 to-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ 
                          width: selectedLanguage && selectedState && selectedDistrict ? "100%" : selectedLanguage && selectedState ? "66%" : selectedLanguage ? "33%" : "0%" 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Click to change button */}
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      // Open the language selection dialog
                      const dialogTrigger = document.querySelector('[data-dialog-trigger]') as HTMLButtonElement;
                      if (dialogTrigger) dialogTrigger.click();
                    }}
                    className="w-full mt-3 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                  >
                    {t("common.clickToChange") || "Click to change selection"}
                  </button>
                </div>

                {/* Mobile Login/Signup Section */}
                {!user && (
                  <div className="border-b pb-4 mb-4">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Account</h3>
                    <div className="space-y-2">
                      <Button
                        onClick={() => {
                          setIsMenuOpen(false);
                          setOpenAuthDialog(true);
                          setAuthMode("login");
                        }}
                        className="w-full justify-start text-sm hover:bg-red-50 hover:text-red-600 transition-colors"
                        variant="ghost"
                      >
                        <User className="mr-2 h-4 w-4" />
                        {t("auth.login") || "Login"}
                      </Button>
                      <Button
                        onClick={() => {
                          setIsMenuOpen(false);
                          setOpenAuthDialog(true);
                          setAuthMode("signup");
                        }}
                        className="w-full justify-start text-sm hover:bg-red-50 hover:text-red-600 transition-colors"
                        variant="ghost"
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        {t("auth.signup") || "Sign Up"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Mobile Categories - Show when categories are available and all selections complete */}
                {categories.length > 0 && selectedLanguage && selectedState && selectedDistrict && (
                  <>
                    <div className="border-b pb-4 mb-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">{t("navigation.categories")}</h3>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {/* Mobile Home Button */}
                        <Button
                          variant="ghost"
                          onClick={() => {
                            handleHomeClick();
                            setIsMenuOpen(false);
                          }}
                          className="w-full justify-start text-sm hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <Home className="mr-2 h-4 w-4" />
                          {t("navigation.home")}
                        </Button>


                        {/* All categories in mobile with scroll */}
                        {navItems.map((item) => (
                          <Button
                            key={item.id}
                            variant="ghost"
                            onClick={() => handleMobileNavClick(item.id, item.name)}
                            className="w-full justify-start text-sm hover:bg-red-50 hover:text-red-600 transition-colors"
                          >
                            {item.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Mobile Language/Location Selector */}
                <div className={`space-y-3 ${categories.length > 0 ? 'pt-4 border-t' : ''}`}>
                  <Dialog open={openDialog} onOpenChange={handleOpenChange}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full flex items-center justify-center gap-2 hover:bg-red-50 hover:border-red-300 transition-colors">
                        <Globe className="h-4 w-4" />
                        {selectedLanguage && selectedState && selectedDistrict
                          ? `${selectedLanguage.language_name}, ${selectedState.state_name}, ${selectedDistrict.name}`
                          : t("common.selectLocation")
                        }
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>

                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <div className="flex items-center justify-center gap-3 text-xs mb-3">
                        <div className={`px-2 py-1 rounded ${currentStep === 1 ? "bg-red-100 text-red-700" : "bg-muted"}`}>
                          {t("common.language")}
                        </div>
                        <div>›</div>
                        <div className={`px-2 py-1 rounded ${currentStep === 2 ? "bg-red-100 text-red-700" : "bg-muted"}`}>
                          {t("common.state")}
                        </div>
                        <div>›</div>
                        <div className={`px-2 py-1 rounded ${currentStep === 3 ? "bg-red-100 text-red-700" : "bg-muted"}`}>
                          {t("common.district")}
                        </div>
                      </div>
                      <div className="pb-4">{renderCurrentStep()}</div>
                    </DialogContent>
                  </Dialog>

                  {/* Mobile Auth - Show login or profile based on user status */}
                  {user ? (
                    <div className="w-full">
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg mb-2">
                        {user.profilePicture ? (
                          <img
                            src={user.profilePicture}
                            alt={`${user.firstName} ${user.lastName}`}
                            className="w-8 h-8 rounded-full object-cover border border-red-500"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white font-semibold text-sm">
                            {user.firstName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {t("profile.hello")}, {user.firstName}
                          </div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                          {user.phone && (
                            <div className="text-xs text-gray-500">{user.phone}</div>
                          )}
                        </div>
                      </div>
                      <Button 
                        onClick={handleLogout}
                        variant="outline" 
                        className="w-full"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        {t("profile.logout")}
                      </Button>
                    </div>
                  ) : (
                    <Dialog open={openAuthDialog} onOpenChange={handleAuthOpenChange}>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-red-500 hover:bg-red-600 text-white">
                          {t("auth.login")}
                        </Button>
                      </DialogTrigger>

                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-center">
                            {authMode === "login" ? t("auth.login") : t("auth.signup")}
                          </DialogTitle>
                        </DialogHeader>

                        {authError && (
                          <div className="p-3 text-red-500 text-sm bg-red-50 border border-red-200 rounded-md mb-4">
                            {authError}
                          </div>
                        )}

                        <div className="pb-4">
                          {authMode === "login" ? (
                            <Login
                              onSuccess={handleLoginSuccess}
                              onSwitchToSignup={() => {
                                setAuthMode("signup");
                                setAuthError(null);
                              }}
                              onError={handleAuthError}
                              onClearError={() => setAuthError(null)}
                            />
                          ) : (
                            <Signup
                              onSuccess={handleSignupSuccess}
                              onSwitchToLogin={() => {
                                setAuthMode("login");
                                setAuthError(null);
                              }}
                              onError={handleAuthError}
                              onClearError={() => setAuthError(null)}
                            />
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
};

export default Header;