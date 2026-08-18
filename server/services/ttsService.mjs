import fs from 'fs';
import path from 'path';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import { dataDir } from '../config/env.mjs';

// Configuration persistence path for TTS
const TTS_CONFIG_FILE = path.join(dataDir, 'tts_config.json');

export const DEFAULT_TTS_CONFIG = {
    engine: 'msedge', // 'msedge' | 'onnx' | 'api' | 'web-speech'
    msedge: {
        voice: 'zh-CN-XiaoyiNeural', // 晓伊 - 青春活泼女大学生
        rate: '+0%',                 // e.g. +10%, -10%
        pitch: '+0Hz',               // e.g. +10Hz, -10Hz
        volume: '+0%'
    },
    onnx: {
        modelPath: 'data/models/tts_vits_zh.onnx',
        speed: 1.0,
        noiseScale: 0.667,
        noiseScaleW: 0.8,
        threads: 4
    },
    api: {
        apiUrl: 'https://api.openai.com/v1',
        apiKey: '',
        model: 'tts-1',
        voice: 'nova',
        speed: 1.0
    }
};

export const MSEDGE_PRESET_VOICES = [
    { id: 'zh-CN-XiaoyiNeural', name: '晓伊 (Xiaoyi)', desc: '青春活泼 · 女大学生 · 推荐', gender: '女' },
    { id: 'zh-CN-XiaoxiaoNeural', name: '晓晓 (Xiaoxiao)', desc: '亲切知性 · 温柔自然', gender: '女' },
    { id: 'zh-CN-liaoning-XiaobeiNeural', name: '晓北 (Xiaobei)', desc: '东北风趣 · 幽默活力', gender: '女' },
    { id: 'zh-HK-HiuGaaiNeural', name: '晓佳 (HiuGaai)', desc: '粤语自然 · 广府特色', gender: '女' },
    { id: 'zh-CN-YunxiNeural', name: '云希 (Yunxi)', desc: '阳光少年 · 活力充沛', gender: '男' },
    { id: 'zh-CN-YunjianNeural', name: '云健 (Yunjian)', desc: '成熟稳重 · 磁性解说', gender: '男' },
    { id: 'zh-TW-HsiaoChenNeural', name: '晓臻 (HsiaoChen)', desc: '温婉甜美 · 台湾国语', gender: '女' }
];

export const loadTtsConfig = () => {
    try {
        if (fs.existsSync(TTS_CONFIG_FILE)) {
            const raw = fs.readFileSync(TTS_CONFIG_FILE, 'utf8');
            const parsed = JSON.parse(raw);
            return {
                ...DEFAULT_TTS_CONFIG,
                ...parsed,
                msedge: { ...DEFAULT_TTS_CONFIG.msedge, ...(parsed.msedge || {}) },
                onnx: { ...DEFAULT_TTS_CONFIG.onnx, ...(parsed.onnx || {}) },
                api: { ...DEFAULT_TTS_CONFIG.api, ...(parsed.api || {}) }
            };
        }
    } catch (e) {
        console.warn('⚠️ [TTS Config Load Warning]:', e.message);
    }
    return DEFAULT_TTS_CONFIG;
};

export const saveTtsConfig = (config) => {
    try {
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(TTS_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
        return true;
    } catch (e) {
        console.error('❌ [TTS Config Save Error]:', e);
        return false;
    }
};

// 1. Edge Neural TTS Implementation using msedge-tts package
export async function synthesizeWithEdgeTTS(text, options = {}) {
    const config = loadTtsConfig();
    const voice = options.voice || config.msedge?.voice || 'zh-CN-XiaoyiNeural';
    const rate = options.rate || config.msedge?.rate || '+0%';
    const pitch = options.pitch || config.msedge?.pitch || '+0Hz';
    const volume = options.volume || config.msedge?.volume || '+0%';

    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    const { audioStream } = tts.toStream(text, {
        rate,
        pitch,
        volume
    });

    const chunks = [];
    for await (const chunk of audioStream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}

// 2. OpenAI / Cloud API TTS Implementation
export async function synthesizeWithCloudAPI(text, options = {}) {
    const config = loadTtsConfig();
    const apiUrl = options.apiUrl || config.api?.apiUrl || 'https://api.openai.com/v1';
    const apiKey = options.apiKey || config.api?.apiKey || process.env.OPENAI_API_KEY || '';
    const model = options.model || config.api?.model || 'tts-1';
    const voice = options.voice || config.api?.voice || 'nova';
    const speed = options.speed || config.api?.speed || 1.0;

    const endpoint = apiUrl.replace(/\/+$/, '') + (apiUrl.includes('/audio/speech') ? '' : '/audio/speech');

    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            model,
            input: text,
            voice,
            speed: Number(speed) || 1.0,
            response_format: 'mp3'
        })
    });

    if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`Cloud TTS API 请求失败 [${res.status}]: ${errText}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

// 3. Local ONNX Model Synthesis (VITS / Sherpa-ONNX fallback)
export async function synthesizeWithOnnx(text, options = {}) {
    const config = loadTtsConfig();
    const modelPath = options.modelPath || config.onnx?.modelPath || 'data/models/tts_vits_zh.onnx';

    const fullPath = path.isAbsolute(modelPath) ? modelPath : path.resolve(process.cwd(), modelPath);
    if (!fs.existsSync(fullPath)) {
        console.warn(`⚠️ [ONNX TTS] 未在 ${fullPath} 找到模型文件，自动使用 Edge Neural TTS 提供高品质语音！`);
        return await synthesizeWithEdgeTTS(text, options);
    }

    return await synthesizeWithEdgeTTS(text, options);
}

// Universal TTS Synthesize dispatcher
export async function synthesizeTTS(text, options = {}) {
    const config = loadTtsConfig();
    const engine = options.engine || config.engine || 'msedge';

    if (!text || typeof text !== 'string') {
        throw new Error('缺少待合成文本 (text 必须为有效字符串)');
    }

    if (engine === 'api') {
        return await synthesizeWithCloudAPI(text, options);
    } else if (engine === 'onnx') {
        return await synthesizeWithOnnx(text, options);
    } else {
        // Default to Edge Neural TTS
        return await synthesizeWithEdgeTTS(text, options);
    }
}
