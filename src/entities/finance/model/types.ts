import type {
  CashFlowTransaction as GenCashFlowTransaction,
  CashFlowInput as GenCashFlowInput,
} from '../api/financeApi';

export type CashFlowInput = GenCashFlowInput;

export type CashFlowTransaction = GenCashFlowTransaction & {
  id: string;
  payment_type: 'receive' | 'pay';
  amount: number;
  payment_date: string;
  created_at: string;
  updated_at: string;
  payment_method: 'cash' | 'bank_transfer' | 'credit_card' | 'other';
};
