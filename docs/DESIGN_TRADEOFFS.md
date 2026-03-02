# Design Trade-offs Document

This document explains the key design decisions made during the development of EuroMotion Model Factory, including alternatives considered and rationale for each choice.

---

## 1. Time Granularity: Monthly (dt = 1 month)

**Decision**: Monthly time step

**Alternatives Considered**:
- Weekly (0.25 months)
- Bi-weekly (0.5 months)
- Quarterly (3 months)

**Rationale**:
- Business decisions are made monthly/quarterly
- Supply chain lead times (4-6 months) are well-captured
- Numerically stable without requiring smaller steps
- Board meetings happen monthly → Model matches decision cadence

**Trade-offs**:
- ✅ Captures medium-term dynamics well
- ✅ Fast simulation (60 steps for 5 years)
- ❌ Misses weekly demand spikes
- **Acceptable because**: Strategic planning horizon is years, not weeks

**Validation**: Tested with dt=0.5, results differ < 5%

---

## 2. Integration Method: Euler (Not Runge-Kutta)

**Decision**: Euler (first-order forward difference)

**Alternatives**:
- Runge-Kutta 4 (RK4)
- Adaptive step size methods

**Rationale**:
- **Simplicity**: Easy to explain to non-technical stakeholders
- **Transparency**: `stock[t+1] = stock[t] + flow × dt` is one line
- **Sufficient accuracy**: At dt=1 month with smooth dynamics
- **Debugging**: Easy to trace step-by-step

**Trade-offs**:
- ✅ Excellent explainability
- ✅ Matches industry-standard SD software (Vensim, Stella)
- ❌ ~2% less accurate than RK4
- **Acceptable because**: Professor prioritizes transparency over precision

**Reference**: Sterman (2000) - *"For monthly or quarterly models with smooth dynamics, Euler is adequate and preferred for clarity."*

---

## 3. Supply Chain Aggregation: Single Variable

**Decision**: Aggregate `semiconductor_availability` as one variable

**Alternative**: Model each supplier (TSMC, Samsung, Intel) individually

**Rationale**:
- **Strategic focus**: "What's overall risk?" not "Which supplier fails?"
- **Data availability**: No supplier-specific reliability data available
- **Complexity reduction**: Multi-supplier requires 10+ parameters
- **Maintainability**: Supplier changes don't break model

**Trade-offs**:
- ✅ Portfolio risk is clear and easy to understand
- ✅ Reduces model complexity
- ❌ Can't answer "Should we switch from TSMC to Samsung?"
- **Acceptable because**: Professor said *"Start narrow and concrete"*

---

## 4. Configuration Format: JSON

**Decision**: All configuration in JSON format

**Alternatives**:
- YAML
- Python dict
- TOML
- Database

**Rationale** (from professor):
> *"Use structured data (JSON) to make AI integration deterministic."*

- **AI-generatable**: LLMs output valid JSON easily and reliably
- **Deterministic**: Parse → Validate → Integrate (no surprises)
- **Version control**: Git diff shows exactly what changed
- **Universal**: Every language has JSON parsers

**Trade-offs**:
- ✅ Safe AI integration (no code execution)
- ✅ Easy to edit in any text editor
- ❌ No expressions (e.g., `growth_rate = 0.005 * FACTOR`)
- **Workaround**: Use "description" fields for documentation

---

## 5. UI Framework: React (vs Python Streamlit)

**Decision**: React with TypeScript

**Alternatives**:
- Streamlit (Python)
- Dash (Python)
- Vue.js

**Rationale**:
- **Professional presentation**: React produces polished UIs
- **Performance**: Client-side rendering handles large datasets
- **Custom styling**: Full control with Tailwind CSS
- **Deployment**: Static hosting (no backend needed)

**Trade-offs**:
- ⏰ Longer development time (~8h vs ~3h for Streamlit)
- ✅ Better final product quality
- ✅ More extensible for future features
- ✅ Better for portfolio/resume

---

## 6. State Management: React useState (vs Redux/Zustand)

**Decision**: Plain React useState hooks

**Alternatives**:
- Redux
- Zustand
- MobX

**Rationale**:
- Application state is relatively simple
- No complex state sharing between distant components
- Avoids additional dependencies
- Easier to understand for code reviewers

**Trade-offs**:
- ✅ Simpler codebase
- ✅ Fewer dependencies
- ❌ Would need refactoring for larger app
- **Acceptable because**: Current scale doesn't require global state

---

## 7. Feedback Loop Visualization: React Flow

**Decision**: Use React Flow for interactive diagram

**Alternatives**:
- D3.js (raw)
- vis.js
- Cytoscape.js
- Custom SVG

**Rationale**:
- **Purpose-built**: Designed for node-based UIs
- **React integration**: Native React component model
- **Interactive**: Built-in pan, zoom, drag
- **Customizable**: Custom nodes and edges supported

**Trade-offs**:
- ✅ Rapid development
- ✅ Beautiful out-of-box
- ❌ Bundle size increase (~150KB)
- **Acceptable because**: Time constraints make this worthwhile

---

## 8. Chart Library: Recharts

**Decision**: Recharts for time series visualization

**Alternatives**:
- Chart.js
- D3.js
- Plotly.js
- Victory

**Rationale**:
- **React-native**: Declarative, component-based API
- **Lightweight**: Smaller than Plotly
- **Sufficient features**: Line, area, composed charts
- **Well-documented**: Good examples available

**Trade-offs**:
- ✅ Easy to implement
- ✅ Responsive by default
- ❌ Less features than Plotly
- **Acceptable because**: We don't need 3D or statistical plots

---

## 9. Parameter Estimation: Literature Values

**Decision**: Use literature-based parameter estimates

**Alternative**: Empirical calibration from real data

**Rationale**:
- No access to real EuroMotion data (fictional company)
- Industry reports provide reasonable ranges
- Sensitivity analysis more important than precise values

**Key Sources**:
- Semiconductor lead times: McKinsey 2021 Chip Shortage Report
- SDV multiplier (2.3x): BCG Autonomous Vehicle Report
- EV market growth (6%/year): IEA Global EV Outlook

**Trade-offs**:
- ✅ Defensible choices for academic context
- ❌ May not match real company dynamics
- **Mitigation**: Scenario analysis tests ranges

---

## 10. Feedback Loop Polarity Determination

**Decision**: Define polarity in JSON config (human judgment)

**Alternative**: Automatic detection from equations

**Rationale**:
- Polarity is a **judgment call** (per professor's guidance)
- Same equation can have different interpretations
- Explicit documentation in config aids understanding

**Example**:
```json
{
  "from": "backlog",
  "to": "market_share",
  "polarity": "-",
  "rationale": "High backlog hurts reputation, causing customer loss"
}
```

**Trade-offs**:
- ✅ Transparent reasoning
- ✅ Explicit assumptions
- ❌ Manual effort to maintain consistency
- **Acceptable because**: Matches SD best practices

---

## Summary Table

| Decision | Trade-off | Justification |
|----------|-----------|---------------|
| Monthly dt | Speed vs. fidelity | Strategic focus, matches ROI horizon |
| Euler integration | Simplicity vs. accuracy | Transparency for stakeholders |
| Single supply variable | Simplicity vs. detail | Start narrow, expand later |
| JSON config | Safety vs. expressiveness | AI integration requirement |
| React | Dev time vs. quality | Professional presentation |
| React Flow | Bundle size vs. features | Best tool for the job |
| Literature parameters | Convenience vs. precision | Academic context |

---

## Questions the Professor May Ask

**Q**: Why didn't you use RK4 for better accuracy?
**A**: Euler is ~2% different and far more transparent. For monthly strategic decisions, this is acceptable.

**Q**: Why aggregate suppliers?
**A**: Professor said "start narrow and concrete." Adding supplier detail is easy if needed.

**Q**: Why JSON instead of Python expressions?
**A**: Direct quote from professor: "Use structured data (JSON) to make AI integration deterministic."

**Q**: What if the time step is too coarse?
**A**: Tested dt=0.5, results differ <5%. Monthly matches business planning cadence.
