# Animation Libraries Installation Guide

To enable animated previews in your PhotoRestore app, you'll need to install additional animation libraries. Here's what you need:

## Required Libraries

### 1. Lottie React Native (for JSON animations)
```bash
npm install lottie-react-native
npx expo install lottie-ios
```

### 2. React Native Fast Image (for WebP and optimized images)
```bash
npm install react-native-fast-image
npx expo install expo-blur
```

### 3. React Native Video (for video loops)
```bash
npm install react-native-video
npx expo install expo-av
```

## Usage Examples

### For Lottie Animations
```typescript
import Lottie from 'lottie-react-native';

<Lottie
  source={{ uri: 'https://example.com/animation.json' }}
  autoPlay={true}
  loop={true}
  style={{ width: 200, height: 200 }}
/>
```

### For WebP Animated Images
```typescript
import FastImage from 'react-native-fast-image';

<FastImage
  source={{ uri: 'https://example.com/animation.webp' }}
  style={{ width: 200, height: 200 }}
  resizeMode={FastImage.resizeMode.cover}
/>
```

### For Video Loops
```typescript
import Video from 'react-native-video';

<Video
  source={{ uri: 'https://example.com/loop.mp4' }}
  style={{ width: 200, height: 200 }}
  resizeMode="cover"
  repeat={true}
  muted={true}
  controls={false}
/>
```

## Recommended Animation Sources

1. **LottieFiles.com** - Free JSON animations
2. **GIPHY** - GIF animations (convert to MP4 for better performance)
3. **WebP Converter Tools** - Convert GIFs to WebP for better compression
4. **Adobe After Effects** - Export as Lottie JSON

## Performance Tips

- Use WebP instead of GIFs for better performance
- For simple animations, prefer Lottie JSON over video
- Always set `muted={true}` for autoplay videos
- Use appropriate image sizes for your components
- Cache animations locally when possible

## Current Implementation Status

The `AnimatedCard.tsx` component is ready to use these libraries once installed. Simply uncomment the import statements and enable the animation logic in the `renderAnimatedContent()` function.

The `BeforeAfter.tsx` component is fully functional and ready for use with static images.