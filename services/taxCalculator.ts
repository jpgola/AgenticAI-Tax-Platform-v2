import { TaxDocument, TaxSummary } from '../types';

export const calculateTaxSummary = (documents: TaxDocument[]): TaxSummary => {
  let totalIncome = 0;
  let fedWithholding = 0;
  let potentialDeductions = 0;
  
  // Track specific income sources
  let w2Income = 0;
  let necIncome = 0;
  let divIncome = 0;
  let intIncome = 0;
  let k1Income = 0;

  // 1. Aggregate data from verified documents
  documents.forEach(doc => {
    if (doc.status === 'verified' && doc.extractedData) {
      const data = doc.extractedData;
      
      // Parse W-2 Data
      if (doc.type === 'W-2') {
        const val = Number(data['Wages, Tips'] || 0);
        totalIncome += val;
        w2Income += val;
        fedWithholding += Number(data['Fed Income Tax'] || 0);
      }
      // Parse 1099-NEC Data
      else if (doc.type === '1099-NEC') {
        const val = Number(data['Nonemployee Comp'] || 0);
        totalIncome += val;
        necIncome += val;
        fedWithholding += Number(data['Fed Tax Withheld'] || 0);
      }
      // Parse 1099-DIV Data
      else if (doc.type === '1099-DIV') {
         const val = Number(data['Total Ordinary Dividends'] || 0);
         totalIncome += val;
         divIncome += val;
         fedWithholding += Number(data['Federal Income Tax Withheld'] || 0);
      }
      // Parse 1099-INT Data
      else if (doc.type === '1099-INT') {
         const val = Number(data['Interest Income'] || 0);
         totalIncome += val;
         intIncome += val;
         fedWithholding += Number(data['Federal Income Tax Withheld'] || 0);
      }
      // Parse Schedule K-1 Data
      else if (doc.type === 'Schedule K-1') {
         // Simply summing business and rental income for estimation purposes
         const businessIncome = Number(data['Ordinary Business Income'] || 0);
         const rentalIncome = Number(data['Net Rental Real Estate Income'] || 0);
         const netK1 = businessIncome + rentalIncome;
         
         totalIncome += netK1;
         k1Income += netK1;
      }
      // Parse Receipts
      else if (doc.type === 'Receipt') {
        potentialDeductions += Number(data['Amount'] || 0);
      }
    }
  });

  // 2. Tax Calculation Logic (Simplified 2024 Tax Brackets for Demo)
  // Standard Deduction for Single Filer (2024)
  const STANDARD_DEDUCTION = 14600; 
  
  // Determine whether to itemize or take standard deduction
  const finalDeductions = Math.max(STANDARD_DEDUCTION, potentialDeductions);
  
  // Calculate Taxable Income
  const taxableIncome = Math.max(0, totalIncome - finalDeductions);
  
  // Estimate Federal Tax (Progressive brackets: 10%, 12%, 22%)
  let estimatedTax = 0;
  if (taxableIncome > 0) {
     if (taxableIncome < 11600) {
        estimatedTax = taxableIncome * 0.10;
     } else if (taxableIncome < 47150) {
        estimatedTax = 1160 + ((taxableIncome - 11600) * 0.12);
     } else {
        estimatedTax = 5426 + ((taxableIncome - 47150) * 0.22);
     }
  }

  const estimatedRefund = fedWithholding - estimatedTax;

  // 3. Determine Filing Status
  let filingStatus: TaxSummary['filingStatus'] = 'Not Started';
  if (documents.length > 0) filingStatus = 'In Progress';
  if (documents.length > 0 && documents.every(d => d.status === 'verified')) filingStatus = 'Review Ready';

  // 4. Calculate Compliance Score
  let complianceScore = 100;
  if (documents.some(d => d.status === 'error')) complianceScore -= 20;
  if (documents.some(d => d.type === 'Unknown')) complianceScore -= 10;
  if (documents.length === 0) complianceScore = 0;
  
  // 5. Construct Breakdowns
  const incomeBreakdown = [
    { name: 'W-2 Wages', value: w2Income, color: '#3b82f6' }, // Blue
    { name: '1099-NEC', value: necIncome, color: '#8b5cf6' }, // Purple
    { name: 'Dividends', value: divIncome, color: '#10b981' }, // Emerald
    { name: 'Interest', value: intIncome, color: '#f59e0b' }, // Amber
    { name: 'K-1 Income', value: k1Income, color: '#ec4899' }, // Pink
  ].filter(i => i.value > 0);

  if (incomeBreakdown.length === 0) {
      incomeBreakdown.push({ name: 'No Income', value: 1, color: '#e2e8f0' });
  }

  const deductionBreakdown = [];
  if (finalDeductions === STANDARD_DEDUCTION) {
      deductionBreakdown.push({ name: 'Standard Deduction', value: STANDARD_DEDUCTION, color: '#10b981' });
  } else {
      deductionBreakdown.push({ name: 'Business Expenses', value: potentialDeductions, color: '#f59e0b' });
  }
  
  return {
    totalIncome,
    deductions: finalDeductions,
    estimatedTax: Math.round(estimatedTax),
    estimatedRefund: Math.round(estimatedRefund), // Positive = Refund, Negative = Owe
    filingStatus,
    complianceScore,
    incomeBreakdown,
    deductionBreakdown
  };
};