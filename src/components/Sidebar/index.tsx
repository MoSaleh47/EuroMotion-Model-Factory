/**
 * Sidebar - Control panel for simulation configuration
 * 
 * Contains:
 * - Scenario selector
 * - Parameter sliders
 * - Simulation controls
 */

import React, { useState } from 'react';
import type { ModelConfig, SimulationConfig, Parameter } from '../../engine/types';

// Parameter descriptions for tooltips
const PARAMETER_DESCRIPTIONS: Record<string, string> = {
    // Supply Chain
    semiconductor_reliability: "Base reliability of semiconductor supply chain. Lower values mean higher risk of disruptions.",
    battery_reliability: "Reliability of battery supply chain. Affects electric vehicle production capacity.",
    regionalization_rate: "Annual rate of shifting to regional/local suppliers. Higher = less dependency on Asian suppliers.",
    sdv_semiconductor_multiplier: "Chip multiplier for Software-Defined Vehicles (SDVs). SDVs use 2-3x more chips than traditional vehicles.",

    // Strategic
    resilience_investment_percentage: "Percentage of revenue invested in supply chain resilience. Increases visibility and reduces risks.",
    market_share_sensitivity: "How sensitive market share is to delivery performance. Higher = customers react more strongly to delays.",
    service_level_target: "Target on-time delivery rate (%). The model tries to achieve this target.",

    // Technical
    production_learning_rate: "Annual efficiency improvement rate from organizational learning.",
    backlog_clearance_rate: "Monthly percentage of backlog the company can process.",
    capacity_expansion_rate: "Maximum monthly rate of production capacity expansion.",

    // Market
    industry_growth_rate: "Annual growth rate of the EV market (%).",
    price_per_unit: "Average price per vehicle (€). Affects revenue and investment capacity.",
    base_demand: "Base monthly vehicle demand before market share effects.",
};

// Tooltip component with "?" icon
interface TooltipProps {
    text: string;
}

const Tooltip: React.FC<TooltipProps> = ({ text }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <span
            style={{ position: 'relative', display: 'inline-flex', marginLeft: '6px' }}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: '#e0e7ff',
                color: '#4f46e5',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'help',
                border: '1px solid #c7d2fe',
            }}>
                ?
            </span>
            {isVisible && (
                <div style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginBottom: '8px',
                    padding: '10px 12px',
                    background: '#1e293b',
                    color: 'white',
                    borderRadius: '8px',
                    fontSize: '12px',
                    lineHeight: '1.5',
                    width: '220px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    zIndex: 1000,
                    pointerEvents: 'none',
                }}>
                    {text}
                    <div style={{
                        position: 'absolute',
                        bottom: '-6px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '0',
                        height: '0',
                        borderLeft: '6px solid transparent',
                        borderRight: '6px solid transparent',
                        borderTop: '6px solid #1e293b',
                    }} />
                </div>
            )}
        </span>
    );
};

interface SidebarProps {
    config: ModelConfig;
    simConfig: SimulationConfig;
    scenarios: string[];
    onParameterChange: (paramName: string, value: number) => void;
    onLoadScenario: (scenarioName: string) => void;
    onRunSimulation: () => void;
    onDurationChange: (months: number) => void;
    isSimulating: boolean;
    hasResults: boolean;
}

// Parameter slider component
interface ParameterSliderProps {
    name: string;
    param: Parameter;
    onChange: (name: string, value: number) => void;
}

const ParameterSlider: React.FC<ParameterSliderProps> = ({ name, param, onChange }) => {
    const displayName = name
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());

    const description = PARAMETER_DESCRIPTIONS[name];

    return (
        <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <label style={{ fontSize: '13px', fontWeight: '500', color: '#334155' }}>
                        {displayName}
                    </label>
                    {description && <Tooltip text={description} />}
                </div>
                <span style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#0ea5e9',
                    background: '#f0f9ff',
                    padding: '2px 8px',
                    borderRadius: '4px'
                }}>
                    {param.value} {param.unit.split('_')[0]}
                </span>
            </div>
            <input
                type="range"
                min={param.min ?? 0}
                max={param.max ?? 100}
                step={(param.max ?? 100) - (param.min ?? 0) > 10 ? 1 : 0.1}
                value={param.value}
                onChange={(e) => onChange(name, parseFloat(e.target.value))}
                style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8' }}>
                <span>{param.min ?? 0}</span>
                <span>{param.max ?? 100}</span>
            </div>
        </div>
    );
};

export const Sidebar: React.FC<SidebarProps> = ({
    config,
    simConfig,
    scenarios,
    onParameterChange,
    onLoadScenario,
    onRunSimulation,
    onDurationChange,
    isSimulating,
    hasResults,
}) => {
    const [selectedScenario, setSelectedScenario] = useState('baseline');
    const [expanded, setExpanded] = useState<Record<string, boolean>>({
        supply_chain: true,
        strategic: true,
        technical: false,
        market: false,
    });

    const toggleExpand = (category: string) => {
        setExpanded((prev) => ({ ...prev, [category]: !prev[category] }));
    };

    const sectionStyle: React.CSSProperties = {
        background: 'white',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        border: '1px solid #e2e8f0',
    };

    const sectionTitleStyle: React.CSSProperties = {
        fontSize: '14px',
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    };

    return (
        <div
            style={{
                width: '320px',
                minWidth: '320px',
                background: '#f8fafc',
                borderRight: '1px solid #e2e8f0',
                height: '100vh',
                overflow: 'auto',
                padding: '20px',
            }}
        >
            {/* Logo/Header */}
            <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '4px' }}>🏭</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                    Model Factory
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Control Panel</div>
            </div>

            {/* Simulation Controls */}
            <div style={sectionStyle}>
                <div style={sectionTitleStyle}>
                    <span>⚡</span> Simulation Controls
                </div>

                {/* Duration slider */}
                <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <label style={{ fontSize: '13px', fontWeight: '500', color: '#334155' }}>
                            Duration
                        </label>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#0ea5e9' }}>
                            {simConfig.time.duration_months} months
                        </span>
                    </div>
                    <input
                        type="range"
                        min={12}
                        max={120}
                        step={6}
                        value={simConfig.time.duration_months}
                        onChange={(e) => onDurationChange(parseInt(e.target.value))}
                        style={{ width: '100%' }}
                    />
                </div>

                <button
                    onClick={onRunSimulation}
                    disabled={isSimulating}
                    style={{
                        width: '100%',
                        padding: '14px',
                        background: isSimulating
                            ? '#94a3b8'
                            : 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '15px',
                        fontWeight: '600',
                        cursor: isSimulating ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: isSimulating ? 'none' : '0 4px 12px rgba(14, 165, 233, 0.3)',
                        transition: 'all 0.2s',
                    }}
                >
                    {isSimulating ? (
                        <>
                            <span className="animate-pulse">⏳</span> Simulating...
                        </>
                    ) : (
                        <>
                            <span>▶️</span> Run Simulation
                        </>
                    )}
                </button>

                {hasResults && (
                    <div style={{
                        marginTop: '12px',
                        padding: '8px',
                        background: '#dcfce7',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#166534',
                        textAlign: 'center'
                    }}>
                        ✅ Results ready - view in tabs above
                    </div>
                )}
            </div>

            {/* Scenario Selector */}
            <div style={sectionStyle}>
                <div style={sectionTitleStyle}>
                    <span>📁</span> Scenario
                </div>
                <select
                    value={selectedScenario}
                    onChange={(e) => setSelectedScenario(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        fontSize: '14px',
                        marginBottom: '12px',
                        background: 'white',
                        cursor: 'pointer',
                    }}
                >
                    {scenarios.map((scenario) => (
                        <option key={scenario} value={scenario}>
                            {scenario.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        </option>
                    ))}
                </select>
                <button
                    onClick={() => onLoadScenario(selectedScenario)}
                    style={{
                        width: '100%',
                        padding: '10px',
                        background: '#f1f5f9',
                        color: '#334155',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                    }}
                >
                    <span>📥</span> Load Scenario
                </button>
            </div>

            {/* Parameter Sliders by Category */}
            {Object.entries(config.parameters).map(([category, params]) => (
                <div key={category} style={sectionStyle}>
                    <div
                        style={{
                            ...sectionTitleStyle,
                            cursor: 'pointer',
                            justifyContent: 'space-between',
                        }}
                        onClick={() => toggleExpand(category)}
                    >
                        <span>
                            {category === 'supply_chain' && '🔗'}
                            {category === 'strategic' && '🎯'}
                            {category === 'technical' && '⚙️'}
                            {category === 'market' && '📊'}
                            {category === 'adjustment_rates' && '🔧'}
                            {' '}
                            {category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        </span>
                        <span style={{ color: '#94a3b8' }}>{expanded[category] ? '▼' : '▶'}</span>
                    </div>
                    {expanded[category] && (
                        <div>
                            {Object.entries(params).map(([paramName, param]) => (
                                <ParameterSlider
                                    key={paramName}
                                    name={paramName}
                                    param={param}
                                    onChange={onParameterChange}
                                />
                            ))}
                        </div>
                    )}
                </div>
            ))}

            {/* Model Info */}
            <div style={{ ...sectionStyle, background: '#f0f9ff' }}>
                <div style={{ fontSize: '12px', color: '#0369a1' }}>
                    <strong>📌 Model Version:</strong> {config.metadata.version}
                </div>
                <div style={{ fontSize: '11px', color: '#0369a1', marginTop: '4px' }}>
                    {config.metadata.model_name}
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
