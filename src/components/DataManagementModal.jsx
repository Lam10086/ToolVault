import { useState } from 'react';
import { X, Save, FolderOpen, RefreshCw, Download, Upload, Check } from 'lucide-react';
import useBackupStore, { setDirHandle, getDirHandle } from '../store/useBackupStore';
import { getFullDbState } from '../db/storage';
import { selectDirectory, writeToFile, downloadFile, applyFIFO } from '../utils/fileSystem';
import { generateMarkdown, generatePlainText } from '../utils/exportGenerators';

export default function DataManagementModal({ onClose, onOpenImport }) {
  const {
    autoBackupEnabled, setAutoBackupEnabled,
    backupIntervalHours, setBackupInterval,
    maxBackups, setMaxBackups,
    formats, setFormats,
    dirName, setDirName,
    lastBackupTime, setLastBackupTime
  } = useBackupStore();

  const [activeTab, setActiveTab] = useState('auto'); // 'auto' | 'manual'
  const [isExporting, setIsExporting] = useState(false);

  const handleSelectDir = async () => {
    const handle = await selectDirectory();
    if (handle) {
      await setDirHandle(handle);
      setDirName(handle.name);
    }
  };

  const handleManualExport = async (format) => {
    setIsExporting(true);
    try {
      const dbState = await getFullDbState();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      let content, mimeType, ext;

      if (format === 'json') {
        content = JSON.stringify(dbState, null, 2);
        mimeType = 'application/json';
        ext = 'json';
      } else if (format === 'md') {
        // Need to pass tags too? Yes, we fetch tags in dbState
        content = generateMarkdown(dbState.resources, dbState.categories, dbState.tags);
        mimeType = 'text/markdown';
        ext = 'md';
      } else if (format === 'txt') {
        content = generatePlainText(dbState.resources, dbState.categories, dbState.tags);
        mimeType = 'text/plain';
        ext = 'txt';
      }

      downloadFile(`ToolVault_Export_${timestamp}.${ext}`, content, mimeType);
    } finally {
      setIsExporting(false);
    }
  };

  const triggerInstantBackup = async () => {
    setIsExporting(true);
    try {
      const dbState = await getFullDbState();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      let success = true;

      // Desktop (Electron) privileged silent backup
      if (window.electronAPI) {
        if (formats.json) {
          const content = JSON.stringify(dbState, null, 2);
          const res = await window.electronAPI.saveBackup({ filename: `ToolVault_Backup_${timestamp}.json`, content, extension: '.json', maxBackups });
          if (!res.success) success = false;
        }
        if (formats.md) {
          const content = generateMarkdown(dbState.resources, dbState.categories, dbState.tags);
          const res = await window.electronAPI.saveBackup({ filename: `ToolVault_Backup_${timestamp}.md`, content, extension: '.md', maxBackups });
          if (!res.success) success = false;
        }
        if (formats.txt) {
          const content = generatePlainText(dbState.resources, dbState.categories, dbState.tags);
          const res = await window.electronAPI.saveBackup({ filename: `ToolVault_Backup_${timestamp}.txt`, content, extension: '.txt', maxBackups });
          if (!res.success) success = false;
        }
      } else {
        const handle = await getDirHandle();
        if (!handle) {
          alert("请先选择备份文件夹！");
          return;
        }
        
        if (formats.json) {
          const ok = await writeToFile(handle, `ToolVault_Backup_${timestamp}.json`, JSON.stringify(dbState, null, 2));
          if (ok) await applyFIFO(handle, '.json', maxBackups); else success = false;
        }
        if (formats.md) {
          const ok = await writeToFile(handle, `ToolVault_Backup_${timestamp}.md`, generateMarkdown(dbState.resources, dbState.categories, dbState.tags));
          if (ok) await applyFIFO(handle, '.md', maxBackups); else success = false;
        }
        if (formats.txt) {
          const ok = await writeToFile(handle, `ToolVault_Backup_${timestamp}.txt`, generatePlainText(dbState.resources, dbState.categories, dbState.tags));
          if (ok) await applyFIFO(handle, '.txt', maxBackups); else success = false;
        }
      }

      if (success) {
        setLastBackupTime(Date.now());
        alert("立即备份成功！");
      } else {
        alert("备份过程中出现错误，请检查权限。");
      }
    } catch (e) {
      console.error(e);
      alert("备份失败: " + e.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        onClose();
        onOpenImport(data); // Trigger import preview modal
      } catch (err) {
        alert("无效的 JSON 文件");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 540 }}>
        <div className="modal-header">
          <h2 className="modal-title">💾 数据管理 & 备份</h2>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body" style={{ padding: '20px 24px' }}>
          
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
            <button className={`btn-ghost ${activeTab === 'auto' ? 'active' : ''}`} style={{ borderBottom: activeTab === 'auto' ? '2px solid var(--accent)' : '2px solid transparent', paddingBottom: 8, borderRadius: 0 }} onClick={() => setActiveTab('auto')}>
              自动备份配置 (FIFO)
            </button>
            <button className={`btn-ghost ${activeTab === 'manual' ? 'active' : ''}`} style={{ borderBottom: activeTab === 'manual' ? '2px solid var(--accent)' : '2px solid transparent', paddingBottom: 8, borderRadius: 0 }} onClick={() => setActiveTab('manual')}>
              手动导入 / 导出
            </button>
          </div>

          {activeTab === 'auto' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {window.electronAPI ? (
                <div className="form-group">
                  <label className="label">1. 备份位置 (已自动分配特权通道)</label>
                  <div style={{ padding: 12, background: 'color-mix(in oklch, var(--accent) 8%, transparent)', border: '1px solid color-mix(in oklch, var(--accent) 20%, transparent)', borderRadius: 'var(--r-md)', fontSize: 13, lineHeight: 1.6 }}>
                    <strong>桌面版特权：</strong> 您的备份将自动免打扰地安全存放于操作系统的标准用户数据目录（AppData / Application Support）中。无需任何授权，后台静默执行。
                  </div>
                </div>
              ) : (
                <div className="form-group">
                  <label className="label">1. 选择本地备份文件夹 (必需)</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn" onClick={handleSelectDir}>
                      <FolderOpen size={14} /> {dirName ? '更改文件夹' : '选择文件夹'}
                    </button>
                    {dirName && <span style={{ padding: '8px 12px', background: 'var(--bg-hover)', borderRadius: 'var(--r-md)', fontSize: 13, flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Check size={14} style={{ color: 'var(--accent)' }}/> 已授权: {dirName}
                    </span>}
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>建议选择 iCloud Drive 或 OneDrive 文件夹，以实现多设备间自动网盘同步。</p>
                </div>
              )}

              <div className="form-group">
                <label className="label">2. 自动备份开关 & 频率</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                    <input type="checkbox" checked={autoBackupEnabled} onChange={e => setAutoBackupEnabled(e.target.checked)} />
                    启用网页后台自动备份
                  </label>
                  <select className="input" style={{ width: 140, padding: '4px 8px', fontSize: 13 }} value={backupIntervalHours} onChange={e => setBackupInterval(Number(e.target.value))} disabled={!autoBackupEnabled}>
                    <option value={1}>每 1 小时</option>
                    <option value={6}>每 6 小时</option>
                    <option value={12}>每 12 小时</option>
                    <option value={24}>每 24 小时</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="label">3. 备份上限 (FIFO 流水灯机制)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="number" className="input" style={{ width: 80 }} value={maxBackups} onChange={e => setMaxBackups(Number(e.target.value))} min={1} max={100} />
                  <span style={{ fontSize: 13, color: 'var(--text-2)' }}>份。超过上限时，将自动删除最老的一份备份，避免塞满硬盘。</span>
                </div>
              </div>

              <div className="form-group">
                <label className="label">4. 备份格式</label>
                <div style={{ display: 'flex', gap: 16 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                    <input type="checkbox" checked={formats.json} onChange={e => setFormats({...formats, json: e.target.checked})} /> .json (用于无损还原)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                    <input type="checkbox" checked={formats.md} onChange={e => setFormats({...formats, md: e.target.checked})} /> .md (Markdown排版)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                    <input type="checkbox" checked={formats.txt} onChange={e => setFormats({...formats, txt: e.target.checked})} /> .txt (纯文本)
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: 16, marginTop: 4 }}>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                  上次备份: {lastBackupTime ? new Date(lastBackupTime).toLocaleString() : '从未备份'}
                </div>
                <button className="btn btn-primary" onClick={triggerInstantBackup} disabled={isExporting || (!window.electronAPI && !dirName)}>
                  <RefreshCw size={14} className={isExporting ? 'spin' : ''} /> 立即执行一次备份
                </button>
              </div>
            </div>
          )}

          {activeTab === 'manual' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ padding: 16, background: 'var(--bg-hover)', borderRadius: 'var(--r-md)' }}>
                <h3 style={{ fontSize: 14, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Download size={16}/> 导出当前数据到下载夹</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn" onClick={() => handleManualExport('json')} disabled={isExporting}>导出 .json 数据包</button>
                  <button className="btn" onClick={() => handleManualExport('md')} disabled={isExporting}>导出 .md 目录</button>
                  <button className="btn" onClick={() => handleManualExport('txt')} disabled={isExporting}>导出 .txt 文本</button>
                </div>
              </div>

              <div style={{ padding: 16, border: '1px dashed var(--accent)', borderRadius: 'var(--r-md)', background: 'color-mix(in oklch, var(--accent) 5%, transparent)' }}>
                <h3 style={{ fontSize: 14, marginBottom: 12, color: 'var(--accent-text)', display: 'flex', alignItems: 'center', gap: 6 }}><Upload size={16}/> 导入资源包与工作流</h3>
                <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 12, lineHeight: 1.5 }}>
                  选择之前导出的 <code>.json</code> 备份文件。导入时，您将看到一个缩略图预览界面，您可以**手动选择**哪些资源要并入到当前库中，并选择是否合并工作流数据。
                </p>
                <label className="btn btn-primary" style={{ display: 'inline-flex', cursor: 'pointer' }}>
                  <Upload size={14} /> 选择 JSON 文件导入
                  <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileChange} />
                </label>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
