import { useState, useEffect } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { GitBranch } from 'lucide-react';

export default function StepNode({ id, data, selected }) {
  const { updateNodeData } = useReactFlow();
  const [label, setLabel] = useState(data.label ?? '节点');

  // Keep text in sync with sidebar edits
  useEffect(() => {
    setLabel(data.label ?? '节点');
  }, [data.label]);

  const handleChange = (e) => {
    const val = e.target.value;
    setLabel(val);
    updateNodeData(id, { label: val });
  };

  return (
    <div className={`step-node ${selected ? 'selected' : ''}`}>
      <Handle id="t-left" type="target" position={Position.Left}   style={{ top: '50%' }} />
      <Handle id="s-left" type="source" position={Position.Left}   style={{ top: '50%', opacity: 0 }} />
      
      <Handle id="t-right" type="target" position={Position.Right}  style={{ top: '50%', opacity: 0 }} />
      <Handle id="s-right" type="source" position={Position.Right}  style={{ top: '50%' }} />
      
      <Handle id="t-top" type="target" position={Position.Top}    style={{ left: '50%' }} />
      <Handle id="s-top" type="source" position={Position.Top}    style={{ left: '50%', opacity: 0 }} />
      
      <Handle id="t-bottom" type="target" position={Position.Bottom} style={{ left: '50%', opacity: 0 }} />
      <Handle id="s-bottom" type="source" position={Position.Bottom} style={{ left: '50%' }} />

      <div className="step-node-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
          <GitBranch size={11} style={{ flexShrink: 0 }} />
          <input
            className="step-node-textarea"
            style={{ padding: 0, margin: 0, border: 'none', background: 'transparent', fontWeight: 'inherit', fontSize: 'inherit', color: 'inherit' }}
            value={label}
            onChange={handleChange}
            onMouseDown={e => e.stopPropagation()}
            placeholder="节点名称"
          />
        </div>
        {data.duration && (
          <span className="step-duration-badge" style={{ flexShrink: 0 }}>
            ⏱️ {data.duration}
          </span>
        )}
      </div>
    </div>
  );
}
