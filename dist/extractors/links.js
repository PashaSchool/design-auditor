export async function extractLinks(page) {
    const raw = await page.evaluate(() => {
        const linkEls = Array.from(document.querySelectorAll('a[href]'));
        // check CSS rules for :visited and :focus
        let hasVisitedStyle = false;
        let hasFocusStyle = false;
        try {
            const sheets = Array.from(document.styleSheets);
            for (const sheet of sheets) {
                const rules = Array.from(sheet.cssRules || []);
                for (const rule of rules) {
                    const text = rule.cssText || '';
                    if (text.includes('a:visited') || text.includes('a:visited'))
                        hasVisitedStyle = true;
                    if (text.includes('a:focus') || text.includes(':focus-visible'))
                        hasFocusStyle = true;
                }
            }
        }
        catch { /* cross-origin */ }
        const links = linkEls
            .map(el => {
            const style = window.getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            const text = (el.textContent || '').trim().slice(0, 40);
            const href = el.href || '';
            if (rect.width === 0 || !text)
                return null;
            // Find link context
            const nav = el.closest('nav');
            const footer = el.closest('footer');
            const main = el.closest('main, article, [role="main"]');
            const context = nav ? 'nav' : footer ? 'footer' : main ? 'main' : 'other';
            const hasUnderline = style.textDecorationLine.includes('underline');
            const hasBorder = parseFloat(style.borderBottomWidth) > 0;
            return {
                href: href.slice(-50),
                text,
                color: style.color,
                textDecoration: style.textDecorationLine,
                fontSize: parseFloat(style.fontSize),
                isExternal: href.startsWith('http') && !href.includes(window.location.hostname),
                hasUnderline,
                hasBorder,
                context,
            };
        })
            .filter(Boolean);
        return { links, hasVisitedStyle, hasFocusStyle };
    });
    const uniqueColors = [...new Set(raw.links.map(l => l.color))];
    // WCAG 1.4.1: inline links must differ by more than just color
    // → needs underline, border, or another visual indicator
    const noUnderlineNoAlt = raw.links.filter(l => l.context === 'main' && !l.hasUnderline && !l.hasBorder);
    return {
        links: raw.links,
        uniqueColors,
        noUnderlineNoAlt,
        inconsistentColors: uniqueColors.length > 3,
        hasVisitedStyle: raw.hasVisitedStyle,
        hasFocusStyle: raw.hasFocusStyle,
    };
}
