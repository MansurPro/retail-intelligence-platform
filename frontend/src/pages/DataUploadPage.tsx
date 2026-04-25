import React, { useState, ChangeEvent } from 'react';
import { useAuth } from '../context/AuthContext'; // To get the token for authentication

// Type for individual file upload state
interface FileUploadState {
  file: File | null;
  status: 'idle' | 'uploading' | 'success' | 'error' | 'polling'; // Added polling status
  message: string | null;
}

// Type for overall process state
type UploadStep = 'households' | 'products' | 'transactions' | 'done';

const DataUploadPage: React.FC = () => {
  const { token } = useAuth();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  // State for each file (still needed to hold the file object and status)
  const [fileStates, setFileStates] = useState<Record<UploadStep, FileUploadState>>({
    households: { file: null, status: 'idle', message: null },
    products: { file: null, status: 'idle', message: null },
    transactions: { file: null, status: 'idle', message: null },
    done: { file: null, status: 'idle', message: null } // Placeholder
  });
  
  // State for current step in the process
  const [currentStep, setCurrentStep] = useState<UploadStep>('households');
  
  // State for dashboard update indicator (global for the page)
  const [isDashboardUpdating, setIsDashboardUpdating] = useState(false);
  let pollingIntervalId: NodeJS.Timeout | null = null; // Keep track of polling interval

  // File selection handler - updates the specific file state
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    setFileStates(prev => ({
      ...prev,
      [currentStep]: { file: file, status: 'idle', message: file ? 'File selected' : null } 
    }));
  };

  // Upload function for the *current step's* file
  const uploadCurrentFile = async () => {
    const stepState = fileStates[currentStep];
    const endpointMap: Record<string, string> = {
        households: '/upload/households',
        products: '/upload/products',
        transactions: '/upload/transactions'
    };
    const endpoint = endpointMap[currentStep];

    if (!stepState || !endpoint) {
        console.error("Invalid step or endpoint");
        setFileStates(prev => ({ ...prev, [currentStep]: {...stepState, status:'error', message:'Internal error: Invalid step.'}}));
        return;
    }

    if (!stepState.file) {
      setFileStates(prev => ({ ...prev, [currentStep]: {...stepState, status: 'error', message: 'No file selected.'}}));
      return;
    }
    if (!token) {
      setFileStates(prev => ({ ...prev, [currentStep]: {...stepState, status: 'error', message: 'Authentication token not found.'}}));
      return;
    }

    // Update status to uploading
    setFileStates(prev => ({ ...prev, [currentStep]: {...stepState, status: 'uploading', message: 'Uploading...'}}));

    const formData = new FormData();
    formData.append('file', stepState.file);

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || `Upload failed with status: ${response.status}`);
      }
      
      // Backend confirmed successful processing & triggered update
      // Update status, show backend message, start polling, and move to next step
      setFileStates(prev => ({ ...prev, [currentStep]: {...stepState, status: 'polling', message: data.message || 'Upload processed, updating dashboard...' }}));
      startPollingDashboardStatus(); // Start global polling indicator
      advanceStep(); // Move to the next step
      
    } catch (err) {
      let errorMessage = 'An unknown error occurred.';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
       // Update status to error
      setFileStates(prev => ({ ...prev, [currentStep]: {...stepState, status: 'error', message: `Upload failed: ${errorMessage}`}}));
    }
  };

  // Function to advance to the next step
  const advanceStep = () => {
      if (currentStep === 'households') setCurrentStep('products');
      else if (currentStep === 'products') setCurrentStep('transactions');
      else if (currentStep === 'transactions') setCurrentStep('done');
  };

  // Polling function - simplified to just manage the global indicator
  const startPollingDashboardStatus = () => {
      if (pollingIntervalId) clearInterval(pollingIntervalId); // Clear previous interval if any
      setIsDashboardUpdating(true); // Show indicator
      
      pollingIntervalId = setInterval(async () => {
          try {
              const response = await fetch(`${API_BASE_URL}/dashboard-update-status`);
              if (!response.ok) {
                  console.error("Polling error: Status check failed");
                  // Stop polling on error maybe?
                  // clearInterval(pollingIntervalId!);
                  // setIsDashboardUpdating(false);
                  return; 
              }
              const data = await response.json();
              if (data.updating === false) {
                  clearInterval(pollingIntervalId!);
                  pollingIntervalId = null;
                  setIsDashboardUpdating(false); // Hide indicator
                  console.log("Dashboard update complete (polled).");
                  // We don't need to update individual file statuses here anymore
              }
          } catch (error) {
              console.error("Polling error:", error);
              clearInterval(pollingIntervalId!); // Stop polling on error
              pollingIntervalId = null;
              setIsDashboardUpdating(false); 
              // Maybe show a general polling error message?
          }
      }, 3000); // Poll every 3 seconds
  };

  // Function to reset the entire process
   const handleReset = () => {
       if (pollingIntervalId) clearInterval(pollingIntervalId);
       setIsDashboardUpdating(false);
       setCurrentStep('households');
       setFileStates({
           households: { file: null, status: 'idle', message: null },
           products: { file: null, status: 'idle', message: null },
           transactions: { file: null, status: 'idle', message: null },
           done: { file: null, status: 'idle', message: null } 
       });
   };

  // Helper to render the input for the current step
  const renderCurrentStepInput = () => {
    const stepConfig = {
        households: { label: 'Step 1: Upload Households Data (.csv)', required: true },
        products: { label: 'Step 2: Upload Products Data (.csv)', required: true },
        transactions: { label: 'Step 3: Upload Transactions Data (.csv)', required: true },
        done: { label: 'Finished!', required: false}
    };

    if (currentStep === 'done') {
      return (
        <div className="upload-step text-center">
          <p className="font-semibold text-green-200">All steps processed.</p>
          <p className="text-sm text-slate-300">Check the status messages above for details. Dashboard data may still be updating in the background.</p>
        </div>
      );
    }
    
    const config = stepConfig[currentStep];
    const state = fileStates[currentStep];
    const isUploadingCurrent = state.status === 'uploading' || state.status === 'polling';

    let statusColor = 'text-slate-300';
    if (state.status === 'success' || state.status === 'polling') statusColor = 'text-green-300'; // Treat polling as temp success
    if (state.status === 'error') statusColor = 'text-red-300';
    if (state.status === 'uploading') statusColor = 'text-cyan-300';
    
    return (
      <div className="upload-step">
        <label className="upload-step-title block">
          {config.label}
        </label>
        <input 
          type="file" 
          accept=".csv" 
          onChange={handleFileChange}
          className="file-input"
          disabled={isUploadingCurrent || isDashboardUpdating}
          key={currentStep} // Force re-render on step change to clear file input visually
        />
        {state.message && (
          <p className={`text-xs mb-3 ${statusColor}`}>
            {state.status === 'uploading' && <span className="animate-pulse">(Uploading file...) </span>}
             {state.status === 'polling' && <span className="animate-pulse">(Processing & updating dashboard...) </span>}
            {state.message}
          </p>
        )}
        <div className="upload-actions">
             <button 
                 type="button" // Prevent form submission
                 onClick={uploadCurrentFile} 
                 className="primary-button"
                 disabled={!state.file || isUploadingCurrent || isDashboardUpdating}
             >
                 {isUploadingCurrent ? 'Processing...' : `Upload ${currentStep.charAt(0).toUpperCase() + currentStep.slice(1)}`}
             </button>
            {/* Add Skip Button for all steps except 'done' */}
            <button 
                type="button" 
                onClick={advanceStep} // Simply advances to the next step
                className="skip-button"
                disabled={isUploadingCurrent || isDashboardUpdating} // Disable during upload/polling
            >
                Skip
            </button>
         </div>
      </div>
    );
  };

  return (
    <div className="page-container relative">
      
      {/* Dashboard Updating Indicator Overlay */} 
      {isDashboardUpdating && (
          <div className="absolute inset-0 bg-slate-950/75 flex items-center justify-center z-50 rounded-2xl backdrop-blur-sm">
              <div className="panel-card rounded-2xl p-6 text-center">
                  <p className="text-lg font-semibold text-cyan-200 animate-pulse">Updating Dashboard Data...</p>
                  <p className="text-sm text-slate-300 mt-2">Please wait, this might take a minute.</p>
              </div>
          </div>
      )}

      <header className="page-header">
        <h2 className="page-title">Data Upload & Refresh</h2>
        <p className="page-subtitle">
          Upload updated household, transaction, and product CSV files to refresh the analytics workspace.
        </p>
      </header>

      <div className="panel-card upload-card">
        <p className="mb-6 text-sm text-slate-400">
          Upload datasets sequentially. Uploading will 
          <strong className="text-amber-300"> append</strong> the new data to the existing database tables.
        </p>

        {/* Render current step */} 
        {renderCurrentStepInput()}

         {/* Only show reset button if process has started */} 
         {(currentStep !== 'households' || fileStates.households.file) && (
           <button 
               type="button" 
               onClick={handleReset}
               className="skip-button mt-6 w-full"
               disabled={isDashboardUpdating || fileStates[currentStep]?.status === 'uploading' || fileStates[currentStep]?.status === 'polling'}
           >
               Reset Upload Process
           </button>
          )}
      </div>

    </div>
  );
};

export default DataUploadPage; 
