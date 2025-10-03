import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshCw, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

import { getLocalMandis, getLocalMandiCategories } from "../api/Localmandi";
import {
  LocalMandiItem,
  LocalMandiCategory,
  LocalMandiCategoriesResponse,
  State,
  Language,
} from "../api/apiTypes";
import getStates from "../api/States";
import getDistricts, { District } from "../api/Districts";
import { useDynamicData } from "../contexts/DynamicDataContext";

// Utility type for dropdown filtering
type Option = { id: string; name: string };

// Utility
function uniqueBy<T extends Option>(arr: T[], key: keyof T): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of arr) {
    const k = String(item[key]);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(item);
    }
  }
  return out;
}

// Trend helpers
function getTrendColor(trend: string) {
  if (trend === "up") return "bg-green-100 text-green-700";
  if (trend === "down") return "bg-red-100 text-red-700";
  return "bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300";
}
function getTrendBgColor(trend: string) {
  if (trend === "up") return "bg-green-50";
  if (trend === "down") return "bg-red-50";
  return "";
}
function getTrendIcon(trend: string) {
  if (trend === "up") return <TrendingUp className="w-4 h-4" />;
  if (trend === "down") return <TrendingDown className="w-4 h-4" />;
  return <Minus className="w-4 h-4" />;
}

export default function LocalMandi() {
  const { t } = useTranslation();
  
  // Get dynamic data from context
  const {
    selectedLanguage,
    selectedState,
    selectedDistrict,
    states,
    districts,
    getCurrentLanguageId,
    getCurrentStateId,
    getCurrentDistrictId,
    setState,
  } = useDynamicData();

  const [mandiItems, setMandiItems] = useState<LocalMandiItem[]>([]);
  const [categories, setCategories] = useState<LocalMandiCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [state_id, setstate_id] = useState<string>("");
  const [district_id, setdistrict_id] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");

  const [showTable, setShowTable] = useState(false);

  // Debug logging for dynamic data
  useEffect(() => {
    console.log('[LocalMandi] Dynamic data state:', {
      selectedLanguage: selectedLanguage?.language_name,
      selectedState: selectedState?.state_name,
      selectedDistrict: selectedDistrict?.name,
      statesCount: states?.length || 0,
      districtsCount: districts?.length || 0,
      currentStateId: state_id,
      currentDistrictId: district_id,
      currentCategoryId: categoryId
    });
  }, [selectedLanguage, selectedState, selectedDistrict, states, districts, state_id, district_id, categoryId]);

  // Manual selection mode - no automatic loading
  // User must manually select state, district, and category, then click "Get Market Data"
  
  // Auto-load categories when language is selected
  useEffect(() => {
    if (selectedLanguage && categories.length === 0) {
      console.log('[LocalMandi] Auto-loading categories for language:', selectedLanguage.language_name);
      fetchCategoriesForLanguage();
    }
  }, [selectedLanguage, categories.length]);

  // Manual district fetching when state is selected
  const fetchDistrictsForState = async (stateId: string) => {
    if (!stateId || !states) return;
    
    console.log('[LocalMandi] Manually fetching districts for state:', stateId);
    
    // Find the selected state and update context to trigger district fetching
    const stateToSelect = states.find(s => s.id === stateId);
    if (stateToSelect) {
      console.log('[LocalMandi] Updating context selectedState to fetch districts:', stateToSelect.state_name);
      setState(stateToSelect);
    }
  };

  // Manual category fetching when language is selected
  const fetchCategoriesForLanguage = async () => {
    if (!selectedLanguage) return;
    
    console.log('[LocalMandi] Manually fetching categories for language:', selectedLanguage.language_name);
    
    try {
      const catRes: LocalMandiCategoriesResponse = await getLocalMandiCategories(selectedLanguage.id);
      console.log('[LocalMandi] Categories loaded:', catRes.result.categories?.length || 0);
      setCategories(catRes.result.categories || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setCategories([]);
    }
  };

  // Fetch With Filters (only if all selected)
  const fetchFiltered = async (page: number = 1) => {
    if (!state_id || !district_id || !categoryId) {
      console.log('[LocalMandi] Missing required parameters:', { state_id, district_id, categoryId });
      return; // 🚫 Stop if filters not selected
    }

    const language_id = getCurrentLanguageId();
    if (!language_id) {
      console.log('[LocalMandi] No language_id available');
      return;
    }

    console.log('[LocalMandi] Fetching mandi data with params:', {
      page,
      limit: pagination.limit,
      categoryId,
      state_id,
      district_id,
      language_id
    });

    setLoading(true);
    try {
      const res = await getLocalMandis({
        page,
        limit: pagination.limit,
        categoryId,
        state_id,
        district_id,
        language_id, // Add language_id parameter
      });
      
      console.log('[LocalMandi] API response:', res);
      
      if (res.status === 1) {
        setMandiItems(res.result.items);
        setPagination(res.result.pagination);
        setShowTable(true); // ✅ Show table only after fetching data
        console.log('[LocalMandi] Successfully loaded mandi items:', res.result.items.length);
        
        if (res.result.items.length === 0) {
          console.log('[LocalMandi] No mandi items found for the selected filters');
        }
      } else {
        console.error("API Error:", res.message);
        setMandiItems([]);
        setShowTable(false);
      }
    } catch (err) {
      console.error("Error fetching filtered data:", err);
      setMandiItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Options
  const stateOptions = useMemo(() => {
    const options = (states || []).map((s) => ({ id: s.id, name: s.state_name }));
    console.log('[LocalMandi] State options:', options);
    return options;
  }, [states]);
  
  const districtOptions = useMemo(() => {
    console.log('[LocalMandi] Computing district options:', {
      totalDistricts: districts?.length || 0,
      state_id,
      selectedStateId: selectedState?.id,
      allDistricts: districts?.map(d => ({ id: d.id, name: d.name, state_id: d.state_id })) || []
    });
    
    const filtered = (districts || []).filter((d) => (state_id ? d.state_id === state_id : true));
    const options = filtered.map((d) => ({ id: d.id, name: d.name }));
    console.log('[LocalMandi] District options for state_id:', state_id, options);
    return options;
  }, [districts, state_id, selectedState]);
  
  const categoryOptions = useMemo(() => {
    const options = (categories || []).map((c) => ({ id: c.id, name: c.categoryName }));
    console.log('[LocalMandi] Category options:', options);
    return options;
  }, [categories]);

  // Table Data
  const filteredData = useMemo(
    () =>
      (mandiItems || []).map((item) => ({
        name: item.name,
        icon: item.itemIcon ? "🧺" : "🍀",
        district: item.districtName,
        minPrice: `₹${item.minPrice}`,
        maxPrice: `₹${item.maxPrice}`,
        modalPrice: `₹${item.avgPrice}`,
        trend: Math.random() > 0.5 ? "up" : "down",
        change: `${Math.floor(Math.random() * 10)}%`,
        unit: item.unit || "N/A",
        quality: item.quality || "N/A",
        description: item.description || "",
        categoryName: item.categoryName || "N/A",
      })),
    [mandiItems]
  );

  const filtersSelected = state_id && district_id && categoryId;

  // Show message if no language is selected
  if (!selectedLanguage) {
    return (
      <div className="p-4 space-y-6">
        <div className="text-center py-8">
          <h1 className="text-3xl font-bold mb-4">{t("localMandi.title")}</h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Please select a language from the header to view local mandi data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-2">
        <h1 className="text-3xl font-bold">{t("localMandi.title")}</h1>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => fetchFiltered(1)} disabled={!filtersSelected}>
            <RefreshCw className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">{t("localMandi.filterTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* State */}
            <Select value={state_id} onValueChange={(v) => {
              console.log('[LocalMandi] State selected:', v);
              setstate_id(v);
              // Clear district and category selections when state changes
              setdistrict_id("");
              setCategoryId("");
              setMandiItems([]);
              setShowTable(false);
              // Manually fetch districts for the selected state
              fetchDistrictsForState(v);
            }}>
              <SelectTrigger>
                <SelectValue placeholder={t("localMandi.selectState")} />
              </SelectTrigger>
              <SelectContent>
                {stateOptions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* District */}
            <Select value={district_id} onValueChange={(v) => {
              console.log('[LocalMandi] District selected:', v);
              setdistrict_id(v);
              // Clear category selection when district changes
              setCategoryId("");
              setMandiItems([]);
              setShowTable(false);
            }} disabled={!state_id}>
              <SelectTrigger>
                <SelectValue placeholder={
                  !state_id 
                    ? "Select State first" 
                    : districtOptions.length === 0 
                      ? "Loading districts..." 
                      : t("localMandi.selectDistrict")
                } />
              </SelectTrigger>
              <SelectContent>
                {districtOptions.length > 0 && districtOptions.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Category */}
            <Select value={categoryId} onValueChange={(v) => {
              console.log('[LocalMandi] Category selected:', v);
              setCategoryId(v);
              // Clear data when category changes
              setMandiItems([]);
              setShowTable(false);
            }} disabled={!district_id || categories.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder={
                  !district_id 
                    ? "Select District first" 
                    : categories.length === 0 
                      ? "Loading categories..." 
                      : t("localMandi.selectCategory")
                } />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.length > 0 && categoryOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-center">
            <Button onClick={() => fetchFiltered(1)} disabled={!filtersSelected || loading}>
              {loading ? t("localMandi.loadingMarketData") : t("localMandi.getMarketData")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Show Table only after data fetch */}
      {showTable && (
        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <CardTitle className="text-xl font-bold text-center">
              {t("localMandi.tableTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-700 border-b-2 border-gray-200 dark:border-gray-600">
                  <TableHead className="text-center font-bold text-gray-800 dark:text-white py-4 min-w-[120px]">
                    {t("localMandi.tableHeaders.commodity")}
                  </TableHead>
                  <TableHead className="text-center font-bold text-gray-800 dark:text-white min-w-[100px]">
                    {t("localMandi.tableHeaders.mandi")}
                  </TableHead>
                  <TableHead className="text-center font-bold text-gray-800 dark:text-white min-w-[80px]">
                    {t("localMandi.tableHeaders.minPrice")}
                  </TableHead>
                  <TableHead className="text-center font-bold text-gray-800 dark:text-white min-w-[80px]">
                    {t("localMandi.tableHeaders.maxPrice")}
                  </TableHead>
                  <TableHead className="text-center font-bold text-gray-800 dark:text-white min-w-[80px]">
                    {t("localMandi.tableHeaders.modalPrice")}
                  </TableHead>
                  <TableHead className="text-center font-bold text-gray-800 dark:text-white min-w-[60px]">
                    Unit
                  </TableHead>
                  <TableHead className="text-center font-bold text-gray-800 dark:text-white min-w-[80px]">
                    Quality
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length > 0 ? (
                  filteredData.map((item, index) => (
                    <TableRow
                      key={index}
                      className={`hover:bg-blue-50 transition-colors border-b border-gray-100 ${getTrendBgColor(item.trend)}`}
                    >
                      <TableCell className="text-center py-4 min-w-[120px]">
                        <div className="flex items-center justify-center gap-2 sm:gap-3">
                          <span className="text-lg sm:text-2xl">{item.icon}</span>
                          <div className="text-left">
                            <div className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm">{item.name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center min-w-[100px]">
                        <span className="font-medium text-gray-800 dark:text-gray-200 text-xs sm:text-sm">{item.district}</span>
                      </TableCell>
                      <TableCell className="text-center min-w-[80px]">
                        <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{item.minPrice}</span>
                      </TableCell>
                      <TableCell className="text-center min-w-[80px]">
                        <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{item.maxPrice}</span>
                      </TableCell>
                      <TableCell className="text-center min-w-[80px]">
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
                          <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{item.modalPrice}</span>
                          <div
                            className={`flex items-center gap-1 px-1 sm:px-2 py-1 rounded-full text-xs font-medium ${getTrendColor(item.trend)}`}
                          >
                            {getTrendIcon(item.trend)}
                            <span className="hidden sm:inline">{item.change}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center min-w-[60px]">
                        <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{item.unit}</span>
                      </TableCell>
                      <TableCell className="text-center min-w-[80px]">
                        <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{item.quality}</span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                      {t("localMandi.noData")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}