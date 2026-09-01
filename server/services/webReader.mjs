import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import TurndownService from 'turndown';
import * as cheerio from 'cheerio';

const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-'
});

// Configure Turndown to keep table formatting and clean images
turndownService.addRule('tables', {
    filter: ['table'],
    replacement: function (_content, node) {
        try {
            const rows = Array.from(node.querySelectorAll('tr'));
            if (rows.length === 0) return '';
            let markdown = '\n';
            rows.forEach((tr, rowIndex) => {
                const cells = Array.from(tr.querySelectorAll('th, td')).map(cell => cell.textContent.trim().replace(/\|/g, '\\|') || ' ');
                markdown += `| ${cells.join(' | ')} |\n`;
                if (rowIndex === 0) {
                    markdown += `| ${cells.map(() => '---').join(' | ')} |\n`;
                }
            });
            return markdown + '\n';
        } catch {
            return '';
        }
    }
});

const withTimeout = (promise, ms = 4000) => {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms))
    ]);
};

/**
 * Tier 1: Local Mozilla Readability + Turndown
 */
const fetchWithReadability = async (url) => {
    const res = await withTimeout(fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
        }
    }), 3500);

    if (!res.ok) throw new Error(`HTTP Status ${res.status}`);
    const html = await res.text();

    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document, {
        charThreshold: 40
    });
    const article = reader.parse();

    if (!article || !article.content || article.textContent.trim().length < 60) {
        throw new Error('Readability failed to extract sufficient article text');
    }

    const markdown = turndownService.turndown(article.content);
    return {
        title: article.title || dom.window.document.title || '网页详情',
        byline: article.byline || '',
        excerpt: article.excerpt || '',
        markdown: markdown.trim(),
        source: 'local-readability'
    };
};

/**
 * Tier 2: Jina Reader Cloud API Fallback (Handles SPAs & Anti-Scraping)
 */
const fetchWithJinaReader = async (url) => {
    const jinaUrl = `https://r.jina.ai/${url.replace(/^https?:\/\//, 'https://')}`;
    const res = await withTimeout(fetch(jinaUrl, {
        headers: {
            'Accept': 'text/markdown',
            'User-Agent': 'Mozilla/5.0 (Gzadm Navigator Bot; +https://github.com/MrEiu/Gzadm-Navigator)'
        }
    }), 5000);

    if (!res.ok) throw new Error(`Jina Reader HTTP ${res.status}`);
    const rawMarkdown = await res.text();

    if (!rawMarkdown || rawMarkdown.trim().length < 50) {
        throw new Error('Jina Reader returned empty content');
    }

    // Extract title from first H1 if present
    const titleMatch = rawMarkdown.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : '网页详情 (Jina Reader)';

    return {
        title,
        markdown: rawMarkdown.trim(),
        source: 'jina-reader'
    };
};

/**
 * Tier 3: Cheerio Heuristic Raw DOM Extraction
 */
const fetchWithCheerio = async (url) => {
    const res = await withTimeout(fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'text/html,*/*;q=0.8'
        }
    }), 3000);

    if (!res.ok) throw new Error(`Cheerio HTTP ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    // Remove noise elements
    $('script, style, nav, footer, header, aside, noscript, svg, iframe, form').remove();

    const title = $('title').text().trim() || $('h1').first().text().trim() || '网页详情';
    
    // Prioritize main content containers
    let mainContent = $('article, .article, .post, .content, .main-content, #content, .news-content, main, body').first();
    if (!mainContent.length) mainContent = $('body');

    const cleanHtml = mainContent.html() || '';
    const markdown = turndownService.turndown(cleanHtml);

    return {
        title,
        markdown: markdown.replace(/\n{3,}/g, '\n\n').trim(),
        source: 'cheerio-fallback'
    };
};

/**
 * Multi-Engine Adaptive Web Page Reader
 * Priority: Local Mozilla Readability -> Jina Reader Cloud -> Cheerio DOM Heuristics
 */
export const fetchWebPageDetails = async (url, maxLength = 3500) => {
    if (!url || !url.startsWith('http')) {
        return {
            ok: false,
            error: '无效的网页 URL 地址'
        };
    }

    console.log(`🌐 [Web Reader] Fetching page content from: ${url}`);

    // Attempt Tier 1: Local Mozilla Readability
    try {
        const result = await fetchWithReadability(url);
        console.log(`  ✅ [Web Reader Tier 1] Readability extracted ${result.markdown.length} chars (Title: "${result.title}")`);
        return {
            ok: true,
            title: result.title,
            content: result.markdown.slice(0, maxLength) + (result.markdown.length > maxLength ? '\n\n*(正文过长已截断展示前 3500 字)*' : ''),
            source: result.source,
            url
        };
    } catch (e1) {
        console.warn(`  ⚠️ [Web Reader Tier 1] Readability failed (${e1.message}), falling back to Jina Reader...`);
    }

    // Attempt Tier 2: Jina Reader Cloud Fallback
    try {
        const result = await fetchWithJinaReader(url);
        console.log(`  ✅ [Web Reader Tier 2] Jina Reader extracted ${result.markdown.length} chars (Title: "${result.title}")`);
        return {
            ok: true,
            title: result.title,
            content: result.markdown.slice(0, maxLength) + (result.markdown.length > maxLength ? '\n\n*(正文过长已截断展示前 3500 字)*' : ''),
            source: result.source,
            url
        };
    } catch (e2) {
        console.warn(`  ⚠️ [Web Reader Tier 2] Jina Reader failed (${e2.message}), falling back to Cheerio...`);
    }

    // Attempt Tier 3: Cheerio DOM Extraction
    try {
        const result = await fetchWithCheerio(url);
        console.log(`  ✅ [Web Reader Tier 3] Cheerio extracted ${result.markdown.length} chars (Title: "${result.title}")`);
        return {
            ok: true,
            title: result.title,
            content: result.markdown.slice(0, maxLength) + (result.markdown.length > maxLength ? '\n\n*(正文过长已截断展示前 3500 字)*' : ''),
            source: result.source,
            url
        };
    } catch (e3) {
        console.error(`  ❌ [Web Reader Failed] All 3 extraction tiers failed for ${url}:`, e3.message);
        return {
            ok: false,
            error: `抓取网页正文失败：${e3.message}`,
            url
        };
    }
};
