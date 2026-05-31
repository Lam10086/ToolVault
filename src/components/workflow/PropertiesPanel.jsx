import { Clock, BookOpen, MessageSquare, Paintbrush, Link } from 'lucide-react';
import useAppStore from '../../store/useAppStore';

export default function PropertiesPanel({ selectedNode, selectedEdge, onUpdateNode, onUpdateEdge }) {
  const { resources } = useAppStore();

  const pastelColors = [
    { key: 'pastel-yellow', label: '柠檬黄', color: 'oklch(88% 0.12 85)' },
    { key: 'pastel-green', label: '薄荷绿', color: 'oklch(88% 0.12 145)' },
    { key: 'pastel-pink', label: '芭比粉', color: 'oklch(86% 0.14 340)' },
    { key: 'pastel-blue', label: '天空蓝', color: 'oklch(86% 0.12 210)' },
  ];

  if (!selectedNode && !selectedEdge) {
    return (
      <div className="wf-properties-panel glass empty">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: 'var(--text-3)' }}>
          <MessageSquare size={24} strokeWidth={1.3} />
          <p style={{ fontSize: 12.5, textAlign: 'center' }}>
            在画布中点击选中任意节点或连线<br />以进行属性配置
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="wf-properties-panel glass animate-slide-in">
      <div className="panel-header">
        <h3>✦ 元素属性配置</h3>
      </div>

      <div className="panel-body">
        {/* ── 1. SELECTED NODE PROPS ── */}
        {selectedNode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="node-type-badge">
              {selectedNode.type === 'resourceNode' ? '🌐 资源工具节点' : selectedNode.type === 'stepNode' ? '⚡ 动作步骤节点' : '📝 画布备注节点'}
            </div>

            {/* A. RESOURCE NODE DETAILS (Read-only reference) */}
            {selectedNode.type === 'resourceNode' && (() => {
              const res = resources.find(r => r.id === selectedNode.data.resourceId);
              if (!res) return <p style={{ fontSize: 12, color: 'var(--error)' }}>⚠️ 关联资源已删除</p>;
              return (
                <div className="prop-res-box">
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div className="res-mini-thumb">
                      {res.imageData ? <img src={res.imageData} alt="" /> : <span>🌐</span>}
                    </div>
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>{res.title}</h4>
                      {res.url && <p style={{ fontSize: 11, color: 'var(--text-3)' }} className="truncate">{res.url}</p>}
                    </div>
                  </div>
                  {res.purpose && (
                    <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 8, fontStyle: 'italic', borderLeft: '2px solid var(--accent)', paddingLeft: 6 }}>
                      💡 {res.purpose}
                    </p>
                  )}
                </div>
              );
            })()}

            {/* B. STEP NODE ACTIONS */}
            {selectedNode.type === 'stepNode' && (
              <>
                {/* Step Title / Label */}
                <div className="form-group">
                  <label className="label">⚡ 步骤标题</label>
                  <input
                    className="input"
                    placeholder="e.g. 视频剪辑, 内容发布…"
                    value={selectedNode.data.label ?? '步骤'}
                    onChange={(e) => onUpdateNode(selectedNode.id, { label: e.target.value })}
                  />
                </div>

                {/* Step Description / Text */}
                <div className="form-group">
                  <label className="label">📝 步骤说明</label>
                  <textarea
                    className="input"
                    placeholder="描述这个步骤的具体操作流程…"
                    value={selectedNode.data.text ?? ''}
                    onChange={(e) => onUpdateNode(selectedNode.id, { text: e.target.value })}
                    rows={3}
                    style={{ minHeight: 70 }}
                  />
                </div>

                {/* Step Duration / Timer */}
                <div className="form-group">
                  <label className="label">⏱️ 估计耗时</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="input"
                      style={{ paddingLeft: 32 }}
                      placeholder="e.g. 30分钟, 2小时…"
                      value={selectedNode.data.duration ?? ''}
                      onChange={(e) => onUpdateNode(selectedNode.id, { duration: e.target.value })}
                    />
                    <Clock size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                  </div>
                </div>

                {/* Step Remarks */}
                <div className="form-group">
                  <label className="label">📌 步骤备注</label>
                  <textarea
                    className="input"
                    placeholder="记录此步骤的关键要点或注意事项…"
                    value={selectedNode.data.remarks ?? ''}
                    onChange={(e) => onUpdateNode(selectedNode.id, { remarks: e.target.value })}
                    rows={2}
                    style={{ minHeight: 56 }}
                  />
                </div>
              </>
            )}

            {/* C. NOTE NODE ACTIONS */}
            {selectedNode.type === 'noteNode' && (
              <>
                {/* Note Content */}
                <div className="form-group">
                  <label className="label">📝 备注便签内容</label>
                  <textarea
                    className="input"
                    placeholder="写下你想记录的灵感、想法或便利贴文字…"
                    value={selectedNode.data.text ?? ''}
                    onChange={(e) => onUpdateNode(selectedNode.id, { text: e.target.value })}
                    rows={5}
                    style={{ minHeight: 120 }}
                  />
                </div>

                {/* Pastel Theme Color picker */}
                <div className="form-group">
                  <label className="label"><Paintbrush size={12} /> 便签背景主题</label>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    {pastelColors.map(opt => (
                      <button
                        key={opt.key}
                        className="color-pill"
                        title={opt.label}
                        style={{
                          background: opt.color,
                          width: 24, height: 24, borderRadius: 99,
                          border: (selectedNode.data.color === opt.key || (!selectedNode.data.color && opt.key === 'pastel-yellow'))
                            ? '2px solid white'
                            : '2px solid transparent',
                          boxShadow: 'var(--shadow-sm)',
                          cursor: 'pointer', transition: 'transform 0.15s ease'
                        }}
                        onClick={() => onUpdateNode(selectedNode.id, { color: opt.key })}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── 2. SELECTED EDGE PROPS ── */}
        {selectedEdge && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="node-type-badge" style={{ background: 'oklch(22% 0.03 200)' }}>
              🔗 关联流向连线
            </div>

            {/* Line Description / Label */}
            <div className="form-group">
              <label className="label">✍️ 连线说明文字</label>
              <input
                className="input"
                placeholder="e.g. 输出为 PNG, 合成视频, 输出成果…"
                value={selectedEdge.label ?? ''}
                onChange={(e) => onUpdateEdge(selectedEdge.id, e.target.value)}
              />
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                连线说明文字将显示在箭头的中心位置，帮您更好的阅读流程。
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
