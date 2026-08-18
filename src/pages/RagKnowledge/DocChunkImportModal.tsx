import React, { useState } from 'react';
import {
    FileUp, X, FileText, Table, Upload,
    Scissors, Layers, Check, Edit3, Trash2
} from 'lucide-react';
import { DocumentChunk } from '../../types';
import { API_BASE } from '../../api/config';
import { ChunkSingleEditor } from './ChunkSingleEditor';

interface DocChunkImportModalProps {
    onClose: () => void;
    onBatchSave: (chunksToSave: DocumentChunk[]) => void;
}

export const DocChunkImportModal: React.FC<DocChunkImportModalProps> = ({ onClose, onBatchSave }) => {
    const [importType, setImportType] = useState<'doc' | 'table'>('doc');
    const [inputText, setInputText] = useState('');
    const [fileName, setFileName] = useState('');
    const [chunkMode, setChunkMode] = useState('heading');
    const [chunkSize] = useState(400);

    const [parsedChunks, setParsedChunks] = useState<DocumentChunk[]>([]);
    const [editingChunkIdx, setEditingChunkIdx] = useState<number | null>(null);
    const [isParsing, setIsParsing] = useState(false);

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
                const res = await fetch(`${API_BASE}/api/admin/parse-document`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: inputText,
                        filename: fileName,
                        mode: chunkMode,
                        chunkSize
                    })
                });
                const data = await res.json();
                if (data.ok && Array.isArray(data.chunks)) {
                    setParsedChunks(data.chunks);
                } else {
                    alert('文档切片解析异常：' + (data.error || '未知错误'));
                }
            } else {
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
                    setParsedChunks([{
                        id: `table-chunk-${Date.now()}`,
                        title: data.title,
                        category: '表格数据',
                        type: 'table',
                        content: `导入表格包含 ${data.tableData.columns.join(' / ')}`,
                        tableData: data.tableData,
                        imageAttachments: [],
                        tags: [data.title, '表格数据']
                    }]);
                } else {
                    alert('表格解析异常：' + (data.error || '未知错误'));
                }
            }
        } catch (err) {
            console.error('Parse failed:', err);
            alert('解析连接失败，请检查后端 Node 服务是否开启 (端口 3001)');
        } finally {
            setIsParsing(false);
        }
    };

    const handleUpdateChunk = (idx: number, updatedChunk: DocumentChunk) => {
        const next = [...parsedChunks];
        next[idx] = updatedChunk;
        setParsedChunks(next);
        setEditingChunkIdx(null);
    };

    const handleDeleteChunk = (idx: number) => {
        setParsedChunks(prev => prev.filter((_, i) => i !== idx));
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-center items-center p-4">
            <div className="bg-white/95 rounded-[36px] max-w-[760px] w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-white space-y-4 animate-in zoom-in-95 duration-300">

                <div className="flex items-center justify-between border-b pb-3">
                    <div>
                        <h3 className="font-bold text-[#4a4365] text-[16px] flex items-center gap-2">
                            <FileUp className="text-[#a494e8]" size={20} /> 智能文件解析与 RAG 切片管理
                        </h3>
                        <p className="text-[11px] text-[#8a84a4] mt-0.5">支持 txt, md, docx 文本与 csv 表格文件导入解析，切片内容可随时预览修改</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-600 cursor-pointer">
                        <X size={20} />
                    </button>
                </div>

                {/* Input Controls */}
                <div className="space-y-3">
                    <div className="flex items-center gap-4 bg-[#f8f6fc] p-2 rounded-2xl border border-purple-100">
                        <label className="flex items-center gap-1.5 text-[13px] font-bold text-[#4a4365] cursor-pointer">
                            <input
                                type="radio"
                                name="importType"
                                checked={importType === 'doc'}
                                onChange={() => setImportType('doc')}
                                className="text-[#a494e8]"
                            />
                            <FileText size={15} /> 文本/文档切片 (TXT, MD, Word)
                        </label>
                        <label className="flex items-center gap-1.5 text-[13px] font-bold text-[#4a4365] cursor-pointer">
                            <input
                                type="radio"
                                name="importType"
                                checked={importType === 'table'}
                                onChange={() => setImportType('table')}
                                className="text-[#a494e8]"
                            />
                            <Table size={15} /> 表格解析 (CSV, JSON)
                        </label>
                    </div>

                    <div className="flex gap-3 items-center">
                        <label className="bg-[#4a4365] text-white px-4 py-2 rounded-xl text-[12px] font-bold cursor-pointer hover:bg-[#342e49] transition-all flex items-center gap-1.5">
                            <Upload size={14} /> 选择本地文件
                            <input type="file" accept=".txt,.md,.doc,.docx,.csv,.json" onChange={handleFileChange} className="hidden" />
                        </label>
                        {fileName && <span className="text-[12px] font-bold text-[#a494e8] bg-purple-50 px-3 py-1 rounded-lg">📄 {fileName}</span>}

                        {importType === 'doc' && (
                            <div className="flex items-center gap-2 ml-auto text-[12px]">
                                <span className="font-bold text-gray-600">切片模式:</span>
                                <select
                                    value={chunkMode}
                                    onChange={(e) => setChunkMode(e.target.value)}
                                    className="bg-[#f8f6fc] rounded-lg px-2 text-purple-950 font-bold py-1 outline-none text-[12px]"
                                >
                                    <option value="ai">智能语义切片 (AI 大模型提炼)</option>
                                    <option value="heading">Markdown 标题章节</option>
                                    <option value="length">固定字数切片 (400字)</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <div>
                        <textarea
                            rows={4}
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="在此粘贴文档正文或 CSV 表格内容..."
                            className="w-full bg-[#f8f6fc] rounded-2xl p-4 text-[12px] outline-none border border-transparent focus:border-[#a494e8] font-mono"
                        />
                    </div>

                    <button
                        onClick={handleParse}
                        disabled={!inputText.trim() || isParsing}
                        className="w-full bg-gradient-to-r from-[#b3a4ed] to-[#f296b2] text-white py-2.5 rounded-2xl font-bold text-[13px] shadow-sm hover:shadow-md active:scale-95 transition-all flex justify-center items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                        <Scissors size={16} /> {isParsing ? '⏳ 正在智能分析并自动切片中...' : '开始智能解析与自动切片'}
                    </button>
                </div>

                {/* Chunks List & Modification Section */}
                {parsedChunks.length > 0 && (
                    <div className="border-t pt-4 space-y-3 animate-in fade-in">
                        <div className="flex items-center justify-between">
                            <h4 className="font-bold text-[#4a4365] text-[14px] flex items-center gap-1.5">
                                <Layers size={16} className="text-purple-600" /> 已分割切片预览 ({parsedChunks.length} 个切片)
                            </h4>
                            <button
                                onClick={() => onBatchSave(parsedChunks)}
                                className="bg-emerald-600 text-white px-5 py-2 rounded-xl text-[12px] font-bold shadow-md hover:bg-emerald-700 transition-all flex items-center gap-1 cursor-pointer"
                            >
                                <Check size={14} /> 确认一键保存全部切片入库
                            </button>
                        </div>

                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                            {parsedChunks.map((chunk, idx) => (
                                <div key={chunk.id} className="bg-[#f8f6fc] p-3 rounded-2xl border border-purple-100 flex items-start justify-between gap-3">
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-purple-200 text-purple-800 text-[10px] px-2 py-0.5 rounded-md font-bold">
                                                切片 #{idx + 1}
                                            </span>
                                            <h5 className="font-bold text-[#4a4365] text-[13px]">{chunk.title}</h5>
                                        </div>
                                        <p className="text-[12px] text-[#6d648b] leading-relaxed line-clamp-2">{chunk.content}</p>
                                        <div className="flex gap-1">
                                            {chunk.tags?.map((t, i) => (
                                                <span key={i} className="text-[10px] text-[#a494e8]">#{t}</span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            onClick={() => setEditingChunkIdx(idx)}
                                            className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-100 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                        >
                                            <Edit3 size={14} /> 编辑
                                        </button>
                                        <button
                                            onClick={() => handleDeleteChunk(idx)}
                                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-100 text-[11px] font-bold cursor-pointer"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
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
