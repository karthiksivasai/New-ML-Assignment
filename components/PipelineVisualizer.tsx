import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

interface Props {
  currentStep: number;
}

const steps = [
  { id: 1, label: 'Upload Data' },
  { id: 2, label: 'Preprocessing' },
  { id: 3, label: 'Train/Test Split' },
  { id: 4, label: 'Model Selection' },
  { id: 5, label: 'Results' },
];

export const PipelineVisualizer: React.FC<Props> = ({ currentStep }) => {
  return (
    <div className="w-full py-6 px-4 mb-8">
      <div className="flex items-center justify-between relative max-w-4xl mx-auto">
        {/* Connection Line */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-10 transform -translate-y-1/2 rounded-full" />
        <div 
          className="absolute top-1/2 left-0 h-1 bg-indigo-600 -z-10 transform -translate-y-1/2 rounded-full transition-all duration-500" 
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;

          return (
            <div key={step.id} className="flex flex-col items-center bg-slate-50 px-2">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                  isCompleted ? 'bg-indigo-600 border-indigo-600' :
                  isCurrent ? 'bg-white border-indigo-600 shadow-lg scale-110' :
                  'bg-white border-slate-300'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-6 h-6 text-white" />
                ) : (
                  <span className={`font-bold ${isCurrent ? 'text-indigo-600' : 'text-slate-400'}`}>{step.id}</span>
                )}
              </div>
              <span className={`mt-2 text-xs font-semibold uppercase tracking-wider ${isCurrent ? 'text-indigo-700' : 'text-slate-400'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
