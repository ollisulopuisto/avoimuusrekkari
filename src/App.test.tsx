import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';

// Mock the API client to prevent network calls during tests
vi.mock('./api/client', () => ({
    api: {
        getRegisterNotifications: vi.fn().mockResolvedValue([]),
        getActivityNotifications: vi.fn().mockResolvedValue([]),
        getTargets: vi.fn().mockResolvedValue([]),
    },
}));

// Mock Lucide icons to avoid jsdom/happy-dom issues with SVG
vi.mock('lucide-react', () => ({
    Search: () => <div data-testid="icon-search" />,
    Globe: () => <div data-testid="icon-globe" />,
    Building2: () => <div data-testid="icon-building" />,
    Calendar: () => <div data-testid="icon-calendar" />,
    FileText: () => <div data-testid="icon-file-text" />,
    Download: () => <div data-testid="icon-download" />,
    X: () => <div data-testid="icon-x" />,
    User: () => <div data-testid="icon-user" />,
    Target: () => <div data-testid="icon-target" />,
}));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

describe('App Component', () => {
    it('renders without crashing', () => {
        render(
            <QueryClientProvider client={queryClient}>
                <App />
            </QueryClientProvider>
        );
        // Check for the main title or a known element
        expect(screen.getByText(/AvoimuusExplorer/i)).toBeInTheDocument();
    });
});
