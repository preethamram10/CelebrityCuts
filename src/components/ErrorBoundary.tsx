import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '40px',
                    color: '#fff',
                    background: '#111',
                    height: '100vh',
                    fontFamily: 'sans-serif'
                }}>
                    <h1 style={{ color: '#ef4444' }}>Something went wrong</h1>
                    <p>The application encountered an unexpected error.</p>
                    <button
                        onClick={() => {
                            localStorage.clear();
                            window.location.reload();
                        }}
                        style={{
                            padding: '10px 20px',
                            background: '#D4AF37',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginBottom: '20px',
                            fontWeight: 'bold'
                        }}
                    >
                        Clear Cache & Restart
                    </button>

                    <details style={{ whiteSpace: 'pre-wrap', marginTop: '20px', background: '#222', padding: '20px', borderRadius: '8px' }}>
                        <summary style={{ cursor: 'pointer', marginBottom: '10px' }}>View Error Details</summary>
                        {this.state.error && this.state.error.toString()}
                        <br />
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </details>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
