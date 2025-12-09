import React, { useState, useEffect } from 'react';
import { PipelineVisualizer } from './components/PipelineVisualizer';
import { StepUpload, StepPreprocess, StepSplit, StepModel } from './components/Steps';
import { StepResults } from './components/StepResults';
import { Dataset, PipelineState, ScalerType, ModelType } from './types';
import { applyScaling } from './utils/dataProcessing';
import { trainModel } from './services/mlService';
import { ArrowRight, ArrowLeft, Play, RefreshCw, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<PipelineState>({
    step: 1,
    dataset: null,
    scaler: 'None',
    splitRatio: 80,
    selectedModel: null,
    isTraining: false,
    results: null,
    error: null,
  });

  // Automatically re-apply scaler when scaler option or dataset changes (but only if we are at step 2)
  useEffect(() => {
    if (state.step >= 2 && state.dataset) {
      const processed = applyScaling(state.dataset.raw, state.dataset.stats, state.scaler, state.dataset.targetColumn);
      setState(prev => ({
        ...prev,
        dataset: prev.dataset ? { ...prev.dataset, processed } : null
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.scaler, state.step]); 

  const handleDataLoaded = (dataset: Dataset) => {
    setState(prev => ({ ...prev, dataset, step: 2, error: null }));
  };

  const handleNext = () => {
    if (state.step === 2) {
      if (!state.dataset?.targetColumn || state.dataset.featureColumns.length === 0) {
        setState(prev => ({ ...prev, error: 'Please select a target column and at least one feature.' }));
        return;
      }
    }
    setState(prev => ({ ...prev, step: prev.step + 1, error: null }));
  };

  const handleBack = () => {
    setState(prev => ({ ...prev, step: prev.step - 1, error: null }));
  };

  const handleRunTraining = async () => {
    if (!state.dataset || !state.selectedModel) return;

    setState(prev => ({ ...prev, isTraining: true, error: null }));

    try {
      const results = await trainModel(state.dataset, state.selectedModel, state.splitRatio, state.scaler);
      setState(prev => ({ 
        ...prev, 
        isTraining: false, 
        results, 
        step: 5 
      }));
    } catch (err: any) {
      setState(prev => ({ 
        ...prev, 
        isTraining: false, 
        error: err.message || 'An error occurred during training.' 
      }));
    }
  };

  const handleReset = () => {
    setState({
      step: 1,
      dataset: null,
      scaler: 'None',
      splitRatio: 80,
      selectedModel: null,
      isTraining: false,
      results: null,
      error: null,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">NeuroFlow <span className="text-indigo-600">AutoML</span></h1>
          </div>
          <button 
            onClick={handleReset} 
            className="text-sm font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Reset Pipeline
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center w-full max-w-6xl mx-auto px-6 py-8">
        
        <PipelineVisualizer currentStep={state.step} />

        <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[500px] flex flex-col relative overflow-hidden">
          
          {/* Content Area */}
          <div className="flex-1 p-8">
            {state.error && (
              <div className="mb-6 bg-rose-50 text-rose-600 px-4 py-3 rounded-lg text-sm font-medium border border-rose-100 flex items-center gap-2">
                <span className="font-bold">Error:</span> {state.error}
              </div>
            )}

            {state.step === 1 && <StepUpload onDataLoaded={handleDataLoaded} />}
            
            {state.step === 2 && state.dataset && (
              <StepPreprocess 
                dataset={state.dataset} 
                scaler={state.scaler}
                setScaler={(s) => setState(prev => ({ ...prev, scaler: s }))}
                setDataset={(d) => setState(prev => ({ ...prev, dataset: d }))}
              />
            )}

            {state.step === 3 && (
              <StepSplit 
                ratio={state.splitRatio} 
                setRatio={(r) => setState(prev => ({ ...prev, splitRatio: r }))}
                totalRows={state.dataset?.processed.length || 0}
              />
            )}

            {state.step === 4 && (
              <StepModel 
                selected={state.selectedModel}
                onSelect={(m) => setState(prev => ({ ...prev, selectedModel: m }))}
              />
            )}

            {state.step === 5 && state.results && (
              <StepResults results={state.results} />
            )}
            
            {/* Loading Overlay */}
            {state.isTraining && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mb-4" />
                <h3 className="text-xl font-bold text-slate-800">Training Model...</h3>
                <p className="text-slate-500 mt-2">Running {state.selectedModel} on cloud instances.</p>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          {state.step !== 1 && state.step !== 5 && (
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
              <button 
                onClick={handleBack}
                className="px-6 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-100 transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              {state.step === 4 ? (
                 <button 
                 onClick={handleRunTraining}
                 disabled={!state.selectedModel}
                 className={`px-8 py-2.5 rounded-lg font-bold shadow-lg shadow-indigo-200 flex items-center gap-2 transition-all transform ${
                   !state.selectedModel 
                     ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                     : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 active:scale-95'
                 }`}
               >
                 <Play className="w-4 h-4 fill-current" /> Run Pipeline
               </button>
              ) : (
                <button 
                  onClick={handleNext}
                  className="px-6 py-2.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-md"
                >
                  Next Step <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
