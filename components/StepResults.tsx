import React from 'react';
import { TrainingResults } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, RadialBarChart, RadialBar, Legend
} from 'recharts';
import { Award, Target, Activity, Zap } from 'lucide-react';

interface Props {
  results: TrainingResults;
}

export const StepResults: React.FC<Props> = ({ results }) => {
  // Metric Cards Data
  const metrics = [
    { label: 'Accuracy', value: results.accuracy, icon: Award, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Precision', value: results.precision, icon: Target, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Recall', value: results.recall, icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'F1 Score', value: results.f1Score, icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  // Feature Importance Data for Chart
  const featureData = results.featureImportance.slice(0, 5); // Top 5

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Top Level Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
            <div className={`p-3 rounded-full mb-3 ${m.bg}`}>
              <m.icon className={`w-6 h-6 ${m.color}`} />
            </div>
            <span className="text-slate-500 text-sm font-medium uppercase tracking-wide">{m.label}</span>
            <span className="text-3xl font-bold text-slate-800">{(m.value * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Feature Importance Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-80">
          <h4 className="font-bold text-slate-800 mb-4">Top Feature Importance</h4>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={featureData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
              <XAxis type="number" domain={[0, 1]} hide />
              <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'Importance']}
              />
              <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]}>
                {featureData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'][index % 5]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Confusion Matrix Visualization */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
          <h4 className="font-bold text-slate-800 mb-6 w-full text-left">Confusion Matrix</h4>
          <div className="grid grid-cols-2 gap-2 w-64 h-64">
            {/* TP */}
            <div className="bg-indigo-100 flex flex-col items-center justify-center rounded-tl-lg p-2 border border-indigo-200">
               <span className="text-2xl font-bold text-indigo-900">{results.confusionMatrix[0][0]}</span>
               <span className="text-xs font-semibold text-indigo-500 uppercase">True Positive</span>
            </div>
            {/* FP */}
            <div className="bg-rose-50 flex flex-col items-center justify-center rounded-tr-lg p-2 border border-rose-200">
               <span className="text-2xl font-bold text-rose-900">{results.confusionMatrix[0][1]}</span>
               <span className="text-xs font-semibold text-rose-500 uppercase">False Positive</span>
            </div>
            {/* FN */}
            <div className="bg-rose-50 flex flex-col items-center justify-center rounded-bl-lg p-2 border border-rose-200">
               <span className="text-2xl font-bold text-rose-900">{results.confusionMatrix[1][0]}</span>
               <span className="text-xs font-semibold text-rose-500 uppercase">False Negative</span>
            </div>
            {/* TN */}
            <div className="bg-indigo-100 flex flex-col items-center justify-center rounded-br-lg p-2 border border-indigo-200">
               <span className="text-2xl font-bold text-indigo-900">{results.confusionMatrix[1][1]}</span>
               <span className="text-xs font-semibold text-indigo-500 uppercase">True Negative</span>
            </div>
          </div>
          <div className="mt-4 flex gap-4 text-xs text-slate-500">
             <div className="flex items-center gap-1"><div className="w-3 h-3 bg-indigo-100 border border-indigo-200"></div> Correct</div>
             <div className="flex items-center gap-1"><div className="w-3 h-3 bg-rose-50 border border-rose-200"></div> Incorrect</div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-slate-800 text-slate-50 p-6 rounded-xl shadow-lg">
        <h4 className="font-bold text-indigo-300 mb-2 flex items-center gap-2">
          <Zap className="w-4 h-4" /> AI Analysis
        </h4>
        <p className="text-slate-300 text-sm leading-relaxed">
          {results.insights}
        </p>
      </div>
    </div>
  );
};
