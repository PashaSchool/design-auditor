export async function extractComponents(page) {
    const raw = await page.evaluate(() => {
        // ─── Buttons ────────────────────────────────────────────────────────────────
        const buttonEls = Array.from(document.querySelectorAll('button, [role="button"], input[type="submit"], input[type="button"], a.btn, a[class*="button"]'));
        const buttons = buttonEls.map(el => {
            const style = window.getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            // check hover via CSS rules (not simulation — expensive)
            const sheets = Array.from(document.styleSheets);
            let hasHoverStyle = false;
            let hasFocusStyle = false;
            let hasDisabledStyle = false;
            try {
                for (const sheet of sheets) {
                    const rules = Array.from(sheet.cssRules || []);
                    for (const rule of rules) {
                        const text = rule.cssText || '';
                        if (text.includes(':hover'))
                            hasHoverStyle = true;
                        if (text.includes(':focus'))
                            hasFocusStyle = true;
                        if (text.includes(':disabled'))
                            hasDisabledStyle = true;
                    }
                }
            }
            catch {
                // cross-origin stylesheets are blocked — ignore
            }
            return {
                tag: el.tagName.toLowerCase(),
                text: (el.textContent || '').trim().slice(0, 30),
                width: Math.round(rect.width),
                height: Math.round(rect.height),
                paddingTop: parseFloat(style.paddingTop),
                paddingRight: parseFloat(style.paddingRight),
                paddingBottom: parseFloat(style.paddingBottom),
                paddingLeft: parseFloat(style.paddingLeft),
                borderRadius: style.borderRadius,
                fontSize: parseFloat(style.fontSize),
                fontWeight: style.fontWeight,
                backgroundColor: style.backgroundColor,
                color: style.color,
                cursor: style.cursor,
                hasHoverStyle,
                hasFocusStyle,
                hasDisabledStyle,
            };
        });
        // ─── Border Radius ───────────────────────────────────────────────────────────
        const allEls = Array.from(document.querySelectorAll('*'));
        const radiiMap = {};
        allEls.forEach(el => {
            const tag = el.tagName.toLowerCase();
            const style = window.getComputedStyle(el);
            const r = style.borderRadius;
            if (!r || r === '0px' || r === '0px 0px 0px 0px')
                return;
            if (['script', 'style', 'meta', 'head', 'link'].includes(tag))
                return;
            if (!radiiMap[tag])
                radiiMap[tag] = new Set();
            radiiMap[tag].add(r);
        });
        const radiiByElement = {};
        for (const [tag, set] of Object.entries(radiiMap)) {
            radiiByElement[tag] = Array.from(set);
        }
        const uniqueRadii = [...new Set(Object.values(radiiByElement).flat())];
        // ─── Shadows ─────────────────────────────────────────────────────────────────
        const shadowMap = new Map();
        allEls.forEach(el => {
            const tag = el.tagName.toLowerCase();
            const style = window.getComputedStyle(el);
            const shadow = style.boxShadow;
            if (!shadow || shadow === 'none')
                return;
            if (['script', 'style', 'meta', 'head', 'link'].includes(tag))
                return;
            // parse the first shadow (there may be multiple, separated by commas)
            const first = shadow.split(/,(?![^(]*\))/)[0].trim();
            // extract numeric values: offsetX offsetY blur spread
            const nums = first.match(/-?\d+\.?\d*px/g)?.map(parseFloat) || [];
            const offsetY = nums[1] ?? 0;
            const blur = nums[2] ?? 0;
            const spread = nums[3] ?? 0;
            if (!shadowMap.has(first)) {
                shadowMap.set(first, { count: 0, tags: new Set(), offsetY, blur, spread });
            }
            const entry = shadowMap.get(first);
            entry.count++;
            entry.tags.add(tag);
        });
        const shadows = Array.from(shadowMap.entries())
            .map(([value, data]) => ({
            value,
            offsetY: data.offsetY,
            blur: data.blur,
            spread: data.spread,
            count: data.count,
            tags: Array.from(data.tags),
        }))
            .sort((a, b) => b.count - a.count);
        // ─── Z-index ─────────────────────────────────────────────────────────────────
        const zSet = new Set();
        allEls.forEach(el => {
            const z = window.getComputedStyle(el).zIndex;
            const n = parseInt(z);
            if (!isNaN(n) && n !== 0)
                zSet.add(n);
        });
        const zIndices = Array.from(zSet).sort((a, b) => a - b);
        return { buttons, uniqueRadii, radiiByElement, shadows, zIndices };
    });
    return raw;
}
