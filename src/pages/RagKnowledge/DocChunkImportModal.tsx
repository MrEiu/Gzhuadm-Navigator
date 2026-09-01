import React, { useState, useMemo } from 'react';
import {
    FileUp, X, FileText, Table, Upload,
    Scissors, Layers, Check, Edit3, Trash2,
    Sparkles, RefreshCw, Plus, CheckSquare,
    Square, Save, Settings2, Eye, EyeOff, Wand2,
    Info, AlertCircle
} from 'lucide-react';
import { DocumentChunk } from '../../types';
import { API_BASE } from '../../api/config';
import { ChunkSingleEditor } from './ChunkSingleEditor';

interface DocChunkImportModalProps {
    isOpen?: boolean;
    onClose: () => void;
    onSaveChunks?: (chunksToSave: DocumentChunk[]) => Promise<void> | void;
    onBatchSave?: (chunksToSave: DocumentChunk[]) => Promise<void> | void;
    onRefresh?: () => void;
}

const DEFAULT_AI_PROMPT = `你是一位专业的 RAG 知识库构建与语义切片专家。请将以下文档内容拆分为 3~15 个逻辑独立、语义连贯的知识切片。

对于每一个切片，必须提取：
1. title: 简洁切片标题
2. category: 分类（如：录取分数、专业介绍、宿舍环境、学费奖学金、校园生活等）
3. type: 'text' 或 'table'
4. content: 提炼后的核心内容
5. tags: 3~6 个适合向量检索的检索关键词数组`;

const PROMPT_PRESETS = [
    {
        name: '🎓 通用知识切片',
        prompt: `你是一位专业的 RAG 知识库构建与语义切片专家。请将以下文档内容拆分为 3~15 个逻辑独立、语义连贯的知识切片。
每个切片提取简洁标题、准确分类、提炼后的核心内容以及 3~6 个检索标签。`
    },
    {
        name: '❓ QA 问答对模式',
        prompt: `你是一位高校问答专家。请将以下文档内容转化为高质量的 QA 问答对切片。
切片的 title 为考生或新生最可能询问的具体问题（如：请问广州大学宿舍有空调和热水吗？），content 为详尽权威的解答，category 根据内容匹配分类，tags 包含 3~5 个关键词。`
    },
    {
        name: '📌 精炼重点要点',
        prompt: `请将以下长文本细化拆解为多个精简知识点。剔除无意义的客套话与废话，每个切片聚焦于一条具体规则、一个具体专业或一个具体政策，用清晰准确的条目形式呈现。`
    },
    {
        name: '📜 招生与规程细则',
        prompt: `请针对高校招生章程与管理条例进行结构化切片。严格保留文件中的年份、分值、比例、限制条件、违纪条款等关键数据与权威表述，切片标题注明具体条款或章节。`
    }
];

const SEPARATOR_PRESETS = [
    { label: '\\n\\n (双换行段落)', value: '\\n\\n' },
    { label: '\\n (单换行每行)', value: '\\n' },
    { label: '--- (Markdown分割线)', value: '---' },
    { label: '=== (双等号分割线)', value: '===' },
    { label: '### (三级标题)', value: '###' },
    { label: '； (分号分割)', value: '；' },
    { label: '。 (句号分割)', value: '。' },
    { label: '| (表格管道符)', value: '|' }
];

// --- 纯前端本地即时切片引擎 (彻底避免网络延迟或服务端缓存滞后) ---
function chunkDocumentClient({
    text,
    filename,
    mode,
    chunkSize = 400,
    targetAgent = 'all',
    separator = '\\n\\n'
}: {
    text: string;
    filename?: string;
    mode: 'heading' | 'line' | 'punctuation' | 'separator' | 'length' | 'ai';
    chunkSize?: number;
    targetAgent?: string;
    separator?: string;
}): DocumentChunk[] {
    const rawText = text.trim();
    if (!rawText) return [];

    const titlePrefix = filename ? filename.replace(/\.[^/.]+$/, '') : '知识条目';
    const chunks: DocumentChunk[] = [];

    const makeChunk = (content: string, idx: number, label: string) => {
        const trimmed = content.trim();
        if (!trimmed) return null;

        let title = `${titlePrefix} - ${label} ${idx + 1}`;
        const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
        const firstLine = (lines[0] || '').replace(/^[#\s\-*【\d.、]+/, '').replace(/[】]/, '').trim();
        if (firstLine && firstLine.length <= 35) {
            title = `${titlePrefix} - ${firstLine}`;
        } else if (firstLine && firstLine.length > 35) {
            title = `${titlePrefix} - ${firstLine.slice(0, 30)}...`;
        }

        let category = '通用资料';
        let assignedTargetAgent = targetAgent || 'all';

        if (/录取|分数|排位|省控|切线|批次|投档|位次/.test(trimmed)) {
            category = '录取分与位次';
            if (assignedTargetAgent === 'all') assignedTargetAgent = 'score_risk';
        } else if (/选科|物理|化学|历史|生物|地理|政治|限制|必选|体检|色盲|色弱/.test(trimmed)) {
            category = '选科与招考政策';
            if (assignedTargetAgent === 'all') assignedTargetAgent = 'subject_rule';
        } else if (/就业|起薪|工资|大厂|校招|薪酬|招聘|行业发展/.test(trimmed)) {
            category = '就业与行业薪酬';
            if (assignedTargetAgent === 'all') assignedTargetAgent = 'career_market';
        } else if (/考公|公务员|考编|事业单位|编制|国考|省考|选调/.test(trimmed)) {
            category = '考公考编体制内';
            if (assignedTargetAgent === 'all') assignedTargetAgent = 'civil_service';
        } else if (/考研|保研|读研|升学|硕士|博士|推免|985|211|双一流/.test(trimmed)) {
            category = '考研保研深造';
            if (assignedTargetAgent === 'all') assignedTargetAgent = 'postgrad_study';
        } else if (/高数|难学|编程|代码|数学|挂科|课程|实验|实训|学分/.test(trimmed)) {
            category = '课业难度体验';
            if (assignedTargetAgent === 'all') assignedTargetAgent = 'curriculum_study';
        } else if (/转专业|调剂|冷门|退路|辅修|双学位|绩点|GPA/.test(trimmed)) {
            category = '转专业与退路';
            if (assignedTargetAgent === 'all') assignedTargetAgent = 'transfer_policy';
        } else if (/宿舍|公寓|四人间|空调|独卫|门禁|宿管|洗衣机|食堂|饭堂/.test(trimmed)) {
            category = '校园生活设施';
            if (assignedTargetAgent === 'all') assignedTargetAgent = 'campus_life';
        } else if (/学费|费用|住宿费|多少钱|中外合作|奖学金|助学金|贷款|资助/.test(trimmed)) {
            category = '学费与资助政策';
            if (assignedTargetAgent === 'all') assignedTargetAgent = 'finance_aid';
        } else if (/父母|家里|爸妈|意见|冲突|焦虑|压力|城市|广州/.test(trimmed)) {
            category = '志愿与家庭诉求';
            if (assignedTargetAgent === 'all') assignedTargetAgent = 'psych_family';
        } else if (/地图|打卡|雕塑园|中心湖|落羽杉|探店|周边|景点/.test(trimmed)) {
            category = '校园地图伴游导览';
            if (assignedTargetAgent === 'all') assignedTargetAgent = 'lili_guide';
        }

        const tags = [titlePrefix, category];
        const words = trimmed.match(/[\u4e00-\u9fa5]{2,6}/g) || [];
        const freq: Record<string, number> = {};
        words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
        const topWords = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 4).map(e => e[0]);
        topWords.forEach(w => { if (!tags.includes(w)) tags.push(w); });

        return {
            id: `chunk-${label}-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
            title,
            category,
            targetAgent: assignedTargetAgent,
            type: 'text' as const,
            content: trimmed,
            tableData: null,
            imageAttachments: [],
            tags,
            saved: false
        };
    };

    // 1. 按行切片 (line)
    if (mode === 'line') {
        const rawLines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        rawLines.forEach((line, idx) => {
            const chunk = makeChunk(line, idx, '行');
            if (chunk) chunks.push(chunk);
        });
        return chunks;
    }

    // 2. 按标点符号与语句切片 (punctuation)
    if (mode === 'punctuation') {
        const sentenceRegex = /[^。！？!?；;\n]+[。！？!?；;\n]*/g;
        const rawSentences = rawText.match(sentenceRegex) || [rawText];
        let currentMerged = '';
        let count = 0;

        for (let i = 0; i < rawSentences.length; i++) {
            const s = rawSentences[i].trim();
            if (!s) continue;
            if (currentMerged.length > 0 && currentMerged.length + s.length < 120) {
                currentMerged += (/[。！？!?；;]$/.test(currentMerged) ? '' : ' ') + s;
            } else {
                if (currentMerged.trim()) {
                    const chunk = makeChunk(currentMerged, count++, '语句');
                    if (chunk) chunks.push(chunk);
                }
                currentMerged = s;
            }
        }
        if (currentMerged.trim()) {
            const chunk = makeChunk(currentMerged, count++, '语句');
            if (chunk) chunks.push(chunk);
        }
        return chunks;
    }

    // 3. 按指定间隔符/自定义分隔符切片 (separator)
    if (mode === 'separator' && separator) {
        let unescapedSep = separator
            .replace(/\\n/g, '\n')
            .replace(/\\t/g, '\t')
            .replace(/\\r/g, '\r');

        const rawParts = rawText.split(unescapedSep).map(p => p.trim()).filter(Boolean);
        rawParts.forEach((part, idx) => {
            const chunk = makeChunk(part, idx, '分隔段');
            if (chunk) chunks.push(chunk);
        });
        return chunks;
    }

    // 4. 按 Markdown 标题或章节切片 (heading)
    if (mode === 'heading' || mode === 'ai') {
        let sections = rawText.split(/(?=(?:^|\n)\s*#{1,6}\s+)/).filter(s => s && s.trim());
        if (sections.length <= 1) {
            sections = rawText.split(/(?=(?:^|\n)\s*(?:#{1,6}\s*|第[一二三四五六七八九十0-9]+[章节篇]|【|\d+\.\s+))/).filter(s => s && s.trim());
        }
        if (sections.length <= 1) {
            sections = rawText.split(/\n\s*\n/).filter(s => s && s.trim());
        }
        if (sections.length > 1) {
            sections.forEach((sec, idx) => {
                const chunk = makeChunk(sec, idx, '章节');
                if (chunk) chunks.push(chunk);
            });
            return chunks;
        }
    }

    // 5. 固定字数切片 (length) / 兜底
    const size = parseInt(String(chunkSize), 10) || 400;
    const words = rawText.split('');
    let currentChunk = '';
    let chunkIndex = 0;

    for (let i = 0; i < words.length; i++) {
        currentChunk += words[i];
        if (currentChunk.length >= size && (/[。！？\n]/.test(words[i]) || currentChunk.length >= size + 50)) {
            const chunk = makeChunk(currentChunk, chunkIndex++, '分段');
            if (chunk) chunks.push(chunk);
            currentChunk = '';
        }
    }
    if (currentChunk.trim()) {
        const chunk = makeChunk(currentChunk, chunkIndex++, '分段');
        if (chunk) chunks.push(chunk);
    }

    return chunks;
}

// 隐藏字符可视化显示工具
function formatVisibleText(text: string, showHidden: boolean): string {
    if (!showHidden) return text;
    return text
        .replace(/ /g, '·')
        .replace(/\t/g, '⇥\t')
        .replace(/\r\n/g, '↵\n')
        .replace(/\n/g, '↵\n')
        .replace(/\u200B/g, '‹零宽›')
        .replace(/\uFEFF/g, '‹BOM›')
        .replace(/\u00A0/g, '‹不换行空格›');
}

export const DocChunkImportModal: React.FC<DocChunkImportModalProps> = ({
    onClose,
    onSaveChunks,
    onBatchSave,
    onRefresh
}) => {
    const [importType, setImportType] = useState<'doc' | 'table'>('doc');
    const [inputText, setInputText] = useState('');
    const [fileName, setFileName] = useState('');
    const [targetAgent, setTargetAgent] = useState('all');

    // 切片模式配置
    const [chunkMode, setChunkMode] = useState<'ai' | 'heading' | 'line' | 'punctuation' | 'separator' | 'length'>('ai');
    const [chunkSize, setChunkSize] = useState(400);
    const [separator, setSeparator] = useState('\\n\\n');

    // 隐藏字符显示开关
    const [showHiddenChars, setShowHiddenChars] = useState(false);

    // AI 提示词状态
    const [customPrompt, setCustomPrompt] = useState(DEFAULT_AI_PROMPT);
    const [showPromptEditor, setShowPromptEditor] = useState(false);

    // 解析切片列表与交互状态
    const [parsedChunks, setParsedChunks] = useState<DocumentChunk[]>([]);
    const [selectedChunkIds, setSelectedChunkIds] = useState<Set<string>>(new Set());
    const [editingChunkIdx, setEditingChunkIdx] = useState<number | null>(null);
    const [savingChunkIds, setSavingChunkIds] = useState<Set<string>>(new Set());
    const [isParsing, setIsParsing] = useState(false);
    const [isBatchSaving, setIsBatchSaving] = useState(false);

    // 实时检测文本中的隐藏字符与分隔符统计
    const stats = useMemo(() => {
        const lineCount = (inputText.match(/\n/g) || []).length;
        const punctuationCount = (inputText.match(/[。！？!?；;]/g) || []).length;
        const zeroWidthCount = (inputText.match(/[\u200B\u200C\u200D\uFEFF]/g) || []).length;
        
        let separatorMatchCount = 0;
        if (chunkMode === 'separator' && separator) {
            try {
                const unescaped = separator.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\r/g, '\r');
                separatorMatchCount = inputText.split(unescaped).length - 1;
            } catch {}
        }
        return { lineCount, punctuationCount, zeroWidthCount, separatorMatchCount };
    }, [inputText, chunkMode, separator]);

    // 一键清理隐藏零宽字符与杂质
    const handleCleanInvisibleChars = () => {
        const cleaned = inputText
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .replace(/[\u200B\u200C\u200D\uFEFF]/g, '')
            .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, ' ');
        setInputText(cleaned);
        alert('已清除文本中的零宽空格、BOM 标记并统一换行符！');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = String(event.target?.result || '');
            setInputText(content);
        };
        reader.readAsText(file);
    };

    const handleParse = async () => {
        if (!inputText.trim()) {
            alert('请上传文件或粘贴文本内容');
            return;
        }

        setIsParsing(true);
        try {
            if (importType === 'doc') {
                // 如果是 AI 模式，先尝试调用后端 AI 接口；如果不是 AI 模式，直接在本地即时执行精准切片
                if (chunkMode === 'ai') {
                    try {
                        const res = await fetch(`${API_BASE}/api/admin/parse-document`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                text: inputText,
                                filename: fileName,
                                mode: 'ai',
                                chunkSize,
                                targetAgent,
                                customPrompt
                            })
                        });
                        const data = await res.json();
                        if (data.ok && Array.isArray(data.chunks) && data.chunks.length > 0 && data.source === 'ai-gateway') {
                            const mapped = data.chunks.map((c: DocumentChunk) => ({ ...c, saved: false }));
                            setParsedChunks(mapped);
                            setSelectedChunkIds(new Set(mapped.map((c: DocumentChunk) => c.id)));
                            return;
                        }
                    } catch (aiErr) {
                        console.warn('AI Parsing gateway fallback to local rules:', aiErr);
                    }
                }

                // 本地极速规则切片（无论是 line, punctuation, separator, heading, length 还是 AI 降级）
                const localChunks = chunkDocumentClient({
                    text: inputText,
                    filename: fileName,
                    mode: chunkMode,
                    chunkSize,
                    targetAgent,
                    separator
                });

                if (localChunks.length > 0) {
                    setParsedChunks(localChunks);
                    setSelectedChunkIds(new Set(localChunks.map(c => c.id)));
                } else {
                    alert('未能切分出有效内容，请检查输入文本或分隔符配置');
                }
            } else {
                // 表格解析
                const res = await fetch(`${API_BASE}/api/admin/parse-table`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        csvText: inputText,
                        filename: fileName
                    })
                });
                const data = await res.json();
                if (data.ok && data.tableData) {
                    const tableChunk: DocumentChunk = {
                        id: `table-chunk-${Date.now()}`,
                        title: data.title || '导入表格数据',
                        category: '表格数据',
                        type: 'table',
                        targetAgent,
                        content: `导入表格包含 ${data.tableData.columns.join(' / ')}`,
                        tableData: data.tableData,
                        imageAttachments: [],
                        tags: [data.title || '表格', '表格数据'],
                        saved: false
                    };
                    setParsedChunks([tableChunk]);
                    setSelectedChunkIds(new Set([tableChunk.id]));
                } else {
                    alert('表格解析异常：' + (data.error || '未知错误'));
                }
            }
        } catch (err) {
            console.error('Parse failed:', err);
            // 兜底本地切片
            const fallbackChunks = chunkDocumentClient({
                text: inputText,
                filename: fileName,
                mode: chunkMode,
                chunkSize,
                targetAgent,
                separator
            });
            if (fallbackChunks.length > 0) {
                setParsedChunks(fallbackChunks);
                setSelectedChunkIds(new Set(fallbackChunks.map(c => c.id)));
            } else {
                alert('解析遇到问题，请检查文本');
            }
        } finally {
            setIsParsing(false);
        }
    };

    // 单个切片保存
    const handleSaveSingleChunk = async (chunk: DocumentChunk, idx: number) => {
        setSavingChunkIds(prev => new Set(prev).add(chunk.id));
        try {
            const res = await fetch(`${API_BASE}/api/admin/save-chunks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chunks: [chunk] })
            });
            const data = await res.json();
            if (data.ok) {
                setParsedChunks(prev => {
                    const next = [...prev];
                    next[idx] = { ...next[idx], saved: true };
                    return next;
                });
                onRefresh?.();
            } else {
                alert(data.error || '保存切片失败');
            }
        } catch (err) {
            console.error('Save single chunk failed:', err);
            alert('单独保存切片异常');
        } finally {
            setSavingChunkIds(prev => {
                const next = new Set(prev);
                next.delete(chunk.id);
                return next;
            });
        }
    };

    // 批量保存（选中或全部）
    const executeBatchSave = async (chunksToSave: DocumentChunk[]) => {
        if (chunksToSave.length === 0) {
            alert('没有待保存的切片');
            return;
        }

        setIsBatchSaving(true);
        try {
            if (onSaveChunks) {
                await onSaveChunks(chunksToSave);
            } else if (onBatchSave) {
                await onBatchSave(chunksToSave);
            } else {
                const res = await fetch(`${API_BASE}/api/admin/save-chunks`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chunks: chunksToSave })
                });
                const data = await res.json();
                if (data.ok) {
                    alert(`成功保存 ${data.count} 条切片入库！`);
                    onRefresh?.();
                    onClose();
                } else {
                    alert(data.error || '批量保存失败');
                }
            }
        } catch (err) {
            console.error('Batch save failed:', err);
            alert('保存切片时发生错误');
        } finally {
            setIsBatchSaving(false);
        }
    };

    const handleSaveAll = () => {
        executeBatchSave(parsedChunks);
    };

    const handleSaveSelected = () => {
        const selected = parsedChunks.filter(c => selectedChunkIds.has(c.id));
        if (selected.length === 0) {
            alert('请先勾选需要保存的切片');
            return;
        }
        executeBatchSave(selected);
    };

    const handleUpdateChunk = (idx: number, updatedChunk: DocumentChunk) => {
        const next = [...parsedChunks];
        next[idx] = updatedChunk;
        setParsedChunks(next);
        setEditingChunkIdx(null);
    };

    const handleDiscardChunk = (idx: number) => {
        const target = parsedChunks[idx];
        setParsedChunks(prev => prev.filter((_, i) => i !== idx));
        if (target) {
            setSelectedChunkIds(prev => {
                const next = new Set(prev);
                next.delete(target.id);
                return next;
            });
        }
    };

    const handleDiscardAll = () => {
        if (!confirm('确定要清空并舍弃当前所有切片预览吗？')) return;
        setParsedChunks([]);
        setSelectedChunkIds(new Set());
    };

    const handleAddNewChunk = () => {
        const newChunk: DocumentChunk = {
            id: `chunk-manual-${Date.now()}`,
            title: `${fileName ? fileName.replace(/\.[^/.]+$/, '') : '知识条目'} - 新切片 ${parsedChunks.length + 1}`,
            category: '通用资料',
            targetAgent,
            type: 'text',
            content: '',
            imageAttachments: [],
            tags: [fileName ? fileName.replace(/\.[^/.]+$/, '') : '知识切片'],
            saved: false
        };
        setParsedChunks(prev => [...prev, newChunk]);
        setSelectedChunkIds(prev => new Set(prev).add(newChunk.id));
        setEditingChunkIdx(parsedChunks.length);
    };

    const handleToggleSelectChunk = (id: string) => {
        setSelectedChunkIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleToggleSelectAll = () => {
        if (selectedChunkIds.size === parsedChunks.length) {
            setSelectedChunkIds(new Set());
        } else {
            setSelectedChunkIds(new Set(parsedChunks.map(c => c.id)));
        }
    };

    const savedCount = parsedChunks.filter(c => c.saved).length;

    return (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex justify-center items-center p-4">
            <div className="bg-white/95 rounded-[36px] max-w-[840px] w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl border border-white space-y-4 animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-purple-50 pb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#9e8fe3] to-[#e4a0b7] text-white flex items-center justify-center shadow-md">
                            <FileUp size={22} />
                        </div>
                        <div>
                            <h3 className="font-black text-[#4a4365] text-[17px] flex items-center gap-2">
                                智能文件解析与 RAG 切片管理
                            </h3>
                            <p className="text-[11px] text-[#8a84a4] mt-0.5">
                                支持 AI 语义切片、按行分割、标点语句切片、间隔符规则分割及隐藏字符可视检测
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all cursor-pointer"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Input & Chunk Settings Controls */}
                <div className="space-y-3 bg-[#faf9fe] p-4 rounded-3xl border border-purple-100/70">
                    {/* Mode Radios */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-100/50 pb-3">
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-1.5 text-[13px] font-bold text-[#4a4365] cursor-pointer">
                                <input
                                    type="radio"
                                    name="importType"
                                    checked={importType === 'doc'}
                                    onChange={() => setImportType('doc')}
                                    className="accent-[#8b79d9]"
                                />
                                <FileText size={15} className="text-purple-600" /> 文本与文档切片
                            </label>
                            <label className="flex items-center gap-1.5 text-[13px] font-bold text-[#4a4365] cursor-pointer">
                                <input
                                    type="radio"
                                    name="importType"
                                    checked={importType === 'table'}
                                    onChange={() => setImportType('table')}
                                    className="accent-[#8b79d9]"
                                />
                                <Table size={15} className="text-pink-600" /> 表格解析 (CSV, JSON)
                            </label>
                        </div>

                        {/* Target Agent Selector */}
                        <div className="flex items-center gap-2 text-[12px]">
                            <span className="font-bold text-gray-500">知识归属:</span>
                            <select
                                value={targetAgent}
                                onChange={(e) => setTargetAgent(e.target.value)}
                                className="bg-white border border-purple-100 rounded-xl px-2.5 py-1 text-purple-950 font-bold outline-none text-[12px] shadow-xs cursor-pointer"
                            >
                                <option value="all">全部智能体通用</option>
                                <option value="dr">招生办主任 (官方答疑)</option>
                                <option value="dorm">宿舍管家 (生活住宿)</option>
                                <option value="counselor">辅导员 (学业心理)</option>
                                <option value="senior_boy">师兄 (就读经验)</option>
                                <option value="senior_girl">师姐 (校园生活)</option>
                            </select>
                        </div>
                    </div>

                    {/* File Upload & Mode Bar */}
                    <div className="flex flex-wrap gap-2.5 items-center justify-between">
                        <div className="flex items-center gap-2">
                            <label className="bg-[#4a4365] text-white px-3.5 py-1.5 rounded-xl text-[12px] font-bold cursor-pointer hover:bg-[#342e49] shadow-xs transition-all flex items-center gap-1.5">
                                <Upload size={14} /> 选择本地文件
                                <input type="file" accept=".txt,.md,.doc,.docx,.csv,.json" onChange={handleFileChange} className="hidden" />
                            </label>
                            {fileName && (
                                <span className="text-[12px] font-bold text-[#7d6bb8] bg-purple-100/70 px-3 py-1 rounded-lg">
                                    📄 {fileName}
                                </span>
                            )}
                        </div>

                        {importType === 'doc' && (
                            <div className="flex flex-wrap items-center gap-2 text-[12px]">
                                <span className="font-bold text-gray-600">切片方式:</span>
                                <select
                                    value={chunkMode}
                                    onChange={(e) => setChunkMode(e.target.value as any)}
                                    className="bg-white border border-purple-200 rounded-xl px-3 py-1.5 text-[#4a4365] font-bold outline-none text-[12px] shadow-xs cursor-pointer"
                                >
                                    <option value="ai">🤖 智能语义切片 (AI 大模型提炼)</option>
                                    <option value="heading">📑 Markdown 标题章节</option>
                                    <option value="line">↵ 按换行分行切片 (逐行切分)</option>
                                    <option value="punctuation">💬 按标点与语句切片 (句号/感叹号/问号/分号)</option>
                                    <option value="separator">✂️ AI 常用间隔符 / 自定义分隔符</option>
                                    <option value="length">📏 固定字数切片</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Real-time Match & Detection Status Indicator */}
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-purple-50/70 px-3 py-2 rounded-xl text-[11px] text-purple-900 border border-purple-100">
                        <div className="flex items-center gap-2">
                            <Info size={13} className="text-purple-600" />
                            <span>
                                当前模式: <b className="text-purple-700">
                                    {chunkMode === 'ai' && 'AI 语义提炼'}
                                    {chunkMode === 'heading' && 'Markdown 标题章节'}
                                    {chunkMode === 'line' && `按行切分 (检测到 ${stats.lineCount} 处换行)`}
                                    {chunkMode === 'punctuation' && `按标点切分 (检测到 ${stats.punctuationCount} 处句子标点)`}
                                    {chunkMode === 'separator' && `间隔符切分 (匹配到 ${stats.separatorMatchCount} 处分隔符)`}
                                    {chunkMode === 'length' && `固定每 ${chunkSize} 字切片`}
                                </b>
                            </span>
                            {stats.zeroWidthCount > 0 && (
                                <span className="text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                    <AlertCircle size={12} /> 发现 {stats.zeroWidthCount} 个零宽隐藏字符
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setShowHiddenChars(!showHiddenChars)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all border ${
                                    showHiddenChars
                                        ? 'bg-purple-600 text-white border-purple-600'
                                        : 'bg-white text-purple-700 border-purple-200 hover:bg-purple-100'
                                }`}
                                title="在预览中显示 ↵换行、·空格、⇥制表符及零宽隐藏字符"
                            >
                                {showHiddenChars ? <Eye size={12} /> : <EyeOff size={12} />}
                                {showHiddenChars ? '隐藏可见标记' : '显示不可见/隐藏字符'}
                            </button>

                            {stats.zeroWidthCount > 0 && (
                                <button
                                    type="button"
                                    onClick={handleCleanInvisibleChars}
                                    className="bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                                >
                                    <Wand2 size={12} /> 清理零宽杂质
                                </button>
                            )}
                        </div>
                    </div>

                    {/* AI Prompt Customization Section */}
                    {importType === 'doc' && chunkMode === 'ai' && (
                        <div className="bg-white p-3.5 rounded-2xl border border-purple-200/80 space-y-2.5 shadow-xs animate-in fade-in duration-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sparkles size={15} className="text-purple-600" />
                                    <span className="text-[12px] font-bold text-[#4a4365]">AI 切片提示词设定 (可临时修改)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowPromptEditor(!showPromptEditor)}
                                        className="text-[11px] font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 cursor-pointer"
                                    >
                                        <Settings2 size={13} /> {showPromptEditor ? '收起提示词' : '编辑提示词'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCustomPrompt(DEFAULT_AI_PROMPT)}
                                        className="text-[11px] font-bold text-gray-400 hover:text-gray-600 flex items-center gap-1 cursor-pointer"
                                    >
                                        <RefreshCw size={12} /> 恢复默认
                                    </button>
                                </div>
                            </div>

                            {/* Preset Pills */}
                            <div className="flex flex-wrap gap-1.5">
                                {PROMPT_PRESETS.map((p, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => {
                                            setCustomPrompt(p.prompt);
                                            setShowPromptEditor(true);
                                        }}
                                        className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 transition-all border border-purple-100 cursor-pointer"
                                    >
                                        {p.name}
                                    </button>
                                ))}
                            </div>

                            {showPromptEditor && (
                                <textarea
                                    rows={4}
                                    value={customPrompt}
                                    onChange={(e) => setCustomPrompt(e.target.value)}
                                    placeholder="在此输入自定义 AI 切片大模型提示词..."
                                    className="w-full bg-[#f8f6fc] rounded-xl p-3 text-[11px] text-[#4a4365] outline-none border border-purple-200 focus:border-[#a494e8] font-mono leading-relaxed"
                                />
                            )}
                        </div>
                    )}

                    {/* Separator Mode Options */}
                    {importType === 'doc' && chunkMode === 'separator' && (
                        <div className="bg-white p-3.5 rounded-2xl border border-purple-200/80 space-y-2 shadow-xs animate-in fade-in duration-200">
                            <div className="flex items-center justify-between">
                                <span className="text-[12px] font-bold text-[#4a4365] flex items-center gap-1.5">
                                    <Scissors size={14} className="text-purple-600" /> 选择或输入切片间隔符:
                                </span>
                                <span className="text-[11px] text-purple-600 font-bold">
                                    匹配到: {stats.separatorMatchCount} 处间隔符
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {SEPARATOR_PRESETS.map((s, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setSeparator(s.value)}
                                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all border cursor-pointer ${
                                            separator === s.value
                                                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                                                : 'bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100'
                                        }`}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2 pt-1">
                                <span className="text-[11px] text-gray-500 font-bold">自定义分隔符:</span>
                                <input
                                    type="text"
                                    value={separator}
                                    onChange={(e) => setSeparator(e.target.value)}
                                    placeholder="例如：\n\n 或 --- 或 ###"
                                    className="flex-1 bg-[#f8f6fc] rounded-xl px-3 py-1.5 text-[12px] text-[#4a4365] font-mono border border-purple-200 outline-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* Length Mode Options */}
                    {importType === 'doc' && chunkMode === 'length' && (
                        <div className="bg-white p-3 rounded-2xl border border-purple-200/80 flex items-center gap-3 shadow-xs animate-in fade-in duration-200">
                            <span className="text-[12px] font-bold text-[#4a4365]">切片单段字数:</span>
                            <div className="flex items-center gap-1.5">
                                {[200, 400, 600, 800].map(sz => (
                                    <button
                                        key={sz}
                                        type="button"
                                        onClick={() => setChunkSize(sz)}
                                        className={`text-[11px] font-bold px-3 py-1 rounded-lg border cursor-pointer transition-all ${
                                            chunkSize === sz
                                                ? 'bg-purple-600 text-white border-purple-600'
                                                : 'bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100'
                                        }`}
                                    >
                                        {sz} 字
                                    </button>
                                ))}
                            </div>
                            <input
                                type="number"
                                min={50}
                                max={2000}
                                value={chunkSize}
                                onChange={(e) => setChunkSize(parseInt(e.target.value, 10) || 400)}
                                className="w-20 bg-[#f8f6fc] rounded-xl px-2 py-1 text-[12px] text-center font-bold text-[#4a4365] border border-purple-200 outline-none"
                            />
                        </div>
                    )}

                    {/* Input Textarea */}
                    <div>
                        <textarea
                            rows={4}
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="在此粘贴文档正文、招生简章、规章制度或 CSV 表格内容..."
                            className="w-full bg-white rounded-2xl p-3.5 text-[12px] outline-none border border-purple-200 focus:border-[#8b79d9] font-mono leading-relaxed text-[#4a4365]"
                        />
                    </div>

                    {/* Parse Trigger Button */}
                    <button
                        onClick={handleParse}
                        disabled={!inputText.trim() || isParsing}
                        className="w-full bg-gradient-to-r from-[#8b79d9] via-[#a895e6] to-[#eb8da6] text-white py-2.5 rounded-2xl font-bold text-[13px] shadow-sm hover:shadow-md active:scale-98 transition-all flex justify-center items-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                        <Scissors size={16} />
                        {isParsing ? '⏳ 正在智能分析并自动切片中...' : '开始智能解析与自动切片'}
                    </button>
                </div>

                {/* Chunks List & Management Section */}
                {parsedChunks.length > 0 && (
                    <div className="border-t border-purple-50 pt-4 space-y-3 animate-in fade-in">
                        {/* Top Action Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 bg-purple-50/60 p-3 rounded-2xl border border-purple-100">
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={handleToggleSelectAll}
                                    className="flex items-center gap-1.5 text-[12px] font-bold text-[#4a4365] hover:text-purple-700 cursor-pointer"
                                >
                                    {selectedChunkIds.size === parsedChunks.length && parsedChunks.length > 0 ? (
                                        <CheckSquare size={16} className="text-purple-600" />
                                    ) : (
                                        <Square size={16} className="text-gray-400" />
                                    )}
                                    全选 ({selectedChunkIds.size}/{parsedChunks.length})
                                </button>
                                <span className="text-[12px] text-gray-500 font-medium">
                                    • 已入库: <span className="font-bold text-emerald-600">{savedCount}</span> 条
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    onClick={handleAddNewChunk}
                                    className="bg-white text-purple-700 border border-purple-200 px-3 py-1.5 rounded-xl text-[12px] font-bold shadow-xs hover:bg-purple-50 transition-all flex items-center gap-1 cursor-pointer"
                                >
                                    <Plus size={14} /> 新增切片
                                </button>
                                <button
                                    onClick={handleDiscardAll}
                                    className="bg-white text-red-600 border border-red-200 px-3 py-1.5 rounded-xl text-[12px] font-bold shadow-xs hover:bg-red-50 transition-all flex items-center gap-1 cursor-pointer"
                                >
                                    <Trash2 size={13} /> 全部舍弃
                                </button>
                                {selectedChunkIds.size > 0 && selectedChunkIds.size < parsedChunks.length && (
                                    <button
                                        onClick={handleSaveSelected}
                                        disabled={isBatchSaving}
                                        className="bg-purple-600 text-white px-3.5 py-1.5 rounded-xl text-[12px] font-bold shadow-sm hover:bg-purple-700 transition-all flex items-center gap-1 cursor-pointer"
                                    >
                                        <Save size={14} /> 保存所选 ({selectedChunkIds.size})
                                    </button>
                                )}
                                <button
                                    onClick={handleSaveAll}
                                    disabled={isBatchSaving}
                                    className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-1.5 rounded-xl text-[12px] font-bold shadow-md hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                >
                                    <Check size={15} /> {isBatchSaving ? '正在入库中...' : '一键保存全部切片入库'}
                                </button>
                            </div>
                        </div>

                        {/* Chunk Items List */}
                        <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                            {parsedChunks.map((chunk, idx) => {
                                const isSelected = selectedChunkIds.has(chunk.id);
                                const isSaving = savingChunkIds.has(chunk.id);
                                const displayedContent = formatVisibleText(chunk.content, showHiddenChars);

                                return (
                                    <div
                                        key={chunk.id}
                                        className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                                            chunk.saved
                                                ? 'bg-emerald-50/40 border-emerald-200'
                                                : isSelected
                                                ? 'bg-[#f8f6fc] border-purple-200 shadow-xs'
                                                : 'bg-white border-gray-100'
                                        }`}
                                    >
                                        {/* Selection Checkbox */}
                                        <button
                                            type="button"
                                            onClick={() => handleToggleSelectChunk(chunk.id)}
                                            className="mt-1 text-gray-400 hover:text-purple-600 cursor-pointer"
                                        >
                                            {isSelected ? (
                                                <CheckSquare size={16} className="text-purple-600" />
                                            ) : (
                                                <Square size={16} />
                                            )}
                                        </button>

                                        {/* Content Block */}
                                        <div className="flex-1 space-y-1.5 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded-md font-bold">
                                                    #{idx + 1}
                                                </span>
                                                <span className="bg-purple-50 text-purple-700 text-[10px] px-2 py-0.5 rounded-md font-bold border border-purple-100">
                                                    {chunk.category || '通用'}
                                                </span>
                                                {chunk.targetAgent && chunk.targetAgent !== 'all' && (
                                                    <span className="bg-amber-50 text-amber-700 text-[10px] px-2 py-0.5 rounded-md font-bold border border-amber-100">
                                                        智能体: {chunk.targetAgent}
                                                    </span>
                                                )}
                                                {chunk.saved ? (
                                                    <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-md font-bold flex items-center gap-0.5">
                                                        <Check size={11} /> 已存入知识库
                                                    </span>
                                                ) : (
                                                    <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-md font-bold">
                                                        待入库
                                                    </span>
                                                )}
                                                <h5 className="font-bold text-[#4a4365] text-[13px] truncate">{chunk.title}</h5>
                                            </div>

                                            <p className="text-[12px] text-[#6d648b] leading-relaxed whitespace-pre-wrap break-all font-mono">
                                                {displayedContent}
                                            </p>

                                            {chunk.tags && chunk.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1 pt-0.5">
                                                    {chunk.tags.map((t, i) => (
                                                        <span key={i} className="text-[10px] text-[#8e7ebb] bg-purple-50/80 px-1.5 py-0.2 rounded">
                                                            #{t}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Buttons: Save Single, Edit, Discard */}
                                        <div className="flex items-center gap-1.5 shrink-0 self-center">
                                            <button
                                                onClick={() => handleSaveSingleChunk(chunk, idx)}
                                                disabled={isSaving || chunk.saved}
                                                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                                    chunk.saved
                                                        ? 'bg-emerald-100 text-emerald-700 cursor-default'
                                                        : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                                                }`}
                                                title="单独保存此切片入库"
                                            >
                                                {isSaving ? (
                                                    <RefreshCw size={12} className="animate-spin" />
                                                ) : chunk.saved ? (
                                                    <Check size={12} />
                                                ) : (
                                                    <Save size={12} />
                                                )}
                                                {chunk.saved ? '已保存' : '单独保存'}
                                            </button>

                                            <button
                                                onClick={() => setEditingChunkIdx(idx)}
                                                className="px-2.5 py-1.5 rounded-xl text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-100 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                                                title="编辑切片标题与内容"
                                            >
                                                <Edit3 size={12} /> 修改
                                            </button>

                                            <button
                                                onClick={() => handleDiscardChunk(idx)}
                                                className="p-1.5 rounded-xl text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 text-[11px] font-bold transition-all cursor-pointer"
                                                title="舍弃此切片"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Sub-Editor for Individual Chunk */}
                {editingChunkIdx !== null && parsedChunks[editingChunkIdx] && (
                    <ChunkSingleEditor
                        chunk={parsedChunks[editingChunkIdx]}
                        onClose={() => setEditingChunkIdx(null)}
                        onSave={(updated) => handleUpdateChunk(editingChunkIdx, updated)}
                    />
                )}

            </div>
        </div>
    );
};
