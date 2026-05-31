import { useState, useEffect, useRef } from 'react';
import { Plus, Star, Tag, Clipboard, Trash2, X, ExternalLink } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { RESOURCE_TYPE_OPTIONS } from '../utils/resourceTypes';
import ResourceCard from '../components/ResourceCard';
import ResourceListView from '../components/ResourceListView';
import ResourceMindmapView from '../components/ResourceMindmapView';
import DetailPanel from '../components/DetailPanel';

export default function LibraryView() {
  const {
    filteredResources, resources,
    openAddModal,
    searchQuery, selectedResourceType, categories,
    viewType, addOrUpdateResource, removeResource,
    tags, showToast, detailResource
  } = useAppStore();

  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, resource: null });
  const [subActive, setSubActive] = useState(null); // null | 'category' | 'tag'
  const menuRef = useRef(null);

  // Close context menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setContextMenu({ visible: false, x: 0, y: 0, resource: null });
        setSubActive(null);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const handleContextMenu = (e, res) => {
    e.preventDefault();
    // Prevent context menu from spawning off-screen
    let x = e.clientX;
    let y = e.clientY;
    const menuWidth = 190;
    const menuHeight = 240;
    if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 10;
    if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight - 10;

    setContextMenu({ visible: true, x, y, resource: res });
    setSubActive(null);
  };

  // Context Menu Actions
  const handleToggleStar = async () => {
    if (!contextMenu.resource) return;
    const res = contextMenu.resource;
    const nextRating = res.rating === 5 ? 0 : 5;
    await addOrUpdateResource({ ...res, rating: nextRating });
    showToast(nextRating === 5 ? '快捷星标成功 ⭐️' : '已取消星标', 'success');
    setContextMenu({ visible: false, x: 0, y: 0, resource: null });
  };



  const handleToggleTag = async (tagName) => {
    if (!contextMenu.resource) return;
    const res = contextMenu.resource;
    const currentTags = res.tags ?? [];
    const nextTags = currentTags.includes(tagName)
      ? currentTags.filter(t => t !== tagName)
      : [...currentTags, tagName];
    await addOrUpdateResource({ ...res, tags: nextTags });
    showToast(currentTags.includes(tagName) ? '标签已移除' : '标签添加成功', 'success');
    setContextMenu({ visible: false, x: 0, y: 0, resource: null });
    setSubActive(null);
  };

  const handleCopyLink = () => {
    if (!contextMenu.resource?.url) return;
    navigator.clipboard.writeText(contextMenu.resource.url);
    showToast('链接复制成功 📋', 'success');
    setContextMenu({ visible: false, x: 0, y: 0, resource: null });
  };

  const handleDeleteResource = async () => {
    if (!contextMenu.resource) return;
    const res = contextMenu.resource;
    if (window.confirm(`确认删除「${res.title}」？`)) {
      await removeResource(res.id);
      showToast('资源删除成功', 'success');
    }
    setContextMenu({ visible: false, x: 0, y: 0, resource: null });
  };

  const selectedType = RESOURCE_TYPE_OPTIONS.find(rt => rt.id === selectedResourceType);
  const emptyTitle  = selectedType
    ? `「${selectedType.label}」下暂无资源`
    : searchQuery
      ? `没有找到「${searchQuery}」相关资源`
      : '还没有收录任何资源';
  const emptyDesc = selectedType || searchQuery
    ? '尝试调整搜索词或在上方高级筛选中切换标签'
    : '点击右上角「添加资源」，开始整理你的智能工具箱吧！';

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0, position: 'relative' }}>
      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
        {filteredResources.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              {selectedType ? selectedType.icon : searchQuery ? '🔍' : '🗂️'}
            </div>
            <h3>{emptyTitle}</h3>
            <p>{emptyDesc}</p>
            {!selectedType && !searchQuery && (
              <button className="btn btn-primary" onClick={() => openAddModal()}>
                <Plus size={15} /> 添加第一个资源
              </button>
            )}
          </div>
        ) : (
          <>
            {viewType === 'card' && (
              <div className="library-grid">
                {filteredResources.map((res, i) => (
                  <ResourceCard
                    key={res.id}
                    resource={res}
                    animDelay={Math.min(i * 35, 250)}
                    onContextMenu={handleContextMenu}
                  />
                ))}
              </div>
            )}

            {viewType === 'list' && (
              <ResourceListView onContextMenu={handleContextMenu} />
            )}

            {viewType === 'mindmap' && (
              <ResourceMindmapView />
            )}
          </>
        )}
      </div>

      {/* Right Sidebar Detail Drawer */}
      {detailResource && <DetailPanel />}

      {/* ── Custom Right-Click Context Menu (毛玻璃上下文菜单) ── */}
      {contextMenu.visible && (
        <div
          ref={menuRef}
          className="context-menu glass animate-scale-up"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          {/* Header */}
          <div className="menu-header truncate">
            {contextMenu.resource?.title}
          </div>

          {/* Action List */}
          <div className="menu-list">
            {/* Quick Star */}
            <button className="menu-item" onClick={handleToggleStar}>
              <Star size={13} style={{ fill: contextMenu.resource?.rating === 5 ? 'oklch(76% 0.18 72)' : 'none', stroke: 'oklch(76% 0.18 72)' }} />
              <span>{contextMenu.resource?.rating === 5 ? '取消星标' : '快捷星标 (5星)'}</span>
            </button>

            {/* Quick Link */}
            {contextMenu.resource?.url && (
              <button className="menu-item" onClick={() => { window.open(contextMenu.resource.url, '_blank'); setContextMenu({ visible: false, x: 0, y: 0, resource: null }); }}>
                <ExternalLink size={13} />
                <span>直接打开链接</span>
              </button>
            )}

            {/* Copy Link */}
            {contextMenu.resource?.url && (
              <button className="menu-item" onClick={handleCopyLink}>
                <Clipboard size={13} />
                <span>复制资源链接</span>
              </button>
            )}

            {/* Divider */}
            <div className="menu-divider" />



            {/* Quick Tag assignment */}
            <div
              className={`menu-item has-sub ${subActive === 'tag' ? 'active' : ''}`}
              onMouseEnter={() => setSubActive('tag')}
              style={{ position: 'relative' }}
            >
              <Tag size={13} />
              <span>快捷打标签</span>
              {subActive === 'tag' && (
                <div className="sub-context-menu glass animate-scale-up" style={{ left: 180, top: 0 }}>
                  <div className="menu-header">选择标签</div>
                  <div className="menu-list scrollable" style={{ maxHeight: 180, overflowY: 'auto' }}>
                    {tags.length === 0 ? (
                      <span className="menu-item disabled">请在侧栏新建标签</span>
                    ) : (
                      tags.map(t => {
                        const hasTag = contextMenu.resource?.tags?.includes(t.name);
                        return (
                          <button
                            key={t.id}
                            className="menu-item"
                            onClick={() => handleToggleTag(t.name)}
                          >
                            <span style={{ color: hasTag ? 'var(--accent)' : 'var(--text-3)', fontSize: 12, marginRight: 2 }}>#</span>
                            <span style={{ fontWeight: hasTag ? 600 : 400 }}>{t.name}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="menu-divider" />

            {/* Delete Resource */}
            <button className="menu-item danger" onClick={handleDeleteResource}>
              <Trash2 size={13} />
              <span>彻底删除资源</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
