import { X, ExternalLink, Star, Compass, DollarSign, Calendar, Flame, Eye, Tag, AlertCircle } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { getCatColor } from '../utils/colors';

export default function DetailModal() {
  const { detailResource, closeDetailModal, addOrUpdateResource, categories, tags: globalTags, showToast } = useAppStore();

  if (!detailResource) return null;

  const res = detailResource;
  const resCats = categories.filter(c => res.categoryIds?.includes(c.id));

  // Handle direct url redirect and click count tracking
  const handleDirectLink = async () => {
    if (!res.url) return;
    const nextUsage = (res.usageCount ?? 0) + 1;
    // Update store asynchronously to keep click counting working
    await addOrUpdateResource({
      ...res,
      usageCount: nextUsage,
    });
    window.open(res.url, '_blank', 'noopener,noreferrer');
    showToast('已安全导航至外部资源 ✨', 'success');
  };

  const statusLabels = {
    'common': '🔥 常用',
    'pending': '⏳ 待评估',
    'caution': '⚠️ 慎用',
    'deprecated': '💤 已弃用',
    'custom': '🎯 定需',
    'freebies': '🎉 薅羊毛',
  };

  const formatDate = (ts) => {
    if (!ts) return '暂无记录';
    return new Date(ts).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeDetailModal()}>
      <div className="modal detail-modal glass animate-fade-in" style={{ maxWidth: 760 }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>✦</span>
            <h2 className="modal-title">资源卡片详情</h2>
          </div>
          <button className="btn-icon" onClick={closeDetailModal}><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '20px 24px' }}>
          {/* Main Grid: Left Screenshot Preview, Right Key Properties */}
          <div className="detail-grid">
            {/* Left side preview */}
            <div className="detail-preview-panel">
              {res.imageData ? (
                <img src={res.imageData} alt={res.title} className="detail-preview-img" />
              ) : (
                <div className="detail-preview-placeholder">
                  <Compass size={48} strokeWidth={1.2} style={{ color: 'var(--text-3)' }} />
                  <span style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 8 }}>暂无图片预览</span>
                </div>
              )}
              {res.url && (
                <button className="btn btn-primary link-btn" onClick={handleDirectLink}>
                  <ExternalLink size={15} /> 一键直达官网
                </button>
              )}
            </div>

            {/* Right side info panel */}
            <div className="detail-info-panel">
              {/* Title & Star Rating */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>{res.title}</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {[1, 2, 3, 4, 5].map(star => {
                      const filled = star <= (res.rating ?? 0);
                      return (
                        <Star
                          key={star}
                          size={15}
                          style={{
                            fill: filled ? 'oklch(76% 0.18 72)' : 'none',
                            stroke: filled ? 'oklch(76% 0.18 72)' : 'var(--text-3)',
                            marginRight: 2
                          }}
                        />
                      );
                    })}
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>（{(res.rating ?? 0).toFixed(1)} / 5.0 分）</span>
                </div>
              </div>

              {/* Badges row */}
              <div className="detail-badges">
                <span className={`detail-badge badge-status-${res.status ?? 'common'}`}>
                  {statusLabels[res.status ?? 'common']}
                </span>
              </div>

              {/* Categories */}
              {resCats.length > 0 && (
                <div className="detail-prop-group">
                  <span className="detail-prop-label"><Compass size={13} /> 所属分类</span>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {resCats.map(cat => {
                      const color = getCatColor(cat.color);
                      return (
                        <span key={cat.id} className="chip" style={{
                          background: `color-mix(in oklch, ${color} 14%, transparent)`,
                          color,
                          border: `1px solid color-mix(in oklch, ${color} 28%, transparent)`,
                          padding: '3px 9px', fontSize: 12.5
                        }}>
                          {cat.emoji} {cat.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tags */}
              {(res.tagIds?.length > 0 || res.tags?.length > 0) && (
                <div className="detail-prop-group">
                  <span className="detail-prop-label"><Tag size={13} /> 关联标签</span>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {res.tagIds?.map(tid => {
                      const gt = globalTags.find(t => t.id === tid);
                      if (!gt) return null;
                      return <span key={`gt-${tid}`} className="chip chip-tag" style={{ padding: '3px 8px', fontSize: 12, borderColor: 'var(--accent-border)', color: 'var(--accent-light)', background: 'var(--accent-dim)' }}>#{gt.name}</span>;
                    })}
                    {res.tags?.map(t => (
                      <span key={t} className="chip chip-tag" style={{ padding: '3px 8px', fontSize: 12 }}>#{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Simple Stats */}
              <div className="detail-stats-row">
                <div className="stat-card">
                  <Flame size={14} style={{ color: 'oklch(70% 0.22 35)' }} />
                  <span className="stat-label">使用次数</span>
                  <span className="stat-value">{res.usageCount ?? 0} 次</span>
                </div>
                <div className="stat-card">
                  <Calendar size={14} style={{ color: 'var(--accent)' }} />
                  <span className="stat-label">收录时间</span>
                  <span className="stat-value" style={{ fontSize: 11 }}>{formatDate(res.createdAt).split(' ')[0]}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom texts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, borderTop: '1px solid var(--border-subtle)', paddingTop: 18 }}>
            {/* Description */}
            {res.description && (
              <div className="detail-text-section">
                <h4 className="detail-text-title">📝 工具简介</h4>
                <p className="detail-text-content">{res.description}</p>
              </div>
            )}

            {/* Purpose */}
            {res.purpose && (
              <div className="detail-text-section purpose-box">
                <h4 className="detail-text-title" style={{ color: 'var(--accent-light)' }}>💡 收录意义（用途）</h4>
                <p className="detail-text-content" style={{ color: 'var(--text-1)' }}>{res.purpose}</p>
              </div>
            )}

            {/* Scenarios */}
            {res.scenario && (
              <div className="detail-text-section">
                <h4 className="detail-text-title">🧭 适用场景</h4>
                <p className="detail-text-content">{res.scenario}</p>
              </div>
            )}

            {/* DiffValue */}
            {res.diffValue && (
              <div className="detail-text-section">
                <h4 className="detail-text-title" style={{ color: 'oklch(74% 0.17 200)' }}>✨ 差异化价值</h4>
                <p className="detail-text-content">{res.diffValue}</p>
              </div>
            )}

            {/* Pitfalls / Remarks */}
            {res.pitfalls && (
              <div className="detail-text-section">
                <h4 className="detail-text-title" style={{ color: 'var(--warning)' }}>⚠️ 收费 / 坑点</h4>
                <p className="detail-text-content" style={{ background: 'oklch(100% 100% 0% / 0.03)', padding: 12, borderRadius: 'var(--r-sm)', borderLeft: '3px solid var(--warning)' }}>{res.pitfalls}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-3)' }}>
            <AlertCircle size={12} />
            <span>更新于 {formatDate(res.updatedAt ?? res.createdAt)}</span>
          </div>
          <button className="btn btn-ghost" onClick={closeDetailModal} style={{ padding: '8px 20px' }}>关闭详情</button>
        </div>
      </div>
    </div>
  );
}
