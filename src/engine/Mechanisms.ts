/**
 * Mechanisms - Strategy Pattern Implementation for Calculation Functions
 * 
 * This module implements pluggable mechanisms for different aspects of the simulation.
 * Following the professor's guidance: "Separate the systematic from the judgment calls."
 * 
 * Mechanisms handle: HOW calculations are done (systematic)
 * Configuration handles: WHAT values to use (judgment calls)
 */

import type { ProductionParams, ProductionMechanismFunction } from './types';

export class Mechanisms {
    private productionMechanisms: Map<string, ProductionMechanismFunction>;

    constructor() {
        this.productionMechanisms = new Map();
        this.registerProductionMechanisms();
    }

    /**
     * Register all available production mechanisms
     * New mechanisms can be added here easily - just add a new entry
     */
    private registerProductionMechanisms(): void {
        // Supply-constrained production (default)
        // This is the main mechanism that considers supply chain constraints
        this.productionMechanisms.set('supply_constrained_production', (params: ProductionParams): number => {
            // SDVs require more semiconductors per unit
            const effectiveSemiconductor = params.semiconductorAvail / params.sdvMultiplier;

            // Production is constrained by the minimum of available supplies
            const supplyConstraint = Math.min(effectiveSemiconductor, params.batteryAvail);

            // Apply learning curve benefits
            const effectiveCapacity = params.capacity * params.learningFactor;

            // Backlog pressure can push production up to 150% (overtime)
            const backlogPressure = Math.min(
                params.backlog * 0.2,
                params.capacity * 0.3 // Max 30% increase from backlog pressure
            );

            // Target production is demand + backlog reduction, capped by overtime limit
            const maxOvertimeFactor = 1.5;
            const target = Math.min(
                params.customerOrders + backlogPressure,
                effectiveCapacity * maxOvertimeFactor
            );

            // Final production is target constrained by supply availability
            return target * supplyConstraint;
        });

        // Unconstrained production (for comparison/testing)
        // Shows what production would be without supply constraints
        this.productionMechanisms.set('unconstrained_production', (params: ProductionParams): number => {
            return params.capacity * params.learningFactor;
        });

        // Demand-driven production
        // Production matches demand exactly (if capacity allows)
        this.productionMechanisms.set('demand_driven_production', (params: ProductionParams): number => {
            const effectiveCapacity = params.capacity * params.learningFactor;
            return Math.min(params.customerOrders, effectiveCapacity);
        });

        // Conservative production
        // Produces at 80% capacity to maintain buffer
        this.productionMechanisms.set('conservative_production', (params: ProductionParams): number => {
            const effectiveCapacity = params.capacity * params.learningFactor;
            const effectiveSemiconductor = params.semiconductorAvail / params.sdvMultiplier;
            const supplyConstraint = Math.min(effectiveSemiconductor, params.batteryAvail);
            return effectiveCapacity * 0.8 * supplyConstraint;
        });

        // Production with fatigue (example of AI-suggested mechanism)
        // If backlog > 2x orders, production efficiency drops 20%
        this.productionMechanisms.set('production_with_fatigue', (params: ProductionParams): number => {
            let fatigueFactor = 1.0;

            if (params.backlog > 2 * params.customerOrders) {
                fatigueFactor = 0.8; // 20% efficiency drop
            }

            const effectiveSemiconductor = params.semiconductorAvail / params.sdvMultiplier;
            const supplyConstraint = Math.min(effectiveSemiconductor, params.batteryAvail);

            return params.capacity * fatigueFactor * supplyConstraint * params.learningFactor;
        });
    }

    /**
     * Get a production mechanism by name
     * Throws an error if mechanism doesn't exist - fail fast for debugging
     */
    getProductionMechanism(name: string): ProductionMechanismFunction {
        const mechanism = this.productionMechanisms.get(name);
        if (!mechanism) {
            throw new Error(`Unknown production mechanism: ${name}. Available: ${this.listProductionMechanisms().join(', ')}`);
        }
        return mechanism;
    }

    /**
     * List all available production mechanisms
     * Useful for UI dropdowns and documentation
     */
    listProductionMechanisms(): string[] {
        return Array.from(this.productionMechanisms.keys());
    }

    /**
     * Check if a mechanism exists
     */
    hasProductionMechanism(name: string): boolean {
        return this.productionMechanisms.has(name);
    }

    /**
     * Add a new mechanism dynamically
     * This allows AI-generated mechanisms to be added at runtime
     */
    addProductionMechanism(name: string, mechanism: ProductionMechanismFunction): void {
        if (this.productionMechanisms.has(name)) {
            console.warn(`Overwriting existing mechanism: ${name}`);
        }
        this.productionMechanisms.set(name, mechanism);
    }
}

// Export singleton instance
export const mechanisms = new Mechanisms();
