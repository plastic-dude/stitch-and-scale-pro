import type { LanguageCode } from '@/lib/i18n';

export interface StudioProfileCopy {
  title: string;
  description: string;
  designerName: string;
  designerNamePlaceholder: string;
  studioName: string;
  studioNamePlaceholder: string;
  website: string;
  websitePlaceholder: string;
  socialHandle: string;
  socialHandlePlaceholder: string;
  copyrightNotice: string;
  copyrightNoticePlaceholder: string;
  logo: string;
  logoHint: string;
  logoChoose: string;
  logoRemove: string;
  logoSaved: string;
  logoFailed: string;
  usageHint: string;
}

const COPY: Record<LanguageCode, StudioProfileCopy> = {
  en: {
    title: 'Studio Profile',
    description: 'Set the identity used when you start new patterns and prepare future exports.',
    designerName: 'Designer name',
    designerNamePlaceholder: 'Your name',
    studioName: 'Studio or business name',
    studioNamePlaceholder: 'Optional studio name',
    website: 'Website',
    websitePlaceholder: 'https://your-site.example',
    socialHandle: 'Social handle',
    socialHandlePlaceholder: '@yourhandle',
    copyrightNotice: 'Copyright line',
    copyrightNoticePlaceholder: '© Your name',
    logo: 'Studio logo',
    logoHint: 'Optional PNG, JPG, or SVG. It is resized locally and included in Brag Cards and future exports.',
    logoChoose: 'Choose logo',
    logoRemove: 'Remove logo',
    logoSaved: 'Logo saved on this device.',
    logoFailed: 'Logo could not be processed. Choose a valid image under 2 MB.',
    usageHint: 'These fields stay on this device and can be changed for each project. They do not publish anything by themselves.',
  },
  de: {
    title: 'Studio-Profil',
    description: 'Lege die Identität fest, die beim Erstellen neuer Muster und für künftige Exporte verwendet wird.',
    designerName: 'Name der Designerin oder des Designers',
    designerNamePlaceholder: 'Dein Name',
    studioName: 'Studio- oder Geschäftsname',
    studioNamePlaceholder: 'Optionaler Studio-Name',
    website: 'Website',
    websitePlaceholder: 'https://deine-seite.example',
    socialHandle: 'Social-Media-Handle',
    socialHandlePlaceholder: '@deinhandle',
    copyrightNotice: 'Copyright-Zeile',
    copyrightNoticePlaceholder: '© Dein Name',
    logo: 'Studio-Logo',
    logoHint: 'Optionales PNG, JPG oder SVG. Es wird lokal verkleinert und in Brag Cards und künftigen Exporten verwendet.',
    logoChoose: 'Logo auswählen',
    logoRemove: 'Logo entfernen',
    logoSaved: 'Logo auf diesem Gerät gespeichert.',
    logoFailed: 'Das Logo konnte nicht verarbeitet werden. Wähle ein gültiges Bild unter 2 MB.',
    usageHint: 'Diese Angaben bleiben auf diesem Gerät und können pro Projekt geändert werden. Sie veröffentlichen nichts automatisch.',
  },
  fr: {
    title: 'Profil du studio',
    description: 'Définissez l’identité utilisée lors de la création de patrons et pour les futurs exports.',
    designerName: 'Nom du ou de la designer',
    designerNamePlaceholder: 'Votre nom',
    studioName: 'Nom du studio ou de l’entreprise',
    studioNamePlaceholder: 'Nom du studio facultatif',
    website: 'Site web',
    websitePlaceholder: 'https://votre-site.example',
    socialHandle: 'Identifiant social',
    socialHandlePlaceholder: '@votreidentifiant',
    copyrightNotice: 'Mention de copyright',
    copyrightNoticePlaceholder: '© Votre nom',
    logo: 'Logo du studio',
    logoHint: 'PNG, JPG ou SVG facultatif. Il est réduit localement et utilisé dans les Brag Cards et les futurs exports.',
    logoChoose: 'Choisir un logo',
    logoRemove: 'Supprimer le logo',
    logoSaved: 'Logo enregistré sur cet appareil.',
    logoFailed: 'Le logo n’a pas pu être traité. Choisissez une image valide de moins de 2 Mo.',
    usageHint: 'Ces informations restent sur cet appareil et peuvent être modifiées pour chaque projet. Elles ne publient rien automatiquement.',
  },
  es: {
    title: 'Perfil del estudio',
    description: 'Define la identidad que se usará al crear patrones nuevos y preparar futuras exportaciones.',
    designerName: 'Nombre de la persona diseñadora',
    designerNamePlaceholder: 'Tu nombre',
    studioName: 'Nombre del estudio o negocio',
    studioNamePlaceholder: 'Nombre del estudio opcional',
    website: 'Sitio web',
    websitePlaceholder: 'https://tu-sitio.example',
    socialHandle: 'Usuario en redes',
    socialHandlePlaceholder: '@tusuario',
    copyrightNotice: 'Línea de copyright',
    copyrightNoticePlaceholder: '© Tu nombre',
    logo: 'Logo del estudio',
    logoHint: 'PNG, JPG o SVG opcional. Se reduce localmente y se incluye en Brag Cards y futuras exportaciones.',
    logoChoose: 'Elegir logo',
    logoRemove: 'Quitar logo',
    logoSaved: 'Logo guardado en este dispositivo.',
    logoFailed: 'No se pudo procesar el logo. Elige una imagen válida de menos de 2 MB.',
    usageHint: 'Estos datos permanecen en este dispositivo y pueden cambiarse por proyecto. No publican nada por sí solos.',
  },
  pt: {
    title: 'Perfil do estúdio',
    description: 'Defina a identidade usada ao criar novos padrões e preparar futuras exportações.',
    designerName: 'Nome do designer',
    designerNamePlaceholder: 'O seu nome',
    studioName: 'Nome do estúdio ou negócio',
    studioNamePlaceholder: 'Nome do estúdio opcional',
    website: 'Website',
    websitePlaceholder: 'https://o-seu-site.example',
    socialHandle: 'Identificador social',
    socialHandlePlaceholder: '@oseuidentificador',
    copyrightNotice: 'Linha de copyright',
    copyrightNoticePlaceholder: '© O seu nome',
    logo: 'Logótipo do estúdio',
    logoHint: 'PNG, JPG ou SVG opcional. É reduzido localmente e incluído nas Brag Cards e em futuras exportações.',
    logoChoose: 'Escolher logótipo',
    logoRemove: 'Remover logótipo',
    logoSaved: 'Logótipo guardado neste dispositivo.',
    logoFailed: 'Não foi possível processar o logótipo. Escolha uma imagem válida com menos de 2 MB.',
    usageHint: 'Estes dados ficam neste dispositivo e podem ser alterados por projeto. Não publicam nada por si próprios.',
  },
};

export function getStudioProfileCopy(locale: string): StudioProfileCopy {
  return COPY[locale.toLowerCase().split('-')[0] as LanguageCode] ?? COPY.en;
}

export interface StudioProfile {
  designerName: string;
  studioName: string;
  website: string;
  socialHandle: string;
  copyrightNotice: string;
}

export const DEFAULT_STUDIO_PROFILE: StudioProfile = {
  designerName: '',
  studioName: '',
  website: '',
  socialHandle: '',
  copyrightNotice: '',
};
