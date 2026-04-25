import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext'; // To get the token

// Define the structure of a search result item
interface SearchResult {
  Hshd_num: number;
  Basket_num: number;
  Date: string; // Assuming date comes as string, format later if needed
  Product_num: number;
  Department: string;
  Commodity: string;
  Spend: number;
  Units: number;
}

const SearchPage: React.FC = () => {
  const [hshdNum, setHshdNum] = useState<string>('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false); // Track if a search has been performed

  const { token } = useAuth(); // Get the auth token
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hshdNum.trim()) {
      setError('Please enter a Household Number.');
      return;
    }
    if (!token) {
        setError('Authentication token not found. Please log in again.');
        return;
    }

    setLoading(true);
    setError(null);
    setResults([]);
    setSearched(true);

    try {
      const response = await fetch(`${API_BASE_URL}/household-search/${hshdNum}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            // Include the token in the Authorization header
            // Adjust if your backend expects a different scheme or header name
            'Authorization': `Bearer ${token}` 
        },
      });
      
      if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: `HTTP error! status: ${response.status}` }));
          throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      
      const data: SearchResult[] = await response.json();
      setResults(data);

    } catch (err) {
        if (err instanceof Error) {
            setError(err.message || 'An error occurred during search.');
        } else {
            setError('An unknown error occurred during search.');
        }
        setResults([]); // Clear results on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <section className="page-header">
        <h1 className="page-title">Household Transaction Search</h1>
        <p className="page-subtitle">
          Search household-level purchases joined with demographic, transaction, and product information.
        </p>
      </section>
      
      <form onSubmit={handleSearch} className="cyber-panel mb-8 flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center">
        <input
          type="number"
          value={hshdNum}
          onChange={(e) => setHshdNum(e.target.value)}
          placeholder="Enter Household Number"
          required
          className="cyber-input block w-full max-w-xs placeholder-slate-500 sm:text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="cyber-button justify-center px-5 py-2.5"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && (
        <p className="mb-4 rounded-xl border border-red-400/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">Error: {error}</p>
      )}

      {loading && (
        <p className="cyber-panel rounded-xl p-4 text-sm text-slate-300">Loading results...</p>
      )}

      {!loading && searched && results.length === 0 && !error && (
         <p className="cyber-panel rounded-xl p-4 text-sm text-slate-300">No transactions found for this household number.</p>
      )}

      {!loading && results.length > 0 && (
        <div className="cyber-table table-card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-cyan-300/10">
              <thead className="bg-cyan-950/50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-bold uppercase tracking-wide text-cyan-100 sm:pl-6">Hshd Num</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-cyan-100">Basket Num</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-cyan-100">Date</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-cyan-100">Product Num</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-cyan-100">Department</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-cyan-100">Commodity</th>
                  <th scope="col" className="px-3 py-3.5 text-right text-xs font-bold uppercase tracking-wide text-cyan-100">Spend</th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right text-xs font-bold uppercase tracking-wide text-cyan-100">Units</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-300/10 bg-slate-950/45">
                {results.map((item, index) => (
                  <tr key={`${item.Basket_num}-${item.Product_num}-${index}`} className="odd:bg-white/[0.025] hover:bg-cyan-400/10"> {/* Composite key */} 
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-semibold text-slate-100 sm:pl-6">{item.Hshd_num}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-300">{item.Basket_num}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-300">{item.Date}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-300">{item.Product_num}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-300">{item.Department}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-300">{item.Commodity}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-200 text-right">{item.Spend.toFixed(2)}</td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-semibold text-slate-100 sm:pr-6">{item.Units}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPage; 
