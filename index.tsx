import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AlertCircle } from 'lucide-react';

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-xl shadow-lg border border-rose-100 max-w-md w-full text-center">
             <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
               <AlertCircle className="w-8 h-8 text-rose-600" />
             </div>
             <h2 className="text-xl font-bold text-slate-800 mb-2">Something went wrong</h2>
             <p className="text-slate-500 mb-6 text-sm">
               The application encountered an unexpected error.
             </p>
             <button 
               onClick={() => window.location.reload()}
               className="bg-slate-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors shadow-md active:scale-95 transform"
             >
               Reload Application
             </button>
             {this.state.error && (
               <div className="mt-6 text-left">
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Error Details</p>
                  <pre className="p-3 bg-slate-100 rounded text-xs text-slate-600 overflow-auto max-h-32 border border-slate-200">
                    {this.state.error.toString()}
                  </pre>
               </div>
             )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);