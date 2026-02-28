
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Fix for "Cannot set property fetch of #<Window> which has only a getter"
if (typeof window !== 'undefined') {
  try {
    let _fetch = window.fetch;
    if (_fetch) {
      Object.defineProperty(window, 'fetch', {
        get: () => _fetch,
        set: (v) => { _fetch = v; },
        configurable: true,
        enumerable: true
      });
    }
  } catch (e) {
    try {
      let _fetchProto = Window.prototype.fetch;
      Object.defineProperty(Window.prototype, 'fetch', {
        get: () => _fetchProto,
        set: (v) => { _fetchProto = v; },
        configurable: true,
        enumerable: true
      });
    } catch (e2) {}
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
