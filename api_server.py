"""
FastAPI Server that communicates with project.py externally
This approach keeps project.py running independently and communicates via files and process calls.
"""

import asyncio
import json
import os
import subprocess
import signal
import psutil
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
import time

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator
import uvicorn

# FastAPI app instance
app = FastAPI(
    title="Portfolio Management API",
    description="External API interface for project.py portfolio service",
    version="1.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://your-frontend-domain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables to track the external process
project_process: Optional[subprocess.Popen] = None
project_pid_file = "project_service.pid"

# Pydantic models for API requests/responses
class ConfigurationRequest(BaseModel):
    api_base_url: str
    api_key: str
    api_secret: Optional[str] = ""
    risk_free_rate: Optional[float] = 0.02
    rebalance_interval: Optional[int] = 300  # seconds
    target_sharpe: Optional[float] = None
    cov_window: Optional[int] = 60
    price_endpoint: Optional[str] = "/prices"
    position_endpoint: Optional[str] = "/positions"
    audit_log_path: Optional[str] = "audit.log"

    @validator('api_base_url')
    def validate_https_url(cls, v):
        if not v.startswith('https://'):
            raise ValueError('API URL must use HTTPS')
        return v

class ServiceStatus(BaseModel):
    running: bool
    pid: Optional[int] = None
    last_rebalance: Optional[str] = None
    uptime_seconds: Optional[float] = None
    error_message: Optional[str] = None

class AnalysisResponse(BaseModel):
    timestamp: str
    positions: Dict[str, float]
    weights: Dict[str, float]
    expected_return: float
    expected_volatility: float
    sharpe_ratio: float

class ConfigurationResponse(BaseModel):
    message: str
    service_status: str

# Helper functions for process management
def is_project_running() -> tuple[bool, Optional[int]]:
    """Check if project.py is running and return its PID"""
    try:
        if os.path.exists(project_pid_file):
            with open(project_pid_file, 'r') as f:
                pid = int(f.read().strip())
            
            # Check if process with this PID exists and is our project
            if psutil.pid_exists(pid):
                process = psutil.Process(pid)
                if 'project.py' in ' '.join(process.cmdline()):
                    return True, pid
        
        # Also check by process name if PID file is missing
        for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
            try:
                if proc.info['cmdline'] and any('project.py' in cmd for cmd in proc.info['cmdline']):
                    return True, proc.info['pid']
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
                
        return False, None
    except Exception:
        return False, None

def start_project_service() -> subprocess.Popen:
    """Start the project.py service as a separate process"""
    try:
        # Start project.py as a subprocess
        process = subprocess.Popen(
            ['python', 'project.py'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=os.getcwd()
        )
        
        # Save PID to file for tracking
        with open(project_pid_file, 'w') as f:
            f.write(str(process.pid))
        
        return process
    except Exception as e:
        raise Exception(f"Failed to start project.py: {str(e)}")

def stop_project_service() -> bool:
    """Stop the project.py service"""
    running, pid = is_project_running()
    if not running or not pid:
        return True
    
    try:
        process = psutil.Process(pid)
        process.terminate()
        
        # Wait for graceful shutdown
        try:
            process.wait(timeout=10)
        except psutil.TimeoutExpired:
            process.kill()  # Force kill if it doesn't stop gracefully
        
        # Clean up PID file
        if os.path.exists(project_pid_file):
            os.remove(project_pid_file)
        
        return True
    except Exception as e:
        print(f"Error stopping project service: {e}")
        return False

def create_env_file(config: ConfigurationRequest):
    """Create .env file with user credentials"""
    env_content = f"""API_URL={config.api_base_url}
API_TOKEN={config.api_key}
"""
    
    with open('.env', 'w') as f:
        f.write(env_content)

def create_config_file(config: ConfigurationRequest):
    """Create config.json file with service parameters"""
    config_data = {
        "risk_free_rate": config.risk_free_rate,
        "rebalance_interval": config.rebalance_interval,
        "target_sharpe": config.target_sharpe,
        "cov_window": config.cov_window,
        "price_endpoint": config.price_endpoint,
        "position_endpoint": config.position_endpoint,
        "audit_log_path": config.audit_log_path
    }
    
    with open('config.json', 'w') as f:
        json.dump(config_data, f, indent=2)

def read_latest_audit_record() -> Optional[Dict]:
    """Read the most recent audit record from the log file"""
    try:
        audit_file = "audit.log"  # Default path, could be from config
        
        # Check if config.json exists to get the actual audit log path
        if os.path.exists('config.json'):
            with open('config.json', 'r') as f:
                config = json.load(f)
                audit_file = config.get('audit_log_path', 'audit.log')
        
        if not os.path.exists(audit_file):
            return None
        
        # Read the last line (most recent record)
        with open(audit_file, 'r') as f:
            lines = f.readlines()
            if not lines:
                return None
            
            last_line = lines[-1].strip()
            return json.loads(last_line)
    
    except Exception as e:
        print(f"Error reading audit record: {e}")
        return None

# API Endpoints
@app.post("/configure", response_model=ConfigurationResponse)
async def configure_service(config: ConfigurationRequest):
    """Configure and start the portfolio service"""
    global project_process
    
    try:
        # Stop existing service if running
        stop_project_service()
        
        # Create configuration files
        create_env_file(config)
        create_config_file(config)
        
        # Start the project.py service
        project_process = start_project_service()
        
        # Wait a moment to ensure it started
        await asyncio.sleep(2)
        
        running, pid = is_project_running()
        if not running:
            raise Exception("Service failed to start")
        
        return ConfigurationResponse(
            message=f"Portfolio service configured and started successfully (PID: {pid})",
            service_status="running"
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Configuration failed: {str(e)}")

@app.get("/status", response_model=ServiceStatus)
async def get_service_status():
    """Get the current status of the portfolio service"""
    running, pid = is_project_running()
    
    uptime = None
    if running and pid:
        try:
            process = psutil.Process(pid)
            uptime = time.time() - process.create_time()
        except Exception:
            pass
    
    # Get last rebalance info from audit log
    last_rebalance = None
    latest_record = read_latest_audit_record()
    if latest_record:
        last_rebalance = latest_record.get('timestamp')
    
    return ServiceStatus(
        running=running,
        pid=pid,
        last_rebalance=last_rebalance,
        uptime_seconds=uptime
    )

@app.get("/analysis", response_model=AnalysisResponse)
async def get_latest_analysis():
    """Get the latest portfolio analysis results"""
    try:
        latest_record = read_latest_audit_record()
        if not latest_record:
            raise HTTPException(status_code=404, detail="No analysis data available yet")
        
        return AnalysisResponse(
            timestamp=latest_record['timestamp'],
            positions=latest_record.get('positions', {}),
            weights=latest_record['weights'],
            expected_return=latest_record['expected_return'],
            expected_volatility=latest_record['expected_volatility'],
            sharpe_ratio=latest_record['sharpe_ratio']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve analysis: {str(e)}")

@app.get("/audit-log")
async def get_audit_log(limit: int = 10):
    """Get recent audit log entries"""
    try:
        audit_file = "audit.log"
        
        # Get audit file path from config
        if os.path.exists('config.json'):
            with open('config.json', 'r') as f:
                config = json.load(f)
                audit_file = config.get('audit_log_path', 'audit.log')
        
        if not os.path.exists(audit_file):
            return {"records": []}
        
        # Read recent records
        records = []
        with open(audit_file, 'r') as f:
            lines = f.readlines()
            
        # Get the last 'limit' lines
        recent_lines = lines[-limit:] if len(lines) > limit else lines
        
        for line in reversed(recent_lines):  # Most recent first
            try:
                record = json.loads(line.strip())
                records.append(record)
            except json.JSONDecodeError:
                continue
        
        return {"records": records}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve audit log: {str(e)}")

@app.post("/stop")
async def stop_service():
    """Stop the portfolio service"""
    try:
        success = stop_project_service()
        if success:
            return {"message": "Portfolio service stopped successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to stop service")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to stop service: {str(e)}")

@app.post("/restart")
async def restart_service():
    """Restart the portfolio service with current configuration"""
    try:
        # Stop current service
        stop_project_service()
        await asyncio.sleep(1)
        
        # Start new instance
        project_process = start_project_service()
        await asyncio.sleep(2)
        
        running, pid = is_project_running()
        if running:
            return {"message": f"Portfolio service restarted successfully (PID: {pid})"}
        else:
            raise HTTPException(status_code=500, detail="Service failed to restart")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to restart service: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/logs")
async def get_service_logs():
    """Get recent service logs (if available)"""
    try:
        # This would read from the service's log file if it exists
        log_file = "portfolio_service.log"
        if os.path.exists(log_file):
            with open(log_file, 'r') as f:
                lines = f.readlines()
            return {"logs": lines[-50:]}  # Last 50 lines
        else:
            return {"logs": ["No log file found"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve logs: {str(e)}")

# Cleanup on shutdown
@app.on_event("shutdown")
async def shutdown_event():
    """Clean up when FastAPI shuts down"""
    stop_project_service()

# Run the FastAPI server
if __name__ == "__main__":
    uvicorn.run(
        "api_server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
