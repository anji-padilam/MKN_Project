import apiClient from "./apiClient";
import { Category } from "../api/apiTypes";

interface CategoriesResponse {
  status: number;
  message: string;
  result: Category[];
}

export const getCategories = async (
  language_id: string | number
): Promise<Category[]> => {
  try {
    console.log(`[Categories API] Fetching categories for language: ${language_id}`);
    
    // 1) Prefer server-side filtering if supported
    const server = await apiClient.get<CategoriesResponse>(
      `/news/categories`,
      { params: { language_id } }
    );

    console.log(`[Categories API] Server response status: ${server.data?.status}`);
    console.log(`[Categories API] Server response message: ${server.data?.message}`);

    const serverList =
      server.data?.status === 1 && Array.isArray(server.data?.result)
        ? server.data.result
        : [];

    console.log(`[Categories API] Server returned ${serverList.length} categories`);

    // If server already filtered by language, return active ones
    const serverLooksFiltered =
      serverList.length > 0 &&
      serverList.every(
        (c) => String(c.language_id ?? "") === String(language_id)
      );

    let filtered: Category[] = [];
    if (serverLooksFiltered) {
      filtered = serverList.filter((c) => c && c.is_active === 1);
      console.log(`[Categories API] Server filtered, returning ${filtered.length} active categories`);
    } else {
      // 2) Fallback: fetch all and filter client-side
      console.log(`[Categories API] Server not filtered, fetching all categories`);
      const all =
        serverLooksFiltered
          ? server
          : await apiClient.get<CategoriesResponse>("/news/categories");

      const allList =
        all.data?.status === 1 && Array.isArray(all.data?.result)
          ? all.data.result
          : [];

      console.log(`[Categories API] All categories response: ${allList.length} categories`);

      filtered = allList.filter(
        (c) => String(c.language_id ?? "") === String(language_id) && c.is_active === 1
      );
      console.log(`[Categories API] Client filtered, returning ${filtered.length} active categories`);
    }

    // Deduplicate categories by ID to prevent duplicates
    const seen = new Set();
    const uniqueCategories = filtered.filter((category) => {
      const id = String(category.id);
      if (seen.has(id)) {
        console.warn(`Duplicate category found in API response: ${category.category_name} (ID: ${id})`);
        return false;
      }
      seen.add(id);
      return true;
    });

    // Debug logging
    if (filtered.length !== uniqueCategories.length) {
      console.log(`Categories deduplication: ${filtered.length} -> ${uniqueCategories.length} (removed ${filtered.length - uniqueCategories.length} duplicates)`);
    }

    console.log(`[Categories API] Final result: ${uniqueCategories.length} unique categories`);
    return uniqueCategories;
  } catch (error) {
    console.error("Error fetching categories", error);
    console.error("Error details:", {
      message: error.message,
      status: error.status,
      type: error.type,
      url: error.config?.url
    });
    
    // Return empty array instead of throwing error to prevent UI crash
    console.log("Returning empty categories array due to error");
    return [];
  }
};