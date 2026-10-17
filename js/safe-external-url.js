function getSafeExternalUrl(value) {
    if (typeof value !== 'string' || !value.trim()) {
        return null;
    }

    try {
        const url = new URL(value);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            return null;
        }

        return url.href;
    } catch {
        return null;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = getSafeExternalUrl;
}

if (typeof window !== 'undefined') {
    window.getSafeExternalUrl = getSafeExternalUrl;
}
