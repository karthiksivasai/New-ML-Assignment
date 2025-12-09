import React, { useCallback, useMemo, useState } from 'react';
import { UploadCloud, FileText, BarChart2, Split, Database, Play, Check, AlertCircle, FilePlus } from 'lucide-react';
import { parseCSV, calculateStats } from '../utils/dataProcessing';
import { Dataset, ScalerType, ModelType } from '../types';

// --- Step 1: Upload ---
interface UploadProps {
  onDataLoaded: (dataset: Dataset) => void;
}

export const StepUpload: React.FC<UploadProps> = ({ onDataLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const processFile = (file: File) => {
    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const { data, columns } = parseCSV(text);
        const stats = calculateStats(data, columns);
        
        onDataLoaded({
          raw: data,
          processed: data,
          columns,
          stats,
          targetColumn: null,
          featureColumns: [],
        });
      } catch (err: any) {
        alert(err.message || 'Error parsing CSV. Please ensure it is a valid format.');
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      alert("Failed to read file.");
      setIsLoading(false);
    }
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'text/csv' || file?.name.endsWith('.csv')) {
      processFile(file);
    } else {
      alert("Please upload a valid .csv file.");
    }
  };

  return (
    <div 
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer relative min-h-[300px]
        ${isDragging 
          ? 'border-indigo-500 bg-indigo-50 scale-[1.02] shadow-xl' 
          : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400'
        }`}
    >
      <input 
        type="file" 
        accept=".csv" 
        onChange={handleFileChange} 
        disabled={isLoading}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />
      
      {isLoading ? (
        <div className="flex flex-col items-center animate-pulse">
           <div className="w-12 h-12 bg-slate-200 rounded-full mb-4"></div>
           <div className="h-4 w-32 bg-slate-200 rounded"></div>
        </div>
      ) : (
        <>
          <div className={`p-4 rounded-full mb-4 transition-colors ${isDragging ? 'bg-indigo-200' : 'bg-indigo-100'}`}>
            <UploadCloud className={`w-10 h-10 ${isDragging ? 'text-indigo-700' : 'text-indigo-600'}`} />
          </div>
          <h3 className={`text-xl font-semibold transition-colors ${isDragging ? 'text-indigo-800' : 'text-slate-800'}`}>
            {isDragging ? 'Drop file here' : 'Upload Dataset'}
          </h3>
          <p className="text-slate-500 mt-2 text-center max-w-sm">
            Drag and drop your CSV file here, or click to browse.
            <br/><span className="text-xs text-slate-400">Supported formats: .csv</span>
          </p>
        </>
      )}
    </div>
  );
};

// --- Step 2: Preprocessing ---
interface PreprocessProps {
  dataset: Dataset;
  scaler: ScalerType;
  setScaler: (s: ScalerType) => void;
  setDataset: (d: Dataset) => void;
}

export const StepPreprocess: React.FC<PreprocessProps> = ({ dataset, scaler, setScaler, setDataset }) => {
  const toggleFeature = (col: string) => {
    const isSelected = dataset.featureColumns.includes(col);
    const newFeatures = isSelected 
      ? dataset.featureColumns.filter(c => c !== col) 
      : [...dataset.featureColumns, col];
    
    setDataset({ ...dataset, featureColumns: newFeatures });
  };

  const setTarget = (col: string) => {
    // If setting target, remove it from features if present
    const newFeatures = dataset.featureColumns.filter(c => c !== col);
    setDataset({ ...dataset, targetColumn: col, featureColumns: newFeatures });
  };

  // Preview data (first 5 rows)
  const previewData = dataset.processed.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Column Configuration */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Database className="w-4 h-4" /> Column Roles
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
              {dataset.columns.map(col => {
                const isTarget = dataset.targetColumn === col;
                const isFeature = dataset.featureColumns.includes(col);
                return (
                  <div key={col} className="flex items-center justify-between text-sm p-2 bg-slate-50 rounded hover:bg-slate-100 transition-colors">
                    <span className="font-medium truncate w-24 text-slate-700" title={col}>{col}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setTarget(col)}
                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${isTarget ? 'bg-rose-500 text-white shadow-sm' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}
                      >
                        Target
                      </button>
                      <button
                        onClick={() => toggleFeature(col)}
                        disabled={isTarget}
                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${isFeature ? 'bg-indigo-500 text-white shadow-sm' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'} ${isTarget ? 'opacity-30 cursor-not-allowed' : ''}`}
                      >
                        Feature
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {(!dataset.targetColumn || dataset.featureColumns.length === 0) && (
              <p className="text-xs text-rose-500 mt-2 flex items-center gap-1 font-medium bg-rose-50 p-2 rounded">
                <AlertCircle className="w-3 h-3" /> Please select 1 target & ≥1 feature.
              </p>
            )}
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <BarChart2 className="w-4 h-4" /> Scaling Method
            </h4>
            <div className="space-y-2">
              {(['None', 'MinMax', 'Standard'] as ScalerType[]).map((type) => (
                <label key={type} className="flex items-start gap-3 p-2 rounded cursor-pointer hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                  <div className="mt-0.5">
                    <input
                      type="radio"
                      name="scaler"
                      value={type}
                      checked={scaler === type}
                      onChange={() => setScaler(type)}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-slate-900">
                      {type === 'None' ? 'No Scaling' : type === 'MinMax' ? 'Min-Max Normalization' : 'StandardScaler'}
                    </span>
                    <span className="block text-xs text-slate-500 mt-0.5">
                      {type === 'None' ? 'Keep original values.' : type === 'MinMax' ? 'Scales to [0, 1].' : 'Zero mean, unit variance.'}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Data Preview */}
        <div className="md:col-span-2 bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
             <h4 className="font-semibold text-slate-800">Processed Data Preview</h4>
             <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full">{dataset.processed.length} rows</span>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  {dataset.columns.map(col => (
                    <th key={col} className={`px-4 py-3 whitespace-nowrap text-xs uppercase tracking-wider ${col === dataset.targetColumn ? 'bg-rose-50 text-rose-700' : ''}`}>
                      {col} {col === dataset.targetColumn && '(Target)'}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {previewData.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    {dataset.columns.map(col => (
                      <td key={`${i}-${col}`} className="px-4 py-3 font-mono text-xs text-slate-600">
                        {typeof row[col] === 'number' ? (row[col] as number).toFixed(4) : row[col]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-2 text-center text-xs text-slate-400 bg-slate-50 border-t border-slate-200">
            Previewing first 5 rows
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Step 3: Split ---
interface SplitProps {
  ratio: number;
  setRatio: (r: number) => void;
  totalRows: number;
}

export const StepSplit: React.FC<SplitProps> = ({ ratio, setRatio, totalRows }) => {
  const trainCount = Math.floor(totalRows * (ratio / 100));
  const testCount = totalRows - trainCount;

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 w-full max-w-2xl">
        <h3 className="text-xl font-semibold text-slate-800 mb-6 flex items-center justify-center gap-2">
          <Split className="w-6 h-6 text-indigo-500" /> Train-Test Split Configuration
        </h3>
        
        <div className="mb-8 px-4">
          <input 
            type="range" 
            min="50" 
            max="90" 
            step="5" 
            value={ratio} 
            onChange={(e) => setRatio(Number(e.target.value))}
            className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <div className="flex justify-between mt-2 text-sm font-medium text-slate-600">
            <span>50%</span>
            <span>90%</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <div className="flex flex-col items-center p-4 bg-indigo-50 rounded-lg w-40 border border-indigo-100 transition-all hover:shadow-md">
            <span className="text-3xl font-bold text-indigo-600">{ratio}%</span>
            <span className="text-sm text-indigo-800 font-medium uppercase tracking-wide">Training Set</span>
            <span className="text-xs text-indigo-400 mt-1">{trainCount} rows</span>
          </div>
          
          <div className="text-slate-300 font-bold text-xl">+</div>

          <div className="flex flex-col items-center p-4 bg-rose-50 rounded-lg w-40 border border-rose-100 transition-all hover:shadow-md">
            <span className="text-3xl font-bold text-rose-500">{100 - ratio}%</span>
            <span className="text-sm text-rose-800 font-medium uppercase tracking-wide">Testing Set</span>
            <span className="text-xs text-rose-400 mt-1">{testCount} rows</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Step 4: Model Selection ---
interface ModelProps {
  selected: ModelType | null;
  onSelect: (m: ModelType) => void;
}

export const StepModel: React.FC<ModelProps> = ({ selected, onSelect }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto py-8">
      {[
        { 
          id: 'LogisticRegression', 
          name: 'Logistic Regression', 
          desc: 'A statistical model used for binary classification. It predicts the probability of an occurrence by fitting data to a logit function.',
          icon: '📉'
        },
        { 
          id: 'DecisionTree', 
          name: 'Decision Tree Classifier', 
          desc: 'A tree-structured model where internal nodes represent feature tests, and leaf nodes represent class labels. Great for non-linear data.',
          icon: '🌳'
        }
      ].map((model) => (
        <div 
          key={model.id}
          onClick={() => onSelect(model.id as ModelType)}
          className={`cursor-pointer p-6 rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${
            selected === model.id 
            ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-200 ring-offset-2' 
            : 'border-slate-200 bg-white hover:border-indigo-300'
          }`}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="text-4xl">{model.icon}</div>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selected === model.id ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
              {selected === model.id && <Check className="w-4 h-4 text-white" />}
            </div>
          </div>
          
          <h3 className={`text-lg font-bold mb-2 ${selected === model.id ? 'text-indigo-800' : 'text-slate-800'}`}>
            {model.name}
          </h3>
          <p className="text-slate-600 text-sm leading-relaxed">{model.desc}</p>
        </div>
      ))}
    </div>
  );
};