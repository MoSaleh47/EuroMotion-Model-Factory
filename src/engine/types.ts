// TypeScript interfaces for the EuroMotion Model Factory

// ================================
// Stock Configuration
// ================================
export interface Stock {
    initial_value?: number;
    initial_value_multiplier?: number;
    depends_on?: string;
    unit: string;
    description: string;
    min_bound?: number;
    max_bound?: number;
    max_bound_multiplier?: number;
}

// ================================
// Flow Configuration
// ================================
export interface Flow {
    initial_value?: number;
    unit?: string;
    growth_rate?: number;
    mechanism?: string;
    formula?: string;  // Editable formula for visual model editor
    description: string;
    parameters?: Record<string, number>;
}

// ================================
// Parameter Configuration
// ================================
export interface Parameter {
    value: number;
    unit: string;
    min?: number;
    max?: number;
    description: string;
}

// ================================
// Feedback Loop Configuration
// ================================
export interface FeedbackEdge {
    from: string;
    to: string;
    formula: string;
    polarity: '+' | '-';
}

export interface FeedbackLoop {
    name: string;
    type: 'reinforcing' | 'balancing';
    polarity: 'positive' | 'negative';
    nodes: string[];
    edges: FeedbackEdge[];
    description: string;
}

// ================================
// Model Configuration (Main)
// ================================
export interface ModelConfig {
    metadata: {
        model_name: string;
        version: string;
        description: string;
        author: string;
        date_created: string;
    };
    stocks: Record<string, Stock>;
    flows: Record<string, Flow>;
    parameters: Record<string, Record<string, Parameter>>;
    constraints: Record<string, {
        min_ratio_of_initial?: number;
        max_ratio_of_initial?: number;
        max_bound_multiplier?: number;
    }>;
    feedback_loops: Record<string, FeedbackLoop>;
    layout?: Record<string, { x: number; y: number }>; // Node positions
    market_share_mechanism: string;
    regionalization_mechanism: string;
}

// ================================
// Simulation Configuration
// ================================
export interface SimulationConfig {
    time: {
        duration_months: number;
        time_step: number;
        integration_method: string;
    };
    output: {
        variables: string[];
        sampling_interval: number;
    };
    shock_scenarios: {
        enabled: boolean;
        events: ShockEvent[];
    };
    validation: {
        check_mass_balance: boolean;
        detect_divergence: boolean;
        divergence_threshold: number;
    };
}

// ================================
// Shock Event
// ================================
export interface ShockEvent {
    name: string;
    type: string;
    start_month: number;
    duration_months: number;
    affected_variable: string;
    impact_type: string;
    impact_magnitude: number;
    rationale: string;
}

// ================================
// Scenario
// ================================
export interface Scenario {
    scenario_name: string;
    description: string;
    business_question: string;
    parameter_overrides: Record<string, number>;
    shock_events: ShockEvent[];
}

// ================================
// Simulation Results
// ================================
export interface SimulationResults {
    time: number[];
    production_capacity: number[];
    inventory: number[];
    backlog: number[];
    market_share: number[];
    supply_chain_visibility: number[];
    regional_supply_percentage: number[];
    customer_orders: number[];
    production_rate: number[];
    delivery_rate: number[];
    revenue: number[];
    cumulative_revenue: number[];
    investment_resilience: number[];
    semiconductor_availability: number[];
    battery_availability: number[];
    learning_factor: number[];
}

// ================================
// Production Mechanism Parameters
// ================================
export interface ProductionParams {
    capacity: number;
    semiconductorAvail: number;
    batteryAvail: number;
    sdvMultiplier: number;
    learningFactor: number;
    backlog: number;
    customerOrders: number;
}

// Type for production mechanism functions
export type ProductionMechanismFunction = (params: ProductionParams) => number;
