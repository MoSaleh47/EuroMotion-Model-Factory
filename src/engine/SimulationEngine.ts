/**
 * SimulationEngine - Core Simulation Engine with Euler Integration
 * 
 * This is the heart of the model factory. It implements:
 * - Euler integration: stock[t+1] = stock[t] + flow[t] × dt
 * - Monthly time step (dt = 1.0)
 * - Shock event handling
 * - Constraint enforcement
 * 
 * Design Decision (from DESIGN_TRADEOFFS.md):
 * We use Euler integration instead of Runge-Kutta because:
 * 1. Simpler to understand and explain to stakeholders
 * 2. Transparent: one line per stock update
 * 3. Sufficient accuracy at monthly time steps
 * 4. Easy to debug step-by-step
 */

import type { ModelConfig, SimulationConfig, SimulationResults, ProductionParams } from './types';
import { Mechanisms } from './Mechanisms';

export class SimulationEngine {
    private config: ModelConfig;
    private mechanisms: Mechanisms;

    constructor(config: ModelConfig) {
        this.config = config;
        this.mechanisms = new Mechanisms();
    }

    /**
     * Run the simulation and return results
     */
    simulate(simConfig: SimulationConfig): SimulationResults {
        const months = simConfig.time.duration_months;
        const dt = simConfig.time.time_step;
        const n = months + 1;

        // Initialize results arrays
        const results = this.initializeResults(n);

        // Store initial capacity for constraint calculations
        const initialCapacity = results.production_capacity[0];

        // Main simulation loop (Euler integration)
        for (let i = 0; i < n - 1; i++) {
            const t = i * dt;

            // ============================================
            // Step 1: Calculate auxiliary variables
            // ============================================

            // Semiconductor availability (affected by shocks)
            const semiconductorAvail = this.calculateSemiconductorAvailability(
                i, t, simConfig, results.regional_supply_percentage[i]
            );
            results.semiconductor_availability[i] = semiconductorAvail;

            // Battery availability
            const batteryAvail = this.calculateBatteryAvailability(i, t, simConfig);
            results.battery_availability[i] = batteryAvail;

            // Learning factor (production efficiency improves over time)
            const learningFactor = this.calculateLearningFactor(t);
            results.learning_factor[i] = learningFactor;

            // ============================================
            // Step 2: Calculate production rate (via mechanism)
            // ============================================
            const productionMechanism = this.mechanisms.getProductionMechanism(
                this.config.flows.production_rate.mechanism || 'supply_constrained_production'
            );

            const productionParams: ProductionParams = {
                capacity: results.production_capacity[i],
                semiconductorAvail,
                batteryAvail,
                sdvMultiplier: this.getParameter('sdv_semiconductor_multiplier'),
                learningFactor,
                backlog: results.backlog[i],
                customerOrders: results.customer_orders[i]
            };

            results.production_rate[i] = productionMechanism(productionParams);

            // ============================================
            // Step 3: Calculate delivery rate
            // ============================================
            // Deliveries come from production + inventory, but can't exceed orders
            results.delivery_rate[i] = Math.min(
                results.production_rate[i] + results.inventory[i],
                results.customer_orders[i] + results.backlog[i]
            );

            // ============================================
            // Step 4: EULER INTEGRATION - Update all stocks
            // ============================================

            // 4a. Inventory
            // Δinventory = production - deliveries
            const inventoryChange = results.production_rate[i] - results.delivery_rate[i];
            const maxInventory = results.production_capacity[i] *
                (this.config.stocks.inventory.max_bound_multiplier || 6.0);

            results.inventory[i + 1] = this.clip(
                results.inventory[i] + inventoryChange * dt,
                0,
                maxInventory
            );

            // 4b. Backlog
            // Δbacklog = unmet demand - clearance
            const unmetDemand = results.customer_orders[i] - results.delivery_rate[i];
            const backlogClearance = results.backlog[i] * this.getParameter('backlog_clearance_rate');

            results.backlog[i + 1] = Math.max(
                0,
                results.backlog[i] + (unmetDemand - backlogClearance) * dt
            );

            // 4c. Market Share
            // Based on delivery performance relative to service target
            const deliveryPerformance = results.delivery_rate[i] /
                Math.max(1, results.customer_orders[i]);
            const backlogRatio = results.backlog[i] / Math.max(1, results.customer_orders[i]);
            const serviceTarget = this.getParameter('service_level_target') / 100;
            const sensitivity = this.getParameter('market_share_sensitivity');

            // Reputation factor decreases as backlog grows
            const reputationFactor = 1 / (1 + backlogRatio);
            const marketShareChange = (deliveryPerformance - serviceTarget) * sensitivity * reputationFactor * dt;

            results.market_share[i + 1] = this.clip(
                results.market_share[i] + marketShareChange,
                this.config.stocks.market_share.min_bound || 10,
                this.config.stocks.market_share.max_bound || 90
            );

            // 4d. Customer Orders
            // Grow with industry growth rate, scaled by market share
            const industryGrowth = this.getParameter('industry_growth_rate');
            const baseDemand = 15000 * Math.pow(1 + industryGrowth, t);
            results.customer_orders[i + 1] = baseDemand * (results.market_share[i + 1] / 50);

            // 4e. Revenue
            results.revenue[i] = results.delivery_rate[i] * this.getParameter('price_per_unit');
            results.investment_resilience[i] = results.revenue[i] *
                (this.getParameter('resilience_investment_percentage') / 100);
            results.cumulative_revenue[i + 1] = results.cumulative_revenue[i] + results.revenue[i] * dt;

            // 4f. Supply Chain Visibility
            // Improves with investment
            const visibilityImprovement = results.investment_resilience[i] / 100000;
            results.supply_chain_visibility[i + 1] = Math.min(
                this.config.stocks.supply_chain_visibility.max_bound || 100,
                results.supply_chain_visibility[i] + visibilityImprovement * dt
            );

            // 4g. Regional Supply Percentage
            // Grows at configured rate
            const regionalChange = (this.getParameter('regionalization_rate') / 12) * dt;
            results.regional_supply_percentage[i + 1] = this.clip(
                results.regional_supply_percentage[i] + regionalChange,
                0,
                this.config.stocks.regional_supply_percentage.max_bound || 80
            );

            // 4h. Production Capacity
            // Changes based on investment (expansion) and depreciation
            const marketPressure = (results.market_share[i] / 50 - 1) *
                results.production_capacity[i] * 0.005;
            const capacityExpansion = results.investment_resilience[i] /
                (this.config.flows.capacity_expansion.parameters?.cost_per_unit_capacity || 5000);
            const depreciationRate = this.config.flows.capacity_expansion.parameters?.depreciation_rate_annual || 0.02;
            const depreciation = results.production_capacity[i] * (depreciationRate / 12);
            const capacityChange = (capacityExpansion - depreciation + marketPressure) * dt;

            const minCapacity = initialCapacity *
                (this.config.constraints.production_capacity?.min_ratio_of_initial || 0.5);
            const maxCapacity = initialCapacity *
                (this.config.constraints.production_capacity?.max_ratio_of_initial || 3.0);

            results.production_capacity[i + 1] = this.clip(
                results.production_capacity[i] + capacityChange,
                minCapacity,
                maxCapacity
            );
        }

        // Fill in final time step auxiliary variables
        this.fillFinalTimeStep(results, n - 1, simConfig);

        // Set time array
        for (let i = 0; i < n; i++) {
            results.time[i] = i;
        }

        return results;
    }

    /**
     * Initialize all result arrays with starting values
     */
    private initializeResults(n: number): SimulationResults {
        const createArray = (length: number, initialValue: number = 0): number[] => {
            return new Array(length).fill(initialValue);
        };

        // Get initial values from config
        const initialCapacity = this.config.stocks.production_capacity.initial_value || 10000;
        const initialInventory = this.config.stocks.inventory.initial_value_multiplier
            ? initialCapacity * this.config.stocks.inventory.initial_value_multiplier
            : 20000;

        const results: SimulationResults = {
            time: createArray(n),
            production_capacity: createArray(n, initialCapacity),
            inventory: createArray(n, initialInventory),
            backlog: createArray(n, this.config.stocks.backlog.initial_value || 0),
            market_share: createArray(n, this.config.stocks.market_share.initial_value || 50),
            supply_chain_visibility: createArray(n, this.config.stocks.supply_chain_visibility.initial_value || 40),
            regional_supply_percentage: createArray(n, this.config.stocks.regional_supply_percentage.initial_value || 10),
            customer_orders: createArray(n, this.config.flows.customer_orders.initial_value || 15000),
            production_rate: createArray(n),
            delivery_rate: createArray(n),
            revenue: createArray(n),
            cumulative_revenue: createArray(n),
            investment_resilience: createArray(n),
            semiconductor_availability: createArray(n),
            battery_availability: createArray(n),
            learning_factor: createArray(n, 1.0)
        };

        return results;
    }

    /**
     * Calculate semiconductor availability considering regional mix and shocks
     */
    private calculateSemiconductorAvailability(
        i: number,
        t: number,
        simConfig: SimulationConfig,
        regionalPct: number
    ): number {
        const baseReliability = this.getParameter('semiconductor_reliability') / 100;

        // Apply shock if active
        let shockFactor = 1.0;
        if (simConfig.shock_scenarios.enabled) {
            for (const event of simConfig.shock_scenarios.events) {
                if (event.affected_variable === 'semiconductor_reliability') {
                    const start = event.start_month;
                    const end = start + event.duration_months;
                    if (t >= start && t < end) {
                        shockFactor *= (100 - event.impact_magnitude) / 100;
                    }
                }
            }
        }

        // Blended availability: Asia (with shocks) + Regional (more reliable)
        const asiaSupply = baseReliability * shockFactor;
        const regionalSupply = 0.95; // Regional suppliers are 95% reliable

        const blended = (1 - regionalPct / 100) * asiaSupply + (regionalPct / 100) * regionalSupply;
        return Math.max(0, Math.min(1, blended));
    }

    /**
     * Calculate battery availability (simpler than semiconductors for now)
     */
    private calculateBatteryAvailability(
        i: number,
        t: number,
        simConfig: SimulationConfig
    ): number {
        let baseReliability = this.getParameter('battery_reliability') / 100;

        // Apply shock if active
        if (simConfig.shock_scenarios.enabled) {
            for (const event of simConfig.shock_scenarios.events) {
                if (event.affected_variable === 'battery_reliability') {
                    const start = event.start_month;
                    const end = start + event.duration_months;
                    if (t >= start && t < end) {
                        baseReliability *= (100 - event.impact_magnitude) / 100;
                    }
                }
            }
        }

        return baseReliability;
    }

    /**
     * Calculate learning factor (production efficiency improves over time)
     */
    private calculateLearningFactor(t: number): number {
        const learningRate = this.getParameter('production_learning_rate') / 100;
        // Convert from annual to monthly and compound
        const monthlyRate = Math.pow(1 + learningRate, 1 / 12) - 1;
        return Math.pow(1 + monthlyRate, t);
    }

    /**
     * Get parameter value from config
     */
    private getParameter(name: string): number {
        // Search through all parameter categories
        for (const category of Object.values(this.config.parameters)) {
            if (name in category) {
                return category[name].value;
            }
        }
        throw new Error(`Parameter ${name} not found in config`);
    }

    /**
     * Clip value to bounds
     */
    private clip(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, value));
    }

    /**
     * Fill in auxiliary variables for the final time step
     */
    private fillFinalTimeStep(results: SimulationResults, lastIndex: number, simConfig: SimulationConfig): void {
        const t = lastIndex;

        results.semiconductor_availability[lastIndex] = this.calculateSemiconductorAvailability(
            lastIndex, t, simConfig, results.regional_supply_percentage[lastIndex]
        );
        results.battery_availability[lastIndex] = this.calculateBatteryAvailability(lastIndex, t, simConfig);
        results.learning_factor[lastIndex] = this.calculateLearningFactor(t);
        results.production_rate[lastIndex] = results.production_rate[lastIndex - 1];
        results.delivery_rate[lastIndex] = results.delivery_rate[lastIndex - 1];
        results.revenue[lastIndex] = results.revenue[lastIndex - 1];
        results.investment_resilience[lastIndex] = results.investment_resilience[lastIndex - 1];
    }

    /**
     * Get the current configuration
     */
    getConfig(): ModelConfig {
        return this.config;
    }

    /**
     * Update config (for parameter changes)
     */
    updateConfig(config: ModelConfig): void {
        this.config = config;
    }
}
