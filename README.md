# Portfolio Management System

A production-ready digital asset portfolio management system with:
- FastAPI backend exposing controls for an external portfolio microservice
- Python microservice for real-time mean-variance optimization and SOC 2-style audit logging
- Next.js frontend dashboard for configuration, status, and analysis


## Architecture
- **Microservice (`project.py`)**: Periodically fetches prices and positions, optimizes weights using PyPortfolioOpt, and logs immutable audit records.
- **API Gateway (`api_server.py`)**: FastAPI app that configures, starts, stops, and monitors the microservice as an external process. Serves analysis data and audit log snippets.
- **Frontend (`portfolio-frontend/`)**: Next.js app that configures the service, displays service status, and visualizes portfolio weights and metrics.
- **Audit Logs (`audit_logs/`)**: Daily audit log files and immutable JSON decision records.


## Prerequisites
- Python 3.10+
- Node.js 18+
- pip and npm


## Backend Setup
1. Create and activate a virtual environment (optional but recommended).
2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. (Optional) Set environment variables used by the microservice if running outside test mode:
- `API_BASE_URL` (required in production)
- `API_KEY` (required in production)
- `API_SECRET` (optional)
- `TLS_CERT_PATH`, `TLS_KEY_PATH` (optional, for mTLS)
- `PORTFOLIO_TEST_MODE=true` to enable test defaults

4. Configure runtime parameters in `config.json` (hot-reload by the microservice):
```json
{
  "risk_free_rate": 0.02,
  "rebalance_interval": 300,
  "target_sharpe": null,
  "cov_window": 60,
  "price_endpoint": "/prices",
  "position_endpoint": "/positions",
  "audit_log_path": "audit.log"
}
```

Note: `project.py` internally maps to its `PortfolioConfig` (e.g., `rebalancing_interval_minutes`, `rolling_window_periods`). The FastAPI layer maintains compatibility with the UI fields above.


## Running the Backend API
Start the FastAPI server that manages the microservice:
```bash
python api_server.py
```
- Serves at `http://localhost:8000`
- Interactive docs: `http://localhost:8000/docs`

The API will create `.env` and update `config.json` when you POST `/configure` via the UI.


## Frontend Setup & Run
1. Navigate to the frontend folder and install deps:
```bash
cd portfolio-frontend
npm install
```

2. Configure the API base URL (optional if using default):
- Create `.env.local` in `portfolio-frontend/` with:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

3. Start the dev server:
```bash
npm run dev
```
- Visit `http://localhost:3000`


## Using the Dashboard
- Open the app and fill in the Configuration form:
  - API Base URL (HTTPS required by backend validation)
  - API Key/Secret
  - Risk-free rate, rebalance interval (seconds), covariance window, optional target Sharpe
  - Advanced: price/position endpoints and audit log path
- Submit to start the service. The UI will:
  - Show service PID, uptime, and last rebalance time
  - Provide Stop/Restart controls
  - Display portfolio allocation, expected return, volatility, and Sharpe ratio


## API Overview (FastAPI)
Base URL: `http://localhost:8000`
- `POST /configure` → Start service and persist config/env
- `GET /status` → `{ running, pid, uptime_seconds, last_rebalance }`
- `GET /analysis` → Latest `{ positions, weights, expected_return, expected_volatility, sharpe_ratio }`
- `GET /audit-log?limit=10` → Recent audit records
- `POST /stop` → Stop service
- `POST /restart` → Restart service
- `GET /health` → Health check
- `GET /logs` → Recent service log lines


## Microservice (`project.py`) Highlights
- Efficient Frontier optimization via PyPortfolioOpt
- Rolling covariance on 5‑minute bars with annualized frequency
- Hot-reloads `config.json` (watchdog) with debounce
- SOC 2-style immutable audit trail per rebalance decision, including cryptographic hashes of data and config
- Robust API client with TLS, HMAC signing, retry/backoff, and timeouts

Run directly (advanced):
```bash
python project.py --once           # single rebalance
python project.py --log-level DEBUG
```
The API server normally manages this process for you.


## Logs & Audit
- Service logs: `portfolio_service.log`
- Audit logs: `audit_logs/audit_YYYYMMDD.log`
- Immutable decisions: `audit_logs/rebalance_YYYYMMDD_HHMMSS_xxxxxx.json`


## Troubleshooting
- Frontend can’t reach API: set `NEXT_PUBLIC_API_URL` and ensure CORS allows your origin.
- `/analysis` empty: wait for first rebalance; ensure price/position API is reachable and valid.
- Service not starting: check `portfolio_service.log`, ensure Python deps installed, and that `API_BASE_URL`/`API_KEY` are set (or `PORTFOLIO_TEST_MODE=true`).
- Windows path issues: run commands from the repository root PowerShell and avoid admin‑blocked directories.


## Scripts & Development
- Formatting/log levels are configured in `project.py` via `setup_logging`.
- Type hints and dataclasses used extensively for clarity.
- Tests (if added) can use `pytest`, `pytest-asyncio`, and `pytest-cov` from `requirements.txt`.


## License
Add your chosen license here. 
