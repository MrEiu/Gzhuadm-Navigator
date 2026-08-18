// Multi-engine TTS Player for Campus Guide "丽丽 (Lili)"
// Supports: Server-side Edge Neural TTS / Cloud API / Local ONNX / Browser Web Speech fallback

import { API_BASE } from '../api/config';

export interface TTSState {
    isPlaying: boolean;
    isPaused: boolean;
    currentText: string;
    voiceName: string;
    engine: string;
}

type TTSCallback = (state: TTSState) => void;

class TTSService {
    private audioElement: HTMLAudioElement | null = null;
    private audioUrl: string | null = null;
    private synth: SpeechSynthesis | null = null;
    private currentUtterance: SpeechSynthesisUtterance | null = null;
    private listeners: Set<TTSCallback> = new Set();
    private voices: SpeechSynthesisVoice[] = [];
    private preferredVoice: SpeechSynthesisVoice | null = null;

    private state: TTSState = {
        isPlaying: false,
        isPaused: false,
        currentText: '',
        voiceName: '微软晓伊 (Neural 活泼女大)',
        engine: 'msedge'
    };

    constructor() {
        if (typeof window !== 'undefined') {
            this.audioElement = new Audio();
            this.audioElement.onended = () => {
                this.handleEnded();
            };
            this.audioElement.onerror = () => {
                this.handleEnded();
            };

            if ('speechSynthesis' in window) {
                this.synth = window.speechSynthesis;
                this.loadVoices();
                if (this.synth.onvoiceschanged !== undefined) {
                    this.synth.onvoiceschanged = () => this.loadVoices();
                }
            }
        }
    }

    private loadVoices() {
        if (!this.synth) return;
        this.voices = this.synth.getVoices();
        const zhVoices = this.voices.filter(v => v.lang.includes('zh') || v.lang.includes('cmn') || v.lang.includes('CN'));
        const preferredNames = ['xiaoxiao', 'xiaoyi', 'tingting', 'huihui', 'yaoyao', 'chinese', '普通话', 'google', 'microsoft'];

        let chosen: SpeechSynthesisVoice | null = null;
        for (const pref of preferredNames) {
            const match = zhVoices.find(v => v.name.toLowerCase().includes(pref) && (v.name.includes('Female') || !v.name.includes('Male')));
            if (match) { chosen = match; break; }
        }
        if (!chosen && zhVoices.length > 0) chosen = zhVoices[0];
        this.preferredVoice = chosen;
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

    private handleEnded(onEnd?: () => void) {
        if (this.audioUrl) {
            URL.revokeObjectURL(this.audioUrl);
            this.audioUrl = null;
        }
        this.state = {
            ...this.state,
            isPlaying: false,
            isPaused: false,
            currentText: ''
        };
        this.notify();
        if (onEnd) onEnd();
    }

    public async speak(text: string, onEnd?: () => void) {
        const cleanText = text
            .replace(/[#*`_~\[\]()!>]/g, '')
            .replace(/https?:\/\/\S+/g, '')
            .trim();

        if (!cleanText) return;
        this.stop();

        // 1. Try Server-side Synthesis first (Edge Neural / Cloud API / ONNX)
        try {
            const res = await fetch(`${API_BASE}/api/tts/synthesize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: cleanText })
            });

            if (res.ok) {
                const blob = await res.blob();
                if (blob.size > 100) {
                    if (this.audioUrl) URL.revokeObjectURL(this.audioUrl);
                    this.audioUrl = URL.createObjectURL(blob);

                    if (this.audioElement) {
                        this.audioElement.src = this.audioUrl;
                        this.audioElement.onended = () => this.handleEnded(onEnd);
                        await this.audioElement.play();

                        this.state = {
                            isPlaying: true,
                            isPaused: false,
                            currentText: cleanText,
                            voiceName: '微软晓伊 (Neural 活泼女大)',
                            engine: 'msedge'
                        };
                        this.notify();
                        return;
                    }
                }
            }
        } catch (e) {
            console.warn('Server TTS synthesis failed, fallback to browser Web Speech API:', e);
        }

        // 2. Fallback to Browser native Web Speech API
        if (this.synth) {
            if (!this.preferredVoice || this.voices.length === 0) {
                this.loadVoices();
            }

            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.lang = 'zh-CN';
            if (this.preferredVoice) utterance.voice = this.preferredVoice;
            utterance.rate = 1.06;
            utterance.pitch = 1.15;

            utterance.onstart = () => {
                this.state = {
                    isPlaying: true,
                    isPaused: false,
                    currentText: cleanText,
                    voiceName: this.preferredVoice?.name || '本地系统中文女声',
                    engine: 'web-speech'
                };
                this.notify();
            };

            utterance.onend = () => {
                this.handleEnded(onEnd);
            };

            utterance.onerror = () => {
                this.handleEnded(onEnd);
            };

            this.currentUtterance = utterance;
            this.synth.speak(utterance);
        }
    }

    public pause() {
        if (this.audioElement && this.state.isPlaying && !this.state.isPaused && !this.synth?.speaking) {
            this.audioElement.pause();
            this.state.isPaused = true;
            this.notify();
        } else if (this.synth && this.state.isPlaying && !this.state.isPaused) {
            this.synth.pause();
            this.state.isPaused = true;
            this.notify();
        }
    }

    public resume() {
        if (this.audioElement && this.state.isPlaying && this.state.isPaused) {
            this.audioElement.play();
            this.state.isPaused = false;
            this.notify();
        } else if (this.synth && this.state.isPlaying && this.state.isPaused) {
            this.synth.resume();
            this.state.isPaused = false;
            this.notify();
        }
    }

    public stop() {
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.currentTime = 0;
        }
        if (this.audioUrl) {
            URL.revokeObjectURL(this.audioUrl);
            this.audioUrl = null;
        }
        if (this.synth) {
            this.synth.cancel();
        }
        this.state = {
            ...this.state,
            isPlaying: false,
            isPaused: false,
            currentText: ''
        };
        this.notify();
    }

    public getState(): TTSState {
        return { ...this.state };
    }
}

export const ttsService = new TTSService();
