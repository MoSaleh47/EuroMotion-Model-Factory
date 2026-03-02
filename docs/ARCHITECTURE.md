# EuroMotion Model Factory - Architecture Document

## Overview

This document describes the technical architecture of the EuroMotion Model Factory, a System Dynamics simulation platform for EV/SDV supply chain strategic planning.

## Core Design Principles

### 1. Model Factory, Not a Model
We build a **system that generates models**, not a single hardcoded model:
- All assumptions explicit in JSON configuration
- Reusable for multiple strategic questions
- Mechanisms are pluggable (Strategy Pattern)

### 2. Separation of Concerns
Following the professor's guidance: *"Separate the systematic from the judgment calls."*

| Human Decisions | Systematic Execution |
|-----------------|---------------------|
| Model boundary | Simulation engine |
| Parameter values | Numerical integration |
| Loop polarity | Visualization |
| What to model | How to compute |

### 3. JSON-Driven Configuration
*"Use structured data (JSON) to make AI integration deterministic."*

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Application                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐    ┌─────────────────────────────────────────┐ │
│  │   Sidebar   │    │              Main Content                │ │
│  │             │    │                                          │ │
│  │ • Scenarios │    │  ┌─────────────────────────────────────┐ │ │
│  │ • Sliders   │    │  │    FeedbackLoopDiagram (React Flow) │ │ │
│  │ • Controls  │    │  └─────────────────────────────────────┘ │ │
│  └─────────────┘    │  ┌─────────────────────────────────────┐ │ │
│                      │  │    TimeSeriesCharts (Recharts)      │ │ │
│                      │  └─────────────────────────────────────┘ │ │
│                      │  ┌─────────────────────────────────────┐ │ │
│                      │  │    MetricsCards                     │ │ │
│                      │  └─────────────────────────────────────┘ │ │
│                      └─────────────────────────────────────────┘ │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│                        Engine Layer                              │
│                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  ConfigLoader   │  │  Mechanisms     │  │ SimulationEngine│  │
│  │                 │  │  (Strategy)     │  │  (Euler)        │  │
│  │ • Load JSON     │  │                 │  │                 │  │
│  │ • Validate      │  │ • Production    │  │ • Main loop     │  │
│  │ • Merge         │  │ • Fatigue       │  │ • Constraints   │  │
│  │                 │  │ • Custom...     │  │ • Shocks        │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
│           │                     │                     │          │
│           └─────────────────────┴─────────────────────┘          │
│                               │                                   │
├──────────────────────────────┬┴──────────────────────────────────┤
│                        JSON Config                               │
│                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ model_config    │  │ simulation_cfg  │  │   scenarios/    │  │
│  │                 │  │                 │  │                 │  │
│  │ • stocks        │  │ • duration      │  │ • baseline      │  │
│  │ • flows         │  │ • time_step     │  │ • crisis        │  │
│  │ • parameters    │  │ • shocks        │  │ • aggressive    │  │
│  │ • feedback_loops│  │                 │  │                 │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
JSON Config ──► ConfigLoader ──► SimulationEngine ──► Results ──► Visualizations
                    │                    │
                    ▼                    ▼
               Validation          Mechanisms
                                  (Strategy Pattern)
```

## Key Components

### 1. SimulationEngine (Euler Integration)

```typescript
// Core integration step
stock[t+1] = stock[t] + flow[t] * dt
```

- **Time Step**: 1 month (dt = 1.0)
- **Integration Method**: Euler (forward difference)
- **Constraint Handling**: Min/max bounds enforced each step
- **Shock Events**: Applied during semiconductor availability calculation

### 2. Mechanisms (Strategy Pattern)

```typescript
interface ProductionMechanismFunction {
  (params: ProductionParams): number
}

// Registry of mechanisms
mechanisms.set('supply_constrained_production', (params) => {...});
mechanisms.set('production_with_fatigue', (params) => {...});
```

**Benefits**:
- Add new mechanisms without changing engine
- Compare different approaches
- AI can suggest new mechanisms

### 3. ConfigLoader

Responsibilities:
- Fetch and parse JSON files
- Validate structure (fail fast)
- Merge scenario overrides
- Extract flattened parameters

### 4. FeedbackLoopDiagram

Built with React Flow:
- Nodes = System variables (circular bubbles)
- Edges = Causal relationships with polarity
- Custom edge component with hover tooltips
- Color coding: Red (reinforcing), Teal (balancing)

## The System Dynamics Model

### 6 Stocks
| Stock | Initial Value | Unit |
|-------|--------------|------|
| production_capacity | 10,000 | units/month |
| inventory | 20,000 | units |
| backlog | 0 | units |
| market_share | 50 | percentage |
| supply_chain_visibility | 40 | score (0-100) |
| regional_supply_percentage | 10 | percentage |

### 4 Feedback Loops
| ID | Name | Type | Key Path |
|----|------|------|----------|
| R1 | Growth Engine | Reinforcing (+) | revenue → investment → capacity → market_share → revenue |
| R2 | Death Spiral | Reinforcing (-) | semiconductor → production → backlog → market_share → revenue |
| B1 | Inventory Buffer | Balancing | backlog → inventory → delivery → backlog |
| B2 | Regionalization | Balancing | semiconductor_avail → regional_% → semiconductor_avail |

## AI Integration

### Safe Integration Pattern

```
LLM generates JSON scenario
        │
        ▼
ConfigLoader validates structure
        │
        ▼
Merge with base config (no code execution)
        │
        ▼
Run simulation (deterministic)
        │
        ▼
Results
```

**Why JSON is safe**:
- No code execution
- Schema validation
- Unknown parameters are rejected
- Human reviews before production use

## Technology Choices

| Technology | Purpose | Rationale |
|------------|---------|-----------|
| React 18 | UI framework | Industry standard, component-based |
| TypeScript | Type safety | Catch errors early, self-documenting |
| React Flow | Diagram | Purpose-built for node-based UIs |
| Recharts | Charts | React-native, declarative |
| Tailwind CSS | Styling | Rapid development |
| Vite | Build tool | Fast HMR, modern ESM |

## File Structure

```
src/
├── engine/
│   ├── types.ts          # All TypeScript interfaces
│   ├── ConfigLoader.ts   # JSON loading & validation
│   ├── Mechanisms.ts     # Strategy Pattern for calculations
│   └── SimulationEngine.ts  # Core Euler integration
├── components/
│   ├── Visualizations/
│   │   ├── FeedbackLoopDiagram.tsx
│   │   ├── TimeSeriesCharts.tsx
│   │   └── MetricsCards.tsx
│   └── Sidebar/
│       └── index.tsx
└── App.tsx               # Main orchestrator
```

## Extensibility Points

1. **Add new stock**: Edit model_config.json, add to SimulationResults interface
2. **Add new mechanism**: Add function to Mechanisms.ts registry
3. **Add new scenario**: Create new JSON file in scenarios/
4. **Add new chart**: Create component, add to TimeSeriesCharts
