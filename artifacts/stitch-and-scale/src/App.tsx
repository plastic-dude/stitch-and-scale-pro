import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Shell } from '@/components/shell';
import { ROUTES, NotFound } from '@/routes';
import { SettingsProvider, useSettings } from '@/context/SettingsContext';
import { ProjectsProvider } from '@/context/ProjectsContext';
import OnboardingOverlay from '@/pages/onboarding';

const queryClient = new QueryClient();

function Router() {
  const { onboardingCompleted } = useSettings();

  return (
    <>
      {/* Onboarding overlay — shown once on first launch */}
      {!onboardingCompleted && <OnboardingOverlay />}

      <Shell>
        <Switch>
          {ROUTES.map(({ path, component: Component }) => (
            <Route key={path} path={path} component={Component} />
          ))}
          <Route component={NotFound} />
        </Switch>
      </Shell>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <ProjectsProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </ProjectsProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
}

export default App;
