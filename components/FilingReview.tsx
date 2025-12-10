import React, { useState } from 'react';
import { TaxSummary } from '../types';
import { Button } from './Button';

interface FilingReviewProps {
  summary: TaxSummary;
}

export const FilingReview: React.FC<FilingReviewProps> = ({ summary }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = () => {
    setIsSubmitting(true);
    // Simulate API submission
    setTimeout(() => {
        setIsSubmitting(false);
        setIsSubmitted(true);
    }, 2500);
  };

  const handleDownload = () => {
      // Simulate creating and downloading a PDF report
      const textContent = `
AGENTIC AI TAX SUMMARY 2024
---------------------------
Date: ${new Date().toLocaleDateString()}
Status: ${summary.filingStatus}

Total Income: $${summary.totalIncome}
Total Deductions: $${summary.deductions}
Taxable Income: $${Math.max(0, summary.totalIncome - summary.deductions)}

Estimated Tax: $${summary.estimatedTax}
Estimated Refund: $${summary.estimatedRefund}

This is a generated draft.
      `;
      
      const element = document.createElement("a");
      const file = new Blob([textContent], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = "Tax_Return_Draft_2024.txt";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
  };

  if (isSubmitted) {
      return (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-6 animate-fade-in-up">
              <div className="h-24 w-24 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="h-12 w-12 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
              </div>
              <h2 className="text-3xl font-bold text-slate-900">Return Successfully Transmitted!</h2>
              <p className="text-slate-600 max-w-md">
                  Your federal tax return has been securely transmitted to the IRS. You will receive an email confirmation shortly with your Submission ID.
              </p>
              
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 w-full max-w-md mt-6">
                  <div className="flex justify-between items-center text-sm mb-2">
                      <span className="text-slate-500">Transmission ID</span>
                      <span className="font-mono font-medium text-slate-900">#TRX-8829-2024</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Date</span>
                      <span className="font-medium text-slate-900">{new Date().toLocaleString()}</span>
                  </div>
              </div>

              <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
                  Return to Dashboard
              </Button>
          </div>
      );
  }

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-900">Tax Return Review</h2>
            <p className="text-slate-500">Review your Form 1040 summary before submitting to the IRS.</p>
        </div>
        <div className="flex gap-3">
             <Button variant="outline" onClick={handleDownload}>Download PDF</Button>
             <Button 
                variant="primary" 
                onClick={handleSubmit} 
                isLoading={isSubmitting}
                disabled={summary.totalIncome === 0}
            >
                 {summary.totalIncome === 0 ? 'Add Income to Submit' : 'Submit Return'}
             </Button>
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
                        <span className="font-bold text-slate-900">${Math.max(0, summary.totalIncome - summary.deductions).toLocaleString()}</span>
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
                        <span className={`text-2xl font-bold ${summary.estimatedRefund >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {summary.estimatedRefund >= 0 ? '+ ' : ''}
                            ${summary.estimatedRefund.toLocaleString()}
                        </span>
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