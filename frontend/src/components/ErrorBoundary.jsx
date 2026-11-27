import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("StreetLens UI Error caught by boundary:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-2xl bg-[#141418] border border-rose-900/60 text-[#f4efe6] space-y-4 shadow-2xl my-4">
          <div className="flex items-center gap-3 text-rose-400">
            <AlertTriangle className="w-6 h-6 shrink-0" />
            <div>
              <h3 className="font-syne font-bold text-base">Rendering Encountered an Issue</h3>
              <p className="text-xs text-[#a29f99] font-sans">
                {this.state.error?.message || "An unexpected error occurred while displaying this section."}
              </p>
            </div>
          </div>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 rounded-lg bg-[#f5ebe1] text-[#0c0c0e] font-display font-bold text-xs hover:bg-[#e4d7cc] transition-colors flex items-center gap-2 cursor-pointer shadow-md"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload View</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
