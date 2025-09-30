// Custom image loader for CDN integration
export default function cdnLoader({ src, width, quality }: {
  src: string;
  width: number;
  quality?: number;
}) {
  const cdnUrl = process.env.CDN_URL || '';
  
  if (!cdnUrl) {
    return src;
  }

  // Handle absolute URLs
  if (src.startsWith('http')) {
    return src;
  }

  // Remove leading slash if present
  const cleanSrc = src.startsWith('/') ? src.slice(1) : src;
  
  // Construct CDN URL with optimization parameters
  const params = new URLSearchParams({
    w: width.toString(),
    q: (quality || 75).toString(),
  });

  return `${cdnUrl}/${cleanSrc}?${params.toString()}`;
}