// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Fix whatwg-url-without-unicode's .js extension resolution issue
config.resolver.sourceExts = [...config.resolver.sourceExts, 'js', 'cjs'];

// Allow resolving .js files explicitly in packages
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
    // Let Metro handle everything normally; if a .js file fails, try without extension
    if (originalResolveRequest) {
        return originalResolveRequest(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
