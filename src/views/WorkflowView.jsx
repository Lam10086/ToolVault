import { useCallback, useRef, useEffect, useState } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
  Panel,
  SelectionMode,
} from '@xyflow/react';
import useAppStore from '../store/useAppStore';
import WorkflowSidebar from '../components/workflow/WorkflowSidebar';
import ResourceNode from '../components/workflow/ResourceNode';
import StepNode from '../components/workflow/StepNode';
import NoteNode from '../components/workflow/NoteNode';
import PropertiesPanel from '../components/workflow/PropertiesPanel';
import { uid } from '../db/storage';
import { Save, Image, Download, Upload, Copy, Trash2, PlusCircle, Check, X, ShieldAlert } from 'lucide-react';
import { toPng } from 'html-to-image';

const nodeTypes = {
  resourceNode: ResourceNode,
  stepNode:     StepNode,
  noteNode:     NoteNode,
};

// ── Inner canvas (needs ReactFlowProvider context) ────────────────────────────
function WorkflowCanvas({ workflow, onSave, pendingAction, onActionDone }) {
  const { screenToFlowPosition } = useReactFlow();
  const { showToast } = useAppStore();

  const [nodes, setNodes, onNodesChange] = useNodesState(workflow?.nodes ?? []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(workflow?.edges ?? []);

  // Context Menu State for Workflow
  const [wfMenu, setWfMenu] = useState({ visible: false, x: 0, y: 0, type: 'pane', node: null, edge: null });
  const wfMenuRef = useRef(null);

  // Ninja Slice State
  const [slicePath, setSlicePath] = useState([]);
  const [isSlicing, setIsSlicing] = useState(false);
  const slicePoints = useRef([]);

  const fileInputRef = useRef(null);
  const saveTimerRef = useRef(null);

  // Keep a stable ref to current nodes/edges for use inside callbacks
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);

  // History tracking for Undo/Redo
  const past = useRef([]);
  const future = useRef([]);

  const pushHistory = useCallback(() => {
    const cloneNodes = nodesRef.current.map(n => ({...n, selected: false}));
    const cloneEdges = edgesRef.current.map(e => ({...e, selected: false}));
    past.current.push({ nodes: cloneNodes, edges: cloneEdges });
    if (past.current.length > 30) past.current.shift();
    future.current = [];
  }, []);

  const scheduleAutoSave = useCallback((ns, es) => {
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => onSave(ns, es), 1500);
  }, [onSave]);

  const undo = useCallback(() => {
    if (past.current.length === 0) return;
    const currentState = { nodes: nodesRef.current.map(n=>({...n})), edges: edgesRef.current.map(e=>({...e})) };
    future.current.push(currentState);
    const prev = past.current.pop();
    setNodes(prev.nodes);
    setEdges(prev.edges);
    scheduleAutoSave(prev.nodes, prev.edges);
    showToast('撤销成功 ↩️', 'success');
  }, [setNodes, setEdges, scheduleAutoSave, showToast]);

  const redo = useCallback(() => {
    if (future.current.length === 0) return;
    const currentState = { nodes: nodesRef.current.map(n=>({...n})), edges: edgesRef.current.map(e=>({...e})) };
    past.current.push(currentState);
    const next = future.current.pop();
    setNodes(next.nodes);
    setEdges(next.edges);
    scheduleAutoSave(next.nodes, next.edges);
    showToast('重做成功 ↪️', 'success');
  }, [setNodes, setEdges, scheduleAutoSave, showToast]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if inside input or textarea
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === 'z') {
          e.preventDefault();
          if (e.shiftKey) redo();
          else undo();
        } else if (e.key.toLowerCase() === 'y') {
          e.preventDefault();
          redo();
        }
      } else {
        // Tab / Enter shortcuts for quick node creation
        if (e.key === 'Tab' || e.key === 'Enter') {
          const selected = nodesRef.current.find(n => n.selected);
          if (selected) {
            e.preventDefault();
            pushHistory();
            const id = uid();
            const isTab = e.key === 'Tab';
            
            const newNode = {
              id,
              type: 'stepNode',
              position: { 
                x: selected.position.x + (isTab ? 320 : 0), 
                y: selected.position.y + (isTab ? 0 : 160) 
              },
              data: { label: '新步骤', text: '', duration: '', remarks: '' },
            };
            
            let newEdge = null;
            if (isTab) {
              newEdge = { id: `e-${selected.id}-${id}`, source: selected.id, target: id, animated: true, style: { stroke: 'var(--accent-border)', strokeWidth: 2 } };
            } else {
              const incomingEdge = edgesRef.current.find(ed => ed.target === selected.id);
              if (incomingEdge) {
                newEdge = { id: `e-${incomingEdge.source}-${id}`, source: incomingEdge.source, target: id, animated: true, style: { stroke: 'var(--accent-border)', strokeWidth: 2 } };
              }
            }
            
            setNodes(ns => {
              const nextNs = [...ns.map(n => ({ ...n, selected: false })), { ...newNode, selected: true }];
              if (newEdge) {
                 setEdges(es => {
                   const nextEs = [...es, newEdge];
                   scheduleAutoSave(nextNs, nextEs);
                   return nextEs;
                 });
              } else {
                 scheduleAutoSave(nextNs, edgesRef.current);
              }
              return nextNs;
            });
            showToast(isTab ? '已添加子节点 ⚡' : '已添加同级节点 ⚡', 'success');
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, pushHistory, scheduleAutoSave, showToast]);

  // Track currently selected node or edge for PropertiesPanel
  const selectedNode = nodes.find(n => n.selected) ?? null;
  const selectedEdge = edges.find(e => e.selected) ?? null;

  // Reload when switching workflows
  useEffect(() => {
    setNodes(workflow?.nodes ?? []);
    setEdges(workflow?.edges ?? []);
  }, [workflow?.id]);

  // Close context menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (wfMenuRef.current && !wfMenuRef.current.contains(e.target)) {
        setWfMenu({ visible: false, x: 0, y: 0, type: 'pane', node: null, edge: null });
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const onConnect = useCallback((params) => {
    pushHistory();
    setEdges(eds => {
      const next = addEdge({
        ...params,
        animated: true,
        style: { stroke: 'var(--accent-border)', strokeWidth: 2 }
      }, eds);
      scheduleAutoSave(nodesRef.current, next);
      return next;
    });
  }, [scheduleAutoSave]);

  const onNodeDragStop = useCallback(() => {
    scheduleAutoSave(nodesRef.current, edgesRef.current);
  }, [scheduleAutoSave]);

  // ── addStep / addNote (called by sidebar via pendingAction) ──
  const addStepNode = useCallback(() => {
    pushHistory();
    const id = uid();
    const newNode = {
      id,
      type: 'stepNode',
      position: { x: 160 + Math.random() * 180, y: 120 + Math.random() * 150 },
      data: { label: '步骤', text: '', duration: '', remarks: '' },
    };
    setNodes(ns => {
      const next = [...ns, newNode];
      scheduleAutoSave(next, edgesRef.current);
      return next;
    });
  }, [scheduleAutoSave]);

  const addNoteNode = useCallback(() => {
    pushHistory();
    const id = uid();
    const newNode = {
      id,
      type: 'noteNode',
      position: { x: 240 + Math.random() * 180, y: 160 + Math.random() * 150 },
      data: { text: '', color: 'pastel-yellow' },
    };
    setNodes(ns => {
      const next = [...ns, newNode];
      scheduleAutoSave(next, edgesRef.current);
      return next;
    });
  }, [scheduleAutoSave]);

  // React to pendingAction from sidebar buttons
  useEffect(() => {
    if (!pendingAction) return;
    if (pendingAction === 'step') addStepNode();
    if (pendingAction === 'note') addNoteNode();
    onActionDone();
  }, [pendingAction]);

  // ── Drop resource from sidebar ──
  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    const resourceId = e.dataTransfer.getData('application/x-toolv-resource');
    if (!resourceId) return;
    pushHistory();
    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    const newNode = { id: uid(), type: 'resourceNode', position, data: { resourceId } };
    setNodes(ns => {
      const next = [...ns, newNode];
      scheduleAutoSave(next, edgesRef.current);
      return next;
    });
  }, [screenToFlowPosition, scheduleAutoSave]);

  const handleManualSave = () => {
    clearTimeout(saveTimerRef.current);
    onSave(nodesRef.current, edgesRef.current);
    showToast('工作流已保存 ✓', 'success');
  };

  const handleNodesChange = useCallback((changes) => {
    onNodesChange(changes);
    const hasDeletion = changes.some(c => c.type === 'remove');
    if (hasDeletion) {
      setTimeout(() => scheduleAutoSave(nodesRef.current, edgesRef.current), 50);
    }
  }, [onNodesChange, scheduleAutoSave]);

  const handleEdgesChange = useCallback((changes) => {
    onEdgesChange(changes);
    const hasDeletion = changes.some(c => c.type === 'remove');
    if (hasDeletion) {
      setTimeout(() => scheduleAutoSave(nodesRef.current, edgesRef.current), 50);
    }
  }, [onEdgesChange, scheduleAutoSave]);

  // ── Double Click Pane to Quick Create Node ──
  const onPaneDoubleClick = useCallback((e) => {
    if (e.target.classList.contains('react-flow__pane')) {
      e.preventDefault();
      setWfMenu({ visible: true, x: e.clientX, y: e.clientY, type: 'pane', node: null, edge: null });
    }
  }, []);

  // ── Properties Panel Actions ──
  const handleUpdateNode = useCallback((nodeId, newData) => {
    setNodes(ns => {
      const next = ns.map(n => {
        if (n.id === nodeId) {
          return { ...n, data: { ...n.data, ...newData } };
        }
        return n;
      });
      scheduleAutoSave(next, edgesRef.current);
      return next;
    });
  }, [scheduleAutoSave]);

  const handleUpdateEdge = useCallback((edgeId, newLabel) => {
    setEdges(eds => {
      const next = eds.map(e => {
        if (e.id === edgeId) {
          return {
            ...e,
            label: newLabel,
            style: { ...e.style, stroke: 'var(--accent-border)', strokeWidth: 2 },
            labelStyle: { fill: 'var(--text-1)', fontSize: 10, fontWeight: 600, fontFamily: 'Outfit, sans-serif' },
            labelBgStyle: { fill: 'oklch(16% 0.016 268 / 0.85)', rx: 6, ry: 6 },
            labelBgPadding: [8, 4],
          };
        }
        return e;
      });
      scheduleAutoSave(nodesRef.current, next);
      return next;
    });
  }, [scheduleAutoSave]);

  // ── Canvas Right Click Event Handlers ──
  const handleNodeContextMenu = useCallback((e, node) => {
    e.preventDefault();
    e.stopPropagation();
    if (slicePoints.current.length > 10) return;
    setWfMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      type: 'node',
      node,
      edge: null
    });
  }, []);

  const handleEdgeContextMenu = useCallback((e, edge) => {
    e.preventDefault();
    e.stopPropagation();
    if (slicePoints.current.length > 10) return;
    setWfMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      type: 'edge',
      node: null,
      edge
    });
  }, []);

  const handlePaneContextMenu = useCallback((e) => {
    e.preventDefault();
    if (slicePoints.current.length > 10) return;
    setWfMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      type: 'pane',
      node: null,
      edge: null
    });
  }, []);

  // ── Ninja Slice Handlers ──
  const onPointerDownCapture = (e) => {
    if (e.button === 2) {
      setIsSlicing(true);
      const rect = e.currentTarget.getBoundingClientRect();
      slicePoints.current = [{ x: e.clientX - rect.left, y: e.clientY - rect.top }];
      setSlicePath([...slicePoints.current]);
    }
  };

  const onPointerMoveCapture = (e) => {
    if (isSlicing || slicePoints.current.length > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      slicePoints.current.push({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      if (slicePoints.current.length > 40) slicePoints.current.shift(); // keep trail short
      setSlicePath([...slicePoints.current]);
    }
  };

  const onPointerUpCapture = (e) => {
    if (e.button === 2 && (isSlicing || slicePoints.current.length > 0)) {
      setIsSlicing(false);
      const pts = slicePoints.current;
      if (pts.length > 10) {
        setWfMenu(m => ({ ...m, visible: false })); // Hide menu if it was open
        
        const flowEl = document.querySelector('.react-flow__renderer');
        if (flowEl) {
           const nodeEls = Array.from(document.querySelectorAll('.react-flow__node'));
           const toDeleteIds = [];
           nodeEls.forEach(el => {
             const rect = el.getBoundingClientRect();
             const containerRect = flowEl.getBoundingClientRect();
             const nx = rect.left - containerRect.left;
             const ny = rect.top - containerRect.top;
             
             const hit = pts.some(p => p.x >= nx && p.x <= nx + rect.width && p.y >= ny && p.y <= ny + rect.height);
             if (hit) {
               const id = el.getAttribute('data-id');
               if (id) {
                 toDeleteIds.push(id);
                 el.classList.add('slice-deleted'); // Add CSS class for shatter effect
               }
             }
           });

           if (toDeleteIds.length > 0) {
             pushHistory();
             setTimeout(() => {
               setNodes(ns => ns.filter(n => !toDeleteIds.includes(n.id)));
               showToast('唰！节点已切除 🗡️', 'success');
             }, 300); // Wait for shatter animation to finish
           }
        }
      }
      setTimeout(() => { setSlicePath([]); slicePoints.current = []; }, 150); // fade out
    }
  };

  // ── Context Menu Actions ──
  const createStepNodeAtCoords = () => {
    pushHistory();
    const position = screenToFlowPosition({ x: wfMenu.x, y: wfMenu.y });
    const id = uid();
    const newNode = {
      id,
      type: 'stepNode',
      position,
      data: { label: '快捷步骤', text: '', duration: '', remarks: '' },
    };
    setNodes(ns => {
      const next = [...ns, newNode];
      scheduleAutoSave(next, edgesRef.current);
      return next;
    });
    setWfMenu({ visible: false, x: 0, y: 0, type: 'pane', node: null, edge: null });
    showToast('快捷步骤节点已成功创建 ⚡', 'success');
  };

  const createNoteNodeAtCoords = () => {
    pushHistory();
    const position = screenToFlowPosition({ x: wfMenu.x, y: wfMenu.y });
    const id = uid();
    const newNode = {
      id,
      type: 'noteNode',
      position,
      data: { text: '', color: 'pastel-yellow' },
    };
    setNodes(ns => {
      const next = [...ns, newNode];
      scheduleAutoSave(next, edgesRef.current);
      return next;
    });
    setWfMenu({ visible: false, x: 0, y: 0, type: 'pane', node: null, edge: null });
    showToast('快捷备注便签已成功创建 📝', 'success');
  };

  const handleDuplicateNode = (node) => {
    if (!node) return;
    pushHistory();
    const id = uid();
    const newNode = {
      ...node,
      id,
      position: { x: node.position.x + 40, y: node.position.y + 40 },
      selected: false,
    };
    setNodes(ns => {
      const next = [...ns, newNode];
      scheduleAutoSave(next, edgesRef.current);
      return next;
    });
    setWfMenu({ visible: false, x: 0, y: 0, type: 'pane', node: null, edge: null });
    showToast('节点已复制 📋', 'success');
  };

  const handleDeleteNode = (nodeId) => {
    pushHistory();
    setNodes(ns => {
      const next = ns.filter(n => n.id !== nodeId);
      scheduleAutoSave(next, edgesRef.current);
      return next;
    });
    setEdges(eds => {
      const next = eds.filter(e => e.source !== nodeId && e.target !== nodeId);
      scheduleAutoSave(nodesRef.current, next);
      return next;
    });
    setWfMenu({ visible: false, x: 0, y: 0, type: 'pane', node: null, edge: null });
    showToast('节点及关联连线已删除', 'success');
  };

  const handleDeleteEdge = (edgeId) => {
    pushHistory();
    setEdges(eds => {
      const next = eds.filter(e => e.id !== edgeId);
      scheduleAutoSave(nodesRef.current, next);
      return next;
    });
    setWfMenu({ visible: false, x: 0, y: 0, type: 'pane', node: null, edge: null });
    showToast('连线已删除', 'success');
  };

  const handleClearCanvas = () => {
    if (window.confirm('确认清空当前画布上的所有节点和连线吗？此操作无法撤销。')) {
      pushHistory();
      setNodes([]);
      setEdges([]);
      scheduleAutoSave([], []);
      showToast('画布已清空 🧹', 'success');
    }
    setWfMenu({ visible: false, x: 0, y: 0, type: 'pane', node: null, edge: null });
  };

  // ── Image Exporting (PNG shareable format) ──
  const handleExportImage = () => {
    const flowEl = document.querySelector('.react-flow');
    if (!flowEl) return;

    const controls = flowEl.querySelector('.react-flow__controls');
    const minimap = flowEl.querySelector('.react-flow__minimap');
    const panels = flowEl.querySelectorAll('.react-flow__panel');
    
    if (controls) controls.style.display = 'none';
    if (minimap) minimap.style.display = 'none';
    panels.forEach(p => p.style.display = 'none');

    showToast('正在生成高清导图，请稍候...', 'warning');

    toPng(flowEl, {
      backgroundColor: 'var(--bg-base)',
      style: {
        padding: '30px',
      }
    })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `${workflow.name}-导图.png`;
        link.href = dataUrl;
        link.click();
        showToast('📸 画布已成功导出为分享图片！', 'success');
      })
      .catch((err) => {
        console.error(err);
        showToast('生成高清导图失败，请重试', 'error');
      })
      .finally(() => {
        if (controls) controls.style.display = '';
        if (minimap) minimap.style.display = '';
        panels.forEach(p => p.style.display = '');
      });
  };

  // ── JSON Configuration Export/Import ──
  const handleExportJSON = () => {
    const serialized = JSON.stringify({
      name: workflow.name,
      description: workflow.description,
      nodes,
      edges,
    }, null, 2);

    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(serialized);
    const link = document.createElement('a');
    link.href = dataUri;
    link.download = `${workflow.name}-备份.json`;
    link.click();
    showToast('💾 画布备份文件导出成功！', 'success');
  };

  const handleImportJSON = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (!parsed.nodes || !parsed.edges) {
          showToast('备份文件格式不合规', 'error');
          return;
        }
        setNodes(parsed.nodes);
        setEdges(parsed.edges);
        scheduleAutoSave(parsed.nodes, parsed.edges);
        showToast('📥 画布已成功从备份中恢复！', 'success');
      } catch {
        showToast('备份解析失败，请确保文件完整', 'error');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
      {/* React Flow Container */}
      <div 
        className="workflow-canvas-wrap"
        onPointerDownCapture={onPointerDownCapture}
        onPointerMoveCapture={onPointerMoveCapture}
        onPointerUpCapture={onPointerUpCapture}
        onContextMenuCapture={(e) => {
          if (slicePoints.current.length > 10) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          onNodeDragStart={pushHistory}
          onNodeDragStop={onNodeDragStop}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDoubleClick={onPaneDoubleClick}
          onNodeContextMenu={handleNodeContextMenu}
          onEdgeContextMenu={handleEdgeContextMenu}
          onPaneContextMenu={handlePaneContextMenu}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.25 }}
          deleteKeyCode="Delete"
          multiSelectionKeyCode="Shift"
          panOnDrag={false}
          selectionOnDrag={true}
          selectionMode={SelectionMode.Partial}
          panActivationKeyCode="Space"
          zoomOnDoubleClick={false}
          style={{ background: 'var(--bg-base)' }}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={22}
            size={1.2}
            color="oklch(28% 0.018 268)"
          />
          <Controls showInteractive={false} />
          <MiniMap
            nodeColor={n => {
              if (n.type === 'stepNode') return 'oklch(68% 0.24 295 / 0.7)';
              if (n.type === 'noteNode') return 'oklch(74% 0.17 68 / 0.7)';
              return 'oklch(38% 0.02 268)';
            }}
            maskColor="oklch(12% 0.014 268 / 0.85)"
            style={{ background: 'var(--bg-card)' }}
          />

          {/* Floating UI Tips */}
          <Panel position="bottom-left" style={{ margin: '16px' }}>
            <div style={{
              background: 'var(--bg-card)', padding: '10px 14px', borderRadius: 'var(--r-md)',
              border: '1px solid var(--border-subtle)', color: 'var(--text-3)', fontSize: 12,
              lineHeight: 1.6, boxShadow: 'var(--shadow-sm)', opacity: 0.8, pointerEvents: 'none'
            }}>
              <strong>✨ 交互指南</strong><br/>
              • <strong>双击空白</strong>：快速唤出新建节点菜单<br/>
              • <strong>右键长按滑动</strong>：一刀劈开删除触碰到的节点<br/>
              • 选定节点按 <strong>Tab</strong> 键建子节点，按 <strong>Enter</strong> 建同级
            </div>
          </Panel>

          {/* Floating toolbar */}
          <Panel position="top-center">
            <div className="wf-toolbar glass">
              <button className="btn btn-ghost btn-sm" onClick={addStepNode} style={{ fontSize: 12 }}>
                ⚡ 步骤节点
              </button>
              <div className="wf-toolbar-divider" />
              <button className="btn btn-ghost btn-sm" onClick={addNoteNode} style={{ fontSize: 12 }}>
                📝 备注节点
              </button>
              <div className="wf-toolbar-divider" />
              <button className="btn btn-ghost btn-sm" onClick={handleExportImage} style={{ fontSize: 12 }} title="导出画布高清PNG">
                <Image size={13} /> 导出图片
              </button>
              <div className="wf-toolbar-divider" />
              <button className="btn btn-ghost btn-sm" onClick={handleExportJSON} style={{ fontSize: 12 }} title="备份导出">
                <Download size={13} /> 备份
              </button>
              <div className="wf-toolbar-divider" />
              <button className="btn btn-ghost btn-sm" onClick={() => fileInputRef.current?.click()} style={{ fontSize: 12 }} title="备份导入还原">
                <Upload size={13} /> 还原
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleImportJSON}
              />
              <div className="wf-toolbar-divider" />
              <button className="btn btn-ghost btn-sm" onClick={handleManualSave} style={{ fontSize: 12, color: 'var(--success)' }}>
                <Save size={13} /> 保存
              </button>
            </div>
          </Panel>

          {/* Tips */}
          <Panel position="bottom-center">
            <div style={{
              fontSize: 11.5, color: 'var(--text-3)', padding: '5px 14px',
              background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--r-full)', marginBottom: 8, boxShadow: 'var(--shadow-sm)'
            }}>
              💡 空格+拖拽移动画布 · 框选节点 · 右键滑动可削开删除 · 双击空白添加节点
            </div>
          </Panel>
        </ReactFlow>

        {/* Ninja Slice Overlay */}
        {slicePath.length > 0 && (
          <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 999 }}>
            <polyline
              points={slicePath.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="var(--error)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                filter: 'drop-shadow(0 0 8px var(--error))',
                opacity: isSlicing ? 1 : 0,
                transition: 'opacity 0.15s ease-out'
              }}
            />
          </svg>
        )}
      </div>

      {/* Right Properties Panel */}
      <PropertiesPanel
        selectedNode={selectedNode}
        selectedEdge={selectedEdge}
        onUpdateNode={handleUpdateNode}
        onUpdateEdge={handleUpdateEdge}
      />

      {/* ── Custom Context Menu for Workflow (毛玻璃画布右键菜单) ── */}
      {wfMenu.visible && (
        <div
          ref={wfMenuRef}
          className="context-menu glass animate-scale-up"
          style={{ top: wfMenu.y, left: wfMenu.x, width: 170 }}
        >
          {/* Header */}
          <div className="menu-header truncate">
            {wfMenu.type === 'node' ? '节点操作' : wfMenu.type === 'edge' ? '连线操作' : '画布背景操作'}
          </div>

          {/* List */}
          <div className="menu-list">
            {/* NODE OPERATIONS */}
            {wfMenu.type === 'node' && (
              <>
                <button className="menu-item" onClick={() => handleDuplicateNode(wfMenu.node)}>
                  <Copy size={12} />
                  <span>复制此节点</span>
                </button>
                <div className="menu-divider" />
                <button className="menu-item danger" onClick={() => handleDeleteNode(wfMenu.node.id)}>
                  <Trash2 size={12} />
                  <span>删除节点</span>
                </button>
              </>
            )}

            {/* EDGE OPERATIONS */}
            {wfMenu.type === 'edge' && (
              <button className="menu-item danger" onClick={() => handleDeleteEdge(wfMenu.edge.id)}>
                <Trash2 size={12} />
                <span>断开此连线</span>
              </button>
            )}

            {/* PANE OPERATIONS */}
            {wfMenu.type === 'pane' && (
              <>
                <button className="menu-item" onClick={createStepNodeAtCoords}>
                  <PlusCircle size={12} />
                  <span>在此处建步骤 ⚡</span>
                </button>
                <button className="menu-item" onClick={createNoteNodeAtCoords}>
                  <PlusCircle size={12} />
                  <span>在此处建便签 📝</span>
                </button>
                <div className="menu-divider" />
                <button className="menu-item" onClick={handleExportImage}>
                  <Image size={12} />
                  <span>画布存为高清图 📸</span>
                </button>
                <button className="menu-item" onClick={handleExportJSON}>
                  <Download size={12} />
                  <span>备份并下载 JSON 💾</span>
                </button>
                <div className="menu-divider" />
                <button className="menu-item danger" onClick={handleClearCanvas}>
                  <ShieldAlert size={12} />
                  <span>清空当前画布 🧹</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Empty canvas placeholder ──────────────────────────────────────────────────
function EmptyCanvas({ hasWorkflows }) {
  return (
    <div className="workflow-canvas-wrap" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 18, color: 'var(--text-3)',
      backgroundImage: 'radial-gradient(circle, oklch(28% 0.018 268) 1px, transparent 1px)',
      backgroundSize: '22px 22px',
    }}>
      <div style={{
        width: 82, height: 82, borderRadius: 'var(--r-xl)',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38,
        boxShadow: 'var(--shadow-md)',
      }}>
        🔗
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-2)', marginBottom: 8, letterSpacing: '-0.02em' }}>
          {hasWorkflows ? '请选择一个画布流程' : '开始你的第一个需求画布'}
        </p>
        <p style={{ fontSize: 13.5, maxWidth: 340, lineHeight: 1.7, color: 'var(--text-3)' }}>
          编排多工具串联链路，描述你的项目业务架构。
          <br />从左侧选择工作流画布，或新建一个流程。
        </p>
      </div>
    </div>
  );
}

// ── Main WorkflowView ─────────────────────────────────────────────────────────
export default function WorkflowView() {
  const {
    workflows, activeWorkflowId,
    setActiveWorkflow, addOrUpdateWorkflow,
  } = useAppStore();

  const [pendingAction, setPendingAction] = useState(null);
  const activeWorkflow = workflows.find(w => w.id === activeWorkflowId) ?? null;

  const handleSave = useCallback(async (nodes, edges) => {
    if (!activeWorkflow) return;
    const cleanNodes = nodes.map(n => ({
      ...n,
      data: { ...n.data, onChange: undefined },
    }));
    await addOrUpdateWorkflow({ ...activeWorkflow, nodes: cleanNodes, edges });
  }, [activeWorkflow, addOrUpdateWorkflow]);

  return (
    <div className="workflow-view">
      <ReactFlowProvider>
        <WorkflowSidebar
          activeId={activeWorkflowId}
          onSelect={setActiveWorkflow}
          onAddStep={() => setPendingAction('step')}
          onAddNote={() => setPendingAction('note')}
        />

        {activeWorkflow
          ? (
            <WorkflowCanvas
              key={activeWorkflow.id}
              workflow={activeWorkflow}
              onSave={handleSave}
              pendingAction={pendingAction}
              onActionDone={() => setPendingAction(null)}
            />
          )
          : <EmptyCanvas hasWorkflows={workflows.length > 0} />
        }
      </ReactFlowProvider>
    </div>
  );
}
