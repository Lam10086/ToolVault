import { Handle, Position } from '@xyflow/react';
import useAppStore from '../../store/useAppStore';
import { getCatColor } from '../../utils/colors';
import { ExternalLink } from 'lucide-react';

export default function ResourceNode({ data, selected }) {
  const { resources, categories } = useAppStore();
  const res = resources.find(r => r.id === data.resourceId);

  if (!res) {
    return (
      <div className={`res-node ${selected ? 'selected' : ''}`}
        style={{ padding: 12, color: 'var(--text-3)', fontSize: 13 }}>
        <Handle type="target" position={Position.Left} />
        <Handle type="source" position={Position.Right} />
        ⚠️ 资源已删除
      </div>
    );
  }

  const resCats = categories.filter(c => res.categoryIds?.includes(c.id));

  return (
    <div className={`res-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Left} style={{ top: '50%' }} />
      <Handle type="source" position={Position.Right} style={{ top: '50%' }} />
      <Handle type="target" position={Position.Top}  style={{ left: '50%' }} />
      <Handle type="source" position={Position.Bottom} style={{ left: '50%' }} />

      {/* Thumbnail */}
      {res.imageData
        ? <img className="res-node-thumb" src={res.imageData} alt={res.title} />
        : (
          <div className="res-node-thumb-ph">
            <span>🌐</span>
          </div>
        )
      }

      <div className="res-node-body">
        <p className="res-node-title">{res.title}</p>

        {resCats.length > 0 && (
          <p className="res-node-cat">
            {resCats.map(c => `${c.emoji} ${c.name}`).join(' · ')}
          </p>
        )}

        {res.url && (
          <a
            href={res.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              marginTop: 6, fontSize: 11, color: 'var(--accent)',
              textDecoration: 'none',
            }}
          >
            <ExternalLink size={10} /> 打开链接
          </a>
        )}
      </div>
    </div>
  );
}
