'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Activity, 
  Clock, 
  Square, 
  RefreshCw, 
  AlertCircle,
  CheckCircle,
  XCircle 
} from 'lucide-react';
import { portfolioAPI, ServiceStatus as ServiceStatusType, handleAPIError } from '@/lib/api';
import { formatUptime, formatTimestamp, cn } from '@/lib/utils';

interface ServiceStatusProps {
  onStatusChange?: (running: boolean) => void;
}

export default function ServiceStatus({ onStatusChange }: ServiceStatusProps) {
  const [status, setStatus] = useState<ServiceStatusType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setError(null);
      const statusData = await portfolioAPI.getStatus();
      setStatus(statusData);
      onStatusChange?.(statusData.running);
    } catch (err) {
      setError(handleAPIError(err));
    } finally {
      setLoading(false);
    }
  }, [onStatusChange]);

  useEffect(() => {
    fetchStatus();
    
    // Poll status every 5 seconds
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleAction = async (action: 'stop' | 'restart') => {
    setActionLoading(action);
    setError(null);

    try {
      if (action === 'stop') {
        await portfolioAPI.stopService();
      } else {
        await portfolioAPI.restartService();
      }
      
      // Wait a moment then refresh status
      setTimeout(fetchStatus, 1000);
    } catch (err) {
      setError(handleAPIError(err));
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Service Status
          </h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  const getStatusIcon = () => {
    if (!status) return <XCircle className="h-6 w-6 text-gray-400" />;
    
    if (status.running) {
      return <CheckCircle className="h-6 w-6 text-green-500" />;
    } else if (status.error_message) {
      return <XCircle className="h-6 w-6 text-red-500" />;
    } else {
      return <AlertCircle className="h-6 w-6 text-yellow-500" />;
    }
  };

  const getStatusText = () => {
    if (!status) return 'Unknown';
    
    if (status.running) {
      return 'Running';
    } else if (status.error_message) {
      return 'Error';
    } else {
      return 'Stopped';
    }
  };

  const getStatusColor = () => {
    if (!status) return 'text-gray-500';
    
    if (status.running) {
      return 'text-green-600 dark:text-green-400';
    } else if (status.error_message) {
      return 'text-red-600 dark:text-red-400';
    } else {
      return 'text-yellow-600 dark:text-yellow-400';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Activity className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Service Status
          </h2>
        </div>
        
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
          title="Refresh status"
        >
          <RefreshCw className={cn("h-5 w-5", loading && "animate-spin")} />
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Service Status */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          {getStatusIcon()}
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
            <p className={cn("font-semibold", getStatusColor())}>
              {getStatusText()}
            </p>
          </div>
        </div>

        {/* Process ID */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-blue-600">PID</span>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Process ID</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {status?.pid || 'N/A'}
            </p>
          </div>
        </div>

        {/* Uptime */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <Clock className="h-6 w-6 text-purple-600" />
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Uptime</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {formatUptime(status?.uptime_seconds)}
            </p>
          </div>
        </div>

        {/* Last Rebalance */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <RefreshCw className="h-6 w-6 text-green-600" />
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Last Rebalance</p>
            <p className="font-semibold text-gray-900 dark:text-white text-xs">
              {status?.last_rebalance ? formatTimestamp(status.last_rebalance) : 'Never'}
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {status?.error_message && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <h4 className="font-semibold text-red-800">Service Error</h4>
          </div>
          <p className="text-sm text-red-700">{status.error_message}</p>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex gap-3">
        {status?.running ? (
          <>
            <button
              onClick={() => handleAction('stop')}
              disabled={actionLoading === 'stop'}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-white font-medium rounded-md transition-colors",
                actionLoading === 'stop'
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              )}
            >
              {actionLoading === 'stop' ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              {actionLoading === 'stop' ? 'Stopping...' : 'Stop Service'}
            </button>

            <button
              onClick={() => handleAction('restart')}
              disabled={actionLoading === 'restart'}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-white font-medium rounded-md transition-colors",
                actionLoading === 'restart'
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              )}
            >
              {actionLoading === 'restart' ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {actionLoading === 'restart' ? 'Restarting...' : 'Restart Service'}
            </button>
          </>
        ) : (
          <div className="text-sm text-gray-600 dark:text-gray-400 py-2">
            Service is not running. Use the configuration form to start it.
          </div>
        )}
      </div>
    </div>
  );
} 