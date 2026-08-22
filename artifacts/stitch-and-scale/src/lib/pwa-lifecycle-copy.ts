import type { LanguageCode } from './i18n';

export interface PwaLifecycleCopy {
  updateAvailable: string;
  updateAction: string;
  offlineStatus: string;
  onlineStatus: string;
  offlineReady: string;
  dismiss: string;
}

export const COPY: Record<LanguageCode, PwaLifecycleCopy> = {
  en: {
    updateAvailable: 'A new version of Stitch & Scale is ready.',
    updateAction: 'Update Now',
    offlineStatus: 'Working Offline',
    onlineStatus: 'Back Online',
    offlineReady: 'App ready for offline use.',
    dismiss: 'Dismiss',
  },
  de: {
    updateAvailable: 'Eine neue Version von Stitch & Scale ist bereit.',
    updateAction: 'Jetzt aktualisieren',
    offlineStatus: 'Offline-Modus',
    onlineStatus: 'Wieder online',
    offlineReady: 'App bereit für Offline-Nutzung.',
    dismiss: 'Schließen',
  },
  fr: {
    updateAvailable: 'Une nouvelle version de Stitch & Scale est disponible.',
    updateAction: 'Mettre à jour',
    offlineStatus: 'Mode hors ligne',
    onlineStatus: 'De retour en ligne',
    offlineReady: 'Application prête pour une utilisation hors ligne.',
    dismiss: 'Fermer',
  },
  es: {
    updateAvailable: 'Hay una nueva versión de Stitch & Scale disponible.',
    updateAction: 'Actualizar ahora',
    offlineStatus: 'Sin conexión',
    onlineStatus: 'De nuevo en línea',
    offlineReady: 'Aplicación lista para usar sin conexión.',
    dismiss: 'Cerrar',
  },
  pt: {
    updateAvailable: 'Uma nova versão do Stitch & Scale está pronta.',
    updateAction: 'Atualizar agora',
    offlineStatus: 'Modo offline',
    onlineStatus: 'Online novamente',
    offlineReady: 'Aplicação pronta para uso offline.',
    dismiss: 'Fechar',
  },
};

export const PWA_LIFECYCLE_COPY = COPY;
