export async function extractTypography(page) {
    const raw = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        const fontsMap = new Map();
        elements.forEach(el => {
            const style = window.getComputedStyle(el);
            const family = style.fontFamily.split(',')[0].replace(/['"]/g, '').trim();
            const size = style.fontSize;
            const weight = style.fontWeight;
            const lineHeight = style.lineHeight;
            const tag = el.tagName.toLowerCase();
            // skip service tags
            if (['script', 'style', 'meta', 'head', 'link'].includes(tag))
                return;
            if (!family || family === '')
                return;
            if (!fontsMap.has(family)) {
                fontsMap.set(family, {
                    sizes: new Set(),
                    weights: new Set(),
                    lineHeights: new Set(),
                    tags: new Set(),
                    count: 0
                });
            }
            const entry = fontsMap.get(family);
            entry.sizes.add(size);
            entry.weights.add(weight);
            entry.lineHeights.add(lineHeight);
            entry.tags.add(tag);
            entry.count++;
        });
        // convert Map to plain object for browser transfer
        const result = {};
        fontsMap.forEach((val, key) => {
            result[key] = {
                sizes: Array.from(val.sizes),
                weights: Array.from(val.weights),
                lineHeights: Array.from(val.lineHeights),
                tags: Array.from(val.tags),
                count: val.count
            };
        });
        return result;
    });
    // sort by usage count (most popular first)
    const fonts = Object.entries(raw)
        .map(([family, data]) => ({
        family,
        sizes: data.sizes,
        weights: data.weights,
        lineHeights: data.lineHeights,
        usedInTags: data.tags,
        count: data.count
    }))
        .sort((a, b) => b.count - a.count);
    // all unique sizes across the site
    const allSizes = [...new Set(fonts.flatMap(f => f.sizes))]
        .sort((a, b) => parseFloat(a) - parseFloat(b));
    // all unique line-heights across the site
    const allLineHeights = [...new Set(fonts.flatMap(f => f.lineHeights))]
        .sort((a, b) => parseFloat(a) - parseFloat(b));
    return { fonts, allSizes, allLineHeights };
}
