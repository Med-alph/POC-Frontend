import React from 'react';

/**
 * ErrorBoundary — catches runtime errors in child component trees.
 * Used to wrap lazy-loaded route chunks so a single broken route
 * doesn't crash the whole application.
 *
 * Also handles ChunkLoadError (lazy chunk fails to download) so users
 * get a helpful "Reload" prompt instead of a blank screen.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, isChunkError: false };
  }

  static getDerivedStateFromError(error) {
    const isChunkError =
      error?.name === 'ChunkLoadError' ||
      error?.message?.includes('Loading chunk') ||
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Importing a module script failed');

    return { hasError: true, error, isChunkError };
  }

  componentDidCatch(error, errorInfo) {
    // Log to console in development; swap for a real error reporting
    // service (e.g. Sentry) in production.
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, isChunkError: false });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    // Chunk-load errors: network blip or new deploy — ask user to reload
    if (this.state.isChunkError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
          <div className="text-5xl mb-4">🔄</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Page update available
          </h2>
          <p className="text-gray-500 mb-6 max-w-sm">
            A newer version of this page is available. Please reload to continue.
          </p>
          <button
            onClick={this.handleReload}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Reload Page
          </button>
        </div>
      );
    }

    // Generic runtime error — allow the user to retry or navigate away
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          {this.props.fallbackTitle || 'Something went wrong'}
        </h2>
        <p className="text-gray-500 mb-6 max-w-sm">
          {this.props.fallbackMessage ||
            'An unexpected error occurred. Please try again or contact support if the problem persists.'}
        </p>
        <div className="flex gap-3">
          <button
            onClick={this.handleReset}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Try Again
          </button>
          <button
            onClick={() => window.history.back()}
            className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Go Back
          </button>
        </div>
        {import.meta.env.DEV && this.state.error && (
          <details className="mt-6 text-left max-w-lg w-full">
            <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-600">
              Error details (dev only)
            </summary>
            <pre className="mt-2 text-xs text-red-600 bg-red-50 p-3 rounded overflow-auto max-h-40">
              {this.state.error.stack || this.state.error.message}
            </pre>
          </details>
        )}
      </div>
    );
  }
}

export default ErrorBoundary;
