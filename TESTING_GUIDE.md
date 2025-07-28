# Testing Guide for Portfolio Management Service

## Quick Start for Testing

### Option 1: Use Test Mode (Recommended)
Set the environment variable to enable test-friendly defaults:

```bash
export PORTFOLIO_TEST_MODE=true
pytest test_project.py -v
```

Or in Python:
```python
import os
os.environ['PORTFOLIO_TEST_MODE'] = 'true'

# Now you can import and test without setting up API credentials
from project import PortfolioService, SecureAPIClient

# These will work without real API credentials in test mode
service = PortfolioService()
client = SecureAPIClient()
```

### Option 2: Set Mock Environment Variables
```bash
export API_BASE_URL=https://api.example.com
export API_KEY=test_key
export API_SECRET=test_secret
pytest test_project.py -v
```

## Dependencies

Install all required packages:
```bash
pip install -r requirements.txt
```

## What Test Mode Does

When `PORTFOLIO_TEST_MODE=true` is set:

1. **✅ No real API credentials required** - Uses safe defaults
2. **✅ No file system watcher** - Skips Observer setup that can cause issues in tests
3. **✅ Same functionality** - All core logic works the same way

## Production vs Test Mode

| Feature | Production Mode | Test Mode |
|---------|----------------|-----------|
| Environment Variables | **Required** (`API_BASE_URL`, `API_KEY`) | **Optional** (uses defaults) |
| File System Watcher | **Enabled** (monitors config.json) | **Disabled** (no background threads) |
| SSL Context | **Full security** | **Full security** |
| API Calls | **Real endpoints** | **Mock in tests** |

## Example Test Structure

```python
import os
import pytest
from unittest.mock import patch
from project import PortfolioService, SecureAPIClient

# Method 1: Use test mode
def test_with_test_mode():
    os.environ['PORTFOLIO_TEST_MODE'] = 'true'
    service = PortfolioService()
    assert service.test_mode == True

# Method 2: Mock environment variables (as in our current tests)
@patch.dict(os.environ, {
    'API_BASE_URL': 'https://api.example.com',
    'API_KEY': 'test_key'
})
def test_with_mocked_env():
    client = SecureAPIClient()
    assert client.base_url == 'https://api.example.com'
```

## Error Solutions

### ❌ "Required environment variable API_BASE_URL not set"
**Solution:** Set `PORTFOLIO_TEST_MODE=true` or provide the environment variables

### ❌ File permission errors in audit_logs/
**Solution:** The code handles this gracefully, but ensure write permissions in test directory

### ❌ Import errors for packages
**Solution:** Run `pip install -r requirements.txt`

## CI/CD Configuration

For continuous integration, set the test mode in your CI configuration:

**GitHub Actions:**
```yaml
env:
  PORTFOLIO_TEST_MODE: true
```

**Docker:**
```dockerfile
ENV PORTFOLIO_TEST_MODE=true
```

## Running the Full Test Suite

```bash
# Basic tests
pytest test_project.py -v

# With coverage
pytest test_project.py -v --cov=project --cov-report=html

# Run specific test
pytest test_project.py::TestPortfolioService::test_portfolio_service_initialization -v
```

This testing approach ensures your code works in any environment without requiring real API credentials or complex setup! 