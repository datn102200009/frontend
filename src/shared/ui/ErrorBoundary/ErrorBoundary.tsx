import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          textAlign: 'center',
          fontFamily: 'sans-serif',
          background: 'var(--clr-bg-primary, #ffffff)',
          color: 'var(--clr-text-primary, #333333)',
        }}>
          <h2 style={{ color: '#ff4d4f' }}>Đã xảy ra lỗi không mong muốn</h2>
          <p style={{ margin: '1rem 0', color: '#666' }}>
            Hệ thống gặp sự cố khi xử lý tác vụ này. Vui lòng tải lại trang hoặc liên hệ quản trị viên.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#1890ff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Tải lại trang
          </button>
          {this.state.error && (
            <pre style={{
              marginTop: '1.5rem',
              padding: '1rem',
              background: '#f5f5f5',
              borderRadius: '4px',
              textAlign: 'left',
              width: '100%',
              maxWidth: '800px',
              overflowX: 'auto',
              fontSize: '0.85rem',
            }}>
              {this.state.error.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
