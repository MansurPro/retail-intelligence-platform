import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    TopSpender,
    LoyaltyTrend,
    EngagementByIncome,
    BrandPreference,
    FrequentPair,
    PopularProduct,
    SeasonalTrend,
    ChurnRiskCustomer,
    ChurnRiskData,
    SummaryCount,
    AssociationRule
} from '../types/dashboardData';

// Import Chart Components
import SimpleBarChart from '../components/charts/SimpleBarChart';
import SimpleLineChart from '../components/charts/SimpleLineChart';
import SimplePieChart from '../components/charts/SimplePieChart';
import FrequentPairsTable from '../components/charts/FrequentPairsTable';
import LoyaltyTrendsChart from '../components/charts/LoyaltyTrendsChart';
import AssociationRulesTable from '../components/charts/AssociationRulesTable';
import { chartTheme } from '../components/charts/chartTheme';
// Import react-select
import Select from 'react-select';

// Type for API fetching state
interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// Custom hook for fetching data
function useFetchDashboardData<T>(endpoint: string): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: true,
    error: null,
  });
  const { token } = useAuth();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  useEffect(() => {
    if (!token) {
      setState({ data: null, loading: false, error: 'Authentication token not found.' });
      return;
    }

    const fetchData = async () => {
      setState({ data: null, loading: true, error: null });
      try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: `HTTP error! status: ${response.status}` }));
          throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }
        const jsonData = await response.json();
        setState({ data: jsonData, loading: false, error: null });
      } catch (err) {
        let errorMessage = 'An unknown error occurred.';
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        setState({ data: null, loading: false, error: `Failed to fetch ${endpoint}: ${errorMessage}` });
      }
    };

    fetchData();
  }, [token, endpoint]);

  return state;
}

// Wrapper to handle loading/error states before rendering chart
const ChartWrapper: React.FC<{ title: string; fetchState: FetchState<unknown>; children: React.ReactNode }> = ({ title, fetchState, children }) => {
  const { loading, error } = fetchState;
  return (
    <div className="chart-card cyber-panel-hover min-h-[200px]">
      <h3 className="section-title text-[20px]">{title}</h3>
      {loading && (
        <div className="flex items-center justify-center h-40">
          <p className="text-sm text-slate-400">Loading...</p>
        </div>
      )}
      {error && (
        <div className="flex items-center justify-center h-40 p-4">
          <p className="text-sm text-red-300 text-center">Error: {error}</p>
        </div>
      )}
      {!loading && !error && children}
    </div>
  );
};

const DashboardPage: React.FC = () => {
  // Fetch data for charts
  const topSpenders = useFetchDashboardData<TopSpender[]>('/top-spenders');
  const loyaltyTrends = useFetchDashboardData<LoyaltyTrend[]>('/loyalty-trends');
  const engagementByIncome = useFetchDashboardData<EngagementByIncome[]>('/engagement-by-income');
  const brandPreference = useFetchDashboardData<BrandPreference[]>('/brand-preference-split');
  const frequentPairs = useFetchDashboardData<FrequentPair[]>('/frequent-pairs');
  const popularProducts = useFetchDashboardData<PopularProduct[]>('/popular-products');
  const seasonalTrends = useFetchDashboardData<SeasonalTrend[]>('/seasonal-trends');
  const churnRisk = useFetchDashboardData<ChurnRiskData>('/churn-risk');
  const associationRules = useFetchDashboardData<AssociationRule[]>('/association-rules');

  // Format seasonal data
  const formatSeasonalData = (data: SeasonalTrend[] | null) => {
    if (!data) return [];
    return data.map(item => ({
      ...item,
      monthLabel: `${item.year}-${String(item.month).padStart(2, '0')}`,
    })).sort((a, b) => a.monthLabel.localeCompare(b.monthLabel));
  };

  // --- ML Prediction States ---
  const [incomeRange, setIncomeRange] = useState('');
  const [hhSize, setHhSize] = useState('');
  const [children, setChildren] = useState('');
  const [predictedCLV, setPredictedCLV] = useState<number | null>(null);
  const [predictLoading, setPredictLoading] = useState(false);
  const [predictError, setPredictError] = useState<string | null>(null);
  
  // --- Basket Prediction States ---
  const [availableFeatures, setAvailableFeatures] = useState<{ value: string, label: string }[]>([]);
  const [selectedCommodities, setSelectedCommodities] = useState<{ value: string, label: string }[]>([]);
  const [basketPredictResult, setBasketPredictResult] = useState<{ target_item: string, probability: number } | null>(null);
  const [basketPredictLoading, setBasketPredictLoading] = useState(false);
  const [basketPredictError, setBasketPredictError] = useState<string | null>(null);
  const [featuresLoading, setFeaturesLoading] = useState(true);
  const { token } = useAuth(); // Get token for API calls
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  
  // Fetch available features for the basket predictor
  useEffect(() => {
      const fetchFeatures = async () => {
          if (!token) {
              setFeaturesLoading(false);
              setBasketPredictError("Authentication token not found."); // Set error if no token
              return;
          }
          setFeaturesLoading(true);
          try {
              const response = await fetch(`${API_BASE_URL}/get-prediction-features`, {
                  headers: { 'Authorization': `Bearer ${token}` },
              });
              if (!response.ok) {
                  const errorData = await response.json().catch(() => ({ detail: `HTTP error! status: ${response.status}` }));
                  throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
              }
              const data = await response.json();
              // Map features to the format required by react-select { value: string, label: string }
              const formattedFeatures = data.features.map((feature: string) => ({ value: feature, label: feature }));
              setAvailableFeatures(formattedFeatures);
              setBasketPredictError(null); // Clear error on success
          } catch (err) {
              let errorMessage = 'An unknown error occurred.';
              if (err instanceof Error) {
                  errorMessage = err.message;
              }
              setBasketPredictError(`Failed to fetch prediction features: ${errorMessage}`);
              setAvailableFeatures([]); // Clear features on error
          } finally {
              setFeaturesLoading(false);
          }
      };
      fetchFeatures();
  }, [token]); // Depend on token

  // ML Prediction handler
  const handlePredictCLV = async (e: React.FormEvent) => {
    e.preventDefault();
    setPredictLoading(true);
    setPredictError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/predict-clv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          income_range: incomeRange,
          hh_size: parseInt(hhSize),
          children: parseInt(children),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Prediction failed');
      }
      setPredictedCLV(data.predicted_clv);
    } catch (err) {
      if (err instanceof Error) {
        setPredictError(err.message || 'Prediction error');
      } else {
        setPredictError('Unknown prediction error.');
      }
      setPredictedCLV(null);
    } finally {
      setPredictLoading(false);
    }
  };
  
  // Basket Prediction Handler
  const handlePredictBasket = async (e: React.FormEvent) => {
      e.preventDefault();
      setBasketPredictLoading(true);
      setBasketPredictError(null);
      setBasketPredictResult(null);

      if (!token) {
          setBasketPredictError("Authentication token not found.");
          setBasketPredictLoading(false);
          return;
      }
      
      const commodityValues = selectedCommodities.map(option => option.value);
      if (commodityValues.length === 0) {
          setBasketPredictError("Please select at least one commodity currently in the basket.");
          setBasketPredictLoading(false);
          return;
      }
      
      try {
          const response = await fetch(`${API_BASE_URL}/predict-target-item`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}` // Include auth token
              },
              body: JSON.stringify({ commodities: commodityValues }),
          });
          const data = await response.json();
          if (!response.ok) {
              throw new Error(data.detail || 'Basket prediction failed');
          }
          setBasketPredictResult(data);
      } catch (err) {
          if (err instanceof Error) {
              setBasketPredictError(err.message || 'Basket prediction error');
          } else {
              setBasketPredictError('Unknown basket prediction error.');
          }
          setBasketPredictResult(null);
      } finally {
          setBasketPredictLoading(false);
      }
  };

  return (
    <div className="page-container">
      <section className="page-header">
        <h1 className="page-title">Retail Insights Dashboard</h1>
        <p className="page-subtitle">
          Explore engagement, loyalty, basket patterns, product preferences, and churn indicators.
        </p>
      </section>

      <div className="dashboard-grid grid-cols-1 md:grid-cols-2">
        <ChartWrapper title="Top 10 Spenders" fetchState={topSpenders}>
          <SimpleBarChart 
            data={topSpenders.data || []} 
            xAxisKey="Hshd_num" 
            barDataKey="total_spend" 
            fillColor={chartTheme.cyan}
          />
        </ChartWrapper>

        <ChartWrapper title="Loyalty Trends (Spend by Loyalty/Week)" fetchState={loyaltyTrends}>
          <LoyaltyTrendsChart data={loyaltyTrends.data || []} />
        </ChartWrapper>

        <ChartWrapper title="Avg. Spend by Income Bracket" fetchState={engagementByIncome}>
          <SimpleBarChart 
            data={engagementByIncome.data || []} 
            xAxisKey="income_bracket" 
            barDataKey="avg_spend" 
            fillColor={chartTheme.green}
          />
        </ChartWrapper>

        <ChartWrapper title="Spend by Brand Type" fetchState={brandPreference}>
          <SimplePieChart 
            data={brandPreference.data || []} 
            nameKey="brand_type" 
            dataKey="total_spend"
          />
        </ChartWrapper>

        <ChartWrapper title="Top 10 Frequent Item Pairs (Commodity)" fetchState={frequentPairs}>
          <FrequentPairsTable data={frequentPairs.data || []} />
        </ChartWrapper>

        <ChartWrapper title="Top 10 Popular Products (Commodity)" fetchState={popularProducts}>
          <SimpleBarChart 
            data={popularProducts.data || []} 
            xAxisKey="commodity" 
            barDataKey="total_spend" 
            fillColor={chartTheme.amber}
          />
        </ChartWrapper>

        <ChartWrapper title="Seasonal Sales Trends (Total Spend by Month)" fetchState={seasonalTrends}>
          <SimpleLineChart 
            data={formatSeasonalData(seasonalTrends.data)} 
            xAxisKey="monthLabel" 
            lineDataKey="total_spend" 
            strokeColor={chartTheme.purple}
          />
        </ChartWrapper>

        {/* --- NEW: Association Rules Card --- */}
        <ChartWrapper title="Top Association Rules (If... Then...)" fetchState={associationRules}>
            <AssociationRulesTable data={associationRules.data || []} />
        </ChartWrapper>

        {/* --- ML PREDICTION CARD --- */}
        <div className="dashboard-card cyber-panel-hover col-span-1 md:col-span-2">
          <h3 className="section-title text-[20px]">Predict Customer Lifetime Value (CLV)</h3>

          <form className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4" onSubmit={handlePredictCLV}>
            <input 
              type="text"
              placeholder="Income Range (e.g. 50-75k)"
              value={incomeRange}
              onChange={(e) => setIncomeRange(e.target.value)}
              className="cyber-input"
              required
            />
            <input 
              type="number"
              placeholder="Household Size (e.g. 4)"
              value={hhSize}
              onChange={(e) => setHhSize(e.target.value)}
              className="cyber-input"
              required
            />
            <input 
              type="number"
              placeholder="Children Count"
              value={children}
              onChange={(e) => setChildren(e.target.value)}
              className="cyber-input"
              required
            />
            <button
              type="submit"
              disabled={predictLoading}
              className="cyber-button col-span-1 mt-2 py-2 md:col-span-3"
            >
              {predictLoading ? 'Predicting...' : 'Predict CLV'}
            </button>
          </form>

          {predictError && (
            <p className="rounded-xl border border-red-400/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">{predictError}</p>
          )}

          {predictedCLV !== null && (
            <p className="text-green-300 font-semibold text-lg">
              Predicted CLV: <span className="underline">${predictedCLV}</span>
            </p>
          )}
        </div>

        {/* --- NEW: Basket Item Prediction Card --- */}
        <div className="dashboard-card cyber-panel-hover col-span-1 md:col-span-2">
            <h3 className="section-title text-[20px]">Predict Next Item (Cross-Sell Opportunity)</h3>
            <p className="card-description mb-4">Select commodities currently in the basket to predict the probability of adding DAIRY.</p>

            <form onSubmit={handlePredictBasket}>
                <label htmlFor="commodity-select" className="block text-sm font-semibold text-slate-200 mb-1">Select Items in Basket:</label>
                <Select
                    id="commodity-select"
                    isMulti
                    options={availableFeatures}
                    value={selectedCommodities}
                    onChange={(selectedOptions) => setSelectedCommodities(selectedOptions as any)}
                    isLoading={featuresLoading}
                    placeholder={featuresLoading ? "Loading commodities..." : "Select commodities..."}
                    className="mb-4"
                    styles={{
                        control: (provided, state) => ({
                            ...provided,
                            backgroundColor: 'rgba(15, 23, 42, 0.82)',
                            borderColor: state.isFocused ? '#67e8f9' : 'rgba(103, 232, 249, 0.28)',
                            borderRadius: 12,
                            boxShadow: state.isFocused ? '0 0 0 3px rgba(34, 211, 238, 0.18)' : 'none',
                            color: '#e5eef8',
                        }),
                        menu: (provided) => ({ ...provided, backgroundColor: '#0f172a', border: '1px solid rgba(103, 232, 249, 0.2)' }),
                        option: (provided, state) => ({
                            ...provided,
                            color: state.isFocused ? '#ffffff' : '#dbeafe',
                            backgroundColor: state.isFocused ? 'rgba(79, 70, 229, 0.72)' : 'transparent',
                        }),
                        input: (provided) => ({ ...provided, color: '#e5eef8' }),
                        placeholder: (provided) => ({ ...provided, color: '#94a3b8' }),
                        singleValue: (provided) => ({ ...provided, color: '#e5eef8' }),
                        multiValue: (provided) => ({ ...provided, backgroundColor: 'rgba(34, 211, 238, 0.16)', borderRadius: 8 }),
                        multiValueLabel: (provided) => ({ ...provided, color: '#cffafe', fontWeight: 600 }),
                    }}
                />
                
                <button
                    type="submit"
                    disabled={basketPredictLoading || featuresLoading || availableFeatures.length === 0}
                    className="cyber-button w-full py-2"
                >
                    {basketPredictLoading ? 'Predicting...' : 'Predict Probability of Adding DAIRY'}
                </button>
            </form>

            {basketPredictError && (
                <p className="mt-3 rounded-xl border border-red-400/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">Error: {basketPredictError}</p>
            )}

            {basketPredictResult && (
                <div className="mt-4 p-3 bg-emerald-400/10 border border-emerald-300/25 rounded-xl">
                    <p className="text-green-200 font-semibold">
                        Predicted Probability of adding {basketPredictResult.target_item}:
                        <span className="text-xl font-bold ml-2">{basketPredictResult.probability}%</span>
                    </p>
                     <p className="text-xs text-green-300/90 mt-1">Based on items: {selectedCommodities.map(o => o.label).join(', ') || '(None)'}</p>
                </div>
            )}
             {availableFeatures.length === 0 && !featuresLoading && !basketPredictError && (
                 <p className="text-slate-400 text-sm mt-3">Commodity list for prediction is unavailable. Model might not be loaded correctly.</p>
            )}
        </div>

      </div>

      {/* --- Churn Risk Section --- */}
      <section className="dashboard-section">
        <div className="page-header">
          <h2 className="section-title text-pink-300">Customer Churn Risk (Inactive &gt; 8 Weeks)</h2>
          <p className="page-subtitle text-base">Review households with inactivity signals and summarize at-risk segments.</p>
        </div>
        
        {/* --- Churn Summary Charts --- */}
        <div className="dashboard-grid grid-cols-1 md:grid-cols-2 mb-8">
          <ChartWrapper title="At-Risk Count by Loyalty Status" fetchState={churnRisk}>
            {churnRisk.data?.summary_stats?.count_by_loyalty ? (
               <SimpleBarChart 
                 data={churnRisk.data.summary_stats.count_by_loyalty}
                 xAxisKey="loyalty_flag" 
                 barDataKey="count" 
                 fillColor={chartTheme.pink} // Risk accent
               />
             ) : <p className="text-sm text-slate-400">Summary data unavailable.</p>}
          </ChartWrapper>
          
          <ChartWrapper title="At-Risk Count by Income Range" fetchState={churnRisk}>
             {churnRisk.data?.summary_stats?.count_by_income ? (
               <SimpleBarChart 
                 data={churnRisk.data.summary_stats.count_by_income}
                 xAxisKey="income_range" 
                 barDataKey="count" 
                 fillColor={chartTheme.purple}
               />
             ) : <p className="text-sm text-slate-400">Summary data unavailable.</p>}
          </ChartWrapper>
        </div>
        
        {/* --- At-Risk Customer Table --- */}
        <ChartWrapper title={`At-Risk Customer Details (${churnRisk.data?.at_risk_list?.length || 0})`} fetchState={churnRisk}>
          <div className="cyber-table table-card max-h-96 overflow-x-auto"> 
             <table className="min-w-full divide-y divide-cyan-300/10">
               <thead className="bg-cyan-950/50">
                 <tr>
                   <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-cyan-100">Household Num</th>
                   <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-cyan-100">Last Purchase</th>
                   <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-cyan-100">Loyalty</th>
                   <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-cyan-100">Income Range</th>
                   <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-cyan-100">HH Size</th>
                   <th scope="col" className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-cyan-100">Children</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-cyan-300/10 bg-slate-950/45">
                 {(churnRisk.data?.at_risk_list && churnRisk.data.at_risk_list.length > 0) ? (
                   churnRisk.data.at_risk_list.map((customer) => (
                     <tr key={customer.Hshd_num} className="odd:bg-white/[0.025] hover:bg-cyan-400/10">
                       <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-100">{customer.Hshd_num}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{customer.LastPurchaseDate}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{customer.Loyalty_flag}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{customer.IncomeRange}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{customer.HshdSize}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{customer.Children}</td>
                     </tr>
                   ))
                 ) : (
                   <tr>
                     <td colSpan={6} className="px-6 py-4 text-center text-sm text-slate-400">No customers identified at high risk of churn (based on 8-week inactivity).</td>
                   </tr>
                 )}
               </tbody>
             </table>
          </div>
        </ChartWrapper>
        
        {/* --- Retention Suggestions --- */}
        <section className="panel-card dashboard-section">
           <h2 className="section-title text-amber-200">Potential Retention Strategies</h2>
           <ul>
             <li>Segment offers based on loyalty status and income range (e.g., exclusive discounts for high-income/low-loyalty, reminders for loyal customers).</li>
             <li>Analyze purchase history of at-risk customers to personalize re-engagement campaigns (e.g., promotions on previously bought categories).</li>
             <li>Consider a targeted survey to understand reasons for disengagement.</li>
             <li>Review product assortment or pricing for commodities frequently purchased by the at-risk groups.</li>
           </ul>
        </section>
        
      </section>
    </div>
  );
};

export default DashboardPage;
