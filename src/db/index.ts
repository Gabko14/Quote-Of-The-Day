export { getDatabase, closeDatabase } from './database';
export {
  type Quote,
  type QuoteInput,
  getAllQuotes,
  getQuoteById,
  getQuotesByCategory,
  getRandomQuote,
  getRandomQuoteExcluding,
  createQuote,
  updateQuote,
  deleteQuote,
  getQuoteCount,
} from './quotes';
export {
  type Category,
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  categoryExists,
} from './categories';
export {
  type SettingKey,
  getSetting,
  setSetting,
  deleteSetting,
  getDarkBackground,
  setDarkBackground,
  getCurrentQuoteId,
  setCurrentQuoteId,
  clearCurrentQuoteId,
  getLastQuoteDate,
  setLastQuoteDate,
} from './settings';
