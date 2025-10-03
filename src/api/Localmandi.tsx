import apiClient from "./apiClient";
import {
  LocalMandiResponse,
  LocalMandiCategoriesResponse,
  GetLocalMandisParams,
} from "./apiTypes";

// Fetch Mandis
export async function getLocalMandis(params: GetLocalMandisParams) {
  console.log('[LocalMandi API] Fetching mandi data with params:', params);
  const res = await apiClient.get<LocalMandiResponse>("/local-mandi-categories/items", {
    params,
  });
  console.log('[LocalMandi API] Response received:', res.data);
  return res.data;
}

// Fetch Categories
export async function getLocalMandiCategories(language_id: string) {
  console.log('[LocalMandi API] Fetching categories for language_id:', language_id);
  const res = await apiClient.get<LocalMandiCategoriesResponse>(
    "/local-mandi-categories",
    { params: { language_id } }
  );
  console.log('[LocalMandi API] Categories response received:', res.data);
  return res.data;
}
