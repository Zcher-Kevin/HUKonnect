const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Expo Router requires this
config.resolver.unstable_enablePackageExports = true;

module.exports = config;