/**
 * NodeEditor - Panel for adding and editing model elements
 * 
 * Features:
 * - Add new flows with custom formulas
 * - Add new parameters with value ranges
 * - Tab toggle between Flow and Parameter modes
 * - Variable selector with checkboxes
 * - Export configuration tracking
 */

import React, { useState, useMemo } from 'react';
import { formulaParser } from '../../engine/FormulaParser';
import type { FormulaContext } from '../../engine/FormulaParser';
import type { ModelConfig, Flow } from '../../engine/types';

type EditorMode = 'flow' | 'parameter';

interface NodeEditorProps {
    config: ModelConfig;
    onAddFlow: (flowId: string, flow: Flow) => void;
    onAddParameter?: (paramId: string, value: number, min: number, max: number, unit: string, description: string, category: string) => void;
    onClose: () => void;
}

export const NodeEditor: React.FC<NodeEditorProps> = ({
    config,
    onAddFlow,
    onAddParameter,
    onClose,
}) => {
    // Editor mode toggle
    const [mode, setMode] = useState<EditorMode>('flow');

    // Flow form state
    const [flowName, setFlowName] = useState('');
    const [flowDescription, setFlowDescription] = useState('');
    const [formula, setFormula] = useState('');
    const [selectedVariables, setSelectedVariables] = useState<Set<string>>(new Set());

    // Parameter form state
    const [paramName, setParamName] = useState('');
    const [paramValue, setParamValue] = useState<number>(0);
    const [paramMin, setParamMin] = useState<number>(0);
    const [paramMax, setParamMax] = useState<number>(100);
    const [paramUnit, setParamUnit] = useState('');
    const [paramDescription, setParamDescription] = useState('');
    const [paramCategory, setParamCategory] = useState('custom');

    // Get existing parameter categories
    const existingCategories = useMemo(() => {
        return Object.keys(config.parameters);
    }, [config]);

    // Get all available variables
    const availableVariables = useMemo(() => {
        const vars: { name: string; category: string; value: number }[] = [];

        // Add stocks
        Object.entries(config.stocks).forEach(([name, stock]) => {
            vars.push({
                name,
                category: 'Stocks',
                value: stock.initial_value || 0
            });
        });

        // Add flows
        Object.entries(config.flows).forEach(([name, flow]) => {
            vars.push({
                name,
                category: 'Flows',
                value: flow.initial_value || 0
            });
        });

        // Add parameters
        Object.entries(config.parameters).forEach(([category, params]) => {
            Object.entries(params).forEach(([name, param]) => {
                vars.push({
                    name,
                    category: category.charAt(0).toUpperCase() + category.slice(1),
                    value: param.value
                });
            });
        });

        return vars;
    }, [config]);

    // Group variables by category
    const groupedVariables = useMemo(() => {
        const groups: Record<string, typeof availableVariables> = {};
        availableVariables.forEach(v => {
            if (!groups[v.category]) groups[v.category] = [];
            groups[v.category].push(v);
        });
        return groups;
    }, [availableVariables]);

    // Build context for formula validation
    const currentContext: FormulaContext = useMemo(() => {
        const ctx: FormulaContext = {};
        availableVariables.forEach(v => {
            ctx[v.name] = v.value;
        });
        // Add common computed variables
        ctx['efficiency'] = 1.0;
        ctx['semiconductor_availability'] = 85;
        ctx['battery_availability'] = 90;
        ctx['base_demand'] = 15000;
        ctx['revenue'] = 15000000;
        return ctx;
    }, [availableVariables]);

    // Validate formula
    const validationResult = useMemo(() => {
        if (!formula.trim()) {
            return { success: false, error: 'Formula cannot be empty' };
        }
        return formulaParser.evaluate(formula, currentContext);
    }, [formula, currentContext]);

    // Generate flow ID from name
    const flowId = flowName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

    // Generate parameter ID from name
    const paramId = paramName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

    // Check if flow ID already exists
    const flowExists = !!config.flows[flowId];

    // Check if parameter ID already exists in any category
    const paramExists = useMemo(() => {
        for (const category of Object.values(config.parameters)) {
            if (category[paramId]) return true;
        }
        return false;
    }, [config.parameters, paramId]);

    // Insert selected variable into formula
    const insertVariable = (varName: string) => {
        setFormula(prev => {
            if (prev && !prev.endsWith(' ') && !prev.endsWith('(')) {
                return prev + ' ' + varName;
            }
            return prev + varName;
        });
        setSelectedVariables(prev => new Set([...prev, varName]));
    };

    // Handle flow save - allow saving even if formula doesn't fully validate
    const handleSaveFlow = () => {
        console.log('handleSaveFlow called:', { flowName, flowId, formula, validationResult, flowExists });

        if (!flowName.trim()) {
            console.log('Save failed: no flow name');
            return;
        }
        if (flowExists) {
            console.log('Save failed: flow already exists');
            return;
        }
        if (!formula.trim()) {
            console.log('Save failed: no formula');
            return;
        }

        const newFlow: Flow = {
            formula: formula,
            description: flowDescription || `Custom flow: ${flowName}`,
            mechanism: 'custom',
        };

        console.log('Calling onAddFlow with:', flowId, newFlow);
        onAddFlow(flowId, newFlow);
        onClose();
    };

    // Handle parameter save
    const handleSaveParameter = () => {
        if (!paramName.trim() || paramExists || !onAddParameter) return;
        if (paramMin >= paramMax) return;

        onAddParameter(paramId, paramValue, paramMin, paramMax, paramUnit, paramDescription || `Custom parameter: ${paramName}`, paramCategory);
        onClose();
    };

    // Validate parameter form
    const isParamValid = paramName.trim() && !paramExists && paramMin < paramMax && onAddParameter;

    // Tab button style
    const tabStyle = (isActive: boolean) => ({
        flex: 1,
        padding: '10px 16px',
        fontSize: '14px',
        fontWeight: '600' as const,
        background: isActive ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : '#f1f5f9',
        color: isActive ? 'white' : '#64748b',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer' as const,
        transition: 'all 0.2s',
    });

    return (
        <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0',
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
            }}>
                <h2 style={{ margin: 0, fontSize: '20px', color: '#1e293b' }}>
                    ➕ Add New {mode === 'flow' ? 'Flow' : 'Parameter'}
                </h2>
                <button
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '24px',
                        cursor: 'pointer',
                        color: '#64748b',
                    }}
                >
                    ×
                </button>
            </div>

            {/* Tab Toggle */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                <button
                    onClick={() => setMode('flow')}
                    style={tabStyle(mode === 'flow')}
                >
                    🔄 Flow
                </button>
                <button
                    onClick={() => setMode('parameter')}
                    style={tabStyle(mode === 'parameter')}
                    disabled={!onAddParameter}
                    title={!onAddParameter ? 'Parameter creation not available' : ''}
                >
                    ⚙️ Parameter
                </button>
            </div>

            {/* Flow Form */}
            {mode === 'flow' && (
                <>
                    {/* Flow Name */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '6px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#334155',
                        }}>
                            Flow Name *
                        </label>
                        <input
                            type="text"
                            value={flowName}
                            onChange={(e) => setFlowName(e.target.value)}
                            placeholder="e.g., Quality Rate"
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                fontSize: '14px',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                outline: 'none',
                            }}
                        />
                        {flowId && (
                            <div style={{
                                marginTop: '4px',
                                fontSize: '12px',
                                color: flowExists ? '#ef4444' : '#64748b'
                            }}>
                                ID: <code>{flowId}</code>
                                {flowExists && ' ⚠️ Already exists!'}
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '6px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#334155',
                        }}>
                            Description
                        </label>
                        <input
                            type="text"
                            value={flowDescription}
                            onChange={(e) => setFlowDescription(e.target.value)}
                            placeholder="What does this flow represent?"
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                fontSize: '14px',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                outline: 'none',
                            }}
                        />
                    </div>

                    {/* Variable Selector */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#334155',
                        }}>
                            Select Variables (click to insert into formula)
                        </label>
                        <div style={{
                            maxHeight: '200px',
                            overflow: 'auto',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '12px',
                            background: '#f8fafc',
                        }}>
                            {Object.entries(groupedVariables).map(([category, vars]) => (
                                <div key={category} style={{ marginBottom: '12px' }}>
                                    <div style={{
                                        fontSize: '11px',
                                        fontWeight: '700',
                                        color: '#64748b',
                                        marginBottom: '6px',
                                        textTransform: 'uppercase',
                                    }}>
                                        {category}
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {vars.map(v => (
                                            <button
                                                key={v.name}
                                                onClick={() => insertVariable(v.name)}
                                                style={{
                                                    background: selectedVariables.has(v.name) ? '#dbeafe' : 'white',
                                                    border: `1px solid ${selectedVariables.has(v.name) ? '#3b82f6' : '#e2e8f0'}`,
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '11px',
                                                    fontFamily: 'monospace',
                                                    cursor: 'pointer',
                                                    color: selectedVariables.has(v.name) ? '#1d4ed8' : '#334155',
                                                }}
                                            >
                                                {v.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Formula Input */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '6px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#334155',
                        }}>
                            Formula *
                        </label>
                        <textarea
                            value={formula}
                            onChange={(e) => setFormula(e.target.value)}
                            placeholder="e.g., production_capacity * 0.95 * semiconductor_reliability / 100"
                            style={{
                                width: '100%',
                                minHeight: '80px',
                                padding: '12px',
                                fontSize: '14px',
                                fontFamily: 'monospace',
                                border: `2px solid ${validationResult.success ? '#22c55e' : formula ? '#ef4444' : '#e2e8f0'}`,
                                borderRadius: '8px',
                                resize: 'vertical',
                                outline: 'none',
                            }}
                        />
                        <div style={{ marginTop: '6px', fontSize: '12px', color: '#64748b' }}>
                            Operators: <code>+ - * /</code> | Functions: <code>min() max() abs() sqrt() pow()</code>
                        </div>
                    </div>

                    {/* Validation Status */}
                    {formula && (
                        <div style={{
                            padding: '12px',
                            borderRadius: '8px',
                            marginBottom: '16px',
                            background: validationResult.success ? '#f0fdf4' : '#fef2f2',
                            border: `1px solid ${validationResult.success ? '#86efac' : '#fca5a5'}`,
                        }}>
                            {validationResult.success ? (
                                <div>
                                    <div style={{ color: '#16a34a', fontWeight: '600', marginBottom: '4px' }}>
                                        ✓ Valid Formula
                                    </div>
                                    <div style={{ fontSize: '14px', color: '#15803d' }}>
                                        Preview: <strong>{validationResult.value?.toFixed(2)}</strong>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ color: '#dc2626' }}>
                                    ✗ {validationResult.error}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button
                            onClick={onClose}
                            style={{
                                padding: '10px 20px',
                                background: '#f1f5f9',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '14px',
                                cursor: 'pointer',
                                color: '#64748b',
                                fontWeight: '500',
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveFlow}
                            disabled={!flowName.trim() || !formula.trim() || flowExists}
                            style={{
                                padding: '10px 20px',
                                background: (flowName.trim() && formula.trim() && !flowExists)
                                    ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                                    : '#e2e8f0',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '14px',
                                cursor: (flowName.trim() && formula.trim() && !flowExists) ? 'pointer' : 'not-allowed',
                                color: (flowName.trim() && formula.trim() && !flowExists) ? 'white' : '#94a3b8',
                                fontWeight: '600',
                            }}
                        >
                            Add Flow to Model
                        </button>
                    </div>

                    {/* JSON Preview */}
                    <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                        <div style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#64748b',
                            marginBottom: '8px',
                        }}>
                            📄 JSON Preview (what will be added to config):
                        </div>
                        <pre style={{
                            background: '#1e293b',
                            color: '#f1f5f9',
                            padding: '12px',
                            borderRadius: '8px',
                            fontSize: '11px',
                            overflow: 'auto',
                            maxHeight: '120px',
                        }}>
                            {JSON.stringify({
                                [flowId || 'flow_name']: {
                                    formula: formula || 'your_formula_here',
                                    description: flowDescription || 'Custom flow',
                                    mechanism: 'custom',
                                }
                            }, null, 2)}
                        </pre>
                    </div>
                </>
            )}

            {/* Parameter Form */}
            {mode === 'parameter' && (
                <>
                    {/* Parameter Name */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '6px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#334155',
                        }}>
                            Parameter Name *
                        </label>
                        <input
                            type="text"
                            value={paramName}
                            onChange={(e) => setParamName(e.target.value)}
                            placeholder="e.g., storage_capacity"
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                fontSize: '14px',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                outline: 'none',
                            }}
                        />
                        {paramId && (
                            <div style={{
                                marginTop: '4px',
                                fontSize: '12px',
                                color: paramExists ? '#ef4444' : '#64748b'
                            }}>
                                ID: <code>{paramId}</code>
                                {paramExists && ' ⚠️ Already exists!'}
                            </div>
                        )}
                    </div>

                    {/* Category */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '6px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#334155',
                        }}>
                            Category
                        </label>
                        <select
                            value={paramCategory}
                            onChange={(e) => setParamCategory(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                fontSize: '14px',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                outline: 'none',
                                background: 'white',
                            }}
                        >
                            {existingCategories.map(cat => (
                                <option key={cat} value={cat}>
                                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                </option>
                            ))}
                            <option value="custom">Custom (New Category)</option>
                        </select>
                    </div>

                    {/* Value, Min, Max Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '6px',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#334155',
                            }}>
                                Value *
                            </label>
                            <input
                                type="number"
                                value={paramValue}
                                onChange={(e) => setParamValue(parseFloat(e.target.value) || 0)}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    fontSize: '14px',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    outline: 'none',
                                }}
                            />
                        </div>
                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '6px',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#334155',
                            }}>
                                Min
                            </label>
                            <input
                                type="number"
                                value={paramMin}
                                onChange={(e) => setParamMin(parseFloat(e.target.value) || 0)}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    fontSize: '14px',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    outline: 'none',
                                }}
                            />
                        </div>
                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '6px',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#334155',
                            }}>
                                Max
                            </label>
                            <input
                                type="number"
                                value={paramMax}
                                onChange={(e) => setParamMax(parseFloat(e.target.value) || 0)}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    fontSize: '14px',
                                    border: `1px solid ${paramMin >= paramMax ? '#ef4444' : '#e2e8f0'}`,
                                    borderRadius: '8px',
                                    outline: 'none',
                                }}
                            />
                        </div>
                    </div>
                    {paramMin >= paramMax && (
                        <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '-12px', marginBottom: '16px' }}>
                            ⚠️ Max must be greater than Min
                        </div>
                    )}

                    {/* Unit */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '6px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#334155',
                        }}>
                            Unit
                        </label>
                        <input
                            type="text"
                            value={paramUnit}
                            onChange={(e) => setParamUnit(e.target.value)}
                            placeholder="e.g., %, units/month, $"
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                fontSize: '14px',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                outline: 'none',
                            }}
                        />
                    </div>

                    {/* Description */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '6px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#334155',
                        }}>
                            Description
                        </label>
                        <input
                            type="text"
                            value={paramDescription}
                            onChange={(e) => setParamDescription(e.target.value)}
                            placeholder="What does this parameter control?"
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                fontSize: '14px',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                outline: 'none',
                            }}
                        />
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button
                            onClick={onClose}
                            style={{
                                padding: '10px 20px',
                                background: '#f1f5f9',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '14px',
                                cursor: 'pointer',
                                color: '#64748b',
                                fontWeight: '500',
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveParameter}
                            disabled={!isParamValid}
                            style={{
                                padding: '10px 20px',
                                background: isParamValid
                                    ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                                    : '#e2e8f0',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '14px',
                                cursor: isParamValid ? 'pointer' : 'not-allowed',
                                color: isParamValid ? 'white' : '#94a3b8',
                                fontWeight: '600',
                            }}
                        >
                            Add Parameter to Model
                        </button>
                    </div>

                    {/* JSON Preview */}
                    <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                        <div style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#64748b',
                            marginBottom: '8px',
                        }}>
                            📄 JSON Preview (what will be added to config):
                        </div>
                        <pre style={{
                            background: '#1e293b',
                            color: '#f1f5f9',
                            padding: '12px',
                            borderRadius: '8px',
                            fontSize: '11px',
                            overflow: 'auto',
                            maxHeight: '120px',
                        }}>
                            {JSON.stringify({
                                parameters: {
                                    [paramCategory]: {
                                        [paramId || 'param_name']: {
                                            value: paramValue,
                                            min: paramMin,
                                            max: paramMax,
                                            unit: paramUnit || '',
                                            description: paramDescription || 'Custom parameter',
                                        }
                                    }
                                }
                            }, null, 2)}
                        </pre>
                    </div>
                </>
            )}
        </div>
    );
};

export default NodeEditor;
