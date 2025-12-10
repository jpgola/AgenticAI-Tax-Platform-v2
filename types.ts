export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export enum TaxFormType {
  W2 = 'W-2',
  Form1099NEC = '1099-NEC',
  Form1099DIV = '1099-DIV',
  Form1099INT = '1099-INT',
  ScheduleK1 = 'Schedule K-1',
  Form1040 = '1040',
  Receipt = 'Receipt'
}

export interface TaxDocument {
  id: string;
  name: string;
  type: TaxFormType | 'Unknown';
  status: 'uploading' | 'analyzing' | 'verified' | 'error';
  confidence: number;
  uploadDate: string;
  extractedData?: Record<string, string | number>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isThinking?: boolean;
}

export type ViewState = 'dashboard' | 'documents' | 'review' | 'filing' | 'settings';

export interface TaxSummary {
  totalIncome: number;
  deductions: number;
  estimatedTax: number;
  estimatedRefund: number;
  filingStatus: 'Not Started' | 'In Progress' | 'Review Ready' | 'Filed';
  complianceScore: number;
  incomeBreakdown: { name: string; value: number; color: string }[];
  deductionBreakdown: { name: string; value: number; color: string }[];
}