import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types for API requests and responses
export interface ConfigurationRequest {
  api_base_url: string;
  api_key: string;
  api_secret?: string;
  risk_free_rate?: number;
  rebalance_interval?: number;
  target_sharpe?: number;
  cov_window?: number;
  price_endpoint?: string;
  position_endpoint?: string;
  audit_log_path?: string;
}

export interface ServiceStatus {
  running: boolean;
  pid?: number;
  last_rebalance?: string;
  uptime_seconds?: number;
  error_message?: string;
}

export interface AnalysisResponse {
  timestamp: string;
  positions: Record<string, number>;
  weights: Record<string, number>;
  expected_return: number;
  expected_volatility: number;
  sharpe_ratio: number;
}

export interface AuditRecord {
  timestamp: string;
  portfolio_weights: Record<string, number>;
  expected_return: number;
  portfolio_volatility: number;
  sharpe_ratio: number;
  execution_time_ms: number;
}

export interface ConfigurationResponse {
  message: string;
  service_status: string;
}

// API functions
export const portfolioAPI = {
  // Configure and start the service
  configure: async (config: ConfigurationRequest): Promise<ConfigurationResponse> => {
    const response = await apiClient.post('/configure', config);
    return response.data;
  },

  // Get service status
  getStatus: async (): Promise<ServiceStatus> => {
    const response = await apiClient.get('/status');
    return response.data;
  },

  // Get latest analysis
  getAnalysis: async (): Promise<AnalysisResponse> => {
    const response = await apiClient.get('/analysis');
    return response.data;
  },

  // Get audit log
  getAuditLog: async (limit: number = 10): Promise<{ records: AuditRecord[] }> => {
    const response = await apiClient.get(`/audit-log?limit=${limit}`);
    return response.data;
  },

  // Stop service
  stopService: async (): Promise<{ message: string }> => {
    const response = await apiClient.post('/stop');
    return response.data;
  },

  // Restart service
  restartService: async (): Promise<{ message: string }> => {
    const response = await apiClient.post('/restart');
    return response.data;
  },

  // Health check
  healthCheck: async (): Promise<{ status: string; timestamp: string }> => {
    const response = await apiClient.get('/health');
    return response.data;
  },

  // Get service logs
  getLogs: async (): Promise<{ logs: string[] }> => {
    const response = await apiClient.get('/logs');
    return response.data;
  },
};

// Error handling utility
export const handleAPIError = (error: unknown): string => {
  if (typeof error === 'object' && error !== null) {
    const axiosError = error as { response?: { data?: { detail?: string } }; message?: string };
    if (axiosError.response?.data?.detail) {
      return axiosError.response.data.detail;
    }
    if (axiosError.message) {
      return axiosError.message;
    }
  }
  return 'An unexpected error occurred';
}; 