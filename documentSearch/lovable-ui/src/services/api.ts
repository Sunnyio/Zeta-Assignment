
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface QueryRequest {
  query: string;
}

export interface QueryResponse {
  query_id: string;
  response: string;
  sources: string[];
  response_time: number;
}

export interface QueryRecord {
  id: string;
  timestamp: string;
  query: string;
  response: string;
  response_time: number;
  sources: string[];
  success: boolean;
}

export interface QueryHistoryResponse {
  total: number;
  limit: number;
  offset: number;
  records: QueryRecord[];
}

export interface QueryStats {
  total_queries: number;
  success_rate: number;
  avg_response_time: number;
  queries_per_day: Record<string, number>;
  top_sources: { source: string; count: number }[];
  top_queries: { query: string; count: number }[];
}

export interface DailyPerformance {
  date: string;
  query_volume: number;
  success_rate: number;
  avg_latency: number;
  top_documents: { source: string; count: number }[];
}

const api = {
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  queryKnowledge: async (query: string): Promise<QueryResponse> => {
    const response = await apiClient.post('/query/', { query });
    return response.data;
  },
  
  getQueryHistory: async (limit = 50, offset = 0): Promise<QueryHistoryResponse> => {
    const response = await apiClient.get(`/analytics/queries?limit=${limit}&offset=${offset}`);
    return response.data;
  },
  
  getQueryStats: async (): Promise<QueryStats> => {
    const response = await apiClient.get('/analytics/stats');
    return response.data;
  },
  
  getPerformanceMetrics: async (days = 7): Promise<DailyPerformance[]> => {
    const response = await apiClient.get(`/analytics/performance?days=${days}`);
    return response.data;
  },
};

export default api;
