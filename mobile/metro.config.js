const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude docs folder from bundling
config.resolver.blockList = [
  /\/docs\/.*/
];

module.exports = config;