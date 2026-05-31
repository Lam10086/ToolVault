import { Search, Plus, LayoutGrid, Workflow, Layers, List, Network, ArrowUpDown, SlidersHorizontal, Settings, Database } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { getCatColor } from '../utils/colors';
import { RESOURCE_TYPE_OPTIONS } from '../utils/resourceTypes';

import { useState } from 'react';

export default function TopNav() {
  const {
    view, setView,
    categories, resources,
    selectedResourceType, setFilter,
    searchQuery, setSearch,
    openAddModal,
    viewType, setViewType,
    sortBy, setSortBy,
    tags,
    selectedTags, setSelectedTags,
    selectedStatuses, setSelectedStatuses,
    selectedPricings, setSelectedPricings,
    openSettingsModal,
    openDataModal,
  } = useAppStore();
  const [fieldsModalOpen, setFieldsModalOpen] = useState(false);

  const [advancedOpen, setAdvancedOpen] = useState(false);

  const countForType = (typeId) =>
    resources.filter(r => (r.resourceType || 'website') === typeId).length;

  return (
    <>
      {/* ── Main top bar ── */}
      <nav className="topnav">
        {/* Brand */}
        <div className="brand" title="ToolVault">
          <div className="brand-icon">🗂️</div>
        </div>

        {/* View tabs */}
        <div className="view-tabs" style={{ flexShrink: 0 }}>
          <button
            className={`view-tab ${view === 'library' ? 'active' : ''}`}
            onClick={() => setView('library')}
            style={{ whiteSpace: 'nowrap' }}
          >
            <LayoutGrid size={14} strokeWidth={2.2} />
            资源库
          </button>
          <button
            className={`view-tab ${view === 'workflow' ? 'active' : ''}`}
            onClick={() => setView('workflow')}
            style={{ whiteSpace: 'nowrap' }}
          >
            <Workflow size={14} strokeWidth={2.2} />
            工作流
          </button>
        </div>

        <div className="nav-spacer" />

        {/* Search */}
        <div className="search-bar" style={{ flex: 1, minWidth: 100, maxWidth: 600, margin: '0 auto', flexShrink: 1 }}>
          <span className="search-icon">
            <Search size={18} />
          </span>
          <input
            className="search-input"
            placeholder="搜索资源、标签、描述…"
            value={searchQuery}
            onChange={e => setSearch(e.target.value)}
            style={{ fontSize: 14 }}
          />
        </div>

        <div className="nav-spacer" />

        {/* View Switcher (Library only) */}
        {view === 'library' && (
          <div className="btn-group-sm" style={{ marginRight: 8, display: 'flex', gap: 2 }}>
            <button
              className={`btn btn-xs ${viewType === 'card' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewType('card')}
              title="卡片网格视图"
              style={{ padding: '6px 10px', minHeight: 28 }}
            >
              <LayoutGrid size={13} />
            </button>
            <button
              className={`btn btn-xs ${viewType === 'list' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewType('list')}
              title="精简列表视图"
              style={{ padding: '6px 10px', minHeight: 28 }}
            >
              <List size={13} />
            </button>
            <button
              className={`btn btn-xs ${viewType === 'mindmap' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewType('mindmap')}
              title="层级脑图视图"
              style={{ padding: '6px 10px', minHeight: 28 }}
            >
              <Network size={13} />
            </button>
          </div>
        )}

        {/* Sort Selector (Library only) */}
        {view === 'library' && (
          <div style={{ display: 'flex', alignItems: 'center', marginRight: 8 }}>
            <label className="btn btn-ghost btn-xs" style={{ gap: 4, padding: '4px 8px', display: 'flex', alignItems: 'center', minHeight: 28, cursor: 'pointer' }}>
              <ArrowUpDown size={12} style={{ color: 'var(--text-3)' }} />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={{
                  background: 'transparent', border: 'none', color: 'inherit',
                  fontFamily: 'inherit', fontSize: 13, padding: '0 4px 0 0',
                  cursor: 'pointer', outline: 'none'
                }}
              >
                <option value="createdAt" style={{ background: 'var(--bg-card)', color: 'var(--text-1)' }}>⏰ 添加时间</option>
                <option value="rating" style={{ background: 'var(--bg-card)', color: 'var(--text-1)' }}>⭐️ 评分最高</option>
                <option value="usageCount" style={{ background: 'var(--bg-card)', color: 'var(--text-1)' }}>🔥 使用次数</option>
                <option value="price_asc" style={{ background: 'var(--bg-card)', color: 'var(--text-1)' }}>💸 价格最低</option>
              </select>
            </label>
          </div>
        )}

        {/* Advanced Filters Button (Library only) */}
        {view === 'library' && (
          <button
            className={`btn btn-xs ${advancedOpen ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setAdvancedOpen(!advancedOpen)}
            style={{ marginRight: 8, gap: 4, padding: '5px 10px', minHeight: 28 }}
            title="高级组合过滤"
          >
            <SlidersHorizontal size={13} />
            <span style={{ fontSize: 13 }}>高级筛选</span>
            {(selectedTags.length + selectedStatuses.length + selectedPricings.length) > 0 && (
              <span style={{
                background: advancedOpen ? 'oklch(100% 0 0 / 0.2)' : 'var(--accent)',
                color: 'white', fontSize: 11, padding: '1px 5px', borderRadius: 99, fontWeight: 700
              }}>
                {selectedTags.length + selectedStatuses.length + selectedPricings.length}
              </span>
            )}
          </button>
        )}



        {/* Settings / Manage Fields */}
        <button 
          className="btn-icon" 
          onClick={openSettingsModal} 
          title="管理字段/标签" 
          style={{ marginRight: 8, minHeight: 32, minWidth: 32, flexShrink: 0 }}
        >
          <Settings size={18} />
        </button>

        {/* Data Management */}
        <button 
          className="btn-icon" 
          onClick={openDataModal} 
          title="数据备份与导入" 
          style={{ marginRight: 8, minHeight: 32, minWidth: 32, flexShrink: 0 }}
        >
          <Database size={18} />
        </button>

        {/* Add resource */}
        <button className="btn btn-primary btn-sm" onClick={() => openAddModal()} style={{ minHeight: 34, padding: '8px 16px', fontSize: 14, flexShrink: 0, whiteSpace: 'nowrap' }}>
          <Plus size={18} strokeWidth={2.5} />
          添加资源
        </button>
      </nav>

      {/* ── Category filter bar (library only) ── */}
      {view === 'library' && (
        <div className="filter-bar">
          <button
            className={`filter-chip ${!selectedResourceType ? 'active' : ''}`}
            style={!selectedResourceType ? { '--chip-color': 'var(--accent)' } : {}}
            onClick={() => setFilter(null)}
          >
            全部
            <span style={{
              marginLeft: 2,
              fontSize: 11,
              background: !selectedResourceType ? 'var(--accent)' : 'var(--bg-hover)',
              color: !selectedResourceType ? 'white' : 'var(--text-3)',
              borderRadius: 99,
              padding: '1px 6px',
            }}>
              {resources.length}
            </span>
          </button>

          {RESOURCE_TYPE_OPTIONS.map(rt => {
            const isActive = selectedResourceType === rt.id;
            return (
              <button
                key={rt.id}
                className={`filter-chip ${isActive ? 'active' : ''}`}
                style={{ '--chip-color': rt.color }}
                onClick={() => setFilter(isActive ? null : rt.id)}
              >
                {rt.icon} {rt.label}
                <span style={{
                  marginLeft: 2,
                  fontSize: 11,
                  background: isActive ? rt.color : 'var(--bg-hover)',
                  borderRadius: 99,
                  padding: '1px 6px',
                  color: isActive ? 'var(--bg-base)' : 'var(--text-3)',
                }}>
                  {countForType(rt.id)}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Advanced Multi-Dimensional Filters Drawer (library only) ── */}
      {view === 'library' && advancedOpen && (
        <div className="advanced-filters-drawer glass animate-slide-down">
          {/* Status Filters */}
          <div className="filter-row">
            <span className="filter-label">⚡ 评估状态:</span>
            <div className="filter-options flex-wrap">
              {['common', 'pending', 'caution', 'deprecated', 'custom', 'freebies'].map(s => {
                const isActive = selectedStatuses.includes(s);
                const count = (() => {
                  let temp = [...resources];
                  if (selectedResourceType) temp = temp.filter(r => (r.resourceType || 'website') === selectedResourceType);
                  if (selectedTags.length > 0) temp = temp.filter(r => selectedTags.every(t => r.tagIds?.includes(t) || r.tags?.includes(t)));
                  return temp.filter(r => (r.status || 'common') === s).length;
                })();

                const labels = { 'common': '常用', 'pending': '待评估', 'caution': '有坑慎用', 'deprecated': '已弃用', 'custom': '定需', 'freebies': '薅羊毛' };

                return (
                  <button
                    key={s}
                    className={`adv-chip ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      if (isActive) setSelectedStatuses(selectedStatuses.filter(x => x !== s));
                      else setSelectedStatuses([...selectedStatuses, s]);
                    }}
                  >
                    {labels[s]}
                    <span className="adv-count">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tags Filters */}
          <div className="filter-row">
            <span className="filter-label">🏷️ 标签过滤:</span>
            <div className="filter-options flex-wrap">
              {tags.map(t => {
                const isActive = selectedTags.includes(t.name);
                const count = (() => {
                  let temp = [...resources];
                  if (selectedResourceType) temp = temp.filter(r => (r.resourceType || 'website') === selectedResourceType);
                  if (selectedStatuses.length > 0) temp = temp.filter(r => selectedStatuses.includes(r.status || 'common'));
                  return temp.filter(r => r.tagIds?.includes(t.id) || r.tags?.includes(t.name)).length;
                })();

                return (
                  <button
                    key={t.id}
                    className={`adv-chip ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      if (isActive) setSelectedTags(selectedTags.filter(x => x !== t.name));
                      else setSelectedTags([...selectedTags, t.name]);
                    }}
                  >
                    #{t.name}
                    <span className="adv-count">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pricing Filters */}
          <div className="filter-row">
            <span className="filter-label">💰 计费模式:</span>
            <div className="filter-options flex-wrap">
              {['free', 'subscription', 'one-time'].map(p => {
                const isActive = selectedPricings.includes(p);
                const count = (() => {
                  let temp = [...resources];
                  if (selectedResourceType) temp = temp.filter(r => (r.resourceType || 'website') === selectedResourceType);
                  if (selectedTags.length > 0) temp = temp.filter(r => selectedTags.every(t => r.tagIds?.includes(t) || r.tags?.includes(t)));
                  if (selectedStatuses.length > 0) temp = temp.filter(r => selectedStatuses.includes(r.status || 'common'));
                  return temp.filter(r => r.pricings && r.pricings.some(pricing => pricing.type === p)).length;
                })();

                const labels = { 'free': '免费体验', 'subscription': '按期订阅', 'one-time': '永久买断' };

                return (
                  <button
                    key={p}
                    className={`adv-chip ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      if (isActive) setSelectedPricings(selectedPricings.filter(x => x !== p));
                      else setSelectedPricings([...selectedPricings, p]);
                    }}
                  >
                    {labels[p]}
                    <span className="adv-count">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reset Filters button */}
          {(selectedTags.length + selectedStatuses.length) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: 10, marginTop: 4 }}>
              <button
                className="btn btn-ghost btn-xs"
                style={{ color: 'var(--error)' }}
                onClick={() => {
                  setSelectedTags([]);
                  setSelectedStatuses([]);
                  setSelectedPricings([]);
                }}
              >
                🧹 清除全部过滤
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
