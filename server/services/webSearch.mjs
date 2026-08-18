import { tavily } from '@tavily/core';
import { search as ddgSearch, SafeSearchType } from 'duck-duck-scrape';
import { getAiConfig } from '../config/env.mjs';

let tavilyClient = null;
const { tavilyApiKey } = getAiConfig();
if (tavilyApiKey) {
    try {
        tavilyClient = tavily({ apiKey: tavilyApiKey });
    } catch (e) {
        console.warn('⚠️ [Tavily Init Warning]:', e.message);
    }
}

export const performWebSearch = async (query = '', maxResults = 3) => {
    if (!query || !query.trim()) return [];
    const cleanQuery = query.trim();
    const { searchProvider, tavilyApiKey: curTavilyKey, bochaApiKey: curBochaKey } = getAiConfig();

    // 1. Tavily AI Search (Preferred if configured)
    if ((searchProvider === 'tavily' || curTavilyKey)) {
        try {
            if (!tavilyClient && curTavilyKey) {
                tavilyClient = tavily({ apiKey: curTavilyKey });
            }
            if (tavilyClient) {
                console.log(`🌐 [WebSearch: Tavily] Querying "${cleanQuery}"...`);
                const res = await tavilyClient.search(cleanQuery, {
                    maxResults,
                    searchDepth: 'basic',
                    includeAnswer: false
                });
                if (res?.results && res.results.length > 0) {
                    return res.results.slice(0, maxResults).map(r => ({
                        title: r.title || '网页搜索结果',
                        url: r.url,
                        snippet: r.content || r.snippet || '',
                        source: 'tavily'
                    }));
                }
            }
        } catch (err) {
            console.warn(`⚠️ [Tavily Search Error, fallback to DuckDuckGo]:`, err.message);
        }
    }

    // 2. Bocha AI Search (Chinese mainland optimized)
    if ((searchProvider === 'bocha' || curBochaKey) && curBochaKey) {
        try {
            console.log(`🌐 [WebSearch: Bocha AI] Querying "${cleanQuery}"...`);
            const res = await fetch('https://api.bochaai.com/v1/web-search', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${curBochaKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: cleanQuery,
                    freshness: 'noLimit',
                    summary: true,
                    count: maxResults
                })
            });
            if (res.ok) {
                const json = await res.json();
                const pages = json.data?.webPages?.value || [];
                if (pages.length > 0) {
                    return pages.slice(0, maxResults).map(p => ({
                        title: p.name || p.title || '网页搜索结果',
                        url: p.url,
                        snippet: p.snippet || p.summary || '',
                        source: 'bocha'
                    }));
                }
            }
        } catch (err) {
            console.warn(`⚠️ [Bocha Search Error, fallback to DuckDuckGo]:`, err.message);
        }
    }

    // 3. DuckDuckGo Scrape (Free Zero-Config Fallback)
    try {
        console.log(`🌐 [WebSearch: DuckDuckGo Fallback] Querying "${cleanQuery}"...`);
        const ddgRes = await ddgSearch(cleanQuery, { safeSearch: SafeSearchType.STRICT });
        if (ddgRes?.results && ddgRes.results.length > 0) {
            return ddgRes.results.slice(0, maxResults).map(r => ({
                title: r.title || '网页搜索结果',
                url: r.url,
                snippet: r.description || r.snippet || '',
                source: 'duckduckgo'
            }));
        }
    } catch (err) {
        console.warn(`⚠️ [DuckDuckGo Fallback Error]:`, err.message);
    }

    return [];
};
