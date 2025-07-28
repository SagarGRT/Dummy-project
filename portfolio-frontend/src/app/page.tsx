'use client';

import { useState } from 'react';
import { Shield, BarChart3 } from 'lucide-react';
import ConfigurationForm from '@/components/ConfigurationForm';
import ServiceStatus from '@/components/ServiceStatus';
import PortfolioAnalysis from '@/components/PortfolioAnalysis';

export default function Home() {
  const [serviceRunning, setServiceRunning] = useState(false);
  const [showConfig, setShowConfig] = useState(true);

  const handleConfigured = () => {
    setShowConfig(false);
    setServiceRunning(true);
  };

  const handleStatusChange = (running: boolean) => {
    setServiceRunning(running);
    if (!running) {
      setShowConfig(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Portfolio Management Dashboard
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Digital Asset Portfolio Optimization Service
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${serviceRunning ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {serviceRunning ? 'Service Running' : 'Service Stopped'}
                </span>
              </div>
              
              {!showConfig && (
                <button
                  onClick={() => setShowConfig(!showConfig)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  {showConfig ? 'Hide Config' : 'Show Config'}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Configuration Section */}
          {showConfig && (
            <ConfigurationForm onConfigured={handleConfigured} />
          )}

          {/* Service Status Section */}
          <ServiceStatus onStatusChange={handleStatusChange} />

          {/* Portfolio Analysis Section */}
          <PortfolioAnalysis serviceRunning={serviceRunning} />

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Quick Actions
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setShowConfig(true)}
                className="p-4 text-left bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Update Configuration
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Modify API settings and portfolio parameters
                </p>
              </button>

              <button
                className="p-4 text-left bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                onClick={() => window.open('/logs', '_blank')}
              >
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  View Logs
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Check service logs and audit trail
                </p>
              </button>

              <button
                className="p-4 text-left bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                onClick={() => window.open('http://localhost:8000/docs', '_blank')}
              >
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  API Documentation
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  View FastAPI interactive documentation
                </p>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            <p>
              Portfolio Management System v1.0.0 • Built with Next.js and FastAPI
            </p>
            <p className="mt-1">
              Real-time portfolio optimization using mean-variance analysis
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
