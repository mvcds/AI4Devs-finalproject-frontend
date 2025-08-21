//@ts-ignore
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
//@ts-ignore
export * from 'ai4devs-api-client';
