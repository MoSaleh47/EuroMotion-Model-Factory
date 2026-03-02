# 🏭 EuroMotion Model Factory - Complete Guide

## Table of Contents
1. [What is This Project?](#what-is-this-project)
2. [System Dynamics 101](#system-dynamics-101)
3. [The EuroMotion Business Context](#the-euromotion-business-context)
4. [Core Concepts: Stocks, Flows, and Feedback Loops](#core-concepts)
5. [The Mathematical Model](#the-mathematical-model)
6. [All Parameters Explained](#all-parameters-explained)
7. [Scenarios: Testing "What If?"](#scenarios)
8. [How the Simulation Engine Works](#simulation-engine)
9. [Code Architecture](#code-architecture)
10. [Practical Examples](#practical-examples)

---

## 1. What is This Project? {#what-is-this-project}

### The Big Picture

**EuroMotion Model Factory** is a **System Dynamics simulation tool** that models a fictional European electric vehicle (EV) manufacturer's supply chain. It helps answer strategic questions like:

- *"What happens to our market share if there's a semiconductor shortage?"*
- *"How much should we invest in regional suppliers to reduce risk?"*
- *"If we increase production capacity, what's the long-term impact on revenue?"*

### Why Does This Matter?

In the real world, companies like Tesla, Volkswagen, and BMW face exactly these challenges. During the 2021 chip shortage, automakers lost **billions of dollars** because they couldn't predict how supply disruptions would cascade through their systems.

This simulation allows decision-makers to:
1. **Explore scenarios** before they happen
2. **Understand feedback loops** that amplify or dampen effects
3. **Test policies** without real-world consequences

---

## 2. System Dynamics 101 {#system-dynamics-101}

### What is System Dynamics?

System Dynamics is a methodology for studying and managing complex systems. It was invented at MIT in the 1950s by Jay Forrester.

> **Key Insight**: In complex systems, effects often loop back to become causes. These "feedback loops" create behaviors that are hard to predict intuitively.

### The Building Blocks

```
┌─────────────────────────────────────────────────────────────────┐
│                     SYSTEM DYNAMICS 101                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────┐        FLOW           ┌─────────┐                │
│   │  STOCK  │ ←───────────────────→ │  STOCK  │                │
│   │ (Level) │    (Rate of change)   │ (Level) │                │
│   └─────────┘                       └─────────┘                │
│       │                                  │                      │
│       └──────────── FEEDBACK ───────────┘                      │
│                                                                 │
│   STOCKS = Things that accumulate (inventory, money, trust)    │
│   FLOWS  = Rates of change (production rate, spending rate)    │
│   FEEDBACK = How outputs become inputs                          │
└─────────────────────────────────────────────────────────────────┘
```

### Two Types of Feedback Loops

#### 🔴 Reinforcing Loops (R) - "Snowball Effect"
These loops amplify change. More leads to even more (or less leads to even less).

**Example**: The "Success breeds Success" loop
```
Higher Revenue → More Investment → Better Production → Higher Sales → Higher Revenue
     ↑                                                                    │
     └────────────────────────────────────────────────────────────────────┘
```

#### 🟢 Balancing Loops (B) - "Correction Effect"  
These loops resist change and push toward equilibrium.

**Example**: The "Backlog Correction" loop
```
High Backlog → Increased Production → Orders Fulfilled → Lower Backlog
      ↑                                                        │
      └────────────────────────────────────────────────────────┘
```

---

## 3. The EuroMotion Business Context {#the-euromotion-business-context}

### Company Profile

| Attribute | Value |
|-----------|-------|
| **Name** | EuroMotion (fictional) |
| **Industry** | Electric Vehicles (EV) |
| **Specialization** | Software-Defined Vehicles (SDV) |
| **Location** | Europe |
| **Challenge** | Supply chain resilience |

### The Strategic Problem

EuroMotion faces a critical dilemma:

1. **Semiconductor Dependency**: SDVs require 3x more chips than traditional EVs
2. **Geopolitical Risk**: 70%+ of semiconductors come from Asia
3. **Market Pressure**: Customers expect fast delivery; delays kill market share
4. **Investment Trade-off**: Should they invest in regional suppliers (safer but expensive) or rely on cheaper Asian suppliers?

### Business Questions This Model Answers

| Question | What the Model Shows |
|----------|---------------------|
| "What if semiconductors become 50% less available?" | Run the `crisis_semiconductor` scenario |
| "Should we invest more in regional suppliers?" | Adjust `regionalization_rate` and `resilience_investment_percentage` |
| "How does market share respond to delivery problems?" | Observe the R1 loop (Revenue → Investment → Capacity → Delivery → Market Share) |

---

## 4. Core Concepts: Stocks, Flows, and Feedback Loops {#core-concepts}

### The 6 Stocks (Things That Accumulate)

| Stock | Initial Value | Unit | What It Represents |
|-------|---------------|------|-------------------|
| **Production Capacity** | 10,000 | units/month | Maximum possible production |
| **Inventory** | 20,000 | units | Finished vehicles ready for delivery |
| **Backlog** | 0 | units | Unfulfilled customer orders |
| **Market Share** | 50 | % | EuroMotion's share of the EV market |
| **Supply Chain Visibility** | 40 | % | How well we can see/predict supply issues |
| **Regional Supply %** | 10 | % | Portion of supplies from European sources |

### The 4 Key Flows (Rates of Change)

| Flow | Formula (Simplified) | What Changes It |
|------|---------------------|-----------------|
| **Production Rate** | `Capacity × Supply_Constraint × Learning` | Semiconductor availability, capacity |
| **Delivery Rate** | `min(Production + Inventory, Orders + Backlog)` | What we can ship vs. what customers want |
| **Customer Orders** | `Base_Demand × (Market_Share / 50)` | Market share, industry growth |
| **Capacity Expansion** | `Investment / Cost_Per_Unit - Depreciation` | Revenue investment, aging equipment |

### The 4 Feedback Loops

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        FEEDBACK LOOPS OVERVIEW                              │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ R1: MARKET GROWTH (Reinforcing)                                      │  │
│  │ Revenue → Investment → Capacity → Production → Delivery → Market    │  │
│  │    ↑                                                        Share   │  │
│  │    └──────────────────────── Revenue ←─────────────────────────┘   │  │
│  │ "Success breeds success"                                            │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ R2: SUPPLY CHAIN RESILIENCE (Reinforcing)                           │  │
│  │ Regional Supply % → Semiconductor Availability → Production →       │  │
│  │    ↑                                              Revenue          │  │
│  │    └──────────────────── Investment in Regionalization ←───────────┘  │
│  │ "Resilience investment pays off during crises"                      │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ B1: BACKLOG CORRECTION (Balancing)                                  │  │
│  │ High Backlog → Production Pressure → Higher Production →            │  │
│  │    ↑                                      Lower Backlog             │  │
│  │    └───────────────────────────────────────────┘                    │  │
│  │ "We work harder when behind"                                        │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ B2: MARKET SATURATION (Balancing)                                   │  │
│  │ High Market Share → Harder to Grow → Equilibrium                    │  │
│  │ "You can't have 100% market share"                                  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. The Mathematical Model {#the-mathematical-model}

### The Core Equation: Euler Integration

All stocks update using this fundamental equation:

```
Stock[t+1] = Stock[t] + Flow[t] × dt
```

Where:
- `Stock[t]` = Current value
- `Flow[t]` = Rate of change at time t
- `dt` = Time step (1 month in our model)

### Production Rate Formula

This is the heart of the model:

```javascript
production_rate = target × supply_constraint

Where:
  target = min(
    customer_orders + backlog_pressure,
    effective_capacity × 1.5  // Max 150% for overtime
  )
  
  supply_constraint = min(
    semiconductor_availability / sdv_multiplier,
    battery_availability
  )
  
  effective_capacity = production_capacity × learning_factor
  
  backlog_pressure = min(backlog × 0.2, capacity × 0.3)
```

**In plain English**: We try to produce enough to meet demand (plus reduce backlog), but we're limited by:
1. Our capacity (can't exceed 150% even with overtime)
2. Semiconductor availability (SDVs need more chips!)
3. Battery availability

### Market Share Formula

```javascript
market_share_change = (delivery_performance - service_target) 
                      × sensitivity 
                      × reputation_factor

Where:
  delivery_performance = delivery_rate / customer_orders
  service_target = 0.95 (95% is our target)
  reputation_factor = 1 / (1 + backlog/orders)  // Backlog hurts reputation
```

**In plain English**: If we deliver more than 95% of orders on time, market share grows. If we deliver less, it shrinks. Having a big backlog makes customers trust us less.

### Semiconductor Availability (with Regional Mix)

```javascript
semiconductor_availability = 
  (1 - regional_pct/100) × asia_supply × shock_factor
  + (regional_pct/100) × 0.95  // Regional is 95% reliable

Where:
  asia_supply = baseline_reliability × shock_factor
  shock_factor = 1.0 normally, drops during crisis scenarios
```

**In plain English**: Our chip supply is a blend of Asian and European sources. Asian is cheaper but riskier (affected by shocks). European is more reliable but more expensive.

---

## 6. All Parameters Explained {#all-parameters-explained}

### Supply Chain Parameters

| Parameter | Default | Range | What It Controls |
|-----------|---------|-------|------------------|
| `semiconductor_reliability` | 90% | 50-100% | Base reliability of Asian semiconductor supply |
| `battery_reliability` | 95% | 70-100% | Battery supply reliability |
| `regionalization_rate` | 5%/year | 0-20% | How fast we shift to European suppliers |
| `sdv_semiconductor_multiplier` | 1.8x | 1.2-3.0x | How many more chips SDVs need vs. traditional EVs |
| `supply_visibility_improvement_rate` | 10%/year | 0-30% | How fast we improve forecasting |

### Strategic Parameters

| Parameter | Default | Range | What It Controls |
|-----------|---------|-------|------------------|
| `resilience_investment_percentage` | 5% | 0-15% | % of revenue invested in supply chain resilience |
| `market_share_sensitivity` | 10 | 1-25 | How sensitive market share is to delivery performance |
| `service_level_target` | 95% | 80-99% | Our delivery target (% of orders on time) |

### Technical Parameters

| Parameter | Default | Range | What It Controls |
|-----------|---------|-------|------------------|
| `production_learning_rate` | 5%/year | 0-15% | How much we improve efficiency each year |
| `backlog_clearance_rate` | 10%/month | 5-30% | How fast we naturally clear backlog |
| `capacity_utilization_target` | 80% | 60-95% | Target utilization (leaving buffer for demand spikes) |

### Market Parameters

| Parameter | Default | Range | What It Controls |
|-----------|---------|-------|------------------|
| `industry_growth_rate` | 8%/year | 0-20% | EV market growth rate |
| `price_per_unit` | €35,000 | - | Average vehicle price |
| `market_share_initial` | 50% | 30-70% | Starting market share |

---

## 7. Scenarios: Testing "What If?" {#scenarios}

### Built-in Scenarios

#### 1. Baseline (Default)
**What it tests**: Normal operations, no disruptions
- All parameters at default values
- No shock events
- Shows stable growth path

#### 2. Semiconductor Crisis
**What it tests**: A 6-month supply disruption
- Shock event: 50% reduction in semiconductor availability
- Starts at month 12, lasts 6 months
- Models: 2021 chip shortage scenario

**Key observations**:
- Production drops immediately
- Backlog builds up
- Market share begins to erode
- Revenue impact is delayed but significant

#### 3. Aggressive Growth
**What it tests**: Heavy investment in resilience
- `resilience_investment_percentage`: 10% (2x baseline)
- `regionalization_rate`: 10% (2x baseline)
- Shows: Trade-off between short-term costs and long-term stability

### Creating Your Own Scenario

Scenarios are JSON files in `public/config/scenarios/`:

```json
{
  "scenario_name": "my_scenario",
  "description": "Testing a specific hypothesis",
  "business_question": "What if we invest heavily in batteries?",
  "parameter_overrides": {
    "battery_reliability": 99,
    "resilience_investment_percentage": 8
  },
  "shock_events": []
}
```

---

## 8. How the Simulation Engine Works {#simulation-engine}

### Step-by-Step Simulation Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SIMULATION LOOP (each month)                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Month 0 ─→ Month 1 ─→ Month 2 ─→ ... ─→ Month 60                  │
│     │                                                               │
│     ▼                                                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ STEP 1: Calculate Auxiliary Variables                        │   │
│  │  • Semiconductor availability (with shock effects)           │   │
│  │  • Battery availability                                      │   │
│  │  • Learning factor (efficiency improvement)                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│     │                                                               │
│     ▼                                                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ STEP 2: Calculate Flows (Production, Delivery)               │   │
│  │  • Apply production mechanism (supply_constrained_production)│   │
│  │  • Calculate delivery rate                                   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│     │                                                               │
│     ▼                                                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ STEP 3: EULER INTEGRATION - Update Stocks                    │   │
│  │  • Inventory += (production - deliveries) × dt               │   │
│  │  • Backlog += (unmet_demand - clearance) × dt               │   │
│  │  • Market_Share += (performance_gap × sensitivity) × dt      │   │
│  │  • Capacity += (expansion - depreciation) × dt               │   │
│  │  • ... (all other stocks)                                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│     │                                                               │
│     ▼                                                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ STEP 4: Apply Constraints                                    │   │
│  │  • Market share: 10% ≤ value ≤ 90%                          │   │
│  │  • Inventory: 0 ≤ value ≤ 6 × capacity                      │   │
│  │  • Capacity: 50% initial ≤ value ≤ 300% initial             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Repeat for each month...                                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### The Mechanisms Pattern

The engine uses the **Strategy Pattern** for pluggable calculation functions:

```typescript
// Different production strategies
mechanisms.set('supply_constrained_production', (params) => {
  // Default: Production limited by supply availability
  return target * supplyConstraint;
});

mechanisms.set('demand_driven_production', (params) => {
  // Alternative: Just match demand (if possible)
  return Math.min(demand, capacity);
});
```

This allows experimenting with different operational strategies without changing the core engine.

---

## 9. Code Architecture {#code-architecture}

### Project Structure

```
euromotion-model-factory/
├── public/config/              # All configuration (JSON)
│   ├── model_config.json       # Main model definition
│   ├── simulation_config.json  # Simulation settings
│   └── scenarios/              # Scenario files
│
├── src/
│   ├── engine/                 # Core simulation logic
│   │   ├── types.ts            # TypeScript interfaces
│   │   ├── ConfigLoader.ts     # JSON loading & validation
│   │   ├── Mechanisms.ts       # Pluggable calculation strategies
│   │   └── SimulationEngine.ts # Main simulation loop
│   │
│   ├── components/             # React UI
│   │   ├── Sidebar/            # Control panel
│   │   └── Visualizations/     # Charts & diagrams
│   │       ├── FeedbackLoopDiagram.tsx
│   │       ├── TimeSeriesCharts.tsx
│   │       └── MetricsCards.tsx
│   │
│   └── App.tsx                 # Main application
│
└── docs/                       # Documentation
```

### Data Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   JSON       │     │   Engine     │     │   React      │
│   Config     │ ──▶ │   Runs       │ ──▶ │   Displays   │
│              │     │   Simulation │     │   Results    │
└──────────────┘     └──────────────┘     └──────────────┘
      ▲                                          │
      └──────────────── User Adjusts ────────────┘
```

---

## 10. Practical Examples {#practical-examples}

### Example 1: Understanding the Chip Shortage Impact

**Scenario**: Semiconductor availability drops by 50% for 6 months

**What happens step by step**:

| Month | Semiconductor Avail. | Production | Backlog | Market Share |
|-------|---------------------|------------|---------|--------------|
| 11 | 90% | 9,500 | 200 | 51.2% |
| 12 | 45% (shock starts) | 4,800 | 2,400 | 50.8% |
| 13 | 45% | 4,900 | 4,500 | 49.1% |
| 14 | 45% | 5,000 | 6,200 | 47.2% |
| 15 | 45% | 5,100 | 7,600 | 45.0% |
| 16 | 45% | 5,200 | 8,800 | 42.8% |
| 17 | 45% | 5,300 | 9,700 | 40.5% |
| 18 | 90% (shock ends) | 9,200 | 8,100 | 39.2% |
| 24 | 90% | 9,800 | 1,200 | 42.5% |
| 36 | 90% | 10,200 | 0 | 48.3% |

**Key insight**: Market share drops significantly during the crisis AND takes a long time to recover because of the reinforcing loop (lower share → lower revenue → less investment → slower recovery).

### Example 2: The Value of Regionalization

**Comparison**: Baseline vs. Aggressive Regionalization

| Metric | Baseline | Aggressive |
|--------|----------|------------|
| Regional supply at month 60 | 15% | 60% |
| Impact of 6-month crisis | -12% market share | -4% market share |
| Cumulative revenue (60 months) | €2.1B | €2.4B |

**Key insight**: Higher upfront investment in regionalization pays off significantly during crises.

### Example 3: Reading the Feedback Loop Diagram

When you hover over an edge in the diagram, you see:

**Example**: Revenue → Investment_Resilience
- **Polarity**: + (positive)
- **Formula**: `revenue × resilience_investment_percentage`
- **Meaning**: When revenue increases, investment also increases (same direction)

**Example**: Backlog → Market_Share  
- **Polarity**: - (negative)
- **Formula**: `1 / (1 + backlog/orders)`
- **Meaning**: When backlog increases, market share decreases (opposite direction)

---

## Quick Reference Card

### Key Formulas

| Variable | Formula |
|----------|---------|
| Production Rate | `min(demand + backlog_pressure, capacity × 1.5) × supply_constraint` |
| Supply Constraint | `min(semiconductor_avail / 1.8, battery_avail)` |
| Market Share Change | `(delivery_perf - 0.95) × sensitivity × reputation` |
| Capacity Change | `investment / cost_per_unit - depreciation` |

### Color Coding in Diagram

| Color | Meaning |
|-------|---------|
| 🟢 Green arrows | Positive polarity (+): Same direction |
| 🔴 Red arrows | Negative polarity (−): Opposite direction |
| White circles | Polarity indicators on edges |

### Scenario Quick Guide

| Scenario | What to Observe |
|----------|-----------------|
| Baseline | Stable growth path, no disruptions |
| Semiconductor Crisis | Supply shock impact, recovery time |
| Aggressive Growth | Trade-off: cost vs. resilience |

---

## Conclusion

This model demonstrates how System Dynamics thinking can help business leaders:

1. **See the big picture** - Understanding how different parts of the system connect
2. **Think long-term** - Seeing how today's decisions affect future outcomes
3. **Prepare for uncertainty** - Testing scenarios before they happen
4. **Make better investments** - Understanding the true value of resilience

The EuroMotion Model Factory is a learning tool that brings these concepts to life through interactive simulation.

---

*Created for the Industrial AI course - PGE 5*
