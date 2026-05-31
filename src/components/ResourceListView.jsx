import { ExternalLink, Edit2, Trash2, Star, Globe, Copy, Key } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { getCatColor } from '../utils/colors';

export default function ResourceListView({ onContextMenu }) {
  const { filteredResources, tags: globalTags, openAddModal, removeResource, openDetailModal, sortBy, setSortBy } = useAppStore();

  const statusLabels = {
    'common': '常用',
    'pending': '待评估',
    'caution': '慎用',
    'deprecated': '已弃用',
    'custom': '定需',
    'freebies': '薅羊毛',
  };

  const handleDelete = (e, res) => {
    e.stopPropagation();
    if (window.confirm(`确认删除「${res.title}」？`)) {
      removeResource(res.id);
    }
  };

  const handleEdit = (e, res) => {
    e.stopPropagation();
    openAddModal(res);
  };

  const handlePrimaryAction = async (e, res) => {
    e.stopPropagation();
    if (res.resourceType === 'account') {
      const text = `账号: ${res.accountName || '-'}\n密码: ${res.password || '-'}`;
      await navigator.clipboard.writeText(text);
      useAppStore.getState().showToast('账号密码已复制到剪贴板 ✅', 'success');
    } else if (res.resourceType === 'secret') {
      await navigator.clipboard.writeText(res.secretValue || '');
      useAppStore.getState().showToast('密钥 Token 已复制到剪贴板 ✅', 'success');
    } else if (res.resourceType === 'snippet') {
      await navigator.clipboard.writeText(res.codeContent || '');
      useAppStore.getState().showToast('代码片段已复制到剪贴板 ✅', 'success');
    } else {
      if (res.url) window.open(res.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="list-view-wrap animate-fade-in">
      <table className="list-table">
        <thead>
          <tr>
            <th style={{ width: 48 }}>预览</th>
            <th style={{ cursor: 'pointer', userSelect: 'none' }}>
              名称
            </th>
            <th style={{ width: 84 }}>工具状态</th>
            <th style={{ width: 100, cursor: 'pointer', userSelect: 'none' }} onClick={() => setSortBy('price_asc')} title="按价格最低排序">
              价格方案 {sortBy === 'price_asc' && '↑'}
            </th>
            <th style={{ width: 80, cursor: 'pointer', userSelect: 'none' }} onClick={() => setSortBy('rating')} title="按评分最高排序">
              评分 {sortBy === 'rating' && '↓'}
            </th>
            <th style={{ width: 84, cursor: 'pointer', userSelect: 'none' }} onClick={() => setSortBy('usageCount')} title="按使用次数最多排序">
              使用次数 {sortBy === 'usageCount' && '↓'}
            </th>
            <th>标签</th>
            <th style={{ width: 110, textAlign: 'center' }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {filteredResources.map(res => {

            return (
              <tr
                key={res.id}
                onClick={() => openDetailModal(res)}
                onDoubleClick={(e) => handleEdit(e, res)}
                onContextMenu={(e) => onContextMenu && onContextMenu(e, res)}
                className="list-row"
              >
                {/* Thumb */}
                <td>
                  <div className="list-thumb">
                    {res.imageData ? (
                      <img src={res.imageData} alt="" />
                    ) : (
                      <div className="list-thumb-ph"><Globe size={11} /></div>
                    )}
                  </div>
                </td>

                {/* Name & Url */}
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="list-title">{res.title}</span>
                    {res.description && (
                      <span className="list-subtitle truncate" style={{ maxWidth: 220 }}>
                        {res.description}
                      </span>
                    )}
                  </div>
                </td>

                {/* Status */}
                <td>
                  <span className={`list-badge badge-status-${res.status ?? 'common'}`}>
                    {statusLabels[res.status ?? 'common']}
                  </span>
                </td>

                {/* Pricings */}
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {res.pricings && res.pricings.length > 0 ? res.pricings.map(p => {
                      const typeColor = p.type === 'free' ? 'oklch(70% 0.15 150)' : p.type === 'subscription' ? 'oklch(70% 0.15 280)' : 'oklch(70% 0.15 40)';
                      return (
                        <span key={p.id} style={{
                          fontSize: 10, padding: '1px 4px', borderRadius: 4,
                          background: `color-mix(in oklch, ${typeColor} 15%, transparent)`,
                          color: typeColor, border: `1px solid color-mix(in oklch, ${typeColor} 30%, transparent)`,
                          display: 'inline-flex', gap: 3, alignItems: 'center', width: 'max-content'
                        }}>
                          <span style={{ fontWeight: 600 }}>
                            {p.type === 'free' ? '免费' : p.type === 'subscription' ? '订阅' : '买断'}
                            {p.model && ` | ${p.model}`}
                            {p.priceNum > 0 && ` | ${p.currency ?? '¥'}${p.priceNum}`}
                          </span>
                        </span>
                      );
                    }) : <span style={{ color: 'var(--text-3)', fontSize: 12 }}>—</span>}
                  </div>
                </td>

                {/* Rating */}
                <td>
                  {res.rating > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'oklch(76% 0.18 72)' }}>
                      <Star size={11} style={{ fill: 'oklch(76% 0.18 72)', stroke: 'oklch(76% 0.18 72)' }} />
                      <span style={{ fontWeight: 600, fontSize: 12.5 }}>{res.rating}</span>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-3)', fontSize: 12 }}>—</span>
                  )}
                </td>
                
                {/* Usage Count */}
                <td>
                  <div style={{ fontSize: 12.5, color: 'var(--text-2)', textAlign: 'center' }}>
                    {res.usageCount ?? 0}
                  </div>
                </td>


                {/* Tags */}
                <td>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {res.tagIds?.slice(0, 2).map(tid => {
                      const gt = globalTags.find(t => t.id === tid);
                      if (!gt) return null;
                      return <span key={`gt-${tid}`} className="chip chip-tag" style={{ padding: '1px 5px', fontSize: 10.5, borderColor: 'var(--accent-border)', color: 'var(--accent-light)', background: 'var(--accent-dim)' }}>#{gt.name}</span>;
                    })}
                    {res.tags?.slice(0, 3).map(tag => (
                      <span key={tag} className="chip chip-tag" style={{ padding: '1px 5px', fontSize: 10.5 }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                </td>

                {/* Actions */}
                <td>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }} onClick={e => e.stopPropagation()}>
                    {['account', 'secret', 'snippet'].includes(res.resourceType) ? (
                      <button className="list-act-btn open" onClick={(e) => handlePrimaryAction(e, res)} title="一键复制">
                        <Copy size={12} />
                      </button>
                    ) : res.url && (
                      <button className="list-act-btn open" onClick={(e) => handlePrimaryAction(e, res)} title="直达链接">
                        <ExternalLink size={12} />
                      </button>
                    )}
                    <button className="list-act-btn edit" onClick={(e) => handleEdit(e, res)} title="编辑">
                      <Edit2 size={12} />
                    </button>
                    <button className="list-act-btn del" onClick={(e) => handleDelete(e, res)} title="删除">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
