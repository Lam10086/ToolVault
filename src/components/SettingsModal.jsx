import { useState } from 'react';
import { X, Trash2, Edit2, Plus, Tag, Compass, Check, Bot, Eye, EyeOff } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { getCatColor, CATEGORY_COLOR_OPTIONS } from '../utils/colors';

const EMOJI_OPTIONS = ['🤖','🎨','⚡','🚀','📚','🔧','🌐','📊','🎵','🎮','💡','🔗','📱','🖥️','✍️'];

export default function SettingsModal() {
  const {
    closeSettingsModal,
    categories, addOrUpdateCategory, removeCategory,
    tags, addOrUpdateTag, removeTag,
    showToast,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState('categories'); // 'categories' | 'tags' | 'ai'

  // AI Config State
  const getStoredAIConfig = () => {
    try { return JSON.parse(localStorage.getItem('tv-ai-config') || '{}'); } catch { return {}; }
  };
  const stored = getStoredAIConfig();
  const [apiKey, setApiKey] = useState(stored.apiKey || '');
  const [apiBase, setApiBase] = useState(stored.apiBase || 'https://api.deepseek.com');
  const [aiModel, setAiModel] = useState(stored.model || 'deepseek-chat');
  const [showKey, setShowKey] = useState(false);

  const saveAIConfig = () => {
    localStorage.setItem('tv-ai-config', JSON.stringify({ apiKey, apiBase, model: aiModel }));
    showToast('AI 配置已保存 ✓', 'success');
  };
  
  // Category Form State
  const [editingCatId, setEditingCatId] = useState(null);
  const [catForm, setCatForm] = useState({ name: '', color: 'cat-violet', emoji: '📁' });

  // Tag Form State
  const [editingTagId, setEditingTagId] = useState(null);
  const [tagForm, setTagForm] = useState({ name: '', color: 'cat-slate' });

  // ── Category Handlers ──
  const startEditCat = (cat) => {
    setEditingCatId(cat.id);
    setCatForm({ name: cat.name, color: cat.color, emoji: cat.emoji });
  };
  const cancelEditCat = () => {
    setEditingCatId(null);
    setCatForm({ name: '', color: 'cat-violet', emoji: '📁' });
  };
  const saveCat = async () => {
    if (!catForm.name.trim()) return showToast('分类名称不能为空', 'error');
    await addOrUpdateCategory({ id: editingCatId, ...catForm });
    cancelEditCat();
    showToast('分类保存成功', 'success');
  };
  const handleRemoveCat = async (cat) => {
    if (window.confirm(`确认删除分类「${cat.name}」？关联的资源不会被删除。`)) {
      await removeCategory(cat.id);
      showToast('分类已删除', 'success');
    }
  };

  // ── Tag Handlers ──
  const startEditTag = (tag) => {
    setEditingTagId(tag.id);
    setTagForm({ name: tag.name, color: tag.color || 'cat-slate' });
  };
  const cancelEditTag = () => {
    setEditingTagId(null);
    setTagForm({ name: '', color: 'cat-slate' });
  };
  const saveTag = async () => {
    if (!tagForm.name.trim()) return showToast('标签名称不能为空', 'error');
    // Check global duplicate
    const exists = tags.find(t => t.name.toLowerCase() === tagForm.name.trim().toLowerCase() && t.id !== editingTagId);
    if (exists) return showToast('该标签已存在', 'error');
    
    await addOrUpdateTag({ id: editingTagId, ...tagForm });
    cancelEditTag();
    showToast('标签保存成功', 'success');
  };
  const handleRemoveTag = async (tag) => {
    if (window.confirm(`确认删除标签「#${tag.name}」？关联的资源将移除该标签。`)) {
      await removeTag(tag.id);
      showToast('标签已删除', 'success');
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeSettingsModal()}>
      <div className="modal glass animate-fade-in" style={{ maxWidth: 500, height: '80vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <div className="modal-header" style={{ paddingBottom: 0, borderBottom: 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 className="modal-title" style={{ fontSize: 18 }}>管理字段</h2>
              <button className="btn-icon" onClick={closeSettingsModal}><X size={18} /></button>
            </div>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              <button
                className={`btn btn-ghost ${activeTab === 'categories' ? 'btn-primary' : ''}`}
                style={{ padding: '6px 16px', minHeight: 32 }}
                onClick={() => setActiveTab('categories')}
              >
                <Compass size={14} style={{ marginRight: 6 }} /> 分类管理
              </button>
              <button
                className={`btn btn-ghost ${activeTab === 'tags' ? 'btn-primary' : ''}`}
                style={{ padding: '6px 16px', minHeight: 32 }}
                onClick={() => setActiveTab('tags')}
              >
                <Tag size={14} style={{ marginRight: 6 }} /> 标签管理
              </button>
              <button
                className={`btn btn-ghost ${activeTab === 'ai' ? 'btn-primary' : ''}`}
                style={{ padding: '6px 16px', minHeight: 32 }}
                onClick={() => setActiveTab('ai')}
              >
                <Bot size={14} style={{ marginRight: 6 }} /> AI 配置
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          
          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Add/Edit Form */}
              <div style={{ background: 'var(--bg-card)', padding: 16, borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: 14 }}>{editingCatId ? '编辑分类' : '新建分类'}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {EMOJI_OPTIONS.map(em => (
                      <button key={em} type="button" onClick={() => setCatForm(f => ({ ...f, emoji: em }))}
                        style={{
                          fontSize: 16, padding: '4px 6px', borderRadius: 6, border: 'none',
                          cursor: 'pointer', background: catForm.emoji === em ? 'var(--accent-dim)' : 'transparent',
                        }}>{em}</button>
                    ))}
                  </div>
                  <input
                    className="input"
                    placeholder="分类名称…"
                    value={catForm.name}
                    onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') saveCat(); }}
                  />
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {CATEGORY_COLOR_OPTIONS.map(opt => (
                      <button key={opt.key} title={opt.label} type="button"
                        className="color-pill"
                        style={{
                          width: 20, height: 20,
                          background: opt.color,
                          borderColor: catForm.color === opt.key ? 'white' : 'transparent',
                          transform: catForm.color === opt.key ? 'scale(1.2)' : 'scale(1)',
                        }}
                        onClick={() => setCatForm(f => ({ ...f, color: opt.key }))}
                      />
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button className="btn btn-primary btn-sm" onClick={saveCat}>
                      {editingCatId ? <><Check size={14} /> 保存</> : <><Plus size={14} /> 新建</>}
                    </button>
                    {editingCatId && (
                      <button className="btn btn-ghost btn-sm" onClick={cancelEditCat}>取消</button>
                    )}
                  </div>
                </div>
              </div>

              {/* List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {categories.map(cat => {
                  const color = getCatColor(cat.color);
                  return (
                    <div key={cat.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-card)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border-subtle)' }}>
                      <span className="chip" style={{ background: `color-mix(in oklch, ${color} 14%, transparent)`, color, border: `1px solid color-mix(in oklch, ${color} 28%, transparent)` }}>
                        {cat.emoji} {cat.name}
                      </span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn-icon" style={{ minWidth: 26, minHeight: 26 }} onClick={() => startEditCat(cat)}><Edit2 size={12} /></button>
                        <button className="btn-icon" style={{ minWidth: 26, minHeight: 26, color: 'var(--error)' }} onClick={() => handleRemoveCat(cat)}><Trash2 size={12} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tags Tab */}
          {activeTab === 'tags' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Add/Edit Form */}
              <div style={{ background: 'var(--bg-card)', padding: 16, borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: 14 }}>{editingTagId ? '编辑标签' : '新建标签'}</h4>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="input"
                    placeholder="输入标签名称…"
                    value={tagForm.name}
                    onChange={e => setTagForm(f => ({ ...f, name: e.target.value.replace(/^#+/, '') }))}
                    onKeyDown={e => { if (e.key === 'Enter') saveTag(); }}
                    style={{ flex: 1 }}
                  />
                  <button className="btn btn-primary" onClick={saveTag} style={{ minWidth: 80 }}>
                    {editingTagId ? <><Check size={14} /> 保存</> : <><Plus size={14} /> 新建</>}
                  </button>
                  {editingTagId && (
                    <button className="btn btn-ghost" onClick={cancelEditTag}>取消</button>
                  )}
                </div>
              </div>

              {/* List */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {tags.map(tag => (
                  <div key={tag.id} style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--bg-card)', padding: '4px 8px 4px 12px', borderRadius: 99, border: '1px solid var(--border)', fontSize: 13, gap: 8 }}>
                    <span style={{ color: 'var(--text-1)' }}>#{tag.name}</span>
                    <div style={{ display: 'flex', gap: 2 }}>
                      <button className="btn-icon" style={{ padding: 2, minWidth: 'auto', minHeight: 'auto', color: 'var(--text-3)' }} onClick={() => startEditTag(tag)}><Edit2 size={10} /></button>
                      <button className="btn-icon" style={{ padding: 2, minWidth: 'auto', minHeight: 'auto', color: 'var(--error)' }} onClick={() => handleRemoveTag(tag)}><Trash2 size={10} /></button>
                    </div>
                  </div>
                ))}
                {tags.length === 0 && <span style={{ color: 'var(--text-3)', fontSize: 13 }}>暂无全局标签</span>}
              </div>
            </div>
          )}

          {/* AI Config Tab */}
          {activeTab === 'ai' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ padding: 14, background: 'color-mix(in oklch, var(--accent) 8%, transparent)', border: '1px solid color-mix(in oklch, var(--accent) 20%, transparent)', borderRadius: 'var(--r-md)', fontSize: 13, lineHeight: 1.6 }}>
                🤖 配置一个兼容 OpenAI 的模型 API，即可开启“智能解析网址”功能。AI 会自动研究该工具并充写整张卡片！推荐使用费用极低的 <strong>DeepSeek</strong>(默认)。
              </div>

              <div className="form-group">
                <label className="label">API Key</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      className="input"
                      type={showKey ? 'text' : 'password'}
                      placeholder="sk-xxxxxxxxxxxxxxxx"
                      value={apiKey}
                      onChange={e => setApiKey(e.target.value)}
                      style={{ paddingRight: 40 }}
                    />
                    <button onClick={() => setShowKey(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}>
                      {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="label">API 基础地址 (Base URL)</label>
                <input className="input" placeholder="https://api.deepseek.com" value={apiBase} onChange={e => setApiBase(e.target.value)} />
                <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {[
                    { label: 'DeepSeek (国内直连/极便宜)', base: 'https://api.deepseek.com' },
                    { label: '硅基流动 (国内直连/多模型免费)', base: 'https://api.siliconflow.cn/v1' },
                    { label: '阿里云百炼 (国内直连/免费额度大)', base: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
                    { label: 'Groq (出海/极速)', base: 'https://api.groq.com/openai/v1' },
                    { label: 'OpenAI (出海)', base: 'https://api.openai.com/v1' },
                  ].map(opt => (
                    <button key={opt.base} className="btn btn-ghost" style={{ fontSize: 12, padding: '3px 10px', minHeight: 28, opacity: apiBase === opt.base ? 1 : 0.6, border: apiBase === opt.base ? '1px solid var(--accent)' : undefined }} onClick={() => { setApiBase(opt.base); }}>{ opt.label }</button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="label">模型 (Model)</label>
                <input className="input" placeholder="deepseek-chat" value={aiModel} onChange={e => setAiModel(e.target.value)} />
                <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {[
                    'deepseek-chat', 
                    'Qwen/Qwen2.5-7B-Instruct', 
                    'qwen-plus',
                    'llama-3.3-70b-versatile',
                    'gpt-4o-mini'
                  ].map(m => (
                    <button key={m} className="btn btn-ghost" style={{ fontSize: 11, padding: '3px 8px', minHeight: 26, fontFamily: 'monospace', opacity: aiModel === m ? 1 : 0.6, border: aiModel === m ? '1px solid var(--accent)' : undefined }} onClick={() => setAiModel(m)}>{m}</button>
                  ))}
                </div>
              </div>

              <button className="btn btn-primary" onClick={saveAIConfig}>
                <Check size={14} /> 保存 AI 配置
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
