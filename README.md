# EuroMotion Model Factory

A **System Dynamics Model Factory** web application for EV/SDV supply chain strategic planning, built with React + TypeScript.

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Version](https://img.shields.io/badge/version-2.0-blue)

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

## 📋 Project Overview

This application models **EuroMotion**, a fictional Tier-1 automotive supplier manufacturing EV/SDV components. It helps answer strategic questions like:

- *"What if semiconductor supply drops 50% for 12 months?"*
- *"Should we invest 15% of revenue in supply chain resilience?"*
- *"How does inventory policy affect market share over 5 years?"*

## ✨ Key Features

### 🔗 Interactive Feedback Loop Diagram
- Visual representation of all 4 feedback loops (R1, R2, B1, B2)
- **Hover over arrows** to see formulas, polarity, and loop names
- Draggable nodes for custom layouts

### 📊 Simulation Engine
- Euler integration with monthly time steps
- Shock event support (supply disruptions)
- Constraint enforcement

### ⚙️ JSON-Driven Configuration
- All model parameters in editable JSON files
- AI-integration ready (LLM-generatable)
- Scenario management

### 📈 Rich Visualizations
- Time series charts (Recharts)
- KPI metric cards
- CSV/JSON export

## 🏗️ Architecture

```
euromotion-model-factory/
├── public/config/           # JSON configuration files
│   ├── model_config.json    # Model structure & feedback loops
│   ├── simulation_config.json
│   └── scenarios/           # Scenario definitions
├── src/
│   ├── engine/              # Simulation core
│   │   ├── types.ts         # TypeScript interfaces
│   │   ├── ConfigLoader.ts  # JSON loading/validation
│   │   ├── Mechanisms.ts    # Strategy Pattern
│   │   └── SimulationEngine.ts
│   ├── components/          # React components
│   │   ├── Visualizations/  # Charts & diagrams
│   │   └── Sidebar/         # Controls
│   └── App.tsx              # Main application
└── docs/                    # Documentation
```

## 📖 Documentation

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - Technical architecture details
- [DESIGN_TRADEOFFS.md](docs/DESIGN_TRADEOFFS.md) - Design decisions explained

## 🎯 The 4 Feedback Loops

| Loop | Name | Type | Description |
|------|------|------|-------------|
| **R1** | Growth Engine | Reinforcing (+) | Revenue → Investment → Capacity → Market Share → Revenue |
| **R2** | Death Spiral | Reinforcing (-) | Supply disruption cascades into business collapse |
| **B1** | Inventory Buffer | Balancing | Safety stock dampens volatility |
| **B2** | Regionalization | Balancing | Reduces Asia dependency over time |

## 🛠️ Technology Stack

- **React 18** + TypeScript
- **React Flow** - Interactive diagram
- **Recharts** - Time series charts
- **Tailwind CSS** - Styling
- **Vite** - Build tool

## 👥 Team

Samir Adam MAHAMAT SALEH - Ibrahima THIOYE

---

*Built for Systems Thinking & Industrial AI course - February 2026*
