import { lazy } from 'react';

// Lazy loading para componentes pesados
export const LazyFocusCards = lazy(() => import('./ui/focus-cards').then(module => ({ default: module.FocusCards })));
export const LazyPortfolioSection = lazy(() => import('./sections/PortfolioSection').then(module => ({ default: module.PortfolioSection })));
export const LazyAboutSection = lazy(() => import('./sections/AboutSection').then(module => ({ default: module.AboutSection })));
export const LazyFAQ = lazy(() => import('./ui/faq-section').then(module => ({ default: module.FAQ })));
export const LazyFooterdemo = lazy(() => import('./ui/footer-section').then(module => ({ default: module.Footerdemo }))); 