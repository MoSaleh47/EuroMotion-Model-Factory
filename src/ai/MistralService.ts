/**
 * MistralService - Frontend service for communicating with the AI proxy
 */

import { SYSTEM_PROMPT } from './prompts';
import type { ModelConfig, SimulationResults } from '../engine/types';

const PROXY_URL = 'http://localhost:3001';

export interface AIResponse {
    explanation: string;
    confidence: number;
    changes: {
        parameters?: Record<string, number>;
        scenario?: {
            scenario_name: string;
            description: string;
            business_question: string;
            parameter_overrides: Record<string, number>;
            shock_events: Array<{
                name: string;
                type: string;
                start_month: number;
                duration_months: number;
                affected_variable: string;
                impact_magnitude: number;
            }>;
        } | null;
    } | null;
    reasoning: string;
    error?: string;
}

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    response?: AIResponse;
    timestamp: Date;
}

export class MistralService {
    private proxyUrl: string;

    constructor(proxyUrl: string = PROXY_URL) {
        this.proxyUrl = proxyUrl;
    }

    /**
     * Check if the API proxy is running and has an API key configured
     */
    async checkHealth(): Promise<{ status: string; hasApiKey: boolean }> {
        try {
            const response = await fetch(`${this.proxyUrl}/health`);
            if (!response.ok) {
                throw new Error('Proxy server not responding');
            }
            return await response.json();
        } catch (error) {
            return { status: 'error', hasApiKey: false };
        }
    }

    /**
     * Send a message to the AI and get a response
     */
    async chat(
        userMessage: string,
        currentConfig: ModelConfig,
        simulationResults?: SimulationResults
    ): Promise<AIResponse> {
        try {
            const response = await fetch(`${this.proxyUrl}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    systemPrompt: SYSTEM_PROMPT,
                    userMessage,
                    currentConfig,
                    simulationResults,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                return {
                    explanation: `Error: ${error.error || 'Failed to get AI response'}`,
                    confidence: 0,
                    changes: null,
                    reasoning: error.details || '',
                    error: error.error,
                };
            }

            const data = await response.json();

            // Validate the response structure
            return this.validateResponse(data);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                explanation: `Connection error: ${errorMessage}. Make sure the AI proxy server is running on ${this.proxyUrl}`,
                confidence: 0,
                changes: null,
                reasoning: '',
                error: errorMessage,
            };
        }
    }

    /**
     * Validate and sanitize AI response
     */
    private validateResponse(data: unknown): AIResponse {
        const response = data as AIResponse;

        // Ensure required fields exist
        return {
            explanation: response.explanation || 'No explanation provided',
            confidence: typeof response.confidence === 'number'
                ? Math.max(0, Math.min(1, response.confidence))
                : 0.5,
            changes: this.validateChanges(response.changes),
            reasoning: response.reasoning || '',
        };
    }

    /**
     * Validate parameter changes are within acceptable ranges
     */
    private validateChanges(changes: AIResponse['changes']): AIResponse['changes'] {
        if (!changes) return null;

        const validRanges: Record<string, { min: number; max: number }> = {
            semiconductor_reliability: { min: 50, max: 100 },
            battery_reliability: { min: 70, max: 100 },
            regionalization_rate: { min: 0, max: 20 },
            sdv_semiconductor_multiplier: { min: 1.2, max: 3.0 },
            resilience_investment_percentage: { min: 0, max: 15 },
            market_share_sensitivity: { min: 1, max: 25 },
            service_level_target: { min: 80, max: 99 },
            production_learning_rate: { min: 0, max: 15 },
            backlog_clearance_rate: { min: 5, max: 30 },
            industry_growth_rate: { min: 0, max: 20 },
        };

        if (changes.parameters) {
            const validatedParams: Record<string, number> = {};

            for (const [key, value] of Object.entries(changes.parameters)) {
                if (validRanges[key]) {
                    // Clamp to valid range
                    validatedParams[key] = Math.max(
                        validRanges[key].min,
                        Math.min(validRanges[key].max, value)
                    );
                } else {
                    // Allow unknown parameters (might be valid)
                    validatedParams[key] = value;
                }
            }

            changes.parameters = validatedParams;
        }

        return changes;
    }

    /**
     * Apply AI-suggested changes to a configuration
     */
    applyChangesToConfig(
        config: ModelConfig,
        changes: AIResponse['changes']
    ): ModelConfig {
        if (!changes || !changes.parameters) {
            return config;
        }

        // Deep clone the config
        const newConfig = JSON.parse(JSON.stringify(config)) as ModelConfig;

        // Apply parameter changes
        for (const [paramName, newValue] of Object.entries(changes.parameters)) {
            // Search through all parameter categories
            for (const category of Object.values(newConfig.parameters)) {
                if (paramName in category) {
                    category[paramName].value = newValue;
                    break;
                }
            }
        }

        return newConfig;
    }
}

// Export singleton instance
export const mistralService = new MistralService();
