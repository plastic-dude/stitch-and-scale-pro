import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { Shell } from '@/components/shell';
import { ROUTES, NotFound } from '@/routes';
import Landing from '@/pages/landing';
import { SettingsProvider, useSettings } from '@/context/SettingsContext';
import { ProjectsProvider } from '@/context/ProjectsContext';
import OnboardingOverlay from '@/pages/onboarding';

const queryClient = new QueryClient();

// CHK-080 — the onboarding overlay must not greet cold visitors who land
// on /landing or /project/:id (demo link). It only blocks the app root
// surfaces where a project flow starts.
function LandingGate({ onboardingCompleted }: { onboardingCompleted: boolean }) {
  const [location] = useLocation();
  const onPublicSurface = location === '/landing' || /^\/project\//.test(location);
  if (onboardingCompleted || onPublicSurface) return null;
  return <OnboardingOverlay />;
}

function Router() {
  const { onboardingCompleted } = useSettings();

  return (
    <>
      {/* Onboarding overlay — shown once on first launch; never on the
          public marketing surface — visitors arrive here cold. */}
      <LandingGate onboardingCompleted={onboardingCompleted} />

      {/* CHK-080 — public marketing surface, rendered outside the app Shell */}
      <Route path="/landing" component={Landing} />

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
