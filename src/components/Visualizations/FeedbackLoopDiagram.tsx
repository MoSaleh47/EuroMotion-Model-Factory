/**
 * FeedbackLoopDiagram - Interactive diagram showing system dynamics feedback loops
 * 
 * This is the "wow factor" component that demonstrates transparency.
 * It uses React Flow to create an interactive visualization of all 4 feedback loops.
 * 
 * Features:
 * - Circular nodes representing variables
 * - Colored edges (red for reinforcing, teal for balancing)
 * - Hover tooltips showing formulas and polarity
 */

import React, { useMemo, useState } from 'react';
import ReactFlow, {
    Controls,
    Background,
    ReactFlowProvider,
    useNodesState,
    useEdgesState,
    ConnectionMode,
    getBezierPath,
    MarkerType,
    Handle,
    Position,
} from 'reactflow';
import type { Node, Edge, EdgeProps, Connection, NodeProps } from 'reactflow';
import 'reactflow/dist/style.css';
import type { ModelConfig, SimulationResults, Flow } from '../../engine/types';
import { FormulaEditor } from '../FormulaEditor';
import { NodeEditor } from '../NodeEditor';
import type { FormulaContext } from '../../engine/FormulaParser';

// ====================================
// Custom Edge with Tooltip
// ====================================
const CustomEdge: React.FC<EdgeProps> = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style,
    markerEnd,
    data,
    label,
}) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    // Calculate midpoint for tooltip positioning
    const midX = (sourceX + targetX) / 2;
    const midY = (sourceY + targetY) / 2;

    return (
        <g
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            {/* Invisible wider path for easier hover */}
            <path
                d={edgePath}
                fill="none"
                stroke="transparent"
                strokeWidth={20}
            />
            {/* Visible edge */}
            <path
                id={id}
                style={style}
                className="react-flow__edge-path"
                d={edgePath}
                markerEnd={markerEnd as string}
            />
            {/* Polarity label with background circle for visibility */}
            <circle
                cx={labelX}
                cy={labelY}
                r={14}
                fill="white"
                stroke={(style as React.CSSProperties)?.stroke || '#333'}
                strokeWidth={2}
            />
            <text
                x={labelX}
                y={labelY}
                style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    fill: label === '+' ? '#22c55e' : '#ef4444',
                }}
                textAnchor="middle"
                dominantBaseline="central"
            >
                {label}
            </text>
            {/* Tooltip on hover */}
            {showTooltip && data?.tooltip && (
                <foreignObject
                    x={midX - 140}
                    y={midY - 80}
                    width={280}
                    height={160}
                    style={{ overflow: 'visible', pointerEvents: 'none' }}
                >
                    <div
                        style={{
                            background: 'white',
                            border: '2px solid #2C3E50',
                            borderRadius: '10px',
                            padding: '14px',
                            fontSize: '13px',
                            boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                            lineHeight: '1.5',
                            pointerEvents: 'none',
                        }}
                    >
                        <div style={{
                            fontWeight: 'bold',
                            marginBottom: '8px',
                            color: '#1e293b',
                            borderBottom: '1px solid #e2e8f0',
                            paddingBottom: '6px'
                        }}>
                            {data.from} → {data.to}
                        </div>
                        <div style={{ marginBottom: '4px' }}>
                            <span style={{ fontWeight: '600', color: '#64748b' }}>Formula:</span>{' '}
                            <span style={{ color: '#0f172a' }}>{data.formula}</span>
                        </div>
                        <div style={{ marginBottom: '4px' }}>
                            <span style={{ fontWeight: '600', color: '#64748b' }}>Polarity:</span>{' '}
                            <span style={{
                                color: data.polarity === '+' ? '#22c55e' : '#ef4444',
                                fontWeight: 'bold',
                                fontSize: '16px'
                            }}>
                                {data.polarity}
                            </span>
                        </div>
                        <div>
                            <span style={{ fontWeight: '600', color: '#64748b' }}>Loop:</span>{' '}
                            <span style={{
                                color: data.loopType === 'reinforcing' ? '#dc2626' : '#0d9488',
                                fontWeight: '600'
                            }}>
                                {data.loopName} ({data.loopType})
                            </span>
                        </div>
                    </div>
                </foreignObject>
            )}
        </g>
    );
};

// Custom Node Component with Handles
const CustomNode: React.FC<NodeProps> = ({ data, isConnectable }) => {
    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            {/* Handles for better connectivity */}
            <Handle
                type="target"
                position={Position.Top}
                isConnectable={isConnectable}
                style={{ background: '#94a3b8', width: '8px', height: '8px' }}
            />
            <Handle
                type="target"
                position={Position.Left}
                isConnectable={isConnectable}
                style={{ background: '#94a3b8', width: '8px', height: '8px' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                isConnectable={isConnectable}
                style={{ background: '#64748b', width: '8px', height: '8px' }}
            />
            <Handle
                type="source"
                position={Position.Bottom}
                isConnectable={isConnectable}
                style={{ background: '#64748b', width: '8px', height: '8px' }}
            />
            {data.label}
        </div>
    );
};

// Node types registration
const nodeTypes = {
    customNode: CustomNode,
};

// Edge types registration
const edgeTypes = {
    custom: CustomEdge,
};

// ====================================
// Node positions (manually laid out for clarity)
// ====================================
const nodePositions: Record<string, { x: number; y: number }> = {
    // Central nodes
    revenue: { x: 400, y: 50 },
    investment_resilience: { x: 150, y: 150 },
    production_capacity: { x: 150, y: 350 },
    market_share: { x: 650, y: 250 },

    // R2 loop nodes
    semiconductor_availability: { x: 400, y: 450 },
    production_rate: { x: 150, y: 550 },
    backlog: { x: 400, y: 650 },

    // B1/B2 nodes
    inventory: { x: 650, y: 550 },
    delivery_rate: { x: 650, y: 650 },
    regional_supply_percentage: { x: 200, y: 450 },
};

interface FeedbackLoopDiagramProps {
    config: ModelConfig;
    results?: SimulationResults;
    onFormulaChange?: (nodeId: string, formula: string) => void;
    onAddFlow?: (flowId: string, flow: Flow) => void;
    onDeleteFlow?: (flowId: string) => void;
    onAddParameter?: (paramId: string, value: number, min: number, max: number, unit: string, description: string, category: string) => void;
    onAddEdge?: (source: string, target: string) => void;
    onLayoutChange?: (layout: Record<string, { x: number; y: number }>) => void;
}

export const FeedbackLoopDiagram: React.FC<FeedbackLoopDiagramProps> = ({
    config,
    results: _results,
    onFormulaChange,
    onAddFlow,
    onDeleteFlow,
    onAddParameter,
    onAddEdge,
    onLayoutChange,
}) => {
    // State for formula editor
    const [editorOpen, setEditorOpen] = useState(false);
    const [nodeEditorOpen, setNodeEditorOpen] = useState(false);
    // Context menu state
    const [contextMenu, setContextMenu] = useState<{
        visible: boolean;
        x: number;
        y: number;
        nodeId: string;
        nodeName: string;
        nodeType: 'stock' | 'flow' | 'variable';
    } | null>(null);
    const [selectedNode, setSelectedNode] = useState<{
        id: string;
        name: string;
        type: 'stock' | 'flow' | 'parameter' | 'variable';
        formula: string;
    } | null>(null);

    // Handle node drag stop to save layout
    const handleNodeDragStop = (_event: React.MouseEvent, node: Node) => {
        if (!onLayoutChange || !config.layout) return;

        const newLayout = {
            ...config.layout,
            [node.id]: { x: Math.round(node.position.x), y: Math.round(node.position.y) }
        };
        onLayoutChange(newLayout);
    };

    // Build nodes from all feedback loops
    const { nodes, edges } = useMemo(() => {
        const loops = config.feedback_loops;

        // Collect unique nodes from all loops AND config definitions
        const nodeSet = new Set<string>();

        // Add nodes from loops
        Object.values(loops).forEach((loop) => {
            loop.nodes.forEach((node) => nodeSet.add(node));
            loop.edges.forEach((edge) => {
                nodeSet.add(edge.from);
                nodeSet.add(edge.to);
            });
        });

        // Create node components
        const nodeArray: Node[] = Array.from(nodeSet).map((nodeId) => {
            const displayName = nodeId
                .replace(/_/g, ' ')
                .replace(/\b\w/g, (l) => l.toUpperCase());

            // Adaptive bubble size based on text length
            const bubbleSize = Math.max(80, Math.min(120, 60 + displayName.length * 2.5));

            // Use layout from config, fallback to default positions or random
            const position = config.layout?.[nodeId] || nodePositions[nodeId] || {
                x: Math.random() * 600 + 100,
                y: Math.random() * 500 + 100,
            };

            return {
                id: nodeId,
                type: 'customNode', // Changed from 'default'
                position,
                data: { label: displayName },
                style: {
                    background: 'linear-gradient(135deg, #1e3a5f 0%, #2C3E50 100%)',
                    color: 'white',
                    border: '3px solid #60a5fa',
                    borderRadius: '50%',
                    width: bubbleSize,
                    height: bubbleSize,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    padding: '8px',
                    textAlign: 'center' as const,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                },
            };
        });

        // Create edges from all loops
        const edgeArray: Edge[] = [];
        const edgeIdSet = new Set<string>();

        Object.entries(loops).forEach(([loopId, loop]) => {
            loop.edges.forEach((edge, idx) => {
                const edgeId = `${edge.from}-${edge.to}`;

                // Skip duplicates
                if (edgeIdSet.has(edgeId)) return;
                edgeIdSet.add(edgeId);

                // Color based on polarity: green for +, red for -
                const polarityColor = edge.polarity === '+' ? '#22c55e' : '#ef4444';

                edgeArray.push({
                    id: `${loopId}-${idx}`,
                    source: edge.from,
                    target: edge.to,
                    type: 'custom',
                    animated: false,
                    style: {
                        stroke: polarityColor,
                        strokeWidth: 3,
                    },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: polarityColor,
                        width: 20,
                        height: 20,
                    },
                    label: edge.polarity,
                    data: {
                        from: edge.from.replace(/_/g, ' '),
                        to: edge.to.replace(/_/g, ' '),
                        formula: edge.formula,
                        polarity: edge.polarity,
                        loopName: `${loopId}: ${loop.name}`,
                        loopType: loop.type,
                        tooltip: true,
                    },
                });
            });
        });

        return { nodes: nodeArray, edges: edgeArray };
    }, [config]);

    const [nodesState, _setNodes, onNodesChange] = useNodesState(nodes);
    const [edgesState, _setEdges, onEdgesChange] = useEdgesState(edges);

    // Get available variables for formula editor
    const availableVariables = useMemo(() => {
        const vars: string[] = [];
        // Add stocks
        Object.keys(config.stocks).forEach(s => vars.push(s));
        // Add flows
        Object.keys(config.flows).forEach(f => vars.push(f));
        // Add parameters
        Object.values(config.parameters).forEach(category => {
            Object.keys(category).forEach(p => vars.push(p));
        });
        // Add common computed variables
        vars.push('revenue', 'efficiency', 'semiconductor_availability', 'battery_availability', 'base_demand');
        return [...new Set(vars)];
    }, [config]);

    // Get current context for formula preview
    const currentContext: FormulaContext = useMemo(() => {
        const ctx: FormulaContext = {};
        // Add stock values
        Object.entries(config.stocks).forEach(([key, stock]) => {
            ctx[key] = stock.initial_value || 0;
        });
        // Add parameter values
        Object.values(config.parameters).forEach(category => {
            Object.entries(category).forEach(([key, param]) => {
                ctx[key] = param.value;
            });
        });
        // Add common values
        ctx['efficiency'] = 1.0;
        ctx['semiconductor_availability'] = 85;
        ctx['battery_availability'] = 90;
        ctx['base_demand'] = 15000;
        ctx['revenue'] = 15000000;
        ctx['cost_per_unit_capacity'] = 5000;
        ctx['depreciation_rate'] = 0.02;
        return ctx;
    }, [config]);

    // Handle node double-click to open editor
    const handleNodeDoubleClick = (_event: React.MouseEvent, node: Node) => {
        const nodeId = node.id;
        const displayName = nodeId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

        // Check if it's a flow (has formula)
        if (config.flows[nodeId]) {
            const flow = config.flows[nodeId];
            setSelectedNode({
                id: nodeId,
                name: displayName,
                type: 'flow',
                formula: flow.formula || '',
            });
            setEditorOpen(true);
        }
        // Check if it's a stock
        else if (config.stocks[nodeId]) {
            setSelectedNode({
                id: nodeId,
                name: displayName,
                type: 'stock',
                formula: `${config.stocks[nodeId].initial_value || 0}`,
            });
            setEditorOpen(true);
        }
        // It's a diagram-only node (like revenue, investment_resilience) - open as variable
        else {
            // Look for it in parameters
            let foundFormula = '';
            for (const category of Object.values(config.parameters)) {
                if (nodeId in category) {
                    foundFormula = `${category[nodeId].value}`;
                    break;
                }
            }

            setSelectedNode({
                id: nodeId,
                name: displayName,
                type: 'variable',
                formula: foundFormula || '0',
            });
            setEditorOpen(true);
        }
    };

    // Handle formula save
    const handleFormulaSave = (formula: string) => {
        if (selectedNode && onFormulaChange) {
            onFormulaChange(selectedNode.id, formula);
        }
    };

    // Handle right-click on nodes
    const handleNodeContextMenu = (event: React.MouseEvent, node: Node) => {
        event.preventDefault();
        const nodeId = node.id;
        const displayName = nodeId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

        // Determine node type
        let nodeType: 'stock' | 'flow' | 'variable' = 'variable';
        if (config.flows[nodeId]) nodeType = 'flow';
        else if (config.stocks[nodeId]) nodeType = 'stock';

        setContextMenu({
            visible: true,
            x: event.clientX,
            y: event.clientY,
            nodeId,
            nodeName: displayName,
            nodeType,
        });
    };

    // Handle delete node
    const handleDeleteNode = () => {
        if (contextMenu && onDeleteFlow && contextMenu.nodeType === 'flow') {
            onDeleteFlow(contextMenu.nodeId);
        }
        setContextMenu(null);
    };

    // Close context menu when clicking outside
    const handlePaneClick = () => {
        setContextMenu(null);
    };

    return (
        <div style={{ width: '100%', height: '750px', position: 'relative' }}>
            <ReactFlow
                nodes={nodesState}
                edges={edgesState}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeDoubleClick={handleNodeDoubleClick}
                onNodeContextMenu={handleNodeContextMenu}
                onPaneClick={handlePaneClick}
                onConnect={(connection: Connection) => {
                    if (onAddEdge && connection.source && connection.target) {
                        onAddEdge(connection.source, connection.target);
                    }
                }}
                onNodeDragStop={handleNodeDragStop}
                edgeTypes={edgeTypes}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                connectionMode={ConnectionMode.Loose}
                proOptions={{ hideAttribution: true }}
            >
                <Background color="#e2e8f0" gap={20} />
                <Controls
                    style={{
                        background: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                />
            </ReactFlow>

            {/* Legend */}
            <div
                style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(255, 255, 255, 0.95)',
                    padding: '14px 28px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    display: 'flex',
                    gap: '32px',
                    alignItems: 'center',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                        style={{
                            width: '24px',
                            height: '4px',
                            background: '#22c55e',
                            borderRadius: '2px',
                        }}
                    />
                    <span style={{ fontWeight: '600', color: '#1e293b' }}>
                        Positive (+) → "More leads to more"
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                        style={{
                            width: '24px',
                            height: '4px',
                            background: '#ef4444',
                            borderRadius: '2px',
                        }}
                    />
                    <span style={{ fontWeight: '600', color: '#1e293b' }}>
                        Negative (−) → "More leads to less"
                    </span>
                </div>
            </div>

            {/* Edit instruction hint */}
            <div
                style={{
                    position: 'absolute',
                    top: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: '600',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
                }}
            >
                ✏️ Double-click any node to edit its formula
            </div>

            {/* Formula Editor Modal */}
            {selectedNode && (
                <FormulaEditor
                    isOpen={editorOpen}
                    onClose={() => setEditorOpen(false)}
                    onSave={handleFormulaSave}
                    initialFormula={selectedNode.formula}
                    nodeName={selectedNode.name}
                    nodeType={selectedNode.type}
                    availableVariables={availableVariables}
                    currentContext={currentContext}
                />
            )}

            {/* Add Flow Button */}
            <button
                onClick={() => setNodeEditorOpen(true)}
                style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(34, 197, 94, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                }}
            >
                ➕ Add Element
            </button>

            {/* Node Editor Modal */}
            {nodeEditorOpen && onAddFlow && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                }}>
                    <div style={{ width: '600px', maxWidth: '90vw' }}>
                        <NodeEditor
                            config={config}
                            onAddFlow={onAddFlow}
                            onAddParameter={onAddParameter}
                            onClose={() => setNodeEditorOpen(false)}
                        />
                    </div>
                </div>
            )}

            {/* Context Menu */}
            {contextMenu && contextMenu.visible && (
                <div
                    style={{
                        position: 'fixed',
                        top: contextMenu.y,
                        left: contextMenu.x,
                        background: 'white',
                        borderRadius: '12px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                        border: '1px solid #e2e8f0',
                        minWidth: '180px',
                        zIndex: 1100,
                        overflow: 'hidden',
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div style={{
                        padding: '12px 16px',
                        background: '#f8fafc',
                        borderBottom: '1px solid #e2e8f0',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#475569',
                    }}>
                        {contextMenu.nodeName}
                        <span style={{
                            marginLeft: '8px',
                            padding: '2px 8px',
                            background: contextMenu.nodeType === 'flow' ? '#dbeafe' : '#f1f5f9',
                            color: contextMenu.nodeType === 'flow' ? '#1d4ed8' : '#64748b',
                            borderRadius: '4px',
                            fontSize: '11px',
                        }}>
                            {contextMenu.nodeType}
                        </span>
                    </div>

                    {/* Edit Option */}
                    <button
                        onClick={() => {
                            const nodeId = contextMenu.nodeId;
                            const displayName = contextMenu.nodeName;

                            if (config.flows[nodeId]) {
                                setSelectedNode({
                                    id: nodeId,
                                    name: displayName,
                                    type: 'flow',
                                    formula: config.flows[nodeId].formula || '',
                                });
                                setEditorOpen(true);
                            } else if (config.stocks[nodeId]) {
                                setSelectedNode({
                                    id: nodeId,
                                    name: displayName,
                                    type: 'stock',
                                    formula: `${config.stocks[nodeId].initial_value || 0}`,
                                });
                                setEditorOpen(true);
                            }
                            setContextMenu(null);
                        }}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            background: 'none',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            color: '#334155',
                            textAlign: 'left',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                        ✏️ Edit Formula
                    </button>

                    {/* Delete Option (only for flows) */}
                    {contextMenu.nodeType === 'flow' && onDeleteFlow && (
                        <button
                            onClick={handleDeleteNode}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                background: 'none',
                                border: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                color: '#dc2626',
                                textAlign: 'left',
                                borderTop: '1px solid #fee2e2',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                        >
                            🗑️ Delete Flow
                        </button>
                    )}

                    {/* Info for non-deletable nodes */}
                    {contextMenu.nodeType !== 'flow' && (
                        <div style={{
                            padding: '10px 16px',
                            fontSize: '12px',
                            color: '#94a3b8',
                            borderTop: '1px solid #e2e8f0',
                            fontStyle: 'italic',
                        }}>
                            ℹ️ Only flows can be deleted
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FeedbackLoopDiagram;
