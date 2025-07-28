# Portfolio Management System - Quick Start Guide

This guide will help you start both the backend API server and the frontend dashboard.

## System Overview

The Portfolio Management System consists of three main components:

1. **project.py** - Core portfolio optimization service
2. **api_server.py** - FastAPI REST API server 
3. **portfolio-frontend** - Next.js React dashboard

## Prerequisites

Make sure you have the following installed:
- Python 3.8+ with pip
- Node.js 16+ with npm
- All Python dependencies: `pip install -r requirements.txt`

## Starting the System

### Step 1: Install Frontend Dependencies

```bash
cd portfolio-frontend
npm install --legacy-peer-deps
```

### Step 2: Start the API Server

In the project root directory:

```bash
python api_server.py
```

The API server will start on `http://localhost:8000`

### Step 3: Start the Frontend Dashboard

In a new terminal, navigate to the frontend directory:

```bash
cd portfolio-frontend
npm run dev
```

The dashboard will be available at `http://localhost:3000`

### Step 4: Configure Your Portfolio Service

1. Open your browser to `http://localhost:3000`
2. Fill in the configuration form with:
   - **API Base URL**: Your trading API endpoint (must use HTTPS)
   - **API Key**: Your trading API key
   - **API Secret**: Your trading API secret (if required)
   - **Portfolio Settings**: Risk-free rate, rebalancing interval, etc.

3. Click "Configure & Start Service" to begin portfolio optimization

## Available Features

### Dashboard Features

- **Real-time Service Status**: Monitor service health, uptime, and last rebalance
- **Portfolio Analysis**: View optimized weights, expected returns, volatility, and Sharpe ratio
- **Interactive Charts**: Pie charts and bar charts showing asset allocation
- **Service Controls**: Start, stop, and restart the portfolio service
- **Configuration Management**: Update settings without restarting

### API Endpoints

The FastAPI server provides these endpoints:

- `POST /configure` - Configure and start the portfolio service
- `GET /status` - Get current service status
- `GET /analysis` - Get latest portfolio analysis
- `GET /audit-log` - View audit trail of rebalancing decisions
- `POST /stop` - Stop the portfolio service
- `POST /restart` - Restart the portfolio service
- `GET /health` - Health check endpoint
- `GET /docs` - Interactive API documentation (Swagger UI)

### Security Features

- HTTPS-only API endpoints
- Secure credential management via environment variables
- Audit logging with cryptographic integrity
- SOC 2 compliant decision tracking

## Troubleshooting

### Common Issues

1. **API Server Won't Start**
   - Check if port 8000 is already in use
   - Verify Python dependencies are installed
   - Check for error messages in the console

2. **Frontend Won't Connect to API**
   - Ensure API server is running on localhost:8000
   - Check browser console for CORS errors
   - Verify .env.local contains correct API URL

3. **Portfolio Service Won't Start**
   - Verify API credentials are valid
   - Check that API endpoints are accessible
   - Review configuration parameters for validity

4. **PowerShell Script Execution Issues**
   - Run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
   - Or use Command Prompt instead of PowerShell

### Logs and Debugging

- **API Server Logs**: Console output from `python api_server.py`
- **Portfolio Service Logs**: `portfolio_service.log` file
- **Audit Logs**: `audit_logs/` directory
- **Frontend Logs**: Browser developer console

## Configuration Examples

### Basic Configuration

```json
{
  "api_base_url": "https://api.yourexchange.com",
  "api_key": "your-api-key",
  "risk_free_rate": 0.02,
  "rebalance_interval": 300,
  "cov_window": 60
}
```

### Advanced Configuration

```json
{
  "api_base_url": "https://api.yourexchange.com",
  "api_key": "your-api-key",
  "api_secret": "your-api-secret",
  "risk_free_rate": 0.025,
  "rebalance_interval": 600,
  "target_sharpe": 1.2,
  "cov_window": 120,
  "price_endpoint": "/v1/prices",
  "position_endpoint": "/v1/positions",
  "audit_log_path": "custom_audit.log"
}
```

## Production Deployment

For production deployment:

1. **Environment Variables**: Set up proper environment variables for API credentials
2. **HTTPS**: Configure SSL certificates for secure connections
3. **Database**: Consider using a database for audit logs and configuration
4. **Monitoring**: Set up monitoring and alerting for service health
5. **Backup**: Implement backup strategies for audit logs and configuration

## Support

For issues and questions:
- Check the API documentation at `http://localhost:8000/docs`
- Review audit logs for portfolio decisions
- Monitor service status in the dashboard
- Check console outputs for error messages 