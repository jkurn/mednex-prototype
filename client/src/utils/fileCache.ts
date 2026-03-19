const FILE_CACHE_KEY = 'strator_file_cache';

interface FileData {
  base64: string;
  mimeType: string;
}

interface FileCache {
  [claimId: string]: FileData;
}

export function cacheFile(claimId: string, base64: string, mimeType: string): void {
  try {
    const cache = getCache();
    cache[claimId] = { base64, mimeType };
    sessionStorage.setItem(FILE_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn('Failed to cache file:', error);
  }
}

export function getCachedFile(claimId: string): FileData | null {
  try {
    const cache = getCache();
    return cache[claimId] || null;
  } catch (error) {
    console.warn('Failed to get cached file:', error);
    return null;
  }
}

export function removeCachedFile(claimId: string): void {
  try {
    const cache = getCache();
    delete cache[claimId];
    sessionStorage.setItem(FILE_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn('Failed to remove cached file:', error);
  }
}

function getCache(): FileCache {
  try {
    const cached = sessionStorage.getItem(FILE_CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch {
    return {};
  }
}
