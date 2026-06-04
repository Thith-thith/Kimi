# Kimi 🧪 — Premium Interactive Periodic Table & Virtual 2D Physics Lab

**Kimi** is a premium, state-of-the-art interactive chemistry educational application. Inspired by the open-source **[Zperiod](https://github.com/Zhilips/Zperiod)** project, **Kimi** takes the concept to the next level by re-engineering the codebase from scratch into a highly performant, type-safe monorepo built on a modern stack: **Next.js (App Router) + TypeScript + Bun + Hono**.

---

## 🗺️ Project Monorepo Structure

Kimi is organized as a monorepo utilizing **Bun Workspaces** for fast dependency management and execution:

```
kimi/
├── apps/
│   ├── web/               # Next.js 16 frontend app (React 19, TailwindCSS v4, Framer Motion)
│   └── api/               # Hono API backend running on Bun
├── packages/
│   ├── chemistry-engine/  # Pure TS calculations (Equation balancing, molar mass, reaction predictor)
│   └── data/              # Static periodic table elements (Levels 1-4) & ions dataset
├── translate_task.py      # Automated Google Translate helper script for Khmer localization
└── package.json           # Monorepo workspaces configuration
```

---

## 🔍 Deep Codebase Audit

We performed a deep audit of the Kimi codebase. Below is an analysis of its architecture, performance optimizations, and components:

### 1. Packages Layer (`/packages`)
* **`@kimi/data`**: 
  * Separates data definition from UI render loops.
  * Organizes chemistry details into a **4-Level pedagogical hierarchy** (Basic Level 1, Atomic Level 2, Properties Level 3, and History & Context Level 4) representing high school conventional details up to university-level interval notations.
  * Contains a comprehensive Ions database (`ions.ts`) categorized into monatomic and polyatomic cations and anions.
* **`@kimi/chemistry-engine`**:
  * **Equation Balancer (`balancer.ts`)**: Rather than relying on simple floats which cause rounding errors, it solves systems of linear chemical equations using a custom exact-fraction representation with arbitrary-precision `bigint`. It supports complex formulas, hydrate notations (e.g., `•5H2O`), and group brackets (e.g., `Ca(OH)2`).
  * **Molar Mass & Empirical Formula Solver (`molarMass.ts`)**: Deduces compound formulas and lists subtotal percentages step-by-step with a mathematical logic breakdown.
  * **Reaction Predictor (`predictor.ts`)**: Built with a rule-based engine mapping reaction classes: *Synthesis, Decomposition, Single Displacement (Activity Series comparison), Double Displacement (precipitation solubility checker), and Combustion*.

### 2. Frontend Layer (`/apps/web`)
* **Framework**: Runs on **Next.js 16** and **React 19** with **TailwindCSS v4**.
* **Visuals & 3D**:
  * Utilizes **Three.js** inside `AtomRenderer.tsx` to render a fully interactive 3D Bohr-like atom model showing orbiting shells, electron clouds, and a central nucleus.
  * Leverages **Framer Motion** for sleek transitions, sliding tab menus, modal fade-ins, and micro-interactions.
* **Physics & Virtual Lab (`VirtualLab.tsx`)**:
  * Employs **Matter.js** for rigid body collision boundaries (beaker, burner stand, heater knobs, dropped metal cubes).
  * Implements a **custom 2D particle fluid system** representing water (60+ active particles with customizable viscosity, surface alignment pulling, and tilt-pouring math).
  * **60fps Ref Performance Optimization**: The physics and canvas variables are stored inside React `useRef` hooks rather than state variables to bypass React's render loop lag, allowing smooth, buttery 60fps simulation on both desktop and mobile.
  * Simulates thermodynamics (Bunsen burner heat levels, beaker heat equilibrium, passive cooling, steam boiling, and evaporation rates).
* **Internationalization**: Runs on `next-intl` supporting **9 locales** (English, Persian, French, Khmer, Russian, Tagalog, Urdu, and Simplified/Traditional Chinese).

### 3. API Backend Layer (`/apps/api`)
* A lightweight **Hono** application running on Bun.
* Handles API request proxying for heavy chemical simulations (`/api/chem`), user suggestion dispatching to Discord webhooks (`/api/feedback`), and basic endpoint health monitoring.

---

## ⚡ Key Features

1. **Interactive Periodic Table Grid**: Visualizes elements 1–118. Features slider-driven range filters and color overlays for standard physical metrics (e.g., Electronegativity, Melting Point, Atomic Radius, Specific Heat).
2. **3D Atom Orbital Visualizer**: Select any element to view its electronic configuration in a live-orbiting 3D render.
3. **Ions Grid**: A detailed dictionary of monatomic and polyatomic cations/anions, highlighting oxidation states, hydration enthalpies, and coordination structures.
4. **Interactive Virtual Lab**: Drop alkali and alkaline earth metal blocks (Li, Na, K, Rb, Cs, Fr, Be, Mg, Ca, Sr, Ba, Ra) into a water beaker and watch physical reactions play out. The simulator handles exothermic heating, hydrogen gas bubble rendering, metal cube dissolution, and color changes (base formation) in real-time.
5. **Advanced Chemical Solvers**:
   * **Equation Balancer**: Instantly balances neutral formulas with step-by-step mathematical validation.
   * **Molar Mass Calculator**: Displays stoichiometric ratios, mass percentage breakdowns, and calculates empirical and molecular formulas based on input percentages.
   * **Solubility Checker**: Intersect cations and anions on a table matrix to identify precipitate formation rules.
6. **Worksheet & Quiz Client**: Interactive practice questions to help students test their balancing and reaction prediction skills.

---

## 🚀 Getting Started

### 📋 Prerequisites
Make sure you have **[Bun](https://bun.sh/)** installed on your system.

### 🔧 Installation
Clone the repository and install the dependencies from the root directory:
```bash
bun install
```

### 💻 Running Development Servers

To spin up all workspaces in parallel (both Next.js web app and Hono API server):
```bash
bun run dev
```

Alternatively, you can run individual workspaces:
* Run the **Next.js Web frontend**:
  ```bash
  bun run dev:web
  ```
* Run the **Hono API server**:
  ```bash
  bun run dev:api
  ```

### 🏗️ Production Build
To build all applications for production:
```bash
bun run build
```

To typecheck all files across the monorepo:
```bash
bun run check
```

---

## 🌍 Khmer Translation Workflow

Kimi features a Python script (`translate_task.py`) that utilizes Google Translate API batch operations to dynamically generate Khmer (km) translations for static chemistry data and web components:
```bash
# Verify deep-translator is installed, then run translation pipeline
python3 translate_task.py
```

---

## 🤝 Inspiration & Credits

Kimi is built on top of the pedagogical structure and idea of **[Zperiod](https://github.com/Zhilips/Zperiod)**. A huge thanks to the original creators for compiling the detailed chemistry datasets and designing the school-level prediction algorithms.
