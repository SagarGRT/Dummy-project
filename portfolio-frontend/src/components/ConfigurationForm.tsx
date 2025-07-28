'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Settings, Key, Globe, Shield } from 'lucide-react';
import { portfolioAPI, ConfigurationRequest, handleAPIError } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ConfigurationFormProps {
  onConfigured: () => void;
}

export default function ConfigurationForm({ onConfigured }: ConfigurationFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ConfigurationRequest>({
    defaultValues: {
      risk_free_rate: 0.02,
      rebalance_interval: 300,
      cov_window: 60,
      price_endpoint: '/prices',
      position_endpoint: '/positions',
      audit_log_path: 'audit.log',
    },
  });

  const onSubmit = async (data: ConfigurationRequest) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await portfolioAPI.configure(data);
      setSuccess(response.message);
      onConfigured();
    } catch (err) {
      setError(handleAPIError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Portfolio Service Configuration
        </h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* API Configuration Section */}
        <div className="border-b pb-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              API Configuration
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                API Base URL *
              </label>
              <input
                type="url"
                {...register('api_base_url', {
                  required: 'API Base URL is required',
                  pattern: {
                    value: /^https:\/\/.+/,
                    message: 'URL must use HTTPS',
                  },
                })}
                className={cn(
                  "w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
                  errors.api_base_url
                    ? "border-red-300 focus:border-red-500"
                    : "border-gray-300 focus:border-blue-500",
                  "dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                )}
                placeholder="https://api.example.com"
              />
              {errors.api_base_url && (
                <p className="mt-1 text-sm text-red-600">{errors.api_base_url.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                API Key *
              </label>
              <input
                type="text"
                {...register('api_key', { required: 'API Key is required' })}
                className={cn(
                  "w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
                  errors.api_key
                    ? "border-red-300 focus:border-red-500"
                    : "border-gray-300 focus:border-blue-500",
                  "dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                )}
                placeholder="Your API key"
              />
              {errors.api_key && (
                <p className="mt-1 text-sm text-red-600">{errors.api_key.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                API Secret (Optional)
              </label>
              <input
                type="password"
                {...register('api_secret')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Your API secret (if required)"
              />
            </div>
          </div>
        </div>

        {/* Portfolio Settings Section */}
        <div className="border-b pb-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Portfolio Settings
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Risk-Free Rate
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                max="1"
                {...register('risk_free_rate', {
                  valueAsNumber: true,
                  min: { value: 0, message: 'Must be positive' },
                  max: { value: 1, message: 'Must be less than 1' },
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              {errors.risk_free_rate && (
                <p className="mt-1 text-sm text-red-600">{errors.risk_free_rate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rebalance Interval (seconds)
              </label>
              <input
                type="number"
                min="60"
                {...register('rebalance_interval', {
                  valueAsNumber: true,
                  min: { value: 60, message: 'Minimum 60 seconds' },
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              {errors.rebalance_interval && (
                <p className="mt-1 text-sm text-red-600">{errors.rebalance_interval.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Covariance Window
              </label>
              <input
                type="number"
                min="10"
                {...register('cov_window', {
                  valueAsNumber: true,
                  min: { value: 10, message: 'Minimum 10 periods' },
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              {errors.cov_window && (
                <p className="mt-1 text-sm text-red-600">{errors.cov_window.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target Sharpe Ratio (Optional)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                {...register('target_sharpe', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Leave empty for max Sharpe"
              />
            </div>
          </div>
        </div>

        {/* API Endpoints Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            API Endpoints (Advanced)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Price Endpoint
              </label>
              <input
                type="text"
                {...register('price_endpoint')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Position Endpoint
              </label>
              <input
                type="text"
                {...register('position_endpoint')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Audit Log Path
              </label>
              <input
                type="text"
                {...register('audit_log_path')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className={cn(
              "flex items-center gap-2 px-6 py-3 text-white font-medium rounded-md transition-colors",
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            )}
          >
            <Key className="h-4 w-4" />
            {loading ? 'Configuring...' : 'Configure & Start Service'}
          </button>

          <button
            type="button"
            onClick={() => reset()}
            className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Reset Form
          </button>
        </div>
      </form>
    </div>
  );
} 