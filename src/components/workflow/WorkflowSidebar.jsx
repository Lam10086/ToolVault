import { useState } from 'react';
import { Plus, Trash2, Search, GripVertical, Globe } from 'lucide-react';
import useAppStore from '../../store/useAppStore';

export default function WorkflowSidebar({
  activeId,
  onSelect,
  onAddStep,
  onAddNote,
}) {
  const {
    workflows, resources, categories,
    addOrUpdateWorkflow, removeWorkflow, showToast,
  } = useAppStore();

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [resSearch, setResSearch] = useState('');

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const wf = await addOrUpdateWorkflow({
      name: newName.trim(),
      description: newDesc.trim(),
      nodes: [],
      edges: [],
    });
    setCreating(false);
    setNewName(''); setNewDesc('');
    onSelect(wf.id);
    showToast(`工作流「${wf.name}」已创建`, 'success');
  };

  const handleDelete = async (wf, e) => {
    e.stopPropagation();
    if (!window.confirm(`删除工作流「${wf.name}」？`)) return;
    await removeWorkflow(wf.id);
    showToast('工作流已删除', 'success');
  };

  const filteredRes = resSearch
    ? resources.filter(r =>
        r.title.toLowerCase().includes(resSearch.toLowerCase()) ||
        r.tags?.some(t => t.toLowerCase().includes(resSearch.toLowerCase()))
      )
    : resources;

  const onDragStartRes = (e, res) => {
    e.dataTransfer.setData('application/x-toolv-resource', res.id);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const getCatNames = (res) =>
    categories
      .filter(c => res.categoryIds?.includes(c.id))
      .map(c => `${c.emoji} ${c.name}`)
      .join(' · ');

  return (
    <div className="workflow-sidebar">
      {/* ── Workflow list section ── */}
      <div className="workflow-sidebar-section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            我的工作流
          </span>
          <button
            className="btn-icon"
            style={{ padding: 5 }}
            title="新建工作流"
            onClick={() => setCreating(v => !v)}
          >
            <Plus size={14} />
          </button>
        </div>

        {/* New workflow form */}
        {creating && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8,
            padding: 10, background: 'var(--bg-card)', borderRadius: 'var(--r-md)',
            border: '1px solid var(--border-subtle)' }}>
            <input
              className="input"
              style={{ padding: '6px 10px', fontSize: 13 }}
              placeholder="工作流名称…"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreating(false); }}
              autoFocus
            />
            <input
              className="input"
              style={{ padding: '6px 10px', fontSize: 12 }}
              placeholder="简短描述（可选）"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
            />
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-primary btn-xs" style={{ flex: 1 }} onClick={handleCreate}>创建</button>
              <button className="btn btn-ghost btn-xs" onClick={() => setCreating(false)}>取消</button>
            </div>
          </div>
        )}

        {/* Workflow items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {workflows.length === 0 && !creating && (
            <p style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', padding: '16px 0' }}>
              还没有工作流<br />
              <span style={{ fontSize: 11 }}>点击 + 创建第一个</span>
            </p>
          )}
          {workflows.map(wf => (
            <div
              key={wf.id}
              className={`workflow-item ${activeId === wf.id ? 'active' : ''}`}
              onClick={() => onSelect(wf.id)}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="workflow-item-name truncate">{wf.name}</p>
                {wf.description && (
                  <p className="workflow-item-desc">{wf.description}</p>
                )}
                <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                  {wf.nodes?.length ?? 0} 个节点
                </p>
              </div>
              <button
                className="btn-icon danger"
                style={{ padding: 4, opacity: 0.6, flexShrink: 0 }}
                onClick={e => handleDelete(wf, e)}
                title="删除工作流"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Node type buttons (only when a workflow is active) ── */}
      {activeId && (
        <div className="workflow-sidebar-section">
          <p style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
            添加节点
          </p>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="btn btn-ghost btn-xs"
              style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}
              onClick={onAddStep}
            >
              ⚡ 步骤
            </button>
            <button
              className="btn btn-ghost btn-xs"
              style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}
              onClick={onAddNote}
            >
              📝 备注
            </button>
          </div>
        </div>
      )}

      {/* ── Resource library (drag to canvas) ── */}
      {activeId && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          <div className="workflow-sidebar-section" style={{ paddingBottom: 8 }}>
            <p style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
              资源库 — 拖拽到画布
            </p>
            <div style={{ position: 'relative' }}>
              <Search size={12} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
              <input
                className="input"
                style={{ padding: '5px 10px 5px 28px', fontSize: 12 }}
                placeholder="搜索资源…"
                value={resSearch}
                onChange={e => setResSearch(e.target.value)}
              />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
            {filteredRes.length === 0 && (
              <p style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', padding: 16 }}>
                没有匹配的资源
              </p>
            )}
            {filteredRes.map(res => (
              <div
                key={res.id}
                className="res-drag-item"
                draggable
                onDragStart={e => onDragStartRes(e, res)}
                title={`拖拽「${res.title}」到画布`}
              >
                <div className="res-drag-thumb">
                  {res.imageData
                    ? <img src={res.imageData} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span>🌐</span>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {res.title}
                  </p>
                  {getCatNames(res) && (
                    <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {getCatNames(res)}
                    </p>
                  )}
                </div>
                <GripVertical size={13} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state when no workflow selected */}
      {!activeId && workflows.length > 0 && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, color: 'var(--text-3)', padding: 20, textAlign: 'center' }}>
          <span style={{ fontSize: 28 }}>👆</span>
          <p style={{ fontSize: 13 }}>选择一个工作流<br />开始编排</p>
        </div>
      )}
    </div>
  );
}
