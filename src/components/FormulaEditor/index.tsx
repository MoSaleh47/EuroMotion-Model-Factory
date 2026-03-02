/**
 * FormulaEditor - Modal editor for editing node formulas
 * 
 * Features:
 * - Text input for formula
 * - Real-time syntax validation
 * - Variable autocomplete suggestions
 * - Preview of computed value
 */

import React, { useState, useEffect, useMemo } from 'react';
import { formulaParser } from '../../engine/FormulaParser';
import type { FormulaContext } from '../../engine/FormulaParser';

interface FormulaEditorProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (formula: string) => void;
    initialFormula: string;
    nodeName: string;
    nodeType: 'stock' | 'flow' | 'parameter' | 'variable';
    availableVariables: string[];
    currentContext: FormulaContext;
}

export const FormulaEditor: React.FC<FormulaEditorProps> = ({
    isOpen,
    onClose,
    onSave,
    initialFormula,
    nodeName,
    nodeType,
    availableVariables,
    currentContext,
}) => {
    const [formula, setFormula] = useState(initialFormula);
    const [showVariables, setShowVariables] = useState(false);

    // Reset formula when opening
    useEffect(() => {
        if (isOpen) {
            setFormula(initialFormula);
        }
    }, [isOpen, initialFormula]);

    // Validation result
    const validationResult = useMemo(() => {
        if (!formula.trim()) {
            return { success: false, error: 'Formula cannot be empty' };
        }
        return formulaParser.evaluate(formula, currentContext);
    }, [formula, currentContext]);

    // Extract used variables
    const usedVariables = useMemo(() => {
        return formulaParser.extractVariables(formula);
    }, [formula]);

    const handleSave = () => {
        if (validationResult.success) {
            onSave(formula);
            onClose();
        }
    };

    const insertVariable = (varName: string) => {
        setFormula(prev => prev + varName);
        setShowVariables(false);
    };

    if (!isOpen) return null;

    return (
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
            <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                width: '600px',
                maxWidth: '90vw',
                maxHeight: '80vh',
                overflow: 'auto',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '20px', color: '#1e293b' }}>
                            ✏️ Edit Formula
                        </h2>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#64748b' }}>
                            {nodeType.charAt(0).toUpperCase() + nodeType.slice(1)}: <strong>{nodeName}</strong>
                        </p>
                    </div>
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

                {/* Formula Input */}
                <div style={{ marginBottom: '16px' }}>
                    <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#334155',
                    }}>
                        Formula
                    </label>
                    <textarea
                        value={formula}
                        onChange={(e) => setFormula(e.target.value)}
                        placeholder="e.g., production_capacity * efficiency * 0.95"
                        style={{
                            width: '100%',
                            minHeight: '80px',
                            padding: '12px',
                            fontSize: '14px',
                            fontFamily: 'monospace',
                            border: `2px solid ${validationResult.success ? '#22c55e' : '#ef4444'}`,
                            borderRadius: '8px',
                            resize: 'vertical',
                            outline: 'none',
                        }}
                    />
                </div>

                {/* Validation Status */}
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
                                Preview value: <strong>{validationResult.value?.toFixed(2)}</strong>
                            </div>
                        </div>
                    ) : (
                        <div style={{ color: '#dc2626' }}>
                            ✗ {validationResult.error}
                        </div>
                    )}
                </div>

                {/* Variables Section */}
                <div style={{ marginBottom: '20px' }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px',
                    }}>
                        <label style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>
                            Used Variables
                        </label>
                        <button
                            onClick={() => setShowVariables(!showVariables)}
                            style={{
                                background: '#e0e7ff',
                                border: 'none',
                                padding: '4px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                color: '#4f46e5',
                                fontWeight: '600',
                            }}
                        >
                            {showVariables ? 'Hide' : 'Show All Variables'}
                        </button>
                    </div>

                    {/* Used variables tags */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {usedVariables.length > 0 ? (
                            usedVariables.map(v => (
                                <span
                                    key={v}
                                    style={{
                                        background: availableVariables.includes(v) ? '#dbeafe' : '#fee2e2',
                                        color: availableVariables.includes(v) ? '#1d4ed8' : '#dc2626',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontFamily: 'monospace',
                                    }}
                                >
                                    {v}
                                    {!availableVariables.includes(v) && ' ⚠️'}
                                </span>
                            ))
                        ) : (
                            <span style={{ color: '#94a3b8', fontSize: '13px' }}>
                                No variables used
                            </span>
                        )}
                    </div>

                    {/* Available variables dropdown */}
                    {showVariables && (
                        <div style={{
                            marginTop: '12px',
                            padding: '12px',
                            background: '#f8fafc',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            maxHeight: '150px',
                            overflow: 'auto',
                        }}>
                            <div style={{
                                fontSize: '11px',
                                color: '#64748b',
                                marginBottom: '8px',
                                fontWeight: '600',
                            }}>
                                Click to insert:
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {availableVariables.map(v => (
                                    <button
                                        key={v}
                                        onClick={() => insertVariable(v)}
                                        style={{
                                            background: '#e0e7ff',
                                            border: 'none',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '11px',
                                            fontFamily: 'monospace',
                                            cursor: 'pointer',
                                            color: '#4f46e5',
                                        }}
                                    >
                                        {v}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Function Reference */}
                <div style={{
                    marginBottom: '20px',
                    padding: '12px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    fontSize: '12px',
                }}>
                    <div style={{ fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                        Supported Functions:
                    </div>
                    <div style={{ color: '#64748b', fontFamily: 'monospace' }}>
                        min(a, b) • max(a, b) • abs(x) • sqrt(x) • pow(x, n)
                    </div>
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
                        onClick={handleSave}
                        disabled={!validationResult.success}
                        style={{
                            padding: '10px 20px',
                            background: validationResult.success
                                ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                                : '#e2e8f0',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            cursor: validationResult.success ? 'pointer' : 'not-allowed',
                            color: validationResult.success ? 'white' : '#94a3b8',
                            fontWeight: '600',
                        }}
                    >
                        Save Formula
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FormulaEditor;
