import React, { useState, useRef, useEffect } from 'react';
import { TaxDocument, TaxFormType } from '../types';
import { analyzeDocumentMock } from '../services/geminiService';
import { Button } from './Button';

interface DocumentUploadProps {
  documents: TaxDocument[];
  setDocuments: React.Dispatch<React.SetStateAction<TaxDocument[]>>;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ documents, setDocuments }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<TaxDocument | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  // Local state for editing form data
  const [editFormData, setEditFormData] = useState<Record<string, string | number>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync local edit state when a document is selected
  useEffect(() => {
    if (selectedDoc?.extractedData) {
      setEditFormData(selectedDoc.extractedData);
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

    const newDocs: TaxDocument[] = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: 'Unknown',
      status: 'uploading',
      confidence: 0,
      uploadDate: new Date().toLocaleDateString()
    }));

    setDocuments(prev => [...prev, ...newDocs]);

    // Simulate upload and then AI analysis
    for (let i = 0; i < newDocs.length; i++) {
        const docId = newDocs[i].id;
        
        // Step 1: Upload finished, start analyzing
        setTimeout(() => {
            setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: 'analyzing' } : d));
            
            // Step 2: Analysis finished
            analyzeDocumentMock(newDocs[i].name).then((result) => {
                let detectedType: TaxFormType | 'Unknown' = 'Unknown';
                const nameLower = newDocs[i].name.toLowerCase();
                
                if (nameLower.includes('w2') || nameLower.includes('w-2')) detectedType = TaxFormType.W2;
                else if (nameLower.includes('1099-div')) detectedType = TaxFormType.Form1099DIV;
                else if (nameLower.includes('1099-int')) detectedType = TaxFormType.Form1099INT;
                else if (nameLower.includes('1099')) detectedType = TaxFormType.Form1099NEC;
                else if (nameLower.includes('k-1') || nameLower.includes('k1')) detectedType = TaxFormType.ScheduleK1;
                else if (nameLower.includes('receipt')) detectedType = TaxFormType.Receipt;

                setDocuments(prev => prev.map(d => 
                    d.id === docId ? { 
                        ...d, 
                        status: 'verified', 
                        type: detectedType,
                        confidence: 0.98,
                        extractedData: result.data
                    } : d
                ));
            });

        }, 1000 + (i * 500));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
  };

  const handleFieldChange = (key: string, value: string) => {
    setEditFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveData = () => {
    if (!selectedDoc) return;
    
    // Convert extracted data back to numbers where appropriate for calculation logic
    const finalData: Record<string, string | number> = {};
    Object.entries(editFormData).forEach(([key, value]) => {
       // Cast value to string | number to handle potential inference issues
       const val = value as string | number;
       // Attempt to parse as number if it looks like one and was likely a number before
       // Simple heuristic: if it casts to a number and isn't empty string
       const numVal = Number(val);
       const isNumeric = !isNaN(numVal) && val !== '';
       finalData[key] = isNumeric ? numVal : val;
    });

    setDocuments(prev => prev.map(d => d.id === selectedDoc.id ? { ...d, extractedData: finalData } : d));
    setSelectedDoc(null);
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-end">
        <div>
            <h2 className="text-2xl font-bold text-slate-900">Documents</h2>
            <p className="text-slate-500">Upload W-2s, 1099s, and expense receipts.</p>
        </div>
        {documents.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearAll} className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                Clear All
            </Button>
        )}
      </div>

      {/* Error Message */}
      {uploadError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 animate-fade-in-down">
            <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">{uploadError}</span>
            <button onClick={() => setUploadError(null)} className="ml-auto text-red-500 hover:text-red-700">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
      )}

      {/* Drop Zone */}
      <div 
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          multiple 
          accept=".pdf, .png, .jpg, .jpeg"
          onChange={handleFileSelect}
        />
        <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-slate-900">Click to upload or drag and drop</h3>
        <p className="text-slate-500 mt-1">PDF, PNG, JPG (max 10MB)</p>
      </div>

      {/* File List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-semibold text-slate-700">Uploaded Files ({documents.length})</h3>
        </div>
        <ul className="divide-y divide-slate-100">
          {documents.length === 0 && (
              <li className="px-6 py-8 text-center text-slate-400 italic">No documents uploaded yet.</li>
          )}
          {documents.map((doc) => (
            <li 
              key={doc.id} 
              className={`px-6 py-4 flex items-center justify-between transition-colors group ${doc.status === 'verified' ? 'cursor-pointer hover:bg-slate-50' : ''}`}
              onClick={() => doc.status === 'verified' && setSelectedDoc(doc)}
            >
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-slate-100 text-slate-500 font-bold text-xs uppercase">
                  {doc.type !== 'Unknown' ? doc.type.substring(0,3) : 'DOC'}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{doc.name}</p>
                  <p className="text-xs text-slate-500">{doc.uploadDate} • {doc.type}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {doc.status === 'analyzing' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 animate-pulse">
                        <svg className="animate-spin -ml-0.5 mr-1.5 h-3 w-3 text-blue-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        AI Analyzing
                    </span>
                )}
                {doc.status === 'verified' && (
                  <div className="flex items-center gap-4">
                     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                         <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                         Verified {(doc.confidence * 100).toFixed(0)}%
                     </span>
                     <svg className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                  </div>
                )}
                 {doc.status === 'uploading' && (
                     <span className="text-xs text-slate-400">Uploading...</span>
                )}
                
                {/* Delete Button - Only visible on hover or if mobile */}
                <button 
                    onClick={(e) => deleteDocument(e, doc.id)}
                    className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors focus:outline-none"
                    title="Remove document"
                >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* AI Inspector Slide-over */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-slate-500 bg-opacity-75 transition-opacity" onClick={() => setSelectedDoc(null)}></div>
          <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
            <div className="relative w-screen max-w-md transform transition-all ease-in-out duration-500 sm:duration-700">
              <div className="h-full flex flex-col bg-white shadow-xl overflow-y-scroll">
                <div className="py-6 px-4 bg-slate-900 sm:px-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium text-white" id="slide-over-title">
                      Review & Edit Data
                    </h2>
                    <div className="ml-3 h-7 flex items-center">
                      <button type="button" className="bg-slate-900 rounded-md text-slate-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-white" onClick={() => setSelectedDoc(null)}>
                        <span className="sr-only">Close panel</span>
                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="mt-1">
                    <p className="text-sm text-slate-400">
                      {selectedDoc.name} • {selectedDoc.type}
                    </p>
                  </div>
                </div>
                <div className="relative flex-1 py-6 px-4 sm:px-6">
                  {selectedDoc.extractedData ? (
                    <div className="space-y-6">
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                             <div className="flex">
                                <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-blue-800">AI Confidence: High ({selectedDoc.confidence * 100}%)</h3>
                                    <div className="mt-2 text-sm text-blue-700">
                                        <p>Review the extracted values. Click any field to edit if the OCR was incorrect.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {Object.entries(editFormData).map(([key, value]) => (
                                <div key={key} className="relative">
                                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                                        {key}
                                    </label>
                                    <div className="relative rounded-md shadow-sm">
                                        <input
                                            type="text"
                                            value={value}
                                            onChange={(e) => handleFieldChange(key, e.target.value)}
                                            className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-slate-300 rounded-md p-2.5 border text-slate-900 font-semibold"
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                  ) : (
                    <div className="text-center py-10">
                        <p className="text-slate-500">No data extracted.</p>
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0 px-4 py-4 flex justify-end gap-3 border-t border-slate-200 bg-slate-50">
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