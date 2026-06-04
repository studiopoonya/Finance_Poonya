import { useState, useEffect, useCallback } from 'react';
import { getDashboardSummary } from '../lib/api';

// Mock data used when the backend is not yet running
const MOCK = {
  kpis: {
    total_revenue:   18450.00,
    total_expenses:  6820.00,
    net_profit:      11630.00,
    burn_rate:       6820.00,
    roi:             29.07,
    total_invested:  40000.00,
    revenue_change:  12.4,
    expenses_change: -3.2,
  },
  trend: [
    { month: 'Dec 2024', revenue: 12400, expenses: 5100 },
    { month: 'Jan 2025', revenue: 14200, expenses: 5800 },
    { month: 'Feb 2025', revenue: 11800, expenses: 4900 },
    { month: 'Mar 2025', revenue: 16500, expenses: 6200 },
    { month: 'Apr 2025', revenue: 15200, expenses: 6100 },
    { month: 'May 2025', revenue: 18450, expenses: 6820 },
  ],
  expense_breakdown: [
    { category: 'Equipment',  total: 2400 },
    { category: 'Marketing',  total: 1800 },
    { category: 'Software',   total: 1020 },
    { category: 'Rent',       total: 900  },
    { category: 'Supplies',   total: 700  },
  ],
  recent: [
    { id: 1, transaction_date: '2025-05-20', merchant: 'Wedding Event #301', amount: 3500, type: 'revenue', category: 'Event Revenue', ai_verified: true  },
    { id: 2, transaction_date: '2025-05-19', merchant: 'Adobe Systems',      amount:  54.99, type: 'expense', category: 'Software',     ai_verified: true  },
    { id: 3, transaction_date: '2025-05-18', merchant: 'Corporate Gig #214', amount: 2800, type: 'revenue', category: 'Event Revenue', ai_verified: false },
    { id: 4, transaction_date: '2025-05-16', merchant: 'Canon Store',        amount: 1200, type: 'expense', category: 'Equipment',    ai_verified: true  },
    { id: 5, transaction_date: '2025-05-14', merchant: 'Graduation Event',   amount: 1900, type: 'revenue', category: 'Event Revenue', ai_verified: true  },
    { id: 6, transaction_date: '2025-05-12', merchant: 'Meta Ads',           amount:  350, type: 'expense', category: 'Marketing',    ai_verified: false },
  ],
};

export function useDashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [isMock,  setIsMock]  = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getDashboardSummary();
      setData(result);
      setIsMock(false);
    } catch {
      setData(MOCK);
      setIsMock(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, isMock, reload: load };
}
