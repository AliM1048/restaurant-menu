/**
 * Resolve the correct image URL for a menu item.
 * Priority: GridFS imageId > legacy image URL > fallback placeholder
 */
export function resolveImage(item) {
  if (item?.imageId) return `/api/images/${item.imageId}`;
  if (item?.image) return item.image;
  return "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop";
}
