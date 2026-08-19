import type { LanguageCode } from '@/lib/i18n';
import type { ThemeId } from './themes';

export interface PdfThemeCopy {
  name: string;
  description: string;
}

const THEME_COPY: Record<LanguageCode, Record<ThemeId, PdfThemeCopy>> = {
  en: {
    minimal: { name: 'MINIMAL', description: 'Clean, generous whitespace and quiet precision.' },
    luxury: { name: 'LUXURY', description: 'Fashion-editorial serif styling with gold accents.' },
    craft: { name: 'CRAFT / COZY', description: 'Warm, handmade character with a knitting-magazine feel.' },
    technical: { name: 'TECHNICAL / BLUEPRINT', description: 'Engineering precision with a blueprint grid.' },
  },
  de: {
    minimal: { name: 'MINIMAL', description: 'Klar, großzügige Weißräume und ruhige Präzision.' },
    luxury: { name: 'LUXUS', description: 'Modejournal-Serifenstil mit goldenen Akzenten.' },
    craft: { name: 'HANDWERK / GEMÜTLICH', description: 'Warmer, handgemachter Charakter im Stil alter Strickmagazine.' },
    technical: { name: 'TECHNISCH / BLAUPAUSE', description: 'Technische Präzision mit einem Blaupausenraster.' },
  },
  fr: {
    minimal: { name: 'MINIMAL', description: 'Épuré, avec de généreux espaces blancs et une précision discrète.' },
    luxury: { name: 'LUXE', description: 'Style éditorial à empattements avec accents dorés.' },
    craft: { name: 'ARTISANAL / DOUILLET', description: 'Caractère chaleureux et fait main, comme un ancien magazine de tricot.' },
    technical: { name: 'TECHNIQUE / PLAN', description: 'Précision technique avec une grille de plan.' },
  },
  es: {
    minimal: { name: 'MINIMAL', description: 'Limpio, con mucho espacio en blanco y precisión serena.' },
    luxury: { name: 'LUJO', description: 'Estilo editorial con serifas y acentos dorados.' },
    craft: { name: 'ARTESANAL / ACOGEDOR', description: 'Carácter cálido y hecho a mano, como una revista de punto clásica.' },
    technical: { name: 'TÉCNICO / PLANO', description: 'Precisión técnica con una cuadrícula de plano.' },
  },
  pt: {
    minimal: { name: 'MINIMAL', description: 'Limpo, com espaços generosos e precisão discreta.' },
    luxury: { name: 'LUXO', description: 'Estilo editorial com serifas e detalhes dourados.' },
    craft: { name: 'ARTESANAL / ACOLHEDOR', description: 'Caráter quente e feito à mão, como uma revista de tricot clássica.' },
    technical: { name: 'TÉCNICO / PLANTA', description: 'Precisão técnica com uma grelha de planta.' },
  },
};

export function getPdfThemeCopy(locale: string, themeId: ThemeId): PdfThemeCopy {
  const code = locale.toLowerCase().split('-')[0] as LanguageCode;
  return THEME_COPY[code]?.[themeId] ?? THEME_COPY.en[themeId];
}
