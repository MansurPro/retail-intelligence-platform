import React from 'react';
import { FrequentPair } from '../../types/dashboardData'; // Use defined type

interface FrequentPairsTableProps {
  data: FrequentPair[];
}

const FrequentPairsTable: React.FC<FrequentPairsTableProps> = ({ data }) => {
  if (!Array.isArray(data) || data.length === 0) {
    return <p className="text-sm text-slate-400">No frequent pair data available.</p>;
  }

  return (
    <div className="cyber-table overflow-x-auto shadow-none">
        <table className="min-w-full divide-y divide-cyan-300/10">
            <thead className="bg-cyan-950/50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-bold uppercase tracking-wide text-cyan-100 sm:pl-6">Item 1 (Commodity)</th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-cyan-100">Item 2 (Commodity)</th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right text-xs font-bold uppercase tracking-wide text-cyan-100">Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-300/10 bg-slate-950/45">
              {data.map((item, index) => (
                <tr key={`${item.item1}-${item.item2}-${index}`} className="odd:bg-white/[0.025] hover:bg-cyan-400/10"> 
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-semibold text-slate-100 sm:pl-6">{item.item1}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-300">{item.item2}</td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-semibold text-slate-100 sm:pr-6">{item.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
    </div>
  );
};

export default FrequentPairsTable; 
