/**
 * Resolve the correct image URL for a menu item.
 * Priority: GridFS imageId > legacy image URL > fallback placeholder
 */
export function resolveImage(item) {
  if (item?.imageId) {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "";
    const base = backendUrl.endsWith("/") ? backendUrl.slice(0, -1) : backendUrl;
    return base ? `${base}/images/${item.imageId}` : `/api/images/${item.imageId}`;
  }
  if (item?.image) return item.image;
  return "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop";
}
