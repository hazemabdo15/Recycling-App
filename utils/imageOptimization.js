import { Image } from 'expo-image';

// Configure expo-image for optimal performance
// This should be called once at app startup
export const configureImagePerformance = () => {
  // Clear any stale memory cache on app start
  Image.clearMemoryCache();
  
  // Preload common placeholder
  Image.prefetch('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==');
};

// Optimized image component for item cards with lazy loading
export const OptimizedImage = ({ source, style, contentFit = 'contain', onError, onLoad, ...props }) => {
  return (
    <Image
      source={source}
      style={style}
      contentFit={contentFit}
      cachePolicy="memory-disk"
      placeholder={{ blurhash: 'LFE{?~%300_3~qRjRjof_3j[fQt7' }}
      transition={200}
      priority="normal"
      allowDownscaling
      recyclingKey={source?.uri} // Help with recycling views
      onError={onError}
      onLoad={onLoad}
      {...props}
    />
  );
};

// Cleanup function for when app goes to background
export const cleanupImageCache = () => {
  // Clear disk cache if app is low on storage
  Image.clearDiskCache();
};

export default OptimizedImage;
