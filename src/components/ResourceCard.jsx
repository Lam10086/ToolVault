import { ExternalLink, Edit2, Trash2, Globe, Star, Copy, Key } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { getCatColor } from '../utils/colors';
import { getResourceType } from '../utils/resourceTypes';

export default function ResourceCard({ resource, style, animDelay = 0, onContextMenu }) {
  const { tags: globalTags, openAddModal, removeResource, openDetailModal } = useAppStore();

  const rType = getResourceType(resource.resourceType);

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm(`确认删除「${resource.title}」？`)) {
      removeResource(resource.id);
    }
  };
  const handleEdit = (e) => { e.stopPropagation(); openAddModal(resource); };
  const handlePrimaryAction = async (e) => {
    e.stopPropagation();
    if (resource.resourceType === 'account') {
      const text = `账号: ${resource.accountName || '-'}\n密码: ${resource.password || '-'}`;
      await navigator.clipboard.writeText(text);
      useAppStore.getState().showToast('账号密码已复制到剪贴板 ✅', 'success');
    } else if (resource.resourceType === 'secret') {
      await navigator.clipboard.writeText(resource.secretValue || '');
      useAppStore.getState().showToast('密钥 Token 已复制到剪贴板 ✅', 'success');
    } else if (resource.resourceType === 'snippet') {
      await navigator.clipboard.writeText(resource.codeContent || '');
      useAppStore.getState().showToast('代码片段已复制到剪贴板 ✅', 'success');
    } else {
      if (resource.url) window.open(resource.url, '_blank', 'noopener');
    }
  };

  const handleCardClick = (e) => {
    e.stopPropagation();
    openDetailModal(resource);
  };

  const handleCardDoubleClick = (e) => {
    e.stopPropagation();
    openAddModal(resource);
  };

  const handleCardContextMenu = (e) => {
    if (onContextMenu) {
      onContextMenu(e, resource);
    }
  };

  return (
    <div
      className="resource-card"
      style={{ animationDelay: `${animDelay}ms`, ...style }}
      onClick={handleCardClick}
      onDoubleClick={handleCardDoubleClick}
      onContextMenu={handleCardContextMenu}
    >
      {/* Thumbnail */}
      <div className="card-thumb">
        {resource.status && resource.status !== 'common' && (
          <span className={`card-pricing-badge badge-${resource.status}`} style={{
            position: 'absolute', top: 8, left: 8, zIndex: 10, fontSize: 11, padding: '2px 6px', borderRadius: 4, fontWeight: 600,
            background: 'oklch(0% 0 0 / 0.5)', color: 'white', backdropFilter: 'blur(4px)'
          }}>
            {resource.status === 'pending' ? '⏳ 待评估' :
             resource.status === 'caution' ? '⚠️ 慎用' :
             resource.status === 'deprecated' ? '💤 已弃用' :
             resource.status === 'freebies' ? '🎉 薅羊毛' : '🎯 定需'}
          </span>
        )}
        <span style={{
          position: 'absolute', bottom: 8, right: 8, zIndex: 10, fontSize: 11, padding: '2px 6px', borderRadius: 4, fontWeight: 600,
          background: `color-mix(in oklch, ${rType.color} 80%, black)`, color: 'white', backdropFilter: 'blur(4px)', display: 'flex', gap: 4, alignItems: 'center'
        }}>
          {rType.icon} {rType.label}
        </span>
        {resource.resourceType === 'snippet' ? (
          <div className="card-thumb-code" style={{ padding: 12, background: '#1e1e1e', color: '#d4d4d4', fontFamily: 'monospace', fontSize: 11, height: '100%', overflow: 'hidden' }}>
            <div style={{ color: 'var(--cat-emerald)', marginBottom: 4 }}>// {resource.language || 'code'}</div>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{resource.codeContent?.slice(0, 100)}{resource.codeContent?.length > 100 ? '...' : ''}</pre>
          </div>
        ) : resource.resourceType === 'secret' ? (
          <div className="card-thumb-secret" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'var(--bg-hover)', color: 'var(--text-2)' }}>
            <Key size={32} style={{ marginBottom: 8, color: 'var(--error)' }} />
            <div style={{ fontFamily: 'monospace', fontSize: 14, letterSpacing: 2 }}>••••••••••••</div>
          </div>
        ) : resource.imageData
          ? <img 
              src={resource.imageData} 
              alt={resource.title} 
              loading="lazy" 
              style={{
                objectPosition: resource.imageCrop ? `${resource.imageCrop.pos.x}% ${resource.imageCrop.pos.y}%` : 'center',
                transform: resource.imageCrop ? `scale(${resource.imageCrop.scale})` : 'none',
              }}
            />
          : (
            <div className="card-thumb-placeholder">
              <Globe size={28} strokeWidth={1.3} />
              <span>暂无预览图</span>
            </div>
          )
        }
        {/* Hover overlay actions */}
        <div className="card-overlay">
          {['account', 'secret', 'snippet'].includes(resource.resourceType) ? (
            <button className="card-overlay-btn open" onClick={handlePrimaryAction} title="一键复制">
              <Copy size={13} />
            </button>
          ) : resource.url && (
            <button className="card-overlay-btn open" onClick={handlePrimaryAction} title="打开链接">
              <ExternalLink size={13} />
            </button>
          )}
          <button className="card-overlay-btn edit" onClick={handleEdit} title="编辑">
            <Edit2 size={13} />
          </button>
          <button className="card-overlay-btn del" onClick={handleDelete} title="删除">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="card-body">
        {/* 1. Resource Title and Stars */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
          <p className="card-title" style={{ flex: 1, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{resource.title}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            {resource.rating > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 1, color: 'oklch(76% 0.18 72)' }}>
                {[...Array(Math.round(resource.rating))].map((_, i) => (
                  <Star key={i} size={11} style={{ fill: 'currentColor', stroke: 'currentColor' }} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 2. Brief Description */}
        {resource.description && (
          <p className="card-desc" style={{ marginBottom: 4 }}>{resource.description}</p>
        )}

        {resource.pricings && resource.pricings.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {resource.pricings.map(p => {
              const typeColor = p.type === 'free' ? 'oklch(70% 0.15 150)' : p.type === 'subscription' ? 'oklch(70% 0.15 280)' : 'oklch(70% 0.15 40)';
              return (
                <span key={p.id} style={{
                  fontSize: 11.5, padding: '2px 8px', borderRadius: 6,
                  background: `color-mix(in oklch, ${typeColor} 15%, transparent)`,
                  color: typeColor, border: `1px solid color-mix(in oklch, ${typeColor} 30%, transparent)`,
                  display: 'inline-flex', gap: 4, alignItems: 'center'
                }}>
                  <span style={{ fontWeight: 600 }}>{p.type === 'free' ? '免费' : p.type === 'subscription' ? '订阅' : '买断'}</span>
                  {p.model && <span style={{ opacity: 0.8 }}>| {p.model}</span>}
                  {p.priceNum > 0 && <span style={{ opacity: 0.8 }}>| {p.currency ?? '¥'}{p.priceNum}</span>}
                </span>
              );
            })}
          </div>
        )}

        {/* Expiration Date */}
        {resource.expiresAt && (
          <div style={{ marginBottom: 8, fontSize: 11.5, color: 'var(--cat-rose)', display: 'flex', alignItems: 'center', gap: 4, background: 'color-mix(in oklch, var(--cat-rose) 10%, transparent)', padding: '2px 6px', borderRadius: 4, width: 'fit-content' }}>
            ⏳ 到期 / 续费：{resource.expiresAt}
          </div>
        )}



        {/* 4. Tags */}
        {(resource.tagIds?.length > 0 || resource.tags?.length > 0) && (
          <div className="card-tags">
            {resource.tagIds?.map(tid => {
              const gt = globalTags.find(t => t.id === tid);
              if (!gt) return null;
              return <span key={`gt-${tid}`} className="chip chip-tag" style={{borderColor: 'var(--accent-border)', color: 'var(--accent-light)', background: 'var(--accent-dim)'}}>#{gt.name}</span>;
            })}
            {resource.tags?.map(tag => (
              <span key={`ct-${tag}`} className="chip chip-tag">#{tag}</span>
            ))}
          </div>
        )}

        {/* 5. Scenarios */}
        {(resource.scenario || resource.scenarios) && (
          <p className="card-desc" style={{ marginTop: 4, color: 'var(--text-2)', fontSize: 12 }}>
            <strong style={{ color: 'var(--text-1)' }}>🧭 适用场景: </strong>
            {resource.scenario || resource.scenarios}
          </p>
        )}

        {/* 6. Differential Value */}
        {resource.diffValue && (
          <p className="card-desc" style={{ marginTop: 2, fontSize: 12 }}>
            <strong style={{ color: 'var(--accent)' }}>✨ 差异点: </strong>
            {resource.diffValue}
          </p>
        )}
      </div>
    </div>
  );
}
