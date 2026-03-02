/**
 * ConfigLoader - Handles loading and validating JSON configuration files
 * 
 * This class provides safe, deterministic loading of all model configuration,
 * following the professor's guidance: "Use structured data (JSON) to make AI integration deterministic."
 */

import type { ModelConfig, SimulationConfig, Scenario, Parameter } from './types';

export class ConfigLoader {
    private baseUrl: string;

    constructor(baseUrl: string = '/config') {
        this.baseUrl = baseUrl;
    }

    /**
     * Load the main model configuration
     */
    async loadModelConfig(): Promise<ModelConfig> {
        const response = await fetch(`${this.baseUrl}/model_config.json`);
        if (!response.ok) {
            throw new Error(`Failed to load model config: ${response.statusText}`);
        }
        const config = await response.json();
        this.validateModelConfig(config);
        return config as ModelConfig;
    }

    /**
     * Load simulation configuration
     */
    async loadSimulationConfig(): Promise<SimulationConfig> {
        const response = await fetch(`${this.baseUrl}/simulation_config.json`);
        if (!response.ok) {
            throw new Error(`Failed to load simulation config: ${response.statusText}`);
        }
        return response.json() as Promise<SimulationConfig>;
    }

    /**
     * List available scenarios
     */
    async listScenarios(): Promise<string[]> {
        // Since we know our scenarios, return them directly
        // In a real app, this could be an API call
        return ['baseline', 'crisis_semiconductor', 'aggressive_growth'];
    }

    /**
     * Load a specific scenario
     */
    async loadScenario(scenarioName: string): Promise<Scenario> {
        const response = await fetch(`${this.baseUrl}/scenarios/${scenarioName}.json`);
        if (!response.ok) {
            throw new Error(`Failed to load scenario ${scenarioName}: ${response.statusText}`);
        }
        const scenario = await response.json();
        this.validateScenario(scenario);
        return scenario as Scenario;
    }

    /**
     * Merge scenario overrides into base configuration
     * Creates a new config object without mutating the original
     */
    mergeScenario(baseConfig: ModelConfig, scenario: Scenario): ModelConfig {
        const mergedConfig = JSON.parse(JSON.stringify(baseConfig)) as ModelConfig;

        // Apply parameter overrides
        for (const [paramName, value] of Object.entries(scenario.parameter_overrides)) {
            this.setParameterValue(mergedConfig, paramName, value);
        }

        return mergedConfig;
    }

    /**
     * Set a parameter value in the config, searching through all parameter categories
     */
    private setParameterValue(config: ModelConfig, paramName: string, value: number): void {
        for (const category of Object.values(config.parameters)) {
            if (paramName in category) {
                category[paramName].value = value;
                return;
            }
        }
        console.warn(`Parameter ${paramName} not found in config`);
    }

    /**
     * Get a parameter value by name, searching through all categories
     */
    getParameterValue(config: ModelConfig, paramName: string): number {
        for (const category of Object.values(config.parameters)) {
            if (paramName in category) {
                return category[paramName].value;
            }
        }
        throw new Error(`Parameter ${paramName} not found`);
    }

    /**
     * Get all parameters flattened into a single record
     */
    getFlattenedParameters(config: ModelConfig): Record<string, Parameter> {
        const flattened: Record<string, Parameter> = {};
        for (const category of Object.values(config.parameters)) {
            for (const [key, param] of Object.entries(category)) {
                flattened[key] = param;
            }
        }
        return flattened;
    }

    /**
     * Validate model configuration structure
     */
    private validateModelConfig(config: unknown): void {
        if (!config || typeof config !== 'object') {
            throw new Error('Invalid config: must be an object');
        }

        const c = config as Record<string, unknown>;

        if (!c.metadata || !c.stocks || !c.flows || !c.parameters || !c.feedback_loops) {
            throw new Error('Invalid config: missing required sections');
        }

        // Validate feedback loops have required fields
        const loops = c.feedback_loops as Record<string, unknown>;
        for (const [loopId, loop] of Object.entries(loops)) {
            const l = loop as Record<string, unknown>;
            if (!l.name || !l.type || !l.nodes || !l.edges) {
                throw new Error(`Invalid feedback loop ${loopId}: missing required fields`);
            }
        }
    }

    /**
     * Validate scenario structure
     */
    private validateScenario(scenario: unknown): void {
        if (!scenario || typeof scenario !== 'object') {
            throw new Error('Invalid scenario: must be an object');
        }

        const s = scenario as Record<string, unknown>;

        if (!s.scenario_name || !s.parameter_overrides) {
            throw new Error('Invalid scenario: missing required fields');
        }
    }

    /**
     * Update simulation config with shock events from a scenario
     */
    updateSimConfigWithShocks(simConfig: SimulationConfig, scenario: Scenario): SimulationConfig {
        return {
            ...simConfig,
            shock_scenarios: {
                enabled: scenario.shock_events && scenario.shock_events.length > 0,
                events: scenario.shock_events || []
            }
        };
    }
}

// Export a default instance
export const configLoader = new ConfigLoader();
