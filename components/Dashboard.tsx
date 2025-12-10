import React from 'react';
import { TaxSummary } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

interface DashboardProps {
  summary: TaxSummary;
  onNavigate: (view: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ summary, onNavigate }) => {
  
  // Construct data for the main bar chart
  const barData = [
    { name: 'Income', amount: summary.totalIncome, color: '#3b82f6' },
    { name: 'Deductions', amount: summary.deductions, color: '#10b981' },
    { name: 'Tax Liability', amount: summary.estimatedTax, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Main Refund Card */}
        <div className="flex-1 bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full filter blur-3xl opacity-10 -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="relative z-10">
            <p className="text-slate-400 text-sm font-medium mb-1">Estimated Refund</p>
            <h2 className="text-4xl font-bold text-white mb-2">
              ${summary.estimatedRefund.toLocaleString()}
            </h2>
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-900/50 text-emerald-400 border border-emerald-700/50">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
              Calculated Live
            </div>
            
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider">Filing Status</p>
                <p className="font-semibold text-lg">{summary.filingStatus}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider">Compliance</p>
                <div className="flex items-center gap-2">
                   <p className="font-semibold text-lg">{summary.complianceScore}%</p>
                   {summary.complianceScore > 80 && <span className="text-emerald-400 text-xs">Safe</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats / Action Items */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between hover:border-blue-500 transition-colors cursor-pointer" onClick={() => onNavigate('documents')}>
            <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Upload Documents</h3>
              <p className="text-sm text-slate-500 mt-1">AI Auto-Extraction</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <div className="h-10 w-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Smart Deductions</h3>
              <p className="text-sm text-slate-500 mt-1">
                {summary.deductions > 14600 ? 'Itemized Strategy' : 'Standard Deduction'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Overview (Bar Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-4">Financial Overview</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `$${val/1000}k`}/>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  cursor={{fill: '#f1f5f9'}}
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-4">Filing Timeline</h3>
          <div className="relative pl-4 border-l-2 border-slate-100 space-y-6">
            <div className="relative">
              <div className="absolute -left-[21px] bg-blue-500 h-3 w-3 rounded-full ring-4 ring-white"></div>
              <p className="text-xs text-slate-500 mb-0.5">Today, 10:23 AM</p>
              <p className="text-sm font-medium text-slate-900">Started Filing</p>
            </div>
            {summary.totalIncome > 0 && (
              <div className="relative animate-fade-in-up">
                <div className="absolute -left-[21px] bg-blue-500 h-3 w-3 rounded-full ring-4 ring-white"></div>
                <p className="text-xs text-slate-500 mb-0.5">Today, {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                <p className="text-sm font-medium text-slate-900">Documents Processed</p>
              </div>
            )}
             <div className="relative">
              <div className={`absolute -left-[21px] h-3 w-3 rounded-full ring-4 ring-white ${summary.filingStatus === 'Review Ready' ? 'bg-blue-500' : 'bg-slate-200'}`}></div>
              <p className={`text-xs mb-0.5 ${summary.filingStatus === 'Review Ready' ? 'text-slate-500' : 'text-slate-400'}`}>Upcoming</p>
              <p className={`text-sm ${summary.filingStatus === 'Review Ready' ? 'font-medium text-slate-900' : 'text-slate-500'}`}>Final Review</p>
            </div>
             <div className="relative">
              <div className="absolute -left-[21px] bg-slate-200 h-3 w-3 rounded-full ring-4 ring-white"></div>
              <p className="text-xs text-slate-400 mb-0.5">Final</p>
              <p className="text-sm text-slate-500">E-File to IRS</p>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Section (Pie Charts) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-4">Income Sources</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie 
                            data={summary.incomeBreakdown} 
                            innerRadius={60} 
                            outerRadius={80} 
                            paddingAngle={5} 
                            dataKey="value"
                        >
                        {summary.incomeBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                        <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-4">Deduction Allocation</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie 
                            data={summary.deductionBreakdown} 
                            innerRadius={60} 
                            outerRadius={80} 
                            paddingAngle={5} 
                            dataKey="value"
                        >
                        {summary.deductionBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                        <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  );
};