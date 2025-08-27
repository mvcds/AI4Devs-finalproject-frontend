//@ts-ignore, necessary while BE is not production ready
import { Configuration, TransactionsApi, CategoriesApi } from 'ai4devs-api-client';

// Configuration that respects environment variables
const createApiConfiguration = () => {
  const basePath = process.env.NEXT_PUBLIC_API_URL || `http://localhost:${process.env.BACKEND_PORT}`;
  
  return new Configuration({
    basePath,
    headers: {
      'Content-Type': 'application/json',
    }
  });
};

// Create API instances
const config = createApiConfiguration();

export const transactionsApi = new TransactionsApi(config);
export const categoriesApi = new CategoriesApi(config);

//TODO: expose it on client
// Add expression evaluation method
export const evaluateExpression = async (expression: string, frequency: string): Promise<{
  amount: number;
  type: 'income' | 'expense';
  normalizedAmount: number;
  isValid: boolean;
}> => {
  const response = await fetch(`${config.basePath}/api/transactions/evaluate-expression`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ expression, frequency }),
  });

  if (!response.ok) {
    throw new Error('Failed to evaluate expression');
  }

  return response.json();
};

//TODO: make them come from BE
// Export constants that components expect
export const FREQUENCIES = {
  DAILY: 'daily',
  WEEK: 'week',
  FORTNIGHT: 'fortnight',
  MONTH: 'month',
  TWO_MONTH: '2-month',
  THREE_MONTH: '3-month',
  QUARTER: 'quarter',
  HALF: 'half',
  YEAR: 'year',
  TWO_YEAR: '2-year'
};

//TODO: make them come from BE
export const FREQUENCY_LABELS = {
  'daily': 'Daily',
  'week': 'Week',
  'fortnight': 'Fortnight',
  'month': 'Month',
  '2-month': '2-Month',
  '3-month': '3-Month',
  'quarter': 'Quarter',
  'half': 'Half Year',
  'year': 'Year',
  '2-year': '2-Year'
};

// Re-export everything from the generated client
//@ts-ignore, necessary while BE is not production ready
export * from 'ai4devs-api-client';
