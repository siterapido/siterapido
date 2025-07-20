import React, { Suspense, lazy } from 'react';

// Loading component otimizado
const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#84CC15]"></div>
  </div>
);

// Error boundary para lazy loading
class LazyErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="text-red-500 mb-2">Erro ao carregar componente</div>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="text-sm text-blue-500 hover:underline"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper para lazy loading com error boundary
const withLazyLoading = (Component: React.ComponentType<any>) => {
  return (props: any) => (
    <LazyErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <Component {...props} />
      </Suspense>
    </LazyErrorBoundary>
  );
};

// Componentes pesados com lazy loading
export const LazyPortfolioSection = withLazyLoading(
  lazy(() => import('./sections/PortfolioSection').then(module => ({ default: module.PortfolioSection })))
);

export const LazyFocusCardsDemo = withLazyLoading(
  lazy(() => import('./ui/demo').then(module => ({ default: module.FocusCardsDemo })))
);

export const LazyAboutSection = withLazyLoading(
  lazy(() => import('./sections/AboutSection').then(module => ({ default: module.AboutSection })))
);

export const LazyFAQ = withLazyLoading(
  lazy(() => import('./ui/faq-section').then(module => ({ default: module.FAQ })))
);

export const LazyFooterdemo = withLazyLoading(
  lazy(() => import('./ui/footer-section').then(module => ({ default: module.Footerdemo })))
);

// Componentes admin com lazy loading
export const LazyAdminLayout = withLazyLoading(
  lazy(() => import('./admin/AdminLayout').then(module => ({ default: module.default })))
);

export const LazyLeadsList = withLazyLoading(
  lazy(() => import('./admin/LeadsList').then(module => ({ default: module.default })))
);

export const LazyLogin = withLazyLoading(
  lazy(() => import('./admin/Login').then(module => ({ default: module.default })))
);

// Componentes UI pesados
export const LazyLeadFormModal = withLazyLoading(
  lazy(() => import('./ui/LeadFormModal').then(module => ({ default: module.LeadFormModal })))
);

// Hook para preload de componentes
export const usePreloadComponent = (preloadFn: () => Promise<any>) => {
  return () => {
    // Preload quando o mouse entra na área do componente
    preloadFn();
  };
};

// Funções de preload
export const preloadPortfolioSection = () => 
  import('./sections/PortfolioSection');

export const preloadFocusCardsDemo = () => 
  import('./ui/demo');

export const preloadAboutSection = () => 
  import('./sections/AboutSection');

export const preloadFAQ = () => 
  import('./ui/faq-section');

export const preloadFooter = () => 
  import('./ui/footer-section'); 