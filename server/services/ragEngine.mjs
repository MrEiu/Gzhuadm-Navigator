import crypto from 'crypto';
import { PROVINCES, CATEGORY_KEYWORDS } from '../config/constants.mjs';
import { getEmbedding, cosineSimilarity } from './embedding.mjs';
import { getRagStore } from './postgres.mjs';
import { getCache, setCache } from './redis.mjs';

export const extractMeaningfulTokens = (text = '') => {
    if (!text) return [];
    const cleaned = String(text).toLowerCase();

    // 1. Extract alphanumeric/Chinese words of 2 or more characters, numbers with units
    const tokens = cleaned.match(/[\u4e00-\u9fa5a-z0-9]{2,}|\d+[分人名本硕博]/g) || [];

    // 2. Extract 2-gram bigrams from contiguous Chinese characters
    const chineseChunks = cleaned.match(/[\u4e00-\u9fa5]+/g) || [];
    chineseChunks.forEach(chunk => {
        if (chunk.length >= 2) {
            for (let i = 0; i < chunk.length - 1; i++) {
                const bi = chunk.slice(i, i + 2);
                if (!tokens.includes(bi)) tokens.push(bi);
            }
        }
    });

    return tokens.filter(t => t.length >= 2);
};

export const searchRagEngine = async (query = '', topK = 3, targetAgent = null) => {
    if (!query || !query.trim()) return [];
    console.log(`🔎 [searchRagEngine] Starting search for query: "${query}" (topK=${topK}, agent=${targetAgent || 'all'})`);
    const queryHash = crypto.createHash('md5').update(query.trim()).digest('hex');
    const cacheKey = `rag:search:v4:${targetAgent || 'all'}:${queryHash}`;

    const cached = await getCache(cacheKey);
    if (cached) {
        console.log(`⚡ [searchRagEngine] Cache HIT for: "${query}" (${cached.length} results)`);
        return cached;
    }

    const queryVector = await getEmbedding(query);
    const fullRagStore = await getRagStore();
    const qTokens = extractMeaningfulTokens(query);
    const qLower = query.toLowerCase();

    // Filter by targetAgent if specified
    const ragStore = targetAgent ? fullRagStore.filter(item => {
        const itemAgent = item.targetAgent || item.target_agent;
        if (!itemAgent || itemAgent === 'all') return true;
        return itemAgent === targetAgent;
    }) : fullRagStore;

    // Detect specific province entities in query
    const queryProvinces = PROVINCES.filter(p => qLower.includes(p));

    const scored = ragStore.map((item) => {
        let score = 0;
        let vectorScore = 0;
        let tokenScore = 0;
        let titleCategoryBonus = 0;
        let provinceBonus = 0;
        let categoryBonus = 0;

        const docTitle = (item.title || '').toLowerCase();
        const docCategory = (item.category || '').toLowerCase();
        const docContent = (item.content || '').toLowerCase();
        const docTags = (item.tags || []).map(t => String(t).toLowerCase());
        const docText = `${docTitle} ${docCategory} ${docContent} ${docTags.join(' ')}`;
        const docTokens = extractMeaningfulTokens(docText);

        // 1. Calibrated Dense Vector Cosine Similarity (Threshold >= 0.50)
        if (queryVector && item.embedding) {
            const vecSim = cosineSimilarity(queryVector, item.embedding);
            if (vecSim >= 0.50) {
                // Linear scale mapping [0.50, 1.0] -> [0, 8.0]
                vectorScore = Number((((vecSim - 0.50) / 0.50) * 8.0).toFixed(2));
                score += vectorScore;
            }
        }

        // 2. High-precision Token Overlap (Length >= 2, no single-character false positives)
        let matchedTokenCount = 0;
        for (const qt of qTokens) {
            if (docTokens.includes(qt) || docTitle.includes(qt)) {
                matchedTokenCount++;
            }
        }
        tokenScore = Number((matchedTokenCount * 2.5).toFixed(2));
        score += tokenScore;

        // 3. Exact Title or Category alignment
        if (docTitle.includes(qLower) || qLower.includes(docTitle)) {
            titleCategoryBonus += 4.0;
        }
        if (qLower.includes(docCategory)) {
            titleCategoryBonus += 3.5;
        }
        score += titleCategoryBonus;

        // 4. Entity Specificity & Conflict Check
        if (queryProvinces.length > 0) {
            const docHasQueriedProvince = queryProvinces.some(p => docText.includes(p));
            if (docHasQueriedProvince) {
                provinceBonus += 6.0; // High reward for matching specified province
            } else if (item.category === '录取分数') {
                provinceBonus -= 4.0; // Suppress scores of other non-queried provinces
            }
        }
        score += provinceBonus;

        // 5. Category Keyword Match Boost
        for (const [catName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
            const queryHasKw = keywords.some(kw => qLower.includes(kw));
            const docIsCat = docCategory.includes(catName) || docText.includes(catName);
            if (queryHasKw && docIsCat) {
                categoryBonus += 3.0;
            }
        }
        score += categoryBonus;

        return {
            item,
            score: Math.max(0, Number(score.toFixed(2))),
            breakdown: {
                totalScore: Math.max(0, Number(score.toFixed(2))),
                vectorScore,
                tokenScore,
                titleCategoryBonus,
                provinceBonus,
                categoryBonus
            }
        };
    });

    // Dynamic Adaptive Cutoff:
    const MIN_ABSOLUTE_THRESHOLD = 5.0; // Must have reliable semantic and/or token match
    const validMatches = scored
        .filter(s => s.score >= MIN_ABSOLUTE_THRESHOLD)
        .sort((a, b) => b.score - a.score);

    if (validMatches.length === 0) {
        await setCache(cacheKey, [], 1800);
        return [];
    }

    const maxScore = validMatches[0].score;
    // Retain only results whose score is at least 70% of the top match (drops sharp drop-offs)
    const results = validMatches
        .filter(s => s.score >= maxScore * 0.70)
        .slice(0, topK);

    await setCache(cacheKey, results, 1800);
    return results;
};

export const formatRagContext = (ragResults) => {
    if (!ragResults.length) return '';

    let ctx = `【知识库（RAG）匹配到的参考信息】：\n\n`;
    ragResults.forEach(({ item, score }, index) => {
        ctx += `${index + 1}. **${item.title}** (${item.category}) [相似度: ${(score * 10).toFixed(1)}%]\n`;
        if (item.content) ctx += `   说明：${item.content}\n`;

        if (item.tableData && item.tableData.columns && item.tableData.rows) {
            ctx += `   数据表格：\n`;
            ctx += `   | ${item.tableData.columns.join(' | ')} |\n`;
            ctx += `   | ${item.tableData.columns.map(() => '---').join(' | ')} |\n`;
            item.tableData.rows.forEach(row => {
                ctx += `   | ${row.join(' | ')} |\n`;
            });
        }

        if (item.imageAttachments && item.imageAttachments.length) {
            ctx += `   包含图片附件：\n`;
            item.imageAttachments.forEach(img => {
                ctx += `   ![${img.caption || img.name}](${img.url})\n`;
            });
        }
        ctx += `\n`;
    });

    return ctx;
};

/**
 * Isolated Agent RAG search wrapper
 */
export const searchAgentRag = async (agentKey = 'dr', query = '', topK = 3) => {
    return await searchRagEngine(query, topK, agentKey);
};

