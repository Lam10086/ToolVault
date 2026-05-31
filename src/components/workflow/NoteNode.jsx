import { useState, useEffect } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';

export default function NoteNode({ id, data, selected }) {
  const { updateNodeData } = useReactFlow();
  const [text, setText] = useState(data.text ?? '');

  // Keep text in sync with sidebar edits
  useEffect(() => {
    setText(data.text ?? '');
  }, [data.text]);

  const handleChange = (e) => {
    const val = e.target.value;
    setText(val);
    updateNodeData(id, { text: val });
  };

  const colorClass = data.color ?? 'pastel-yellow';

  return (
    <div className={`note-node ${colorClass} ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Left}   style={{ top: '50%' }} />
      <Handle type="source" position={Position.Right}  style={{ top: '50%' }} />
      <Handle type="target" position={Position.Top}    style={{ left: '50%' }} />
      <Handle type="source" position={Position.Bottom} style={{ left: '50%' }} />

      <div className="note-node-label">📝 备注</div>
      <textarea
        className="note-node-textarea"
        placeholder="写下你的想法、提醒…"
        value={text}
        onChange={handleChange}
        onMouseDown={e => e.stopPropagation()}
        rows={3}
      />
    </div>
  );
}
