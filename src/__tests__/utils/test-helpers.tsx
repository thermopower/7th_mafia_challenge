import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

export const renderWithProviders = (
  ui: ReactNode,
  { queryClient = createTestQueryClient(), ...options }: CustomRenderOptions = {}
) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return render(ui as React.ReactElement, { wrapper: Wrapper, ...options });
};

// Hono 앱 테스트 헬퍼
export const testRequest = async (
  app: any,
  path: string,
  options: RequestInit = {}
) => {
  const url = new URL(path, 'http://localhost:3000');
  const request = new Request(url, options);
  return app.fetch(request);
};
