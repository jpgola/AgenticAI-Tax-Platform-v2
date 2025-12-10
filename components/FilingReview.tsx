import React from 'react';
import { TaxSummary } from '../types';
import { Button } from './Button';

interface FilingReviewProps {
  summary: TaxSummary;
}

export const FilingReview: React.FC<FilingReviewProps> = ({ summary }) => {
  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-900">Tax Return Review</h2>
            <p className="text-slate-500">Review your Form 1040 summary before submitting to the IRS.</p>
        </div>
        <div className="flex gap-3">
             <Button variant="outline">Download PDF</Button>
             <Button variant="primary">Submit Return</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main 1040 Form Summary */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-800">Federal 1040 Summary</h3>
                    <span className="text-xs font-mono text-slate-400">DRAFT-2024-v1</span>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                        <span className="text-slate-600">Total Income (W-2, 1099)</span>
                        <span className="font-medium text-slate-900">${summary.totalIncome.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                        <span className="text-slate-600">Total Deductions</span>
                        <span className="font-medium text-emerald-600">-${summary.deductions.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-100 bg-slate-50 -mx-6 px-6">
                        <span className="font-medium text-slate-900">Taxable Income</span>
                        <span className="font-bold text-slate-900">${(summary.totalIncome - summary.deductions).toLocaleString()}</span>
                    </div>
                     <div className="flex justify-between items-center py-2 border-b border-slate-100">
                        <span className="text-slate-600">Total Tax Liability</span>
                        <span className="font-medium text-slate-900">${summary.estimatedTax.toLocaleString()}</span>
                    </div>
                     <div className="flex justify-between items-center py-2 border-b border-slate-100">
                        <span className="text-slate-600">Taxes Withheld</span>
                        <span className="font-medium text-slate-900">${(summary.estimatedTax + summary.estimatedRefund).toLocaleString()}</span>
                    </div>
                     <div className="flex justify-between items-center pt-4">
                        <span className="text-lg font-bold text-slate-900">Estimated Refund</span>
                        <span className="text-2xl font-bold text-emerald-600">+ ${summary.estimatedRefund.toLocaleString()}</span>
                    </div>
                </div>
            </div>

             <div className="bg-blue-50 rounded-xl border border-blue-100 p-4 flex gap-4 items-start">
                 <div className="flex-shrink-0">
                     <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                 </div>
                 <div>
                     <h4 className="text-sm font-semibold text-blue-900">AI Insight</h4>
                     <p className="text-sm text-blue-700 mt-1">
                         Based on your 1099 income, we applied the standard deduction which resulted in a higher refund than itemizing. Your return has passed our automated audit risk check with a 94% safety score.
                     </p>
                 </div>
             </div>
        </div>

        {/* Sidebar Status */}
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-800 mb-4">Submission Steps</h3>
                <div className="space-y-6">
                    <div className="flex gap-3">
                        <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                             <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-900">Document Verification</p>
                            <p className="text-xs text-slate-500">All documents processed.</p>
                        </div>
                    </div>
                     <div className="flex gap-3">
                        <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                             <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-900">Data Entry</p>
                            <p className="text-xs text-slate-500">W-2 & 1099 data extracted.</p>
                        </div>
                    </div>
                     <div className="flex gap-3">
                        <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 ring-4 ring-blue-50">
                             <span className="text-xs font-bold">3</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-900">Final Review</p>
                            <p className="text-xs text-slate-500">Waiting for your approval.</p>
                        </div>
                    </div>
                     <div className="flex gap-3 opacity-50">
                        <div className="h-6 w-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0">
                             <span className="text-xs font-bold">4</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-900">E-File Transmission</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl shadow-lg p-6 text-white">
                <h3 className="font-semibold text-lg mb-2">Pro Protection</h3>
                <p className="text-sm text-slate-300 mb-4">You are covered by our audit defense guarantee.</p>
                <div className="flex items-center gap-2 text-xs text-emerald-400 bg-white/10 p-2 rounded-lg">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                    Active Coverage
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};