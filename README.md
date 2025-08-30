# 🌱 Karakeeb - Smart Recycling Platform

<div align="center">
<img src="./assets/images/Karakeeb-logo.pn" alt="Karakeeb Logo" width="120" height="120" style="border-radius: 20px;" />

<p><strong>Transforming waste into wealth through intelligent recycling solutions</strong></p>

[![React Native](https://img.shields.io/badge/React%20Native-0.74-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~53.0-black.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
</div>

---

## 🎯 Overview

Karakeeb is a comprehensive mobile application that revolutionizes the recycling ecosystem by connecting customers, recyclers, and delivery personnel in a seamless marketplace. Our platform gamifies recycling through a sophisticated points system while enabling users to buy and sell recyclable materials efficiently.

## ✨ Key Features

### 🔄 Multi-Role Ecosystem
- **Customers**: Sell recyclables, earn points, and track environmental impact
- **Buyers**: Purchase recycled materials with integrated inventory management
- **Delivery Partners**: Efficient pickup and delivery workflow management

### 🎮 Gamified Experience
- **Smart Points System**: Earn rewards for every recycling transaction
- **Achievement Tracking**: Monitor personal recycling milestones
- **Tier-based Rewards**: Unlock exclusive benefits as you progress

### 🛒 Intelligent Marketplace
- **Dynamic Inventory**: Real-time stock management and availability
- **Smart Categorization**: AI-powered material classification
- **Price Optimization**: Market-driven pricing algorithms

### 📱 Advanced Mobile Features
- **Voice Recognition**: AI-powered voice commands for hands-free operation
- **Smart Chat**: Integrated AI assistant for user support
- **Real-time Notifications**: Live updates on orders and deliveries
- **Multi-language Support**: Arabic and English localization with RTL support

### 🚚 Seamless Logistics
- **Smart Pickup Scheduling**: Optimized route planning for deliveries
- **Order Tracking**: Real-time status updates throughout the process
- **Digital Receipts**: Automated PDF report generation

## 🌍 Localization

Karakeeb supports multiple languages with full RTL (Right-to-Left) support:
- **English** (default)
- **Arabic** with RTL layout adaptation

## 🛡️ Security & Privacy

- **Secure Authentication** with JWT tokens
- **Data Encryption** for sensitive information
- **Privacy-first Design** with minimal data collection
- **GDPR Compliance** ready architecture


## 🏗️ Technical Architecture

### Frontend Stack
- **React Native** with Expo framework for cross-platform development
- **TypeScript** for enhanced code reliability and developer experience
- **Expo Router** for file-based navigation system
- **React Query** for efficient data fetching and caching

### State Management
- **Context API** for global state management
- **Custom Hooks** for reusable business logic
- **Async Storage** for local data persistence

### UI/UX Excellence
- **Custom Theme System** with dark/light mode support
- **Responsive Design** using dynamic scaling utilities
- **Smooth Animations** with React Native Reanimated
- **Accessibility** compliance for inclusive user experience

### Backend Integration
- **RESTful API** architecture
- **JWT Authentication** with secure token management
- **Real-time Updates** through WebSocket connections
- **File Upload** handling for images and documents

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn package manager
- Expo CLI
- iOS Simulator or Android Emulator

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/hazemabdo15/Recycling-App.git
   cd karakeeb-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start the development server**
   ```bash
   npx expo start
   ```

### Development Scripts

```bash
# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run tests
npm test

# Build for production
npm run build:android
npm run build:ios
```

## 📂 Project Structure

```
karakeeb/
├── app/                    # Main application screens
│   ├── (tabs)/            # Tab-based navigation screens
│   ├── auth/              # Authentication flows
│   └── _layout.jsx        # Root layout configuration
├── components/            # Reusable UI components
│   ├── auth/              # Authentication components
│   ├── common/            # Shared components
│   ├── pickup/            # Pickup workflow components
│   └── ui/                # Base UI components
├── context/               # React Context providers
├── hooks/                 # Custom React hooks
├── services/              # API and external services
├── styles/                # Theme and styling system
├── utils/                 # Utility functions
└── localization/          # Multi-language support
```

## 🔧 Configuration

### App Configuration
- **Bundle Identifier**: `com.recyclecrew.karakeeb`
- **Deep Linking**: `karakeebapp://` and `com.recyclecrew.karakeeb://`
- **Supported Platforms**: iOS, Android
- **Minimum Requirements**: iOS 13+, Android API 21+

## 🤝 Contributing

We welcome contributions!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- **Expo Team** for the amazing development platform
- **React Native Community** for continuous innovation
- **Environmental Partners** supporting our recycling mission

## 📞 Support

- **Email**: recyclecrew7@gmail.com
- **Issues**: [GitHub Issues](https://github.com/hazemabdo15/Recycling-App/issues)

---

<div align="center">
  <p>Made with ❤️ for a sustainable future</p>
  <p>© 2025 Karakeeb. All rights reserved.</p>
</div>