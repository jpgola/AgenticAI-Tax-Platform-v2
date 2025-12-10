import React, { useState, useRef, useEffect } from 'react';
import { TaxDocument, TaxFormType } from '../types';
import { analyzeDocument } from '../services/geminiService';
import { Button } from './Button';

interface DocumentUploadProps {
  documents: TaxDocument[];
  setDocuments: React.Dispatch<React.SetStateAction<TaxDocument[]>>;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ documents, setDocuments }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<TaxDocument | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Record<string, string | number>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedDoc?.extractedData) {
      // Format data for friendly display (e.g. 85000 -> 85,000.00)
      const formattedData: Record<string, string | number> = {};
      Object.entries(selectedDoc.extractedData).forEach(([key, val]) => {
          // Cast val to ensure TS treats it correctly if inferred as unknown
          const safeVal = val as string | number;

          // Check if it is a numeric money field
          const lowerKey = key.toLowerCase();
          const isMoney = typeof safeVal === 'number' && 
                          !lowerKey.includes('ein') && 
                          !lowerKey.includes('tin') && 
                          !lowerKey.includes('zip') && 
                          !lowerKey.includes('year') &&
                          !lowerKey.includes('date') &&
                          !lowerKey.includes('no.');

          if (isMoney) {
              formattedData[key] = (safeVal as number).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          } else {
              formattedData[key] = safeVal;
          }
      });
      setEditFormData(formattedData);
    } else {
      setEditFormData({});
    }
  }, [selectedDoc]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const deleteDocument = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDocuments(prev => prev.filter(doc => doc.id !== id));
    if (selectedDoc?.id === id) setSelectedDoc(null);
  };

  const clearAll = () => {
      if (window.confirm("Are you sure you want to remove all documents?")) {
          setDocuments([]);
          setSelectedDoc(null);
      }
  };

  const processFiles = async (files: FileList | null) => {
    if (!files) return;
    setUploadError(null);

    const validFiles: File[] = [];
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    const ACCEPTED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];

    Array.from(files).forEach(file => {
        if (!ACCEPTED_TYPES.includes(file.type)) {
            setUploadError(`Unsupported file type: ${file.name}. Please upload PDF, PNG, or JPG.`);
            return;
        }
        if (file.size > MAX_SIZE) {
            setUploadError(`File too large: ${file.name}. Max size is 10MB.`);
            return;
        }
        validFiles.push(file);
    });

    if (validFiles.length === 0) return;

    // Create placeholders
    const newDocs: TaxDocument[] = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: 'Unknown',
      status: 'uploading',
      confidence: 0,
      uploadDate: new Date().toLocaleDateString()
    }));

    setDocuments(prev => [...prev, ...newDocs]);

    // Process each file
    validFiles.forEach((file, index) => {
        const docId = newDocs[index].id;

        // Transition to analyzing
        setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: 'analyzing' } : d));

        // Call Gemini Service
        analyzeDocument(file).then((result) => {
            setDocuments(prev => prev.map(d => 
                d.id === docId ? { 
                    ...d, 
                    status: 'verified', 
                    type: result.type as TaxFormType | 'Unknown',
                    confidence: result.confidence,
                    extractedData: result.data
                } : d
            ));
        }).catch(err => {
            console.error(err);
            setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: 'error' } : d));
        });
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files);
    }
    // Reset value to allow selecting the same file again
    e.target.value = '';
  };

  const handleFieldChange = (key: string, value: string) => {
    setEditFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveData = () => {
    if (!selectedDoc) return;
    const finalData: Record<string, string | number> = {};
    
    Object.entries(editFormData).forEach(([key, value]) => {
       const strVal = String(value);
       // Remove commas, $, and spaces to parse
       const cleanVal = strVal.replace(/[$,\s]/g, '');
       const numVal = parseFloat(cleanVal);
       
       // Identification fields should remain strings even if numeric
       const lowerKey = key.toLowerCase();
       const isIdField = lowerKey.includes('ein') || lowerKey.includes('tin') || lowerKey.includes('zip') || lowerKey.includes('no.') || lowerKey.includes('date');
       
       if (!isNaN(numVal) && !isIdField && cleanVal !== '') {
           finalData[key] = numVal;
       } else {
           finalData[key] = value as string | number;
       }
    });

    setDocuments(prev => prev.map(d => d.id === selectedDoc.id ? { ...d, extractedData: finalData } : d));
    setSelectedDoc(null);
  };

  // Grouping Logic
  const getDocCategory = (doc: TaxDocument) => {
    if (doc.status === 'uploading' || doc.status === 'analyzing') return 'Processing';
    if ([TaxFormType.W2, TaxFormType.Form1099DIV, TaxFormType.Form1099INT, TaxFormType.Form1099NEC, TaxFormType.ScheduleK1].includes(doc.type as TaxFormType)) return 'Income Sources';
    if (doc.type === TaxFormType.Receipt) return 'Expenses & Deductions';
    return 'Uncategorized';
  };

  const groupedDocs = documents.reduce((acc, doc) => {
      const cat = getDocCategory(doc);
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(doc);
      return acc;
  }, {} as Record<string, TaxDocument[]>);

  const getIconForType = (type: string) => {
      if (type === TaxFormType.W2) return <div className="h-10 w-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">W-2</div>;
      if (type.includes('1099')) return <div className="h-10 w-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">1099</div>;
      if (type === TaxFormType.Receipt) return <div className="h-10 w-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg></div>;
      return <div className="h-10 w-10 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg></div>;
  };

  // Helper to check for money fields to render icons
  const isLikelyMoney = (key: string, value: string | number) => {
      const lowerKey = key.toLowerCase();
      // Heuristic: Key implies money AND value looks like a number (after cleanup)
      const cleanVal = String(value).replace(/[$,\s]/g, '');
      const isNum = !isNaN(parseFloat(cleanVal));
      const notId = !lowerKey.includes('ein') && !lowerKey.includes('tin') && !lowerKey.includes('zip') && !lowerKey.includes('no.') && !lowerKey.includes('date');
      return isNum && notId;
  };

  return (
    <div className="space-y-8 relative pb-20">
      <div className="flex justify-between items-end">
        <div>
            <h2 className="text-2xl font-bold text-slate-900">Tax Documents</h2>
            <p className="text-slate-500 mt-1">AI automatically extracts data from your uploads to populate your return.</p>
        </div>
        {documents.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearAll} className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                Clear All
            </Button>
        )}
      </div>

      {uploadError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 animate-fade-in-down">
            <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">{uploadError}</span>
            <button onClick={() => setUploadError(null)} className="ml-auto text-red-500 hover:text-red-700">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
      )}

      {/* Modern Drop Zone */}
      <div 
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 cursor-pointer group overflow-hidden ${
          isDragging ? 'border-blue-500 bg-blue-50/50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          multiple 
          accept=".pdf, .png, .jpg, .jpeg"
          onChange={handleFileSelect}
        />
        <div className="relative z-10">
            <div className="h-14 w-14 bg-white shadow-sm border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Click to upload or drag and drop</h3>
            <p className="text-slate-500 mt-1 max-w-sm mx-auto">Support for PDF, PNG, JPG (max 10MB). We'll automatically detect W-2s, 1099s, and receipts.</p>
        </div>
      </div>

      {/* Document Groups */}
      {documents.length === 0 ? (
          <div className="text-center py-12 border border-slate-100 rounded-2xl bg-white/50">
              <p className="text-slate-400">No documents uploaded yet. Start by adding your W-2.</p>
          </div>
      ) : (
          <div className="space-y-8">
            {['Processing', 'Income Sources', 'Expenses & Deductions', 'Uncategorized'].map(category => {
                const categoryDocs = groupedDocs[category];
                if (!categoryDocs || categoryDocs.length === 0) return null;

                return (
                    <div key={category} className="animate-fade-in-up">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 ml-1 flex items-center gap-2">
                            {category === 'Processing' && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span></span>}
                            {category} <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-600 normal-case">{categoryDocs.length}</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {categoryDocs.map(doc => (
                                <div 
                                    key={doc.id} 
                                    className={`relative bg-white rounded-xl border p-4 transition-all duration-200 ${
                                        doc.status === 'verified' 
                                            ? 'border-slate-200 hover:border-blue-300 hover:shadow-md cursor-pointer' 
                                            : 'border-blue-100 bg-blue-50/30'
                                    }`}
                                    onClick={() => doc.status === 'verified' && setSelectedDoc(doc)}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        {getIconForType(doc.type)}
                                        <div className="flex gap-2">
                                            {doc.status === 'verified' && (
                                                <button 
                                                    onClick={(e) => deleteDocument(e, doc.id)}
                                                    className="text-slate-400 hover:text-red-500 p-1 hover:bg-red-50 rounded transition-colors"
                                                >
                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="mb-3">
                                        <h4 className="font-semibold text-slate-900 truncate" title={doc.name}>{doc.name}</h4>
                                        <p className="text-xs text-slate-500">{doc.uploadDate} • {doc.type !== 'Unknown' ? doc.type : 'Auto-detecting...'}</p>
                                    </div>

                                    {/* Status Indicators */}
                                    {doc.status === 'uploading' && (
                                        <div className="w-full bg-blue-100 rounded-full h-1.5 mb-2 overflow-hidden">
                                            <div className="bg-blue-500 h-1.5 rounded-full animate-[shimmer_1s_infinite] w-2/3"></div>
                                        </div>
                                    )}
                                    
                                    {doc.status === 'analyzing' && (
                                        <div className="flex items-center gap-2 text-xs text-blue-700 font-medium">
                                            <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            Extracting Data...
                                        </div>
                                    )}

                                    {doc.status === 'verified' && (
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                Verified {(doc.confidence * 100).toFixed(0)}%
                                            </span>
                                            <span className="text-xs text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                                Review Data &rarr;
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
          </div>
      )}

      {/* Slide-Over Inspector */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => setSelectedDoc(null)}></div>
          <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
            <div className="relative w-screen max-w-md transform transition-all ease-in-out duration-500">
              <div className="h-full flex flex-col bg-white shadow-2xl overflow-y-scroll">
                <div className="py-6 px-4 bg-slate-900 sm:px-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium text-white">Review & Edit Data</h2>
                    <button type="button" className="text-slate-400 hover:text-white" onClick={() => setSelectedDoc(null)}>
                        <span className="sr-only">Close</span>
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">{selectedDoc.name}</p>
                </div>
                
                <div className="relative flex-1 py-6 px-4 sm:px-6 bg-slate-50">
                  {selectedDoc.extractedData ? (
                    <div className="space-y-6">
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3">
                            <svg className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <h3 className="text-sm font-semibold text-blue-900">AI Data Extraction</h3>
                                <p className="text-sm text-blue-700 mt-1">Verify the values below against your original document. Edits are saved automatically to your tax return.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {Object.entries(editFormData).map(([key, value]) => {
                                const isMoney = isLikelyMoney(key, value as string | number);
                                return (
                                <div key={key} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                                        {key}
                                    </label>
                                    <div className="flex items-center">
                                        {isMoney && <span className="text-slate-400 mr-2">$</span>}
                                        <input
                                            type="text"
                                            value={value}
                                            onChange={(e) => handleFieldChange(key, e.target.value)}
                                            className="block w-full text-slate-900 font-medium bg-transparent border-none p-0 focus:ring-0 sm:text-sm placeholder-slate-300"
                                            placeholder={isMoney ? "0.00" : ""}
                                        />
                                        <svg className="h-4 w-4 text-slate-300 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    </div>
                                </div>
                            )})}
                        </div>
                    </div>
                  ) : (
                    <div className="text-center py-10">
                        <p className="text-slate-500">No data extracted.</p>
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0 px-4 py-4 flex justify-end gap-3 border-t border-slate-200 bg-white">
                  <Button variant="outline" onClick={() => setSelectedDoc(null)}>Cancel</Button>
                  <Button onClick={handleSaveData}>Confirm & Save</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};