// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Support .cjs / .mjs files from modern packages
config.resolver.sourceExts.push('cjs', 'mjs');

module.exports = config;
