/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

interface EBProps { children: React.ReactNode; fallback?: React.ReactNode; }
interface EBState { hasError: boolean; error?: Error; }

// Use any to avoid TypeScript class member resolution issues across React versions
export default class ErrorBoundary extends (React.Component as any)<EBProps, EBState> {
  state: EBState = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error.message, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', textAlign:'center', gap:20, padding:32, background:'#0d1117', color:'white' }}>
          <div style={{ fontSize:48 }}>💥</div>
          <h3 style={{ margin:'0 0 8px' }}>Something went wrong</h3>
          <p style={{ color:'#8b949e', margin:'0 0 16px' }}>{this.state.error?.message || 'An unexpected error occurred.'}</p>
          <button onClick={() => this.setState({ hasError: false, error: undefined })}
            style={{ padding:'8px 20px', background:'#1f6feb', color:'white', border:'none', borderRadius:12, cursor:'pointer', fontWeight:'bold', fontSize:14 }}>
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
