# Demo Preparation Guide

## 10-Minute Demo Script

### Before the Demo (Preparation)
- [ ] Ensure `npm run dev` is running
- [ ] Open browser to http://localhost:5173
- [ ] Clear browser cache if needed
- [ ] Have backup screenshots ready

---

## Demo Flow (10 minutes)

### Opening (1 min)
"Welcome to EuroMotion Model Factory - a System Dynamics platform for EV/SDV supply chain strategic planning."

**Show**: Main interface with header and sidebar

---

### 1. Interactive Feedback Loops (2 min)

**Action**: Click on "Feedback Loops" tab (already active by default)

**Say**: "The heart of our model is 4 feedback loops - 2 reinforcing and 2 balancing."

**Action**: Hover over an arrow in the diagram

**Say**: "Notice how hovering shows the formula, polarity, and loop name. This is the transparency the professor asked for."

**Key Points**:
- R1 Growth Engine (positive reinforcing)
- R2 Death Spiral (negative reinforcing) 
- B1 Inventory Buffer (balancing)
- B2 Regionalization (balancing)

---

### 2. Run Baseline Simulation (2 min)

**Action**: Click "Run Simulation" button in sidebar

**Say**: "Let's run the baseline scenario - normal market conditions."

**Action**: When complete, show Results tab

**Say**: "We see total revenue, market share trend, and key metrics."

**Action**: Click "Time Series" tab

**Say**: "These charts show how stocks evolve over 60 months."

---

### 3. Crisis Scenario (2 min)

**Action**: Select "Crisis Semiconductor" from dropdown, click "Load Scenario"

**Say**: "Now let's simulate a 50% semiconductor shortage starting month 18, lasting 12 months - similar to the 2021 chip crisis."

**Action**: Click "Run Simulation"

**Action**: Show Time Series tab, point to supply chain chart

**Say**: "Look at semiconductor availability dropping at month 18. This triggers the Death Spiral loop - see how market share declines?"

---

### 4. Parameter Sensitivity (1.5 min)

**Action**: Expand "Strategic" parameters section

**Action**: Move resilience_investment slider to 15%

**Say**: "What if we invest more aggressively in resilience?"

**Action**: Run simulation again

**Say**: "Higher investment leads to faster regionalization, which buffers the crisis impact."

---

### 5. JSON Configuration & AI Integration (1 min)

**Action**: Click "Export" tab, download JSON config

**Say**: "All configuration is in JSON - this is critical for AI integration. An LLM can generate new scenarios that we validate and run."

**Action**: Show downloaded JSON briefly

**Say**: "The structured format makes this safe and deterministic."

---

### 6. Architecture Highlights (30 sec)

**Say**: 
- "Euler integration for transparency"
- "Strategy Pattern for pluggable mechanisms"
- "Clean separation: config is WHAT, code is HOW"

---

### Closing (30 sec)

**Say**: "Questions?"

**Be prepared to answer**:
- "How do I add a new stock?" → Edit JSON config
- "Can I change the production formula?" → Add new mechanism to Mechanisms.ts
- "Why Euler not RK4?" → Transparency > 2% accuracy difference

---

## Backup Plan

If live demo fails:
1. Show screenshots of each tab
2. Walk through code structure
3. Show JSON config file
4. Explain architecture diagram

## Key Talking Points

- **Not a model, a model FACTORY** - reusable for multiple questions
- **JSON-driven** - AI can generate scenarios safely
- **Interactive diagram** - transparency for non-technical stakeholders
- **Trade-offs documented** - every decision has rationale

## Files to Have Open
- `model_config.json` - show feedback_loops section
- `SimulationEngine.ts` - show Euler integration
- `Mechanisms.ts` - show Strategy Pattern
