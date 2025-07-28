#!/usr/bin/env python3
"""
Test suite for enhanced Digital Asset Portfolio Management Microservice
"""

import pytest
import asyncio
import json
import os
import tempfile
from unittest.mock import Mock, patch, AsyncMock
from pathlib import Path

from project import (
    PortfolioConfig, RebalanceRecord, SecureAPIClient, PortfolioOptimizer,
    AuditLogger, PortfolioService, _TimeProvider, BAR_FREQ_PER_YEAR,
    PRICE_CACHE_LIMIT, API_RETRY_ATTEMPTS
)
import pandas as pd
import numpy as np


class TestEnhancements:
    """Test the new enhancements in the enhanced project.py"""
    
    def test_global_constants_defined(self):
        """Test that all global constants are properly defined."""
        assert BAR_FREQ_PER_YEAR == 252 * 24 * 12
        assert PRICE_CACHE_LIMIT == 2 * 60 * 24
        assert API_RETRY_ATTEMPTS == 3
    
    def test_time_provider_functionality(self):
        """Test the time provider abstraction."""
        time_provider = _TimeProvider()
        
        # Test basic functionality
        assert isinstance(time_provider.now(), float)
        assert hasattr(time_provider.utcnow(), 'isoformat')
        
    def test_enhanced_config_validation(self):
        """Test enhanced configuration validation."""
        # Test valid configuration
        config = PortfolioConfig(
            assets=["BTC", "ETH"],
            risk_free_rate=0.02,
            min_weight_per_asset=0.05,
            max_weight_per_asset=0.4
        )
        assert config.assets == ["BTC", "ETH"]
        
        # Test empty assets validation
        with pytest.raises(ValueError, match="Assets list cannot be empty"):
            PortfolioConfig(assets=[])
        
        # Test duplicate assets validation
        with pytest.raises(ValueError, match="Duplicate asset symbols found"):
            PortfolioConfig(assets=["BTC", "ETH", "BTC"])
        
        # Test weight relationship validation
        with pytest.raises(ValueError, match="min_weight_per_asset must be less than max_weight_per_asset"):
            PortfolioConfig(min_weight_per_asset=0.5, max_weight_per_asset=0.3)
        
        # Test numeric range validation
        with pytest.raises(ValueError, match="risk_free_rate must be between 0 and 1"):
            PortfolioConfig(risk_free_rate=1.5)
    
    def test_rebalance_record_audit_string(self):
        """Test RebalanceRecord audit string generation."""
        record = RebalanceRecord(
            timestamp="2024-01-01T00:00:00Z",
            portfolio_weights={"BTC": 0.5, "ETH": 0.5},
            expected_return=0.1,
            portfolio_volatility=0.2,
            sharpe_ratio=0.5,
            optimization_objective="max_sharpe",
            target_sharpe=None,
            execution_time_ms=100.0,
            price_data_hash="abc123",
            config_hash="def456"
        )
        
        audit_string = record.to_audit_string()
        assert "HASH:" in audit_string
        assert "portfolio_weights" in audit_string
    
    @patch('project.os.getenv')
    def test_secure_api_client_test_mode(self, mock_getenv):
        """Test SecureAPIClient in test mode."""
        mock_getenv.side_effect = lambda key, default=None: {
            'PORTFOLIO_TEST_MODE': 'true',
            'API_BASE_URL': 'https://test.api.com',
            'API_KEY': 'test_key',
            'API_SECRET': 'test_secret'
        }.get(key, default)
        
        client = SecureAPIClient(test_mode=True)
        assert client.test_mode is True
        assert client.base_url == 'https://test.api.com'
        assert client.api_key == 'test_key'
    
    def test_portfolio_optimizer_with_caching(self):
        """Test portfolio optimizer with caching functionality."""
        config = PortfolioConfig()
        optimizer = PortfolioOptimizer(config)
        
        # Test cache key generation
        cache_key = optimizer._cached_covariance("test_hash", 60)
        assert cache_key == "test_hash_60"
    
    def test_audit_logger_resource_management(self):
        """Test audit logger proper resource management."""
        with tempfile.TemporaryDirectory() as temp_dir:
            audit_logger = AuditLogger(log_directory=temp_dir)
            
            # Test that file handler is created
            assert audit_logger._file_handler is not None
            
            # Test cleanup
            audit_logger.close()
    
    def test_portfolio_service_enhanced_initialization(self):
        """Test enhanced PortfolioService initialization."""
        with patch('project.Observer'):
            service = PortfolioService(test_mode=True, config_file='test_config.json')
            
            assert service.test_mode is True
            assert service.config_file == 'test_config.json'
            assert service.config_observer is None  # Should be None in test mode
    
    @pytest.mark.asyncio
    async def test_secure_api_client_context_manager(self):
        """Test SecureAPIClient as async context manager."""
        with patch('project.aiohttp.ClientSession') as mock_session_class:
            mock_session = AsyncMock()
            mock_session.closed = False
            mock_session_class.return_value = mock_session
            
            with patch('project.aiohttp.TCPConnector') as mock_connector_class:
                mock_connector = AsyncMock()
                mock_connector_class.return_value = mock_connector
                
                client = SecureAPIClient(test_mode=True)
                
                async with client:
                    assert client.session is not None
                    mock_session_class.assert_called_once()
                
                # Verify cleanup was called
                mock_session.close.assert_called_once()
                mock_connector.close.assert_called_once()
    
    def test_cli_functionality(self):
        """Test CLI interface functionality."""
        from project import cli
        
        # Test that CLI function exists and is callable
        assert callable(cli)
        
        # We can't easily test full CLI functionality without subprocess,
        # but we can verify the function exists
    
    @pytest.mark.asyncio  
    async def test_concurrent_operations_structure(self):
        """Test that concurrent operation methods exist and are structured correctly."""
        with patch('project.Observer'):
            service = PortfolioService(test_mode=True)
            
            # Test that run_once method exists
            assert hasattr(service, 'run_once')
            assert callable(service.run_once)
            
            # Test that execute_rebalancing_cycle method exists
            assert hasattr(service, 'execute_rebalancing_cycle')
            assert callable(service.execute_rebalancing_cycle)


class TestBackwardCompatibility:
    """Test that enhancements maintain backward compatibility."""
    
    def test_original_class_interfaces_preserved(self):
        """Test that original class interfaces are preserved."""
        # Test PortfolioConfig can still be created with defaults
        config = PortfolioConfig()
        assert config.assets == ["BTC", "ETH", "ADA", "SOL"]
        
        # Test RebalanceRecord can still be created
        record = RebalanceRecord(
            timestamp="2024-01-01T00:00:00Z",
            portfolio_weights={"BTC": 0.5, "ETH": 0.5},
            expected_return=0.1,
            portfolio_volatility=0.2,
            sharpe_ratio=0.5,
            optimization_objective="max_sharpe",
            target_sharpe=None,
            execution_time_ms=100.0,
            price_data_hash="abc123",
            config_hash="def456"
        )
        assert record.timestamp == "2024-01-01T00:00:00Z"
    
    def test_main_function_compatibility(self):
        """Test that main function is still available for backward compatibility."""
        from project import main
        assert callable(main)


if __name__ == "__main__":
    pytest.main([__file__, "-v"]) 