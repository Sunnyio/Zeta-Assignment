
export type QueryStatus = 'idle' | 'loading' | 'success' | 'error';

export interface ChartData {
  name: string;
  value: number;
}

export interface LineChartData {
  date: string;
  value: number;
}

export interface MultiLineChartData {
  date: string;
  [key: string]: number | string;
}
