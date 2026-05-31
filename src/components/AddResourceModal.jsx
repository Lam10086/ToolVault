import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Upload, Link, Image, Plus, Check, AlertCircle, Clipboard, Star, Zap } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { getCatColor, CATEGORY_COLOR_OPTIONS } from '../utils/colors';
import { analyzeUrlWithAI, hasAIConfig } from '../utils/aiAnalyzer';
import { fetchUrlMetadata } from '../utils/scraper';
import { RESOURCE_TYPE_OPTIONS, getResourceType } from '../utils/resourceTypes';
import ImageCropper from './ImageCropper';

const EMOJI_OPTIONS = ['🤖','🎨','⚡','🚀','📚','🔧','🌐','📊','🎵','🎮','💡','🔗','📱','🖥️','✍️'];

export default function AddResourceModal() {
  const {
    editingResource, closeAddModal,
    addOrUpdateResource, categories,
    tags: globalTags, addOrUpdateTag,
    addOrUpdateCategory, showToast,
  } = useAppStore();

  const isEdit = !!editingResource?.id;
  const [isParsing, setIsParsing] = useState(false);

  const [form, setForm] = useState({
    title: '',
    url: '',
    description: '',
    purpose: '',
    scenario: '',
    diffValue: '',
    pitfalls: '',
    imageData: null,
    categoryIds: [],
    tagIds: [],
    tags: [],
    rating: 5,
    status: 'common',
    pricings: [],
    resourceType: 'website',
    expiresAt: '',
    imageCrop: null,
    accountName: '',
    password: '',
    secretValue: '',
    codeContent: '',
    language: 'javascript',
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newCatForm, setNewCatForm] = useState({ show: false, name: '', color: 'cat-violet', emoji: '📁' });

  const fileRef = useRef(null);
  const tagInputRef = useRef(null);

  // Pre-fill when editing
  useEffect(() => {
    if (editingResource) {
      setForm({
        title:       editingResource.title       ?? '',
        url:         editingResource.url         ?? '',
        description: editingResource.description ?? '',
        purpose:     editingResource.purpose     ?? '',
        scenario:    editingResource.scenario    ?? editingResource.scenarios ?? '',
        diffValue:   editingResource.diffValue   ?? '',
        pitfalls:    editingResource.pitfalls    ?? editingResource.remarks ?? '',
        imageData:   editingResource.imageData   ?? null,
        categoryIds: editingResource.categoryIds ?? [],
        tagIds:      editingResource.tagIds      ?? [],
        tags:        editingResource.tags        ?? [],
        rating:      editingResource.rating      ?? 5,
        status:      editingResource.status      ?? 'common',
        pricings:    editingResource.pricings    ?? [],
        resourceType: editingResource.resourceType ?? 'website',
        expiresAt:   editingResource.expiresAt   ?? '',
        imageCrop:   editingResource.imageCrop   ?? null,
        accountName: editingResource.accountName ?? '',
        password:    editingResource.password    ?? '',
        secretValue: editingResource.secretValue ?? '',
        codeContent: editingResource.codeContent ?? '',
        language:    editingResource.language    ?? 'javascript',
        id:          editingResource.id,
      });
    }
  }, [editingResource]);

  // ── Clipboard paste (Ctrl+V anywhere while modal open) ──
  useEffect(() => {
    const handlePaste = async (e) => {
      const items = Array.from(e.clipboardData?.items ?? []);
      const imgItem = items.find(i => i.type.startsWith('image/'));
      if (imgItem) {
        const blob = imgItem.getAsFile();
        readAsDataURL(blob);
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeAddModal(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const readAsDataURL = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setForm(f => ({ ...f, imageData: e.target.result }));
    reader.readAsDataURL(file);
  };

  // ── Drop zone handlers ──
  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = Array.from(e.dataTransfer.files).find(f => f.type.startsWith('image/'));
    if (file) readAsDataURL(file);
  }, []);

  const onDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = () => setDragOver(false);

  // ── Tag handling ──
  const toggleGlobalTag = (id) => {
    setForm(f => ({
      ...f,
      tagIds: f.tagIds.includes(id) ? f.tagIds.filter(t => t !== id) : [...f.tagIds, id]
    }));
  };

  const addTag = async () => {
    const t = tagInput.trim().replace(/^#+/, '');
    if (!t) return;
    
    // Check if it exists globally
    const existing = globalTags.find(gt => gt.name.toLowerCase() === t.toLowerCase());
    if (existing) {
      if (!form.tagIds.includes(existing.id)) {
        setForm(f => ({ ...f, tagIds: [...f.tagIds, existing.id] }));
      }
    } else {
      // Create new global tag
      const saved = await addOrUpdateTag({ name: t, color: 'cat-slate' });
      setForm(f => ({ ...f, tagIds: [...f.tagIds, saved.id] }));
    }
    setTagInput('');
  };

  const removeCustomTag = (tag) => setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }));
  const removeGlobalTag = (id) => setForm(f => ({ ...f, tagIds: f.tagIds.filter(t => t !== id) }));

  const onTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); }
    if (e.key === 'Backspace' && !tagInput) {
      if (form.tags.length > 0) {
        removeCustomTag(form.tags[form.tags.length - 1]);
      } else if (form.tagIds.length > 0) {
        removeGlobalTag(form.tagIds[form.tagIds.length - 1]);
      }
    }
  };

  // ── Category toggle ──
  const toggleCat = (id) => {
    setForm(f => ({
      ...f,
      categoryIds: f.categoryIds.includes(id)
        ? f.categoryIds.filter(c => c !== id)
        : [...f.categoryIds, id],
    }));
  };

  // ── Inline new category ──
  const handleCreateCat = async () => {
    if (!newCatForm.name.trim()) return;
    const saved = await addOrUpdateCategory({
      name: newCatForm.name.trim(),
      color: newCatForm.color,
      emoji: newCatForm.emoji,
    });
    setForm(f => ({ ...f, categoryIds: [...f.categoryIds, saved.id] }));
    setNewCatForm({ show: false, name: '', color: 'cat-violet', emoji: '📁' });
  };

  // ── URL Scraping (AI-powered) ──
  const handleAutoParse = async () => {
    if (!form.url || !form.url.startsWith('http')) {
      showToast('请输入有效的带 http/https 的网址', 'error');
      return;
    }
    setIsParsing(true);
    try {
      if (hasAIConfig()) {
        // AI deep analysis: fills all fields
        showToast('AI 正在深度研究该工具，稍候片刻...', 'info');
        const result = await analyzeUrlWithAI(form.url);
        setForm(f => ({
          ...f,
          title: result.title || f.title,
          description: result.description || f.description,
          purpose: result.purpose || f.purpose,
          scenario: result.scenario || f.scenario,
          diffValue: result.diffValue || f.diffValue,
          pitfalls: result.pitfalls || f.pitfalls,
          rating: result.rating || f.rating,
          pricings: result.pricings?.length > 0 ? result.pricings : f.pricings,
          tags: result.tags?.length > 0 ? [...new Set([...f.tags, ...result.tags])] : f.tags,
        }));
        showToast('✨ AI 分析完成，请确认内容后保存', 'success');
      } else {
        // Fallback: basic title & desc only
        const meta = await fetchUrlMetadata(form.url);
        setForm(f => ({
          ...f,
          title: f.title || meta.title,
          description: f.description || meta.description,
        }));
        showToast('基础解析完成。在设置中配置 AI Key 可开启深度分析', 'success');
      }
    } catch (err) {
      showToast('解析失败: ' + err.message, 'error');
    } finally {
      setIsParsing(false);
    }
  };

  // ── Pricings ──
  const addPricing = () => {
    setForm(s => ({
      ...s,
      pricings: [...s.pricings, { id: Date.now(), model: '', type: 'free', priceNum: 0, currency: '¥' }]
    }));
  };
  const updatePricing = (id, key, val) => {
    setForm(f => ({
      ...f,
      pricings: f.pricings.map(p => p.id === id ? { ...p, [key]: val } : p)
    }));
  };
  const removePricing = (id) => {
    setForm(f => ({ ...f, pricings: f.pricings.filter(p => p.id !== id) }));
  };

  // ── Save ──
  const handleSave = async () => {
    if (!form.title.trim()) { showToast('请填写资源名称', 'error'); return; }
    setSaving(true);
    try {
      await addOrUpdateResource({ ...form });
      showToast(isEdit ? '资源已更新 ✨' : '资源已收录 🎉', 'success');
      closeAddModal();
    } finally {
      setSaving(false);
    }
  };

  const setField = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeAddModal()}>
      <div className="modal">
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? '编辑资源' : '✦ 收录新资源'}</h2>
          <button className="btn-icon" onClick={closeAddModal}><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <div className="modal-grid">
            {/* ── Left: Form ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Resource Type */}
              <div className="form-group">
                <label className="label">🏷️ 资产类型</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {RESOURCE_TYPE_OPTIONS.map(rt => {
                    const isSelected = form.resourceType === rt.id;
                    return (
                      <button
                        key={rt.id}
                        className={`filter-chip ${isSelected ? 'active' : ''}`}
                        style={isSelected ? { '--chip-color': rt.color, padding: '5px 12px' } : { padding: '5px 12px' }}
                        onClick={() => setForm(f => ({ ...f, resourceType: rt.id }))}
                      >
                        {rt.icon} {rt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div className="form-group">
                <label className="label">📌 资源名称 <span style={{ color: 'var(--error)' }}>*</span></label>
                <input
                  className="input"
                  placeholder="e.g. Figma, Claude, Notion…"
                  value={form.title}
                  onChange={setField('title')}
                  autoFocus
                />
              </div>

              {/* === Dynamic Fields based on ResourceType === */}

              {/* URL Field (Not for secrets and snippets) */}
              {!['secret', 'snippet'].includes(form.resourceType) && (
                <div className="form-group">
                  <label className="label">
                    🔗 链接地址 / 本地路径 {form.resourceType === 'website' && <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>（网站需提供）</span>}
                  </label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input
                        className="input"
                        placeholder="https://…"
                        value={form.url}
                        onChange={setField('url')}
                        style={{ paddingLeft: 36 }}
                      />
                      <Link size={14} style={{
                        position: 'absolute', left: 12, top: '50%',
                        transform: 'translateY(-50%)', color: 'var(--text-3)',
                      }} />
                    </div>
                    <button className="btn btn-ghost" onClick={handleAutoParse} disabled={isParsing || !form.url} title="自动抓取网页标题和描述">
                      <Zap size={14} className={isParsing ? 'spin' : ''} style={{ color: 'var(--accent)' }} /> 
                      {isParsing ? '解析中...' : '自动解析'}
                    </button>
                  </div>
                </div>
              )}

              {/* Account Specific Fields */}
              {form.resourceType === 'account' && (
                <div style={{ display: 'flex', gap: 12 }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="label">👤 账号 / 邮箱</label>
                    <input className="input" placeholder="e.g. user@example.com" value={form.accountName} onChange={setField('accountName')} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="label">🔑 密码</label>
                    <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={setField('password')} />
                  </div>
                </div>
              )}

              {/* Secret Specific Fields */}
              {form.resourceType === 'secret' && (
                <div className="form-group">
                  <label className="label">🛡️ 密钥 / Token 内容 <span style={{ color: 'var(--error)' }}>*</span></label>
                  <textarea
                    className="input"
                    placeholder="sk-proj-..."
                    value={form.secretValue}
                    onChange={setField('secretValue')}
                    rows={3}
                    style={{ fontFamily: 'monospace', minHeight: 84 }}
                  />
                </div>
              )}

              {/* Snippet Specific Fields */}
              {form.resourceType === 'snippet' && (
                <>
                  <div className="form-group">
                    <label className="label">💻 代码内容 <span style={{ color: 'var(--error)' }}>*</span></label>
                    <textarea
                      className="input"
                      placeholder="function example() { ... }"
                      value={form.codeContent}
                      onChange={setField('codeContent')}
                      rows={5}
                      style={{ fontFamily: 'monospace', minHeight: 120, whiteSpace: 'pre' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="label">🔤 语言 / 格式</label>
                    <input
                      className="input"
                      placeholder="e.g. javascript, python, css, prompt..."
                      value={form.language}
                      onChange={setField('language')}
                      style={{ maxWidth: 200 }}
                    />
                  </div>
                </>
              )}

              {/* Description (Hide for secret/snippet as they have specific content) */}
              {!['secret', 'snippet'].includes(form.resourceType) && (
                <div className="form-group">
                  <label className="label">📝 简要描述</label>
                  <textarea
                    className="input"
                    placeholder="这个工具/资源是做什么的？"
                    value={form.description}
                    onChange={setField('description')}
                    rows={2}
                    style={{ minHeight: 68 }}
                  />
                </div>
              )}

              {/* Expiration Date (for Accounts/Secrets/Software) */}
              {['account', 'software', 'secret', 'other'].includes(form.resourceType) && (
                <div className="form-group">
                  <label className="label">⏳ 到期时间 / 续费日 <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>（可选）</span></label>
                  <input
                    type="date"
                    className="input"
                    value={form.expiresAt || ''}
                    onChange={setField('expiresAt')}
                    style={{ maxWidth: 200 }}
                  />
                </div>
              )}

              {/* Purpose — the "收录意义" prompt */}
              <div className="form-group">
                <label className="label">💡 收录意义</label>
                <textarea
                  className="input"
                  placeholder="为什么收录这个？它解决了你的什么问题，或在什么场景下你会用到它？"
                  value={form.purpose}
                  onChange={setField('purpose')}
                  rows={3}
                  style={{ minHeight: 84, borderColor: form.purpose ? 'var(--accent-border)' : undefined }}
                />
                {!form.purpose && (
                  <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
                    <AlertCircle size={11} style={{ display: 'inline', marginRight: 4 }} />
                    建议填写，帮助未来的你快速回忆为什么收录这个
                  </p>
                )}
              </div>

              {/* === Advanced Toggle === */}
              <button
                type="button"
                className="btn btn-ghost"
                style={{ justifyContent: 'center', margin: '8px 0', border: '1px dashed var(--border)', color: 'var(--text-3)' }}
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? '收起高级配置 ▲' : '⚙️ 展开高级配置 (标签、场景、计费等) ▼'}
              </button>

              {showAdvanced && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '12px 16px', background: 'var(--bg-hover)', borderRadius: 'var(--r-md)', border: '1px solid var(--border-subtle)' }}>
                  {/* Tags */}
              <div className="form-group">
                <label className="label">🏷️ 标签</label>
                {/* Available Global Tags */}
                {globalTags.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                    {globalTags.map(gt => {
                      const sel = form.tagIds.includes(gt.id);
                      return (
                        <button key={gt.id} type="button" onClick={() => toggleGlobalTag(gt.id)}
                          className={`chip chip-tag ${sel ? 'selected' : ''}`}
                          style={sel ? { background: 'var(--accent-dim)', color: 'var(--accent-light)', borderColor: 'var(--accent-border)' } : {}}>
                          {sel && <Check size={11} />} #{gt.name}
                        </button>
                      );
                    })}
                  </div>
                )}
                <div className="tag-input-wrap" onClick={() => tagInputRef.current?.focus()}>
                  {form.tagIds.map(tid => {
                    const gt = globalTags.find(t => t.id === tid);
                    if (!gt) return null;
                    return (
                      <span key={`gid-${tid}`} className="tag-pill">
                        #{gt.name}
                        <button type="button" onClick={() => removeGlobalTag(tid)}><X size={10} /></button>
                      </span>
                    );
                  })}
                  {form.tags.map(tag => (
                    <span key={`ct-${tag}`} className="tag-pill" style={{ background: 'var(--bg-hover)', color: 'var(--text-2)', borderColor: 'var(--border-subtle)' }}>
                      #{tag}
                      <button type="button" onClick={() => removeCustomTag(tag)}><X size={10} /></button>
                    </span>
                  ))}
                  <input
                    ref={tagInputRef}
                    className="tag-input"
                    placeholder={(form.tags.length + form.tagIds.length) === 0 ? '选择或输入新标签按 Enter 添加…' : ''}
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={onTagKeyDown}
                    onBlur={addTag}
                  />
                </div>
              </div>

              {/* Scenarios, DiffValue, Pitfalls */}
              <div className="form-group">
                <label className="label">🧭 适用场景</label>
                <input
                  className="input"
                  placeholder="e.g. 视频剪辑、自媒体文案、小红书配图…"
                  value={form.scenario}
                  onChange={setField('scenario')}
                />
              </div>

              <div className="form-group">
                <label className="label">✨ 差异化价值</label>
                <input
                  className="input"
                  placeholder="它和竞品比，最特别的地方是什么？"
                  value={form.diffValue}
                  onChange={setField('diffValue')}
                />
              </div>

              <div className="form-group">
                <label className="label">⚠️ 收费 / 坑点</label>
                <textarea
                  className="input"
                  placeholder="有没有什么要注意的坑？"
                  value={form.pitfalls}
                  onChange={setField('pitfalls')}
                  rows={2}
                  style={{ minHeight: 64 }}
                />
              </div>

              {/* Pricings */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="label">💰 计费方案区间</label>
                  <button type="button" className="btn btn-ghost btn-xs" onClick={addPricing}>
                    <Plus size={11} /> 添加方案
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {form.pricings.map((p) => (
                    <div key={p.id} style={{ display: 'flex', gap: 6, alignItems: 'center', background: 'var(--bg-hover)', padding: '6px 8px', borderRadius: 8 }}>
                      <select className="input" style={{ width: 70, padding: '4px 6px', fontSize: 12 }} value={p.type} onChange={e => updatePricing(p.id, 'type', e.target.value)}>
                        <option value="free">免费</option>
                        <option value="subscription">订阅</option>
                        <option value="one-time">买断</option>
                      </select>
                      <input className="input" style={{ flex: 1, padding: '4px 6px', fontSize: 12 }} placeholder="方案描述 (如: 基础版)" value={p.model} onChange={e => updatePricing(p.id, 'model', e.target.value)} />
                      <select className="input" style={{ width: 64, padding: '4px', fontSize: 12 }} value={p.currency ?? '¥'} onChange={e => updatePricing(p.id, 'currency', e.target.value)}>
                        <option value="¥">¥ (RMB)</option>
                        <option value="$">$ (USD)</option>
                        <option value="€">€ (EUR)</option>
                        <option value="£">£ (GBP)</option>
                      </select>
                      <input className="input" type="number" style={{ width: 70, padding: '4px 6px', fontSize: 12 }} placeholder="排序价格" value={p.priceNum} onChange={e => updatePricing(p.id, 'priceNum', Number(e.target.value))} />
                      <button type="button" className="btn-icon" style={{ color: 'var(--error)' }} onClick={() => removePricing(p.id)}><X size={12} /></button>
                    </div>
                  ))}
                  {form.pricings.length === 0 && (
                    <div style={{ fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic' }}>暂未填写计费方案</div>
                  )}
                </div>
              </div>
              </div>
              )}

              {/* Status & Rating */}
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="label">⚡ 评估状态</label>
                  <select className="input" value={form.status} onChange={setField('status')}>
                    <option value="common">🔥 常用</option>
                    <option value="pending">⏳ 待评估</option>
                    <option value="caution">⚠️ 有坑慎用</option>
                    <option value="deprecated">💤 已弃用</option>
                    <option value="custom">🎯 定需</option>
                    <option value="freebies">🎉 薅羊毛</option>
                  </select>
                </div>
                
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="label">⭐️ 星级评分</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 42 }}>
                    {[1, 2, 3, 4, 5].map(star => {
                      const active = star <= form.rating;
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, rating: star }))}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer', padding: '0px 2px',
                            color: active ? 'oklch(76% 0.18 72)' : 'var(--text-3)',
                            transition: 'transform 0.1s ease',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          <Star size={20} style={{ fill: active ? 'oklch(76% 0.18 72)' : 'none' }} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>

            {/* ── Right: Image + Preview ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="label">🖼️ 预览图</label>

                {/* Drop zone */}
                <div style={{ height: 200 }}>
                  {form.imageData ? (
                    <ImageCropper
                      imageData={form.imageData}
                      cropSettings={form.imageCrop}
                      onChange={(crop) => setForm(f => ({ ...f, imageCrop: crop }))}
                      onClear={() => setForm(f => ({ ...f, imageData: null, imageCrop: null }))}
                    />
                  ) : (
                    <div
                      className={`img-drop-zone ${dragOver ? 'drag-over' : ''}`}
                      onDrop={onDrop}
                      onDragOver={onDragOver}
                      onDragLeave={onDragLeave}
                      onClick={() => fileRef.current?.click()}
                      style={{ height: '100%' }}
                    >
                      <Image size={28} strokeWidth={1.3} />
                      <p style={{ fontWeight: 500 }}>拖拽 / 点击 / <kbd style={{ padding: '1px 5px', borderRadius: 4, background: 'var(--bg-hover)', border: '1px solid var(--border)', fontSize: 12 }}>Ctrl+V</kbd> 粘贴截图</p>
                      <p style={{ fontSize: 12 }}>支持选取裁剪</p>
                      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => readAsDataURL(e.target.files[0])} />
                    </div>
                  )}
                </div>

                {/* Clipboard button */}
                {!form.imageData && (
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}
                    onClick={async () => {
                      try {
                        const items = await navigator.clipboard.read();
                        for (const item of items) {
                          const imgType = item.types.find(t => t.startsWith('image/'));
                          if (imgType) {
                            const blob = await item.getType(imgType);
                            readAsDataURL(blob);
                            return;
                          }
                        }
                        showToast('剪贴板中没有图片，请先截图', 'warning');
                      } catch {
                        showToast('请使用 Ctrl+V 直接粘贴截图', 'warning');
                      }
                    }}
                  >
                    <Clipboard size={14} /> 从剪贴板粘贴
                  </button>
                )}
              </div>

              {/* Live card mini preview */}
              <div style={{ marginTop: 8 }}>
                <p className="label">卡片预览</p>
                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--r-lg)',
                  overflow: 'hidden',
                  fontSize: 13,
                }}>
                  <div style={{
                    aspectRatio: '16/9',
                    position: 'relative',
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, oklch(22% 0.04 295), oklch(18% 0.025 268))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {form.imageData ? (
                      <img
                        src={form.imageData}
                        alt="preview"
                        style={{
                          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                          objectFit: 'cover',
                          objectPosition: form.imageCrop ? `${form.imageCrop.pos.x}% ${form.imageCrop.pos.y}%` : 'center',
                          transform: form.imageCrop ? `scale(${form.imageCrop.scale})` : 'none'
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: 24 }}>🌐</span>
                    )}
                  </div>
                  <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p style={{ fontWeight: 600, color: 'var(--text-1)' }}>{form.title || '资源名称'}</p>
                    {form.description && (
                      <p style={{ color: 'var(--text-2)', fontSize: 12, lineHeight: 1.5 }}>
                        {form.description.slice(0, 80)}
                      </p>
                    )}

                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={closeAddModal}>取消</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? '保存中…' : isEdit ? '保存修改' : '✦ 收录资源'}
          </button>
        </div>
      </div>
    </div>
  );
}
