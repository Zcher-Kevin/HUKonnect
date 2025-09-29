# HUKonnect Frontend

React Native mobile application built with Expo for the HUKonnect campus connection platform.

## 🚀 Tech Stack

- **Framework**: React Native with Expo SDK 51
- **Navigation**: Expo Router
- **Language**: TypeScript
- **HTTP Client**: Axios
- **State Management**: React Hooks
- **Styling**: React Native StyleSheet
- **Development Tools**: Metro Bundler, Expo CLI

## 📱 Platform Support

- ✅ iOS (Simulator & Device)
- ✅ Android (Emulator & Device)
- ✅ Web (Browser)

## 🏗️ Project Structure

```
frontend/
├── app/                          # Expo Router app directory
│   ├── (tabs)/                  # Tab-based navigation
│   │   ├── index.tsx           # Home screen
│   │   ├── explore.tsx         # Explore screen
│   │   └── _layout.tsx         # Tab layout configuration
│   ├── _layout.tsx             # Root layout
│   └── +not-found.tsx          # 404 page
├── components/                   # Reusable UI components
│   ├── ui/                     # UI-specific components
│   │   ├── IconSymbol.tsx      # Cross-platform icons
│   │   └── TabBarBackground.tsx # Tab bar styling
│   └── HapticTab.tsx           # Tab with haptic feedback
├── constants/                   # App constants
│   └── Colors.ts               # Theme colors
├── hooks/                      # Custom React hooks
│   └── useColorScheme.ts       # Color scheme detection
├── assets/                     # Static assets
│   ├── fonts/                  # Font files
│   └── images/                 # Image assets
├── package.json                # Dependencies and scripts
├── app.json                    # Expo configuration
├── tsconfig.json               # TypeScript configuration
├── babel.config.js             # Babel configuration
└── metro.config.js             # Metro bundler configuration
```

## 🛠️ Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)

### Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

## 📱 Running the App

### iOS

```bash
# iOS Simulator
npm run ios
# or press 'i' when Expo server is running

# Physical iOS Device
# Scan QR code with Camera app
```

### Android

```bash
# Android Emulator
npm run android
# or press 'a' when Expo server is running

# Physical Android Device
# Install Expo Go app and scan QR code
```

### Web

```bash
# Web Browser
npm run web
# or press 'w' when Expo server is running
```

## 🔗 Backend Integration

The app connects to the Node.js backend API:

### API Configuration

```typescript
// Located in app/(tabs)/index.tsx
const getApiUrl = () => {
  if (Platform.OS === "ios") {
    return "http://localhost:3000"; // iOS Simulator
  } else if (Platform.OS === "android") {
    return "http://10.0.2.2:3000"; // Android Emulator
  }
  return "http://localhost:3000"; // Web & others
};
```

### API Endpoints Used

- `GET /api/test` - Backend connection test
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `GET /api/users/profile` - User profile
- `GET /api/groups` - Study groups
- `GET /api/events` - Campus events

## 🧩 Key Features

### Navigation

- **Tab Navigation**: Home and Explore screens
- **Expo Router**: File-based routing system
- **Deep Linking**: Support for navigation via URLs

### Components

- **HapticTab**: Touch feedback for tab interactions
- **IconSymbol**: Cross-platform Material Icons
- **TabBarBackground**: Custom tab bar styling
- **Color Themes**: Light/dark mode support

### Backend Connection

- **API Integration**: Axios for HTTP requests
- **Error Handling**: Comprehensive error management
- **Loading States**: User feedback during API calls
- **Debug Mode**: Development debugging tools

## 🚧 Available Scripts

```bash
npm start          # Start Expo development server
npm run android    # Run on Android emulator
npm run ios        # Run on iOS simulator
npm run web        # Run in web browser
npm test           # Run Jest tests
npm run lint       # Run ESLint linter
```

## 🎨 UI/UX Features

### Design System

- **Colors**: Consistent theme colors
- **Typography**: Custom font support
- **Icons**: Material Icons integration
- **Responsive**: Adapts to different screen sizes

### User Experience

- **Loading States**: Visual feedback during operations
- **Error Handling**: User-friendly error messages
- **Touch Feedback**: Haptic responses on iOS
- **Platform Adaptation**: iOS and Android native feel

## 🔧 Development

### Hot Reload

- Code changes reflect instantly
- Preserves app state during development
- Works across all platforms

### Debugging

- **React Native Debugger**: Full debugging support
- **Console Logs**: Available in terminal
- **Network Inspection**: Monitor API calls
- **Error Boundaries**: Graceful error handling

### Environment Configuration

```typescript
// Development vs Production API URLs
const API_URL = __DEV__
  ? getApiUrl() // Development
  : "https://your-api.com"; // Production
```

## 📦 Key Dependencies

```json
{
  "expo": "~51.0.28",
  "expo-router": "~3.5.23",
  "react-native": "0.74.5",
  "axios": "^1.7.7",
  "@expo/vector-icons": "^14.0.4",
  "@react-navigation/native": "^6.1.18",
  "react": "18.2.0",
  "typescript": "~5.3.3"
}
```

## 🚀 Building for Production

### Development Build

```bash
# Create development build
expo run:ios       # iOS
expo run:android   # Android
```

### Production Build

```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Configure EAS
eas build:configure

# Build for app stores
eas build --platform ios
eas build --platform android
```

### Web Deployment

```bash
# Build for web
expo export:web

# Deploy to hosting service
# (Netlify, Vercel, etc.)
```

## 🐛 Troubleshooting

### Common Issues

**Metro bundler issues:**

```bash
# Clear cache
npx expo start -c
```

**iOS Simulator not opening:**

```bash
# Check Xcode installation
xcode-select --version

# Reset simulator
xcrun simctl erase all
```

**Android emulator connection:**

```bash
# Check ADB
adb devices

# Restart Metro
npx expo start --android
```

**Backend connection failures:**

- Check API URL configuration
- Ensure backend server is running
- Verify network connectivity
- Check CORS configuration

## 📱 Device Testing

### Physical Device Setup

**iOS Device:**

1. Install Expo Go from App Store
2. Ensure device and computer are on same network
3. Scan QR code with Camera app

**Android Device:**

1. Install Expo Go from Google Play
2. Enable Developer Mode
3. Scan QR code with Expo Go app

## 🔒 Security Considerations

- **API Keys**: Store sensitive data in environment variables
- **HTTPS**: Use secure connections in production
- **Authentication**: JWT token handling
- **Input Validation**: Client-side validation for UX

## 🚀 Performance Optimization

- **Bundle Size**: Optimize imports and dependencies
- **Image Optimization**: Use appropriate image formats
- **Lazy Loading**: Load screens on demand
- **Memory Management**: Proper cleanup of subscriptions

## 📚 Learning Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [TypeScript with React Native](https://reactnative.dev/docs/typescript)

## 🤝 Contributing

1. Follow the existing code structure
2. Use TypeScript for type safety
3. Follow React Native best practices
4. Test on multiple platforms
5. Update documentation as needed

## 📄 License

This project is part of COMP3330 Group Project. All rights reserved.
