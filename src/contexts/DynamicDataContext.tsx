import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  fetchAndCacheData, 
  getCategoryIdsByType, 
  Language, 
  State, 
  District, 
  Category 
} from '../utils/dynamicDataUtils';

interface DynamicDataContextType {
  // Data arrays
  languages: Language[];
  states: State[];
  districts: District[];
  categories: Category[];
  
  // Selected values
  selectedLanguage: Language | null;
  selectedState: State | null;
  selectedDistrict: District | null;
  selectedCategories: Category[];
  
  // Loading states
  loadingLanguages: boolean;
  loadingStates: boolean;
  loadingDistricts: boolean;
  loadingCategories: boolean;
  
  // Error states
  errorLanguages: string | null;
  errorStates: string | null;
  errorDistricts: string | null;
  errorCategories: string | null;
  
  // Setters
  setLanguage: (language: Language | null) => void;
  setState: (state: State | null) => void;
  setDistrict: (district: District | null) => void;
  setSelectedCategories: (categories: Category[]) => void;
  
  // Utility functions
  getCurrentLanguageId: () => string | null;
  getCurrentStateId: () => string | null;
  getCurrentDistrictId: () => string | null;
  getCurrentCategoryIds: () => string[];
  getCategoryIdsByType: (type: string) => string[];
  
  // Refresh functions
  refreshLanguages: () => void;
  refreshStates: () => void;
  refreshDistricts: () => void;
  refreshCategories: () => void;
}

const DynamicDataContext = createContext<DynamicDataContextType | undefined>(undefined);

export const useDynamicData = () => {
  const context = useContext(DynamicDataContext);
  if (context === undefined) {
    throw new Error('useDynamicData must be used within a DynamicDataProvider');
  }
  return context;
};

interface DynamicDataProviderProps {
  children: ReactNode;
}

export const DynamicDataProvider: React.FC<DynamicDataProviderProps> = ({ children }) => {
  // Global state for selections (managed by Header component)
  const [selectedLanguage, setSelectedLanguage] = React.useState<Language | null>(null);
  const [selectedState, setSelectedState] = React.useState<State | null>(null);
  const [selectedDistrict, setSelectedDistrict] = React.useState<District | null>(null);
  const [selectedCategories, setSelectedCategories] = React.useState<Category[]>([]);

  // Languages query
  const {
    data: languages = [],
    isLoading: loadingLanguages,
    error: errorLanguages,
    refetch: refreshLanguages
  } = useQuery({
    queryKey: ['languages'],
    queryFn: () => fetchAndCacheData<Language>('/api/languages', {}, 'languages'),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    cacheTime: 24 * 60 * 60 * 1000, // 24 hours
  });

  // States query - depends on selectedLanguage
  const {
    data: states = [],
    isLoading: loadingStates,
    error: errorStates,
    refetch: refreshStates
  } = useQuery({
    queryKey: ['states', selectedLanguage?.id],
    queryFn: () => fetchAndCacheData<State>('/api/states', { language_id: selectedLanguage?.id }, 'states'),
    enabled: !!selectedLanguage?.id,
    staleTime: 24 * 60 * 60 * 1000,
    cacheTime: 24 * 60 * 60 * 1000,
  });

  // Districts query - depends on selectedState
  const {
    data: districts = [],
    isLoading: loadingDistricts,
    error: errorDistricts,
    refetch: refreshDistricts
  } = useQuery({
    queryKey: ['districts', selectedState?.id],
    queryFn: () => fetchAndCacheData<District>('/api/districts', { state_id: selectedState?.id }, 'districts'),
    enabled: !!selectedState?.id,
    staleTime: 24 * 60 * 60 * 1000,
    cacheTime: 24 * 60 * 60 * 1000,
  });

  // Categories query - depends on selectedLanguage
  const {
    data: categories = [],
    isLoading: loadingCategories,
    error: errorCategories,
    refetch: refreshCategories
  } = useQuery({
    queryKey: ['categories', selectedLanguage?.id],
    queryFn: () => fetchAndCacheData<Category>('/api/categories', { language_id: selectedLanguage?.id }, 'categories'),
    enabled: !!selectedLanguage?.id,
    staleTime: 24 * 60 * 60 * 1000,
    cacheTime: 24 * 60 * 60 * 1000,
  });

  // Load saved selections from session storage on mount
  React.useEffect(() => {
    const savedLanguage = sessionStorage.getItem('selectedLanguage');
    const savedState = sessionStorage.getItem('selectedState');
    const savedDistrict = sessionStorage.getItem('selectedDistrict');
    const savedCategories = sessionStorage.getItem('selectedCategories');

    if (savedLanguage) {
      try {
        const parsed = JSON.parse(savedLanguage);
        setSelectedLanguage(parsed);
        console.log('[DynamicData] Loaded saved language:', parsed.language_name);
      } catch (error) {
        console.error('Error parsing saved language:', error);
      }
    }

    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setSelectedState(parsed);
        console.log('[DynamicData] Loaded saved state:', parsed.state_name);
      } catch (error) {
        console.error('Error parsing saved state:', error);
      }
    }

    if (savedDistrict) {
      try {
        const parsed = JSON.parse(savedDistrict);
        setSelectedDistrict(parsed);
        console.log('[DynamicData] Loaded saved district:', parsed.name);
      } catch (error) {
        console.error('Error parsing saved district:', error);
      }
    }

    if (savedCategories) {
      try {
        const parsed = JSON.parse(savedCategories);
        setSelectedCategories(parsed);
        console.log('[DynamicData] Loaded saved categories:', parsed.length);
      } catch (error) {
        console.error('Error parsing saved categories:', error);
      }
    }
  }, []);

  // Initialize with default language on first load if no saved selection
  React.useEffect(() => {
    if (languages.length > 0 && !selectedLanguage) {
      console.log('[DynamicData] Available languages:', languages.map(l => l.language_name));
      // Try to find English first, fallback to first available
      const defaultLang = languages.find(lang => 
        lang.language_name.toLowerCase().includes('english') || 
        lang.language_code.toLowerCase() === 'en'
      ) || languages[0];
      
      if (defaultLang) {
        setSelectedLanguage(defaultLang);
        console.log('[DynamicData] Auto-selected default language:', defaultLang.language_name, 'ID:', defaultLang.id);
      }
    }
  }, [languages, selectedLanguage]);

  // Initialize with default state (Telangana) when language is selected
  React.useEffect(() => {
    if (states.length > 0 && !selectedState && selectedLanguage) {
      console.log('[DynamicData] Available states:', states.map(s => s.state_name));
      const defaultState = states.find(state => 
        state.state_name.toLowerCase().includes('telangana') || 
        state.state_name.toLowerCase().includes('telangana')
      ) || states[0];
      
      if (defaultState) {
        setSelectedState(defaultState);
        console.log('[DynamicData] Auto-selected default state:', defaultState.state_name, 'ID:', defaultState.id);
      }
    }
  }, [states, selectedLanguage, selectedState]);

  // Initialize with default district (Hyderabad) when state is selected
  React.useEffect(() => {
    if (districts.length > 0 && !selectedDistrict && selectedState) {
      console.log('[DynamicData] Available districts:', districts.map(d => d.name));
      const defaultDistrict = districts.find(district => 
        district.name.toLowerCase().includes('hyderabad') || 
        district.name.toLowerCase().includes('hyderabad')
      ) || districts[0];
      
      if (defaultDistrict) {
        setSelectedDistrict(defaultDistrict);
        console.log('[DynamicData] Auto-selected default district:', defaultDistrict.name, 'ID:', defaultDistrict.id);
      }
    }
  }, [districts, selectedState, selectedDistrict]);

  // Save selections to session storage when they change
  React.useEffect(() => {
    if (selectedLanguage) {
      sessionStorage.setItem('selectedLanguage', JSON.stringify(selectedLanguage));
    }
  }, [selectedLanguage]);

  React.useEffect(() => {
    if (selectedState) {
      sessionStorage.setItem('selectedState', JSON.stringify(selectedState));
    }
  }, [selectedState]);

  React.useEffect(() => {
    if (selectedDistrict) {
      sessionStorage.setItem('selectedDistrict', JSON.stringify(selectedDistrict));
    }
  }, [selectedDistrict]);

  React.useEffect(() => {
    if (selectedCategories.length > 0) {
      sessionStorage.setItem('selectedCategories', JSON.stringify(selectedCategories));
    }
  }, [selectedCategories]);

  // Utility functions
  const getCurrentLanguageId = () => selectedLanguage?.id || null;
  const getCurrentStateId = () => selectedState?.id || null;
  const getCurrentDistrictId = () => selectedDistrict?.id || null;
  const getCurrentCategoryIds = () => selectedCategories.map(cat => cat.id);
  const getCategoryIdsByTypeHelper = (type: string) => getCategoryIdsByType(categories, type);

  // Context value
  const contextValue: DynamicDataContextType = {
    // Data arrays
    languages,
    states,
    districts,
    categories,
    
    // Selected values
    selectedLanguage,
    selectedState,
    selectedDistrict,
    selectedCategories,
    
    // Loading states
    loadingLanguages,
    loadingStates,
    loadingDistricts,
    loadingCategories,
    
    // Error states
    errorLanguages: errorLanguages?.message || null,
    errorStates: errorStates?.message || null,
    errorDistricts: errorDistricts?.message || null,
    errorCategories: errorCategories?.message || null,
    
    // Setters
    setLanguage: setSelectedLanguage,
    setState: setSelectedState,
    setDistrict: setSelectedDistrict,
    setSelectedCategories,
    
    // Utility functions
    getCurrentLanguageId,
    getCurrentStateId,
    getCurrentDistrictId,
    getCurrentCategoryIds,
    getCategoryIdsByType: getCategoryIdsByTypeHelper,
    
    // Refresh functions
    refreshLanguages,
    refreshStates,
    refreshDistricts,
    refreshCategories,
  };

  return (
    <DynamicDataContext.Provider value={contextValue}>
      {children}
    </DynamicDataContext.Provider>
  );
};