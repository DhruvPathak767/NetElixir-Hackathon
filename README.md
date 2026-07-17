# ForecastIQ — Marketing Spend Forecast & Budget Optimization Platform

ForecastIQ is a state-of-the-art marketing campaign performance forecast and budget allocation engine. It uses machine learning models (LightGBM/Scikit-learn) on campaign history data to predict marketing outcomes and execute heuristic spend distribution algorithms to maximize ROAS.

## Repository Structure

The repository is structured as a clean, production-ready full-stack application:

```text
Marketing-Forecast/
├── backend/            # FastAPI Python backend (ML pipelines, JWT Auth, SQLite Cache, ReportLab PDF)
├── frontend/           # React, Vite, Tailwind CSS client dashboard and studio workspace
├── .gitignore          # Repository git ignore configuration
└── README.md           # Project documentation and setup guide
```

## Features

- **Interactive Preprocessing Studio**: Automates out-of-bounds capping, missing data imputation, and scaling.
- **Feature Engineering Workspace**: Generates lag features, rolling windows, and weekday indices.
- **Automated Model Training**: Trains LightGBM forecasting models, visualizing feature importances.
- **Studio Forecast Engine**: Visualizes campaign point predictors, optimistic/pessimistic scenarios, and confidence intervals.
- **Executive Budget Simulator**: Wires to mathematical simulation models for multi-channel allocation.
- **AI Strategy Insights & Chat**: Delivers strategy recommendations utilizing conversational LLMs.
- **Enterprise PDF Generator**: Generates formatted executive report PDFs via ReportLab.
- **Secure Authentication**: Fully functional signup, login, password recovery, and session managers.

## Setup and Installation

### Backend Setup
1. Navigate to `backend/`
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate # or .\.venv\Scripts\activate on Windows
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the development server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend Setup
1. Navigate to `frontend/`
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Build the production application:
   ```bash
   npm run build
   ```
