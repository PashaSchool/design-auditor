// Standard aspect ratios and their acceptable tolerance
const KNOWN_RATIOS = [
    { label: '1:1', value: 1.000, tolerance: 0.05 },
    { label: '4:3', value: 1.333, tolerance: 0.05 },
    { label: '3:2', value: 1.500, tolerance: 0.05 },
    { label: '16:9', value: 1.778, tolerance: 0.05 },
    { label: '16:10', value: 1.600, tolerance: 0.05 },
    { label: '2:1', value: 2.000, tolerance: 0.08 },
    { label: '3:4', value: 0.750, tolerance: 0.05 }, // portrait
    { label: '2:3', value: 0.667, tolerance: 0.05 }, // portrait
    { label: '9:16', value: 0.563, tolerance: 0.05 }, // portrait mobile
];
function detectRatioLabel(ratio) {
    const match = KNOWN_RATIOS.find(r => Math.abs(r.value - ratio) <= r.tolerance);
    return match ? match.label : 'free';
}
export async function extractImages(page) {
    const raw = await page.evaluate(() => {
        const imgEls = Array.from(document.querySelectorAll('img'));
        return imgEls
            .map(img => {
            const rect = img.getBoundingClientRect();
            const parent = img.closest('article, .card, [class*="card"], li, [class*="grid"], [class*="list"]');
            const context = parent ? (parent.tagName.toLowerCase() + (parent.className ? '.' + parent.className.split(' ')[0] : '')) : 'page';
            return {
                src: img.src?.slice(-60) || '', // last 60 chars of URL
                width: Math.round(rect.width),
                height: Math.round(rect.height),
                alt: img.alt || '',
                hasAlt: !!img.alt,
                context,
            };
        })
            // filter invisible images (icons, tracking pixels)
            .filter(img => img.width >= 48 && img.height >= 48);
    });
    const images = raw.map(img => {
        const ratio = img.height > 0 ? img.width / img.height : 0;
        const ratioLabel = ratio > 0 ? detectRatioLabel(ratio) : 'unknown';
        return {
            ...img,
            ratio: Math.round(ratio * 100) / 100,
            ratioLabel,
        };
    });
    const uniqueRatios = [...new Set(images.map(i => i.ratioLabel))];
    const missingAlt = images.filter(i => !i.hasAlt);
    // Find groups where different ratios exist in the same context
    const contextRatios = new Map();
    for (const img of images) {
        if (!contextRatios.has(img.context))
            contextRatios.set(img.context, new Set());
        contextRatios.get(img.context).add(img.ratioLabel);
    }
    const inconsistentCards = Array.from(contextRatios.entries())
        .filter(([, ratios]) => ratios.size > 1)
        .map(([ctx, ratios]) => `${ctx}: ${Array.from(ratios).join(', ')}`);
    return { images, uniqueRatios, missingAlt, inconsistentCards };
}
