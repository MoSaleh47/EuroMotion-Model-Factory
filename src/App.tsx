/**
 * App.tsx - Main Application Component
 * 
 * EuroMotion Model Factory - System Dynamics Model for EV/SDV Supply Chain
 * 
 * This is the main orchestrator that:
 * - Loads configuration from JSON files
 * - Manages application state
 * - Coordinates simulation runs
 * - Renders the main UI layout
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { FeedbackLoopDiagram } from './components/Visualizations/FeedbackLoopDiagram';
import { TimeSeriesCharts } from './components/Visualizations/TimeSeriesCharts';
import { MetricsCards } from './components/Visualizations/MetricsCards';
import { AIAssistant } from './components/AIAssistant';
import { ConfigLoader } from './engine/ConfigLoader';
import { SimulationEngine } from './engine/SimulationEngine';
import { mistralService } from './ai/MistralService';
import type { ModelConfig, SimulationConfig, SimulationResults, Scenario } from './engine/types';
import type { AIResponse } from './ai/MistralService';
import './index.css';

// Tab definitions
type TabId = 'feedback-loops' | 'results' | 'time-series' | 'ai-assistant' | 'export';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

const tabs: Tab[] = [
  { id: 'feedback-loops', label: 'Feedback Loops', icon: '🔗' },
  { id: 'results', label: 'Results', icon: '📊' },
  { id: 'time-series', label: 'Time Series', icon: '📈' },
  { id: 'ai-assistant', label: 'AI Assistant', icon: '🤖' },
  { id: 'export', label: 'Export', icon: '💾' },
];

function App() {
  // State
  const [config, setConfig] = useState<ModelConfig | null>(null);
  const [simConfig, setSimConfig] = useState<SimulationConfig | null>(null);
  const [results, setResults] = useState<SimulationResults | null>(null);
  const [scenarios, setScenarios] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('feedback-loops');
  const [error, setError] = useState<string | null>(null);
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);

  // Undo/Redo history state
  const [configHistory, setConfigHistory] = useState<ModelConfig[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Load initial configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        setError(null);

        const loader = new ConfigLoader();
        const modelConfig = await loader.loadModelConfig();
        const simulationConfig = await loader.loadSimulationConfig();
        const scenarioList = await loader.listScenarios();

        setConfig(modelConfig);
        setSimConfig(simulationConfig);
        setScenarios(scenarioList);

        // Initialize history with the loaded config
        setConfigHistory([JSON.parse(JSON.stringify(modelConfig))]);
        setHistoryIndex(0);
      } catch (err) {
        setError(`Failed to load configuration: ${err instanceof Error ? err.message : 'Unknown error'}`);
        console.error('Config load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  // Run simulation
  const handleRunSimulation = useCallback(() => {
    if (!config || !simConfig) return;

    setSimulating(true);
    setError(null);

    // Use setTimeout to allow UI to update before heavy computation
    setTimeout(() => {
      try {
        const engine = new SimulationEngine(config);
        const simulationResults = engine.simulate(simConfig);
        setResults(simulationResults);

        // Auto-switch to results tab
        setActiveTab('results');
      } catch (err) {
        setError(`Simulation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        console.error('Simulation error:', err);
      } finally {
        setSimulating(false);
      }
    }, 50);
  }, [config, simConfig]);

  // Load scenario
  const handleLoadScenario = useCallback(async (scenarioName: string) => {
    if (!config) return;

    try {
      setError(null);
      const loader = new ConfigLoader();
      const scenario = await loader.loadScenario(scenarioName);

      // Merge scenario into config
      const mergedConfig = loader.mergeScenario(config, scenario);
      setConfig(mergedConfig);
      setCurrentScenario(scenario);

      // Update simulation config with shock events
      if (simConfig) {
        const updatedSimConfig = loader.updateSimConfigWithShocks(simConfig, scenario);
        setSimConfig(updatedSimConfig);
      }

      // Clear previous results
      setResults(null);
    } catch (err) {
      setError(`Failed to load scenario: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Scenario load error:', err);
    }
  }, [config, simConfig]);

  // Handle parameter change
  const handleParameterChange = useCallback((paramName: string, value: number) => {
    if (!config) return;

    // Deep clone config and update parameter
    const newConfig = JSON.parse(JSON.stringify(config)) as ModelConfig;

    // Search through categories
    for (const category of Object.values(newConfig.parameters)) {
      if (paramName in category) {
        category[paramName].value = value;
        break;
      }
    }

    setConfig(newConfig);
    // Clear results since parameters changed
    setResults(null);
  }, [config]);

  // Handle duration change
  const handleDurationChange = useCallback((months: number) => {
    if (!simConfig) return;

    setSimConfig({
      ...simConfig,
      time: {
        ...simConfig.time,
        duration_months: months
      }
    });
    setResults(null);
  }, [simConfig]);

  // Handle formula change from visual editor
  const handleFormulaChange = useCallback((nodeId: string, formula: string) => {
    if (!config) return;

    // Save current state to history before making changes
    setConfigHistory(prev => {
      const newHistory = [...prev];
      newHistory.push(JSON.parse(JSON.stringify(config)));
      if (newHistory.length > 50) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex(prev => prev + 1);

    const newConfig = JSON.parse(JSON.stringify(config)) as ModelConfig;

    // Update flow formula
    if (newConfig.flows[nodeId]) {
      newConfig.flows[nodeId].formula = formula;
    }
    // Update stock initial value (if formula is a number)
    else if (newConfig.stocks[nodeId]) {
      const numValue = parseFloat(formula);
      if (!isNaN(numValue)) {
        newConfig.stocks[nodeId].initial_value = numValue;
      }
    }

    setConfig(newConfig);
    setResults(null); // Clear results since model changed
  }, [config]);

  // Helper to save config to history before changes
  const saveToHistory = useCallback((configToSave: ModelConfig) => {
    setConfigHistory(prev => {
      // Cut off any redo history after current index
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(JSON.parse(JSON.stringify(configToSave)));
      // Keep max 50 history entries
      if (newHistory.length > 50) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  // Undo handler
  const handleUndo = useCallback(() => {
    if (historyIndex > 0 && configHistory.length > 0) {
      const previousConfig = configHistory[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setConfig(JSON.parse(JSON.stringify(previousConfig)));
      setResults(null);
      console.log('Undo: restored to history index', historyIndex - 1);
    }
  }, [historyIndex, configHistory]);

  // Redo handler
  const handleRedo = useCallback(() => {
    if (historyIndex < configHistory.length - 1) {
      const nextConfig = configHistory[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setConfig(JSON.parse(JSON.stringify(nextConfig)));
      setResults(null);
      console.log('Redo: restored to history index', historyIndex + 1);
    }
  }, [historyIndex, configHistory]);

  // Check if undo/redo are available
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < configHistory.length - 1;

  // Handle adding new flow from visual editor
  const handleAddFlow = useCallback((flowId: string, flow: import('./engine/types').Flow) => {
    try {
      if (!config) return;

      console.log('Attempting to add flow:', flowId);

      // Save current state to history before making changes
      saveToHistory(config);

      const newConfig = JSON.parse(JSON.stringify(config)) as ModelConfig;
      newConfig.flows[flowId] = flow;

      // Initialize position
      if (!newConfig.layout) newConfig.layout = {};
      newConfig.layout[flowId] = {
        x: Math.random() * 600 + 100,
        y: Math.random() * 500 + 100
      };

      setConfig(newConfig);
      setResults(null);
      console.log('Successfully added new flow:', flowId, flow);
    } catch (error) {
      console.error('Error adding flow:', error);
      alert('Failed to add flow. Check console for details.');
    }
  }, [config, saveToHistory]);

  // Handle deleting flow from visual editor
  const handleDeleteFlow = useCallback((flowId: string) => {
    if (!config) return;

    // Save current state to history before making changes
    saveToHistory(config);

    const newConfig = JSON.parse(JSON.stringify(config)) as ModelConfig;

    // Delete the flow
    if (newConfig.flows[flowId]) {
      delete newConfig.flows[flowId];
      setConfig(newConfig);
      setResults(null);
      console.log('Deleted flow:', flowId);
    }
  }, [config, saveToHistory]);

  // Handle adding new parameter from visual editor
  const handleAddParameter = useCallback((paramId: string, value: number, min: number, max: number, unit: string, description: string, category: string = 'custom') => {
    try {
      if (!config) return;

      console.log('Attempting to add parameter:', paramId);

      // Save current state to history before making changes
      saveToHistory(config);

      const newConfig = JSON.parse(JSON.stringify(config)) as ModelConfig;

      // Ensure category exists
      if (!newConfig.parameters[category]) {
        newConfig.parameters[category] = {};
      }

      // Add the new parameter
      newConfig.parameters[category][paramId] = {
        value,
        min,
        max,
        unit,
        description
      };

      // Initialize position
      if (!newConfig.layout) newConfig.layout = {};
      newConfig.layout[paramId] = {
        x: Math.random() * 600 + 100,
        y: Math.random() * 500 + 100
      };

      setConfig(newConfig);
      setResults(null);
      console.log('Successfully added new parameter:', paramId, 'in category:', category);
    } catch (error) {
      console.error('Error adding parameter:', error);
      alert('Failed to add parameter. Check console for details.');
    }
  }, [config, saveToHistory]);

  // Handle adding new edge from visual editor
  const handleAddEdge = useCallback((source: string, target: string) => {
    try {
      if (!config) return;

      // prevent self-loops for now if desired, or allow them
      if (source === target) return;

      console.log('Attempting to add edge:', source, '->', target);

      saveToHistory(config);

      const newConfig = JSON.parse(JSON.stringify(config)) as ModelConfig;

      // We'll use a special "custom_connections" loop to store these user-created links
      // Check if it exists, if not create it
      if (!newConfig.feedback_loops['custom_connections']) {
        newConfig.feedback_loops['custom_connections'] = {
          name: 'Custom Connections',
          type: 'reinforcing', // default
          polarity: 'positive', // default
          nodes: [],
          edges: [],
          description: 'User-defined connections'
        };
      }

      const customLoop = newConfig.feedback_loops['custom_connections'];

      // Check if edge already exists to avoid duplicates
      const edgeExists = customLoop.edges.some(e => e.from === source && e.to === target);
      if (edgeExists) {
        console.log('Edge already exists, skipping');
        return;
      }

      // Add nodes if not present
      if (!customLoop.nodes.includes(source)) customLoop.nodes.push(source);
      if (!customLoop.nodes.includes(target)) customLoop.nodes.push(target);

      // Add the edge
      customLoop.edges.push({
        from: source,
        to: target,
        formula: '', // Default empty formula
        polarity: '+' // Default polarity
      });

      setConfig(newConfig);
      setResults(null);
      console.log('Successfully added new edge:', source, '->', target);
    } catch (error) {
      console.error('Error adding edge:', error);
      alert('Failed to add edge. Check console for details.');
    }
  }, [config, saveToHistory]);

  // Handle layout changes (node movements)
  const handleLayoutChange = useCallback((newLayout: Record<string, { x: number; y: number }>) => {
    if (!config) return;

    // Save to history (debouncing happens naturally by user drag stop)
    saveToHistory(config);

    const newConfig = JSON.parse(JSON.stringify(config)) as ModelConfig;
    newConfig.layout = newLayout;

    setConfig(newConfig);
  }, [config, saveToHistory]);

  // Export results as CSV
  const handleExportCSV = useCallback(() => {
    if (!results) return;

    const headers = Object.keys(results);
    const rows: string[] = [headers.join(',')];

    for (let i = 0; i < results.time.length; i++) {
      const row = headers.map((h) => results[h as keyof SimulationResults][i]);
      rows.push(row.join(','));
    }

    const csv = rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `euromotion_simulation_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [results]);

  // Export config as JSON
  const handleExportConfig = useCallback(() => {
    if (!config) return;

    const json = JSON.stringify(config, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `euromotion_config_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [config]);

  // Handle AI-suggested changes
  const handleAIChanges = useCallback((changes: AIResponse['changes']) => {
    if (!changes || !config) return;

    // Apply parameter changes using mistralService
    const newConfig = mistralService.applyChangesToConfig(config, changes);
    setConfig(newConfig);

    // Clear results since parameters changed
    setResults(null);

    // If there's a new scenario suggestion, we could save it here
    if (changes.scenario) {
      console.log('New scenario suggested:', changes.scenario);
      // In a full implementation, we'd save this to the scenarios folder
    }
  }, [config]);

  // Loading state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#f1f5f9',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏭</div>
          <div style={{ fontSize: '20px', color: '#334155', marginBottom: '8px' }}>
            EuroMotion Model Factory
          </div>
          <div style={{ color: '#64748b' }}>Loading configuration...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !config) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#fef2f2',
      }}>
        <div style={{
          textAlign: 'center',
          maxWidth: '500px',
          padding: '32px',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <div style={{ fontSize: '20px', color: '#dc2626', marginBottom: '8px' }}>
            Configuration Error
          </div>
          <div style={{ color: '#64748b', marginBottom: '16px' }}>{error}</div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      {config && simConfig && (
        <Sidebar
          config={config}
          simConfig={simConfig}
          scenarios={scenarios}
          onParameterChange={handleParameterChange}
          onLoadScenario={handleLoadScenario}
          onRunSimulation={handleRunSimulation}
          onDurationChange={handleDurationChange}
          isSimulating={simulating}
          hasResults={!!results}
        />
      )}

      {/* Main Content */}
      <div style={{ flex: 1, overflow: 'auto', background: '#f8fafc' }}>
        {/* Header */}
        <header
          style={{
            background: 'linear-gradient(135deg, #1e3a5f 0%, #2C3E50 100%)',
            padding: '24px 32px',
            color: 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          <h1
            style={{
              fontSize: '28px',
              fontWeight: '700',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <span>🏭</span> EuroMotion Model Factory
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '15px', marginBottom: '8px' }}>
            System Dynamics Model for EV/SDV Supply Chain Strategic Planning
          </p>
          {currentScenario && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255,255,255,0.1)',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '13px',
              }}
            >
              <span>📁</span>
              {currentScenario.scenario_name}
              {currentScenario.shock_events?.length > 0 && (
                <span style={{ background: '#dc2626', padding: '2px 8px', borderRadius: '10px', fontSize: '11px' }}>
                  ⚡ {currentScenario.shock_events.length} shock(s)
                </span>
              )}
            </div>
          )}
        </header>

        {/* Error Banner */}
        {error && (
          <div
            style={{
              background: '#fef2f2',
              borderBottom: '1px solid #fca5a5',
              padding: '12px 32px',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>⚠️</span> {error}
            <button
              onClick={() => setError(null)}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                color: '#dc2626',
                cursor: 'pointer',
                fontSize: '18px',
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div
          style={{
            background: 'white',
            borderBottom: '1px solid #e2e8f0',
            padding: '0 32px',
            display: 'flex',
            gap: '8px',
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '16px 24px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? '3px solid #0ea5e9' : '3px solid transparent',
                color: activeTab === tab.id ? '#0ea5e9' : '#64748b',
                fontWeight: activeTab === tab.id ? '600' : '500',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ padding: '24px 32px' }}>
          {/* Feedback Loops Tab */}
          {activeTab === 'feedback-loops' && config && (
            <div
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
                    System Dynamics Feedback Loops
                  </h2>
                  <p style={{ color: '#64748b', fontSize: '14px' }}>
                    💡 <strong>Hover over arrows</strong> to see formulas, polarity, and loop names.
                    Drag nodes to rearrange the diagram.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={handleUndo}
                    disabled={!canUndo}
                    style={{
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: '500',
                      background: canUndo ? '#f1f5f9' : '#e2e8f0',
                      color: canUndo ? '#334155' : '#94a3b8',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      cursor: canUndo ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    title="Undo last change"
                  >
                    ↩️ Undo
                  </button>
                  <button
                    onClick={handleRedo}
                    disabled={!canRedo}
                    style={{
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: '500',
                      background: canRedo ? '#f1f5f9' : '#e2e8f0',
                      color: canRedo ? '#334155' : '#94a3b8',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      cursor: canRedo ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    title="Redo last change"
                  >
                    ↪️ Redo
                  </button>
                  <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '8px' }}>
                    {historyIndex + 1} / {configHistory.length || 1}
                  </span>
                </div>
              </div>
              <FeedbackLoopDiagram
                config={config}
                results={results || undefined}
                onFormulaChange={handleFormulaChange}
                onAddFlow={handleAddFlow}
                onDeleteFlow={handleDeleteFlow}
                onAddParameter={handleAddParameter}
                onAddEdge={handleAddEdge}
                onLayoutChange={handleLayoutChange}
              />
            </div>
          )}

          {/* Results Tab */}
          {activeTab === 'results' && (
            <div>
              {results ? (
                <MetricsCards results={results} />
              ) : (
                <div
                  style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '64px',
                    textAlign: 'center',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                  <div style={{ fontSize: '18px', color: '#334155', marginBottom: '8px' }}>
                    No Results Yet
                  </div>
                  <div style={{ color: '#64748b', marginBottom: '24px' }}>
                    Run a simulation to see metrics and analysis
                  </div>
                  <button
                    onClick={handleRunSimulation}
                    disabled={simulating}
                    style={{
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)',
                    }}
                  >
                    ▶️ Run Simulation
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Time Series Tab */}
          {activeTab === 'time-series' && (
            <div>
              {results ? (
                <TimeSeriesCharts results={results} />
              ) : (
                <div
                  style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '64px',
                    textAlign: 'center',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📈</div>
                  <div style={{ fontSize: '18px', color: '#334155', marginBottom: '8px' }}>
                    No Time Series Data
                  </div>
                  <div style={{ color: '#64748b' }}>
                    Run a simulation to see charts
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI Assistant Tab */}
          {activeTab === 'ai-assistant' && config && (
            <AIAssistant
              config={config}
              results={results}
              onApplyChanges={handleAIChanges}
            />
          )}

          {/* Export Tab */}
          {activeTab === 'export' && (
            <div
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '32px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
                border: '1px solid #e2e8f0',
              }}
            >
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b', marginBottom: '24px' }}>
                💾 Export Data
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                {/* Export Results CSV */}
                <div
                  style={{
                    background: '#f0f9ff',
                    borderRadius: '12px',
                    padding: '24px',
                    border: '1px solid #bae6fd',
                  }}
                >
                  <div style={{ fontSize: '24px', marginBottom: '12px' }}>📊</div>
                  <div style={{ fontWeight: '600', color: '#0369a1', marginBottom: '8px' }}>
                    Simulation Results
                  </div>
                  <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '16px' }}>
                    Export all time series data as CSV
                  </div>
                  <button
                    onClick={handleExportCSV}
                    disabled={!results}
                    style={{
                      padding: '10px 20px',
                      background: results ? '#0ea5e9' : '#94a3b8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: results ? 'pointer' : 'not-allowed',
                      fontSize: '14px',
                      fontWeight: '500',
                    }}
                  >
                    Download CSV
                  </button>
                </div>

                {/* Export Config JSON */}
                <div
                  style={{
                    background: '#f0fdf4',
                    borderRadius: '12px',
                    padding: '24px',
                    border: '1px solid #bbf7d0',
                  }}
                >
                  <div style={{ fontSize: '24px', marginBottom: '12px' }}>⚙️</div>
                  <div style={{ fontWeight: '600', color: '#166534', marginBottom: '8px' }}>
                    Model Configuration
                  </div>
                  <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '16px' }}>
                    Export current configuration as JSON
                  </div>
                  <button
                    onClick={handleExportConfig}
                    style={{
                      padding: '10px 20px',
                      background: '#22c55e',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                    }}
                  >
                    Download JSON
                  </button>
                </div>
              </div>

              {/* AI Integration Info */}
              <div
                style={{
                  marginTop: '24px',
                  background: '#faf5ff',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid #e9d5ff',
                }}
              >
                <div style={{ fontWeight: '600', color: '#7c3aed', marginBottom: '8px' }}>
                  🤖 AI Integration Ready
                </div>
                <div style={{ color: '#64748b', fontSize: '13px' }}>
                  The exported JSON configuration can be modified by AI systems (like GPT-4)
                  to create new scenarios. The structured format ensures deterministic,
                  safe integration.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
