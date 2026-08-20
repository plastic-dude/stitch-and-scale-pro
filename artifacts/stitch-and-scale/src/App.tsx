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

import { useEffect } from 'react';
import { SplashScreen } from '@/components/splash-screen';

function ScrollHandler() {
  const [location] = useLocation();

  useEffect(() => {
    // Yield to the browser to ensure the DOM has rendered the new page
    setTimeout(() => {
      if (window.location.hash) {
        const id = window.location.hash.replace('#', '');
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
          return;
        }
      }
      window.scrollTo(0, 0);
    }, 10);
  }, [location]);

  return null;
}


const queryClient = new QueryClient();

// CHK-080 — the onboarding overlay must not greet cold visitors who land
// on /landing or /project/:id (demo link). It only blocks the app root
// surfaces where a project flow starts.
// CHK-126 — live mobile audit (Android 360px / iPhone 390px) found the
// overlay also rendered on /settings, /portfolio, /project/import-csv and
// unknown routes (404). At 360px its "Skip setup" button sat directly on
// top of the header Settings nav link (29x24 overlap), making the nav
// unreachable on phones. The overlay now shows ONLY on surfaces where a
// project flow starts: the app root, /project/new, /project/import-csv,
// and /project/:id with no trailing segments.
function LandingGate({ onboardingCompleted }: { onboardingCompleted: boolean }) {
  const [location] = useLocation();
  const isEntryFlow = location === '/'
    || location === '/project/new'
    || location === '/project/import-csv'
    || /^\/project\/[\w-]+$/.test(location);
  const onPublicSurface = location === '/landing' || !isEntryFlow;
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

      {/* CHK-080 — public marketing surface. Keep it mutually exclusive
          with the app shell so its 404 fallback cannot render underneath. */}
      <Switch>
        <Route path="/landing" component={Landing} />
        <Route>
          <Shell>
            <Switch>
              {ROUTES.map(({ path, component: Component }) => (
                <Route key={path} path={path} component={Component} />
              ))}
              <Route component={NotFound} />
            </Switch>
          </Shell>
        </Route>
      </Switch>
    </>
  );
}


function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <ProjectsProvider>
          <TooltipProvider>
            <SplashScreen>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
                <ScrollHandler />
                <Router />
              </WouterRouter>
              <Toaster />
            </SplashScreen>
          </TooltipProvider>
        </ProjectsProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
}

export default App;
