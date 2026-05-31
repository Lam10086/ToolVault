import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ExternalLink, Star, Edit3, Target, AlertTriangle, Lightbulb, Compass, Copy, Key, Maximize2, Flame, Calendar, Tag, DollarSign, AlertCircle, Layers, Activity } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { getCatColor } from '../utils/colors';
import { getRelatedResources } from '../utils/similarity';

export default function DetailPanel() {
  const { detailResource, closeDetailModal, addOrUpdateResource, showToast, resources } = useAppStore();

  if (!detailResource) return null;

  const res = detailResource;
  const relatedResources = getRelatedResources(res, resources, 4);
  const [fullImg, setFullImg] = useState(false);

  // Handle primary polymorphic action and click count tracking
  const handlePrimaryAction = async () => {
    const nextClicks = (res.clicks ?? 0) + 1;
    await addOrUpdateResource({
      ...res,
      clicks: nextClicks,
    });
    
    if (res.resourceType === 'account') {
      const text = `账号: ${res.accountName || '-'}\n密码: ${res.password || '-'}`;
      await navigator.clipboard.writeText(text);
      showToast('账号密码已复制到剪贴板 ✅', 'success');
    } else if (res.resourceType === 'secret') {
      await navigator.clipboard.writeText(res.secretValue || '');
      showToast('密钥 Token 已复制到剪贴板 ✅', 'success');
    } else if (res.resourceType === 'snippet') {
      await navigator.clipboard.writeText(res.codeContent || '');
      showToast('代码片段已复制到剪贴板 ✅', 'success');
    } else {
      if (res.url) window.open(res.url, '_blank', 'noopener');
    }
  };

  const pricingLabels = {
    'free': '🎉 免费使用',
    'limited-free': '⏳ 限时免费',
    'freemium': '⚖️ 免费+内购',
    'paid': '💎 付费软件',
  };

  const statusLabels = {
    'frequent': '🔥 常用工具',
    'backup': '📦 备用工具',
    'deprecated': '💤 归档/弃用',
  };

  const formatDate = (ts) => {
    if (!ts) return '暂无记录';
    return new Date(ts).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <aside className="detail-panel glass animate-slide-in-right">
      {/* Header */}
      <div className="panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 16 }}>✦</span>
          <h3 style={{ fontSize: 14.5, fontWeight: 700 }}>资源详情面板</h3>
        </div>
        <button className="btn-icon" onClick={closeDetailModal} title="关闭面板" style={{ padding: 4 }}>
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: '16px 18px', overflowY: 'auto', flex: 1 }}>
        
        {/* Preview image or Polymorphic block */}
        <div className="detail-preview-panel">
          {res.resourceType === 'snippet' ? (
            <div style={{ borderRadius: 'var(--r-sm)', padding: 16, background: '#1e1e1e', color: '#d4d4d4', fontFamily: 'monospace', fontSize: 12, overflowX: 'auto', border: '1px solid var(--border)' }}>
              <div style={{ color: 'var(--cat-emerald)', marginBottom: 8, fontWeight: 600 }}>// {res.language || 'code'}</div>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{res.codeContent}</pre>
            </div>
          ) : res.resourceType === 'secret' ? (
            <div style={{ borderRadius: 'var(--r-sm)', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-hover)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
              <Key size={42} style={{ marginBottom: 12, color: 'var(--error)' }} />
              <div style={{ fontFamily: 'monospace', fontSize: 18, letterSpacing: 3 }}>••••••••••••</div>
            </div>
          ) : res.imageData ? (
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setFullImg(true)} title="点击查看大图">
              <img 
                src={res.imageData} 
                alt={res.title} 
                className="detail-preview-img" 
                style={{ 
                  borderRadius: 'var(--r-sm)',
                  objectPosition: res.imageCrop ? `${res.imageCrop.pos.x}% ${res.imageCrop.pos.y}%` : 'center',
                  transform: res.imageCrop ? `scale(${res.imageCrop.scale})` : 'none',
                }} 
              />
              <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.5)', color: 'white', padding: 4, borderRadius: 4, backdropFilter: 'blur(4px)' }}>
                <Maximize2 size={12} />
              </div>
            </div>
          ) : (
            <div className="detail-preview-placeholder" style={{ borderRadius: 'var(--r-sm)', height: 140 }}>
              <Compass size={32} strokeWidth={1.2} style={{ color: 'var(--text-3)' }} />
              <span style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>暂无图片预览</span>
            </div>
          )}

          {/* Primary Action Button */}
          {['account', 'secret', 'snippet'].includes(res.resourceType) ? (
            <button className="btn btn-primary link-btn" onClick={handlePrimaryAction} style={{ borderRadius: 'var(--r-sm)', fontSize: 13, padding: '8px 12px', marginTop: 12 }}>
              <Copy size={14} /> 一键复制{res.resourceType === 'account' ? '账号密码' : res.resourceType === 'secret' ? '密钥 Token' : '代码'}
            </button>
          ) : res.url && (
            <button className="btn btn-primary link-btn" onClick={handlePrimaryAction} style={{ borderRadius: 'var(--r-sm)', fontSize: 13, padding: '8px 12px', marginTop: 12 }}>
              <ExternalLink size={14} /> 一键直达官网
            </button>
          )}
        </div>

        {/* Title & Stars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1.3 }}>{res.title}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {[1, 2, 3, 4, 5].map(star => {
                const filled = star <= (res.rating ?? 5);
                return (
                  <Star
                    key={star}
                    size={13}
                    style={{
                      fill: filled ? 'oklch(76% 0.18 72)' : 'none',
                      stroke: filled ? 'oklch(76% 0.18 72)' : 'var(--text-3)',
                      marginRight: 1
                    }}
                  />
                );
              })}
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>（{(res.rating ?? 5).toFixed(0)}分）</span>
          </div>
        </div>

        {/* Status badges */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {res.pricings && res.pricings.length > 0 ? (
            res.pricings.map(p => {
              const typeColor = p.type === 'free' ? 'oklch(70% 0.15 150)' : p.type === 'subscription' ? 'oklch(70% 0.15 280)' : 'oklch(70% 0.15 40)';
              return (
                <span key={p.id} className="detail-badge" style={{
                  fontSize: 11, padding: '2px 8px',
                  background: `color-mix(in oklch, ${typeColor} 12%, transparent)`,
                  color: typeColor, border: `1px solid color-mix(in oklch, ${typeColor} 24%, transparent)`
                }}>
                  {p.type === 'free' ? '免费' : p.type === 'subscription' ? '订阅' : '买断'}
                  {p.priceNum > 0 && ` | ${p.currency ?? '¥'}${p.priceNum}`}
                </span>
              );
            })
          ) : (
            <span className={`detail-badge badge-${res.pricing ?? 'free'}`} style={{ fontSize: 11, padding: '2px 8px' }}>
              {pricingLabels[res.pricing ?? 'free']}
            </span>
          )}
          <span className={`detail-badge badge-status-${res.status ?? 'frequent'}`} style={{ fontSize: 11, padding: '2px 8px' }}>
            {statusLabels[res.status ?? 'frequent']}
          </span>
        </div>



        {/* Tags */}
        {res.tags?.length > 0 && (
          <div className="detail-prop-group">
            <span className="detail-prop-label" style={{ fontSize: 11.5 }}><Tag size={12} /> 关联标签</span>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {res.tags.map(t => (
                <span key={t} className="chip chip-tag" style={{ padding: '2px 6px', fontSize: 11.5 }}>#{t}</span>
              ))}
            </div>
          </div>
        )}

        {/* Visits & Date */}
        <div className="detail-stats-row" style={{ gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div className="stat-card" style={{ padding: '8px 10px' }}>
            <Flame size={12} style={{ color: 'oklch(70% 0.22 35)', marginBottom: 2 }} />
            <span className="stat-label" style={{ fontSize: 10 }}>访问频次</span>
            <span className="stat-value" style={{ fontSize: 13 }}>{res.clicks ?? 0} 次</span>
          </div>
          <div className="stat-card" style={{ padding: '8px 10px' }}>
            <Calendar size={12} style={{ color: 'var(--accent)', marginBottom: 2 }} />
            <span className="stat-label" style={{ fontSize: 10 }}>收录时间</span>
            <span className="stat-value" style={{ fontSize: 12, fontWeight: 600 }}>{formatDate(res.createdAt)}</span>
          </div>
        </div>

        {/* Details Text Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
          {/* Description */}
          {res.description && (
            <div className="detail-text-section">
              <h4 className="detail-text-title" style={{ fontSize: 12.5 }}>📝 工具简介</h4>
              <p className="detail-text-content" style={{ fontSize: 12, lineHeight: 1.5 }}>{res.description}</p>
            </div>
          )}

          {/* Purpose */}
          {res.purpose && (
            <div className="detail-text-section purpose-box" style={{ padding: 10, borderRadius: 'var(--r-sm)' }}>
              <h4 className="detail-text-title" style={{ fontSize: 12.5, color: 'var(--accent-light)' }}>💡 收录用途</h4>
              <p className="detail-text-content" style={{ fontSize: 12, color: 'var(--text-1)', lineHeight: 1.5 }}>{res.purpose}</p>
            </div>
          )}

          {/* Scenarios */}
          {(res.scenario || res.scenarios) && (
            <div className="detail-text-section">
              <h4 className="detail-text-title" style={{ fontSize: 12.5 }}>🧭 适用场景</h4>
              <p className="detail-text-content" style={{ fontSize: 12, lineHeight: 1.5 }}>{res.scenario || res.scenarios}</p>
            </div>
          )}

          {/* DiffValue */}
          {res.diffValue && (
            <div className="detail-text-section">
              <h4 className="detail-text-title" style={{ fontSize: 12.5, color: 'var(--accent)' }}>✨ 差异化价值</h4>
              <p className="detail-text-content" style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--accent-text)' }}>{res.diffValue}</p>
            </div>
          )}

          {/* Pitfalls / Remarks */}
          {(res.pitfalls || res.remarks) && (
            <div className="detail-text-section">
              <h4 className="detail-text-title" style={{ fontSize: 12.5, color: 'var(--error)' }}>⚠️ 收费 / 坑点 / 备注</h4>
              <p className="detail-text-content" style={{
                fontSize: 12,
                background: 'oklch(100% 100% 0% / 0.03)',
                padding: 8,
                borderRadius: 'var(--r-xs)',
                borderLeft: '2px solid var(--error)',
                lineHeight: 1.5
              }}>{res.pitfalls || res.remarks}</p>
            </div>
          )}

          {/* Related Resources */}
          {relatedResources.length > 0 && (
            <div className="detail-text-section" style={{ marginTop: 24, paddingTop: 16, borderTop: '1px dashed var(--border-subtle)' }}>
              <h4 className="detail-text-title" style={{ fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-1)' }}>
                <Activity size={14} style={{ color: 'var(--accent)' }}/> 库内关联推荐
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                {relatedResources.map(r => (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-hover)', borderRadius: 'var(--r-sm)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden' }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</span>
                      {r.description && <span style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.description}</span>}
                    </div>
                    {/* The openAddModal could be reused to view resource if we had a view action, but for now we can just show them */}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="panel-footer" style={{ borderTop: '1px solid var(--border-subtle)', padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <AlertCircle size={11} />
          <span>更新于 {formatDate(res.updatedAt ?? res.createdAt)}</span>
        </div>
        <button className="btn btn-ghost btn-xs" onClick={closeDetailModal} style={{ padding: '4px 10px' }}>收起</button>
      </div>

      {/* Lightbox for full image (Portaled to avoid transform clipping) */}
      {fullImg && createPortal(
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}
          onClick={() => setFullImg(false)}
        >
          <button className="btn-icon" style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.2)', color: 'white' }} onClick={() => setFullImg(false)}>
            <X size={24} />
          </button>
          <img src={res.imageData} alt={res.title} style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }} />
        </div>,
        document.body
      )}
    </aside>
  );
}
