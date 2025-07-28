'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { TrendingUp, Target, Zap, RefreshCw } from 'lucide-react';
import { portfolioAPI, AnalysisResponse, handleAPIError } from '@/lib/api';
import { formatPercentage, formatTimestamp, cn } from '@/lib/utils';

interface PortfolioAnalysisProps {
  serviceRunning: boolean;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'];

export default function PortfolioAnalysis({ serviceRunning }: PortfolioAnalysisProps) {
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = useCallback(async () => {
    if (!serviceRunning) return;
    
    setLoading(true);
    setError(null);

    try {
      const analysisData = await portfolioAPI.getAnalysis();
      setAnalysis(analysisData);
    } catch (err) {
      setError(handleAPIError(err));
    } finally {
      setLoading(false);
    }
  }, [serviceRunning]);

  useEffect(() => {
    if (serviceRunning) {
      fetchAnalysis();
      
      // Poll analysis every 10 seconds when service is running
      const interval = setInterval(fetchAnalysis, 10000);
      return () => clearInterval(interval);
    } else {
      setAnalysis(null);
    }
  }, [serviceRunning, fetchAnalysis]);

  const formatChartData = () => {
    if (!analysis) return [];

    return Object.entries(analysis.weights).map(([asset, weight]) => ({
      name: asset,
      value: weight,
      percentage: weight * 100,
    }));
  };

  const formatBarData = () => {
    if (!analysis) return [];

    return Object.entries(analysis.weights).map(([asset, weight]) => ({
      asset,
      weight: weight * 100,
      position: analysis.positions[asset] || 0,
    }));
  };

  if (!serviceRunning) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Portfolio Analysis
          </h2>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">
            Service is not running. Configure and start the service to view portfolio analysis.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Portfolio Analysis
          </h2>
        </div>
        
        <button
          onClick={fetchAnalysis}
          disabled={loading}
          className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
          title="Refresh analysis"
        >
          <RefreshCw className={cn("h-5 w-5", loading && "animate-spin")} />
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {loading && !analysis && (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      )}

      {analysis && (
        <>
          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Expected Return</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatPercentage(analysis.expected_return)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
              <Target className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Volatility</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatPercentage(analysis.expected_volatility)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
              <Zap className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Sharpe Ratio</p>
                <p className="text-2xl font-bold text-purple-600">
                  {analysis.sharpe_ratio.toFixed(4)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Portfolio Weights Pie Chart */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Portfolio Allocation
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={formatChartData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {formatChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatPercentage(value as number)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Weights Bar Chart */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Asset Weights
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={formatBarData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="asset" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'weight' ? `${(value as number).toFixed(2)}%` : value,
                        name === 'weight' ? 'Weight' : 'Position'
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="weight" fill="#3B82F6" name="Weight %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Detailed Breakdown
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Asset</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">Weight</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">Position</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(analysis.weights).map(([asset, weight], index) => (
                    <tr key={asset} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium text-gray-900 dark:text-white">{asset}</span>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4 text-gray-700 dark:text-gray-300">
                        {formatPercentage(weight)}
                      </td>
                      <td className="text-right py-3 px-4 text-gray-700 dark:text-gray-300">
                        {(analysis.positions[asset] || 0).toFixed(6)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Timestamp */}
          <div className="mt-6 text-sm text-gray-500 dark:text-gray-400 text-center">
            Last updated: {formatTimestamp(analysis.timestamp)}
          </div>
        </>
      )}
    </div>
  );
} 