import { useState, useMemo } from 'react';
import { X, CheckSquare, Square, Filter, Database } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { bulkSaveResources } from '../db/storage';
import ResourceCard from './ResourceCard';

export default function ImportPreviewModal({ importData, onClose }) {
  const { resources, loadResources, showToast } = useAppStore();
  
  // The resources to import
  const incomingResources = importData?.resources || [];
  
  // State for selected IDs
  const [selectedIds, setSelectedIds] = useState(() => new Set(incomingResources.map(r => r.id)));
  const [isImporting, setIsImporting] = useState(false);
  const [importWorkflows, setImportWorkflows] = useState(true);
  const incomingWorkflowsCount = importData?.workflows?.length || 0;

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(incomingResources.map(r => r.id)));
  const selectNone = () => setSelectedIds(new Set());

  const excludeExisting = () => {
    // Exclude if title or URL matches perfectly
    const existingTitles = new Set(resources.map(r => r.title.toLowerCase()));
    const existingUrls = new Set(resources.map(r => r.url).filter(Boolean));

    const newSet = new Set();
    incomingResources.forEach(r => {
      const hasTitle = existingTitles.has(r.title.toLowerCase());
      const hasUrl = r.url && existingUrls.has(r.url);
      if (!hasTitle && !hasUrl) {
        newSet.add(r.id);
      }
    });
    setSelectedIds(newSet);
    showToast(`已排除 ${incomingResources.length - newSet.size} 个可能已存在的资源`);
  };

  const handleImport = async () => {
    if (selectedIds.size === 0) {
      showToast('未选择任何要导入的资源', 'error');
      return;
    }
    setIsImporting(true);
    try {
      const toImport = incomingResources.filter(r => selectedIds.has(r.id));
      
      // We are only doing resources right now. Categories and tags could also be merged,
      // but for simplicity and safety of the DB, we just merge resources.
      const addedCount = await bulkSaveResources(toImport);

      // Merge workflows if any (Append mode, don't delete existing)
      let importedWfCount = 0;
      if (importWorkflows && importData?.workflows && importData.workflows.length > 0) {
        const { saveWorkflow } = await import('../db/storage');
        for (const w of importData.workflows) {
          // Change ID slightly to avoid overwriting existing workflows by accident if user re-imports
          await saveWorkflow({ ...w, id: `${w.id}_imported_${Date.now()}` });
          importedWfCount++;
        }
      }
      
      await loadResources();
      const { loadWorkflows } = useAppStore.getState();
      if (loadWorkflows) await loadWorkflows();

      showToast(`成功导入 ${addedCount} 个资源${importedWfCount > 0 ? `及 ${importedWfCount} 个工作流` : ''}！`, 'success');
      onClose();
    } catch (err) {
      console.error(err);
      showToast('导入失败', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  if (!incomingResources || incomingResources.length === 0) {
    if (incomingWorkflowsCount > 0) {
       // If there are workflows but no resources, we still allow importing workflows
    } else {
      return (
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">导入预览</h2>
              <button className="btn-icon" onClick={onClose}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ padding: 24, textAlign: 'center' }}>
              <p>该文件中没有找到资源或工作流数据，或者文件格式不正确。</p>
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 860, height: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <h2 className="modal-title">📦 导入数据预览</h2>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Toolbar */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 8, flexWrap: 'wrap', background: 'var(--bg-surface)' }}>
          <button className="btn" onClick={selectAll}><CheckSquare size={14}/> 全选</button>
          <button className="btn" onClick={selectNone}><Square size={14}/> 全不选</button>
          <div style={{ width: 1, background: 'var(--border)', margin: '0 8px' }} />
          <button className="btn" onClick={excludeExisting} title="根据名称或URL匹配排除"><Filter size={14}/> 排除已存在 ({incomingResources.length - selectedIds.size})</button>
          <div style={{ flex: 1 }} />
          {incomingWorkflowsCount > 0 && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginRight: 16, cursor: 'pointer', background: 'var(--accent-dim)', padding: '4px 10px', borderRadius: 'var(--r-md)', color: 'var(--accent)' }}>
              <input type="checkbox" checked={importWorkflows} onChange={(e) => setImportWorkflows(e.target.checked)} />
              连带导入 {incomingWorkflowsCount} 个工作流画布
            </label>
          )}
          <span style={{ fontSize: 13, color: 'var(--text-2)', display: 'flex', alignItems: 'center' }}>
            即将导入 <strong style={{ color: 'var(--accent)', margin: '0 4px', fontSize: 15 }}>{selectedIds.size}</strong> / {incomingResources.length} 个资源
          </span>
        </div>

        {/* Grid Preview */}
        <div className="modal-body" style={{ padding: '20px', overflowY: 'auto', flex: 1, background: 'var(--bg-base)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {incomingResources.map(res => {
              const isSelected = selectedIds.has(res.id);
              return (
                <div key={res.id} style={{ 
                  position: 'relative', 
                  opacity: isSelected ? 1 : 0.4, 
                  transition: 'opacity 0.2s',
                  transform: isSelected ? 'scale(1)' : 'scale(0.98)',
                  cursor: 'pointer'
                }} onClick={() => toggleSelect(res.id)}>
                  
                  {/* Selection Overlay Checkbox */}
                  <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10, background: 'var(--bg-card)', borderRadius: 4, display: 'flex', padding: 2 }}>
                    {isSelected ? <CheckSquare size={20} style={{ color: 'var(--accent)' }}/> : <Square size={20} style={{ color: 'var(--text-3)' }}/>}
                  </div>
                  
                  {/* Pointer events none so click passes through to the wrapper */}
                  <div style={{ pointerEvents: 'none' }}>
                    <ResourceCard resource={res} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="modal-footer" style={{ borderTop: '1px solid var(--border-subtle)', padding: '16px 20px' }}>
          <button className="btn btn-ghost" onClick={onClose}>取消导入</button>
          <button className="btn btn-primary" onClick={handleImport} disabled={isImporting || (selectedIds.size === 0 && (!importWorkflows || incomingWorkflowsCount === 0))}>
            <Database size={15}/> 确认导入
          </button>
        </div>
      </div>
    </div>
  );
}
