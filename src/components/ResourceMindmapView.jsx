import { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronDown, Compass, Tag, Link } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { getCatColor } from '../utils/colors';

export default function ResourceMindmapView() {
  const { filteredResources, categories, openDetailModal } = useAppStore();
  const [organizeBy, setOrganizeBy] = useState('category'); // 'category' | 'tag'
  const [expandedBranches, setExpandedBranches] = useState({});

  const containerRef = useRef(null);
  const rootNodeRef = useRef(null);
  const branchRefs = useRef({});
  const leafRefs = useRef({});
  const [lines, setLines] = useState([]);

  // Get active branches and their resources
  const getBranchesData = () => {
    if (organizeBy === 'category') {
      return categories
        .map(cat => {
          const items = filteredResources.filter(r => r.categoryIds?.includes(cat.id));
          return {
            id: cat.id,
            name: cat.name,
            emoji: cat.emoji,
            color: getCatColor(cat.color),
            items,
          };
        })
        .filter(b => b.items.length > 0);
    } else {
      // Gather all tags from filtered resources
      const tagSet = new Set();
      filteredResources.forEach(r => r.tags?.forEach(t => tagSet.add(t)));
      return Array.from(tagSet).map(tagName => {
        const items = filteredResources.filter(r => r.tags?.includes(tagName));
        return {
          id: `tag-${tagName}`,
          name: `#${tagName}`,
          emoji: '🏷️',
          color: 'var(--accent)',
          items,
        };
      });
    }
  };

  const branches = getBranchesData();

  // Initialize all branches to expanded
  useEffect(() => {
    const initial = {};
    branches.forEach(b => {
      initial[b.id] = true;
    });
    setExpandedBranches(initial);
  }, [organizeBy, filteredResources.length]);

  const toggleBranch = (id) => {
    setExpandedBranches(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Recalculate SVG connection lines whenever dimensions or expansion state changes
  const recalculateLines = () => {
    if (!containerRef.current || !rootNodeRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const rootRect = rootNodeRef.current.getBoundingClientRect();

    const rootX = rootRect.right - containerRect.left;
    const rootY = rootRect.top + rootRect.height / 2 - containerRect.top;

    const newLines = [];

    branches.forEach(b => {
      const branchEl = branchRefs.current[b.id];
      if (!branchEl) return;

      const branchRect = branchEl.getBoundingClientRect();
      const branchLeftX = branchRect.left - containerRect.left;
      const branchMidY = branchRect.top + branchRect.height / 2 - containerRect.top;

      // Line from root to branch
      newLines.push({
        id: `line-root-${b.id}`,
        fromX: rootX,
        fromY: rootY,
        toX: branchLeftX,
        toY: branchMidY,
        color: b.color,
        dashed: false,
      });

      // If branch is expanded, draw lines from branch to its leaves
      if (expandedBranches[b.id]) {
        b.items.forEach(res => {
          const leafKey = `${b.id}-${res.id}`;
          const leafEl = leafRefs.current[leafKey];
          if (!leafEl) return;

          const leafRect = leafEl.getBoundingClientRect();
          const branchRightX = branchRect.right - containerRect.left;
          const leafLeftX = leafRect.left - containerRect.left;
          const leafMidY = leafRect.top + leafRect.height / 2 - containerRect.top;

          newLines.push({
            id: `line-${b.id}-${res.id}`,
            fromX: branchRightX,
            fromY: branchMidY,
            toX: leafLeftX,
            toY: leafMidY,
            color: b.color,
            dashed: true,
          });
        });
      }
    });

    setLines(newLines);
  };

  useEffect(() => {
    // Wait for DOM layout to settle, then draw lines
    const timer = setTimeout(recalculateLines, 150);
    window.addEventListener('resize', recalculateLines);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', recalculateLines);
    };
  }, [branches.length, expandedBranches, organizeBy, filteredResources]);

  // Redraw curves when any branch list items finish mounting/animating
  useEffect(() => {
    recalculateLines();
  });

  return (
    <div className="mindmap-view-wrap animate-fade-in">
      {/* Mindmap header / controls */}
      <div className="mindmap-controls">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text-3)' }}>展示维度:</span>
          <div className="btn-group-sm">
            <button
              className={`btn btn-xs ${organizeBy === 'category' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setOrganizeBy('category')}
            >
              <Compass size={12} /> 分类层级
            </button>
            <button
              className={`btn btn-xs ${organizeBy === 'tag' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setOrganizeBy('tag')}
            >
              <Tag size={12} /> 标签映射
            </button>
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
          🔍 脑图实时呈现在此维度下的关联关系 · 点击资源节点查看卡片详情
        </div>
      </div>

      {/* Mindmap Canvas Area */}
      <div className="mindmap-canvas" ref={containerRef}>
        {/* Dynamic connection lines overlay */}
        <svg className="mindmap-svg-overlay">
          {lines.map(line => {
            // Compute elegant bezier curve path
            const dx = Math.abs(line.toX - line.fromX) * 0.45;
            const path = `M ${line.fromX} ${line.fromY} C ${line.fromX + dx} ${line.fromY}, ${line.toX - dx} ${line.toY}, ${line.toX} ${line.toY}`;
            return (
              <path
                key={line.id}
                d={path}
                fill="none"
                stroke={line.color}
                strokeWidth={line.dashed ? 1.5 : 2.5}
                strokeDasharray={line.dashed ? "4,4" : "none"}
                style={{
                  opacity: 0.65,
                  transition: 'stroke 0.2s ease, d 0.25s ease'
                }}
              />
            );
          })}
        </svg>

        {/* Horizontal Mindmap Tree */}
        <div className="mindmap-tree">
          {/* Level 1: Root Node */}
          <div className="mindmap-root-col">
            <div className="mindmap-root-node glass" ref={rootNodeRef}>
              <span style={{ fontSize: 24 }}>🗂️</span>
              <div>
                <span className="mindmap-root-title">ToolVault</span>
                <span className="mindmap-root-desc">{filteredResources.length} 个资源</span>
              </div>
            </div>
          </div>

          {/* Level 2 & 3: Branches & Leaves */}
          <div className="mindmap-branches-col">
            {branches.map(b => (
              <div key={b.id} className="mindmap-branch-row">
                {/* Branch Node */}
                <div
                  ref={el => branchRefs.current[b.id] = el}
                  className={`mindmap-branch-node glass ${expandedBranches[b.id] ? 'expanded' : ''}`}
                  style={{ '--branch-color': b.color }}
                  onClick={() => toggleBranch(b.id)}
                >
                  <span className="branch-icon">{b.emoji}</span>
                  <span className="branch-name">{b.name}</span>
                  <span className="branch-count">{b.items.length}</span>
                  {expandedBranches[b.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>

                {/* Leaf Nodes */}
                {expandedBranches[b.id] && (
                  <div className="mindmap-leaves-col">
                    {b.items.map(res => (
                      <div
                        key={res.id}
                        ref={el => leafRefs.current[`${b.id}-${res.id}`] = el}
                        className="mindmap-leaf-node glass animate-scale-up"
                        onClick={() => openDetailModal(res)}
                      >
                        <div className="leaf-thumb">
                          {res.imageData ? (
                            <img src={res.imageData} alt="" />
                          ) : (
                            <span style={{ fontSize: 13 }}>🌐</span>
                          )}
                        </div>
                        <div className="leaf-info">
                          <span className="leaf-title truncate">{res.title}</span>
                          {res.pricing && (
                            <span className={`leaf-pricing badge-${res.pricing}`}>
                              {res.pricing === 'free' ? '免费' : res.pricing === 'limited-free' ? '限免' : res.pricing === 'freemium' ? '内购' : '付费'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
