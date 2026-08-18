// Local Web Speech Synthesis TTS Service for Campus Guide "丽丽 (Lili)"

export interface TTSState {
    isPlaying: boolean;
    isPaused: boolean;
    currentText: string;
    voiceName: string;
}

type TTSCallback = (state: TTSState) => void;

class TTSService {
    private synth: SpeechSynthesis | null = null;
    private currentUtterance: SpeechSynthesisUtterance | null = null;
    private listeners: Set<TTSCallback> = new Set();
    private voices: SpeechSynthesisVoice[] = [];
    private preferredVoice: SpeechSynthesisVoice | null = null;

    private state: TTSState = {
        isPlaying: false,
        isPaused: false,
        currentText: '',
        voiceName: ''
    };

    constructor() {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            this.synth = window.speechSynthesis;
            this.loadVoices();
            if (this.synth.onvoiceschanged !== undefined) {
                this.synth.onvoiceschanged = () => this.loadVoices();
            }
        }
    }

    private loadVoices() {
        if (!this.synth) return;
        this.voices = this.synth.getVoices();
        
        // Find best Chinese female natural voice (e.g. Xiaoxiao, Xiaoyi, Tingting, Huihui, Yaoyao, Google 普通话)
        const zhVoices = this.voices.filter(v => v.lang.includes('zh') || v.lang.includes('cmn') || v.lang.includes('CN'));
        
        const preferredNames = [
            'xiaoxiao', 'xiaoyi', 'tingting', 'huihui', 'yaoyao', 'kangkang',
            'chinese', 'mandarin', '普通话', 'google', 'microsoft'
        ];

        let chosen: SpeechSynthesisVoice | null = null;

        for (const pref of preferredNames) {
            const match = zhVoices.find(v => v.name.toLowerCase().includes(pref) && (v.name.includes('Female') || !v.name.includes('Male')));
            if (match) {
                chosen = match;
                break;
            }
        }

        if (!chosen && zhVoices.length > 0) {
            chosen = zhVoices[0];
        }

        this.preferredVoice = chosen;
        if (chosen) {
            this.state.voiceName = chosen.name;
        }
    }

    public subscribe(callback: TTSCallback): () => void {
        this.listeners.add(callback);
        callback({ ...this.state });
        return () => this.listeners.delete(callback);
    }

    private notify() {
        for (const cb of this.listeners) {
            cb({ ...this.state });
        }
    }

    public speak(text: string, onEnd?: () => void) {
        if (!this.synth) {
            console.warn('SpeechSynthesis is not supported in this browser.');
            return;
        }

        // Clean text: strip markdown symbols for natural speech
        const cleanText = text
            .replace(/[#*`_~\[\]()!>]/g, '')
            .replace(/https?:\/\/\S+/g, '')
            .trim();

        if (!cleanText) return;

        // Cancel previous speech
        this.stop();

        // Reload voices if empty
        if (!this.preferredVoice || this.voices.length === 0) {
            this.loadVoices();
        }

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'zh-CN';
        
        if (this.preferredVoice) {
            utterance.voice = this.preferredVoice;
        }

        // Tuned for a sweet, energetic young female student guide (Lili)
        utterance.rate = 1.06;   // Slightly lively speed
        utterance.pitch = 1.15;  // Higher pleasant pitch

        utterance.onstart = () => {
            this.state = {
                isPlaying: true,
                isPaused: false,
                currentText: cleanText,
                voiceName: this.preferredVoice?.name || '系统默认中文女声'
            };
            this.notify();
        };

        utterance.onend = () => {
            this.state = {
                isPlaying: false,
                isPaused: false,
                currentText: '',
                voiceName: this.preferredVoice?.name || ''
            };
            this.notify();
            if (onEnd) onEnd();
        };

        utterance.onerror = (e) => {
            console.warn('TTS playback error/interrupted:', e);
            this.state = {
                isPlaying: false,
                isPaused: false,
                currentText: '',
                voiceName: this.preferredVoice?.name || ''
            };
            this.notify();
        };

        this.currentUtterance = utterance;
        this.synth.speak(utterance);
    }

    public pause() {
        if (this.synth && this.state.isPlaying && !this.state.isPaused) {
            this.synth.pause();
            this.state.isPaused = true;
            this.notify();
        }
    }

    public resume() {
        if (this.synth && this.state.isPlaying && this.state.isPaused) {
            this.synth.resume();
            this.state.isPaused = false;
            this.notify();
        }
    }

    public stop() {
        if (this.synth) {
            this.synth.cancel();
            this.state = {
                isPlaying: false,
                isPaused: false,
                currentText: '',
                voiceName: this.preferredVoice?.name || ''
            };
            this.notify();
        }
    }

    public getState(): TTSState {
        return { ...this.state };
    }
}

export const ttsService = new TTSService();
