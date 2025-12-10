import React, { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { DocumentUpload } from './components/DocumentUpload';
import { AgentChat } from './components/AgentChat';
import { Settings } from './components/Settings';
import { FilingReview } from './components/FilingReview';
import { User, ViewState, TaxDocument, TaxSummary } from './types';
import { calculateTaxSummary } from './services/taxCalculator';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [documents, setDocuments] = useState<TaxDocument[]>([]);
  
  // Calculate summary dynamically based on uploaded documents
  // Default to 0 values if no docs
  const [summary, setSummary] = useState<TaxSummary>({
    totalIncome: 0,
    deductions: 14600, // Standard deduction 2024
    estimatedTax: 0,
    estimatedRefund: 0,
    filingStatus: 'Not Started',
    complianceScore: 0,
    incomeBreakdown: [],
    deductionBreakdown: []
  });

  // Effect to recalculate tax whenever documents change
  useEffect(() => {
    const newSummary = calculateTaxSummary(documents);
    setSummary(newSummary);
  }, [documents]);

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard summary={summary} onNavigate={setCurrentView} />;
      case 'documents':
        return <DocumentUpload documents={documents} setDocuments={setDocuments} />;
      case 'filing':
        return <FilingReview summary={summary} />;
      case 'settings':
        return <Settings user={user} />;
      default:
        return (
            <div className="flex items-center justify-center h-full text-slate-400">
                Work in progress
            </div>
        );
    }
  };

  return (
    <>
      <Layout 
        user={user} 
        currentView={currentView} 
        onChangeView={setCurrentView}
        onLogout={() => setUser(null)}
      >
        {renderView()}
      </Layout>
      <AgentChat summary={summary} />
    </>
  );
}

export default App;