import React from 'react';
import type { LanguageCode } from '@/lib/i18n';

export interface RouteErrorCopy {
  title: string;
  description: string;
  retry: string;
  projects: string;
  technicalDetails: string;
}

const COPY: Record<LanguageCode, RouteErrorCopy> = {
  en: {
    title: 'This workspace needs a refresh.',
    description: 'A project screen could not finish loading. Your saved work is still stored locally. Try the screen again, or return to Projects.',
    retry: 'Try again',
    projects: 'Back to Projects',
    technicalDetails: 'Technical details',
  },
  de: {
    title: 'Dieser Arbeitsbereich benötigt eine Aktualisierung.',
    description: 'Eine Projektseite konnte nicht vollständig geladen werden. Deine gespeicherte Arbeit liegt weiterhin lokal. Versuche es erneut oder kehre zu den Projekten zurück.',
    retry: 'Erneut versuchen',
    projects: 'Zurück zu den Projekten',
    technicalDetails: 'Technische Details',
  },
  fr: {
    title: 'Cet espace de travail doit être actualisé.',
    description: 'Une page de projet n’a pas pu finir de se charger. Votre travail enregistré reste stocké localement. Réessayez ou revenez aux projets.',
    retry: 'Réessayer',
    projects: 'Retour aux projets',
    technicalDetails: 'Détails techniques',
  },
  es: {
    title: 'Este espacio de trabajo necesita actualizarse.',
    description: 'Una pantalla del proyecto no pudo terminar de cargarse. Tu trabajo guardado sigue almacenado localmente. Inténtalo de nuevo o vuelve a Proyectos.',
    retry: 'Intentar de nuevo',
    projects: 'Volver a Proyectos',
    technicalDetails: 'Detalles técnicos',
  },
  pt: {
    title: 'Este espaço de trabalho precisa de ser atualizado.',
    description: 'Uma página do projeto não conseguiu terminar de carregar. O seu trabalho guardado continua armazenado localmente. Tente novamente ou volte aos Projetos.',
    retry: 'Tentar novamente',
    projects: 'Voltar aos Projetos',
    technicalDetails: 'Detalhes técnicos',
  },
};

export function getRouteErrorCopy(language: string): RouteErrorCopy {
  return COPY[language.toLowerCase().split('-')[0] as LanguageCode] ?? COPY.en;
}

type Props = {
  children: React.ReactNode;
  copy: RouteErrorCopy;
};

type State = {
  hasError: boolean;
  error?: Error;
};

export class RouteErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[RouteErrorBoundary] Route failed to render', error, info.componentStack);
  }

  private retry = () => {
    window.location.reload();
  };

  private goToProjects = () => {
    window.location.assign('/');
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="min-h-[60vh] flex items-center justify-center px-4 py-16" role="alert">
        <section className="w-full max-w-xl rounded-2xl border border-border/60 bg-card p-6 shadow-sm sm:p-8">
          <div className="mb-5 flex items-start gap-4">
            <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive" aria-hidden="true">
              <span className="text-lg font-semibold">!</span>
            </div>
            <div>
              <h1 className="font-serif text-2xl font-medium text-foreground">{this.props.copy.title}</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{this.props.copy.description}</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={this.goToProjects}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {this.props.copy.projects}
            </button>
            <button
              type="button"
              onClick={this.retry}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {this.props.copy.retry}
            </button>
          </div>
          {this.state.error?.message && (
            <details className="mt-6 rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
              <summary className="cursor-pointer select-none">{this.props.copy.technicalDetails}</summary>
              <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap break-words font-mono">{this.state.error.message}</pre>
            </details>
          )}
        </section>
      </main>
    );
  }
}
