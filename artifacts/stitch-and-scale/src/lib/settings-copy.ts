import type { LanguageCode } from '@/lib/i18n';

export interface SettingsCopy {
  unitsDescription: string; inches: string; centimeters: string; projectOverride: string;
  gradingDescription: string; cycName: string; cycDescription: string; custom: string; customDescription: string;
  cycValue: (value: string | number) => string; light: string; dark: string; system: string;
  restartOnboarding: string; exportWorkspace: string; exportDescription: string; restoreBackup: string; restoreDescription: string;
  customHelper: string; resetAll: string; futureStandards: string;
  onboardingTitle: string; onboardingDescription: string; restartGuide: string; restartGuideDescription: string;
  dataTitle: string; dataDescription: string; downloadBackup: string; uploadFile: string;
}

const COPY: Record<LanguageCode, SettingsCopy> = {
  en: {
    unitsDescription: 'Choose the primary unit for your workspace.', inches: 'Inches', centimeters: 'Centimeters', projectOverride: 'You can override this setting per-project.',
    gradingDescription: 'The grading standard your patterns are built from.', cycName: 'Craft Yarn Council', cycDescription: 'The published CYC body-measurement chart.', custom: 'Custom', customDescription: 'Your own measurement chart.',
    cycValue: (value) => `CYC value: ${value}\"`, light: 'Light', dark: 'Dark', system: 'System',
    restartOnboarding: 'Restart Onboarding', exportWorkspace: 'Export Workspace', exportDescription: 'Download a JSON file containing all your patterns and settings.', restoreBackup: 'Restore from Backup', restoreDescription: 'Merges with your workspace — your existing patterns are never deleted or overwritten.',
    customHelper: 'Every value starts as a copy of the CYC chart. Edit only where your own patterns run differently — everything else keeps grading exactly like CYC until you change it.',
    resetAll: 'Reset all', futureStandards: 'Additional international standards (UK, EU, Japanese) will become available through future updates.',
    onboardingTitle: 'Onboarding', onboardingDescription: 'Re-run the setup guide to review your workspace configuration.', restartGuide: 'Restart Guide', restartGuideDescription: 'Walk through the setup guide again — sizing standard, units, workspace tour.',
    dataTitle: 'Data & Backups', dataDescription: 'Your patterns live right here in this browser — nothing\'s uploaded unless you choose to. Back them up regularly, just in case.',
    downloadBackup: 'Download Backup', uploadFile: 'Upload File'
  },
  de: {
    unitsDescription: 'Wähle die bevorzugte Einheit für deine Arbeitsumgebung.', inches: 'Zoll', centimeters: 'Zentimeter', projectOverride: 'Diese Einstellung kann pro Projekt überschrieben werden.',
    gradingDescription: 'Der Gradierungsstandard, auf dem deine Muster basieren.', cycName: 'Craft Yarn Council', cycDescription: 'Die veröffentlichte CYC-Körpermaßtafel.', custom: 'Benutzerdefiniert', customDescription: 'Deine eigene Maßtabelle.',
    cycValue: (value) => `CYC-Wert: ${value}\"`, light: 'Hell', dark: 'Dunkel', system: 'System',
    restartOnboarding: 'Onboarding neu starten', exportWorkspace: 'Arbeitsumgebung exportieren', exportDescription: 'Lade eine JSON-Datei mit allen Mustern und Einstellungen herunter.', restoreBackup: 'Aus Sicherung wiederherstellen', restoreDescription: 'Wird mit deiner Arbeitsumgebung zusammengeführt — vorhandene Muster werden nie gelöscht oder überschrieben.',
    customHelper: 'Jeder Wert beginnt als Kopie der CYC-Tabelle. Bearbeite nur dort, wo deine eigenen Muster abweichen — alles andere wird genau wie CYC gradiert, bis du es änderst.',
    resetAll: 'Alles zurücksetzen', futureStandards: 'Weitere internationale Standards (UK, EU, Japanisch) werden in zukünftigen Updates verfügbar sein.',
    onboardingTitle: 'Onboarding', onboardingDescription: 'Starte den Einrichtungsassistenten neu, um deine Arbeitsumgebung zu überprüfen.', restartGuide: 'Guide neu starten', restartGuideDescription: 'Gehe den Einrichtungsassistenten noch einmal durch — Größenstandard, Einheiten, Tour durch den Arbeitsbereich.',
    dataTitle: 'Daten & Backups', dataDescription: 'Deine Muster leben direkt hier in diesem Browser — nichts wird hochgeladen, außer du entscheidest dich dazu. Sichere sie regelmäßig ab.',
    downloadBackup: 'Backup herunterladen', uploadFile: 'Datei hochladen'
  },
  fr: {
    unitsDescription: 'Choisissez l’unité principale de votre espace de travail.', inches: 'Pouces', centimeters: 'Centimètres', projectOverride: 'Cette option peut être remplacée pour chaque projet.',
    gradingDescription: 'Le standard de gradation utilisé par vos patrons.', cycName: 'Craft Yarn Council', cycDescription: 'Le tableau publié des mesures corporelles du CYC.', custom: 'Personnalisé', customDescription: 'Votre propre tableau de mesures.',
    cycValue: (value) => `Valeur CYC : ${value}\"`, light: 'Clair', dark: 'Sombre', system: 'Système',
    restartOnboarding: 'Redémarrer l’onboarding', exportWorkspace: 'Exporter l’espace de travail', exportDescription: 'Téléchargez un fichier JSON contenant tous vos patrons et réglages.', restoreBackup: 'Restaurer une sauvegarde', restoreDescription: 'Fusionne votre espace de travail — vos patrons existants ne sont jamais supprimés ni remplacés.',
    customHelper: 'Chaque valeur commence par une copie du tableau CYC. Modifiez uniquement là où vos propres patrons diffèrent — tout le reste continue de grader exactement comme le CYC jusqu\'à ce que vous le changiez.',
    resetAll: 'Tout réinitialiser', futureStandards: 'D\'autres standards internationaux (UK, EU, Japonais) seront disponibles dans les futures mises à jour.',
    onboardingTitle: 'Onboarding', onboardingDescription: 'Relancez le guide d\'installation pour revoir la configuration de votre espace de travail.', restartGuide: 'Redémarrer le guide', restartGuideDescription: 'Suivez à nouveau le guide d\'installation — standard de taille, unités, visite de l\'espace de travail.',
    dataTitle: 'Données & Sauvegardes', dataDescription: 'Vos patrons vivent ici même dans ce navigateur — rien n\'est téléchargé sauf si vous le choisissez. Sauvegardez-les régulièrement.',
    downloadBackup: 'Télécharger la sauvegarde', uploadFile: 'Charger un fichier'
  },
  es: {
    unitsDescription: 'Elige la unidad principal de tu espacio de trabajo.', inches: 'Pulgadas', centimeters: 'Centímetros', projectOverride: 'Puedes cambiar esta opción por proyecto.',
    gradingDescription: 'El estándar de gradación en el que se basan tus patrones.', cycName: 'Craft Yarn Council', cycDescription: 'La tabla publicada de medidas corporales del CYC.', custom: 'Personalizado', customDescription: 'Tu propia tabla de medidas.',
    cycValue: (value) => `Valor CYC: ${value}\"`, light: 'Claro', dark: 'Oscuro', system: 'Sistema',
    restartOnboarding: 'Reiniciar onboarding', exportWorkspace: 'Exportar espacio de trabajo', exportDescription: 'Descarga un archivo JSON con todos tus patrones y ajustes.', restoreBackup: 'Restaurar desde una copia', restoreDescription: 'Se combina con tu espacio de trabajo; tus patrones existentes nunca se eliminan ni se sobrescriben.',
    customHelper: 'Cada valor comienza como una copia de la tabla CYC. Edita solo donde tus propios patrones sean diferentes; todo lo demás se seguirá graduando exactamente como CYC hasta que lo cambies.',
    resetAll: 'Restablecer todo', futureStandards: 'Otros estándares internacionales (Reino Unido, UE, japonés) estarán disponibles en futuras actualizaciones.',
    onboardingTitle: 'Onboarding', onboardingDescription: 'Vuelve a ejecutar la guía de configuración para revisar tu espacio de trabajo.', restartGuide: 'Reiniciar guía', restartGuideDescription: 'Vuelve a recorrer la guía de configuración: estándar de tallas, unidades, recorrido por el espacio de trabajo.',
    dataTitle: 'Datos y copias de seguridad', dataDescription: 'Tus patrones viven aquí mismo en este navegador; no se sube nada a menos que tú lo decidas. Haz copias de seguridad con regularidad.',
    downloadBackup: 'Descargar copia', uploadFile: 'Subir archivo'
  },
  pt: {
    unitsDescription: 'Escolha a unidade principal do seu espaço de trabalho.', inches: 'Polegadas', centimeters: 'Centimètres', projectOverride: 'Pode substituir esta definição em cada projeto.',
    gradingDescription: 'O padrão de graduação em que os seus padrões são baseados.', cycName: 'Craft Yarn Council', cycDescription: 'A tabela publicada de medidas corporais do CYC.', custom: 'Personalizado', customDescription: 'A sua própria tabela de medidas.',
    cycValue: (value) => `Valor CYC: ${value}\"`, light: 'Claro', dark: 'Escuro', system: 'Sistema',
    restartOnboarding: 'Reiniciar onboarding', exportWorkspace: 'Exportar espaço de trabalho', exportDescription: 'Descarregue um ficheiro JSON com todos os seus padrões e definições.', restoreBackup: 'Restaurar a partir de cópia', restoreDescription: 'É fundido com o seu espaço de trabalho — os padrões existentes nunca são eliminados nem substituídos.',
    customHelper: 'Cada valor começa como uma cópia da tabela CYC. Edite apenas onde os seus próprios padrões forem diferentes — tudo o resto continuará a graduar exatamente como o CYC até que o altere.',
    resetAll: 'Repor tudo', futureStandards: 'Outros padrões internacionais (Reino Unido, UE, japonês) estarão disponíveis em futuras atualizações.',
    onboardingTitle: 'Onboarding', onboardingDescription: 'Execute novamente o guia de configuração para rever o seu espaço de trabalho.', restartGuide: 'Reiniciar guia', restartGuideDescription: 'Percorra novamente o guia de configuração — padrão de tamanhos, unidades, visita ao espaço de trabalho.',
    dataTitle: 'Dados e Cópias de Segurança', dataDescription: 'Os seus padrões vivem aqui mesmo neste navegador — nada é carregado a menos que você escolha fazê-lo. Faça cópias de segurança regularmente.',
    downloadBackup: 'Descarregar cópia', uploadFile: 'Carregar ficheiro'
  },
};

export function getSettingsCopy(locale: string): SettingsCopy {
  return COPY[locale.toLowerCase().split('-')[0] as LanguageCode] ?? COPY.en;
}

