import { PatternProject } from '@/lib/grading-engine';
import { LanguageCode } from './i18n';

export const getSampleCrewNeckSweater = (lang: LanguageCode = 'en'): PatternProject => {
  const names: Record<LanguageCode, string> = {
    en: 'Classic Crew Neck Sweater',
    de: 'Klassischer Rundhalspullover',
    fr: 'Pull à col rond classique',
    es: 'Suéter clásico de cuello redondo',
    pt: 'Suéter clássico de gola redonda',
  };

  const descriptions: Record<LanguageCode, string> = {
    en: 'A timeless crew neck pullover in worsted weight yarn. Worked flat in pieces and seamed. Great for first-time graders.',
    de: 'Ein zeitloser Rundhalspullover aus Worsted-Garn. In Teilen flach gestrickt und zusammengenäht. Ideal für erste Gradierungsschritte.',
    fr: 'Un pull à col rond intemporel en laine worsted. Tricoté à plat en plusieurs pièces et assemblé. Idéal pour une première gradation.',
    es: 'Un jersey de cuello redondo atemporal en lana de grosor worsted. Tejido en plano por piezas y cosido. Ideal para principiantes en el escalado.',
    pt: 'Uma camisola de gola redonda intemporal em fio de peso worsted. Trabalhada em plano em peças e costurada. Ótima para quem está a começar a graduar.',
  };

  const sectionNames: Record<LanguageCode, { body: string; sleeve: string; neckline: string }> = {
    en: { body: 'Body', sleeve: 'Sleeve', neckline: 'Neckline' },
    de: { body: 'Körper', sleeve: 'Ärmel', neckline: 'Ausschnitt' },
    fr: { body: 'Corps', sleeve: 'Manche', neckline: 'Encolure' },
    es: { body: 'Cuerpo', sleeve: 'Manga', neckline: 'Escote' },
    pt: { body: 'Corpo', sleeve: 'Manga', neckline: 'Decote' },
  };

  const labels: Record<LanguageCode, Record<string, string>> = {
    en: {
      chest: 'Chest Circumference',
      waist: 'Waist Circumference',
      backLength: 'Back Length',
      sleeveLength: 'Sleeve Length',
      upperArm: 'Upper Arm Circumference',
      cuff: 'Cuff Circumference',
      neck: 'Neck Circumference',
      shoulder: 'Shoulder Width',
    },
    de: {
      chest: 'Brustumfang',
      waist: 'Taillenumfang',
      backLength: 'Rückenlänge',
      sleeveLength: 'Ärmellänge',
      upperArm: 'Oberarmumfang',
      cuff: 'Manschettenumfang',
      neck: 'Halsausschnitt-Umfang',
      shoulder: 'Schulterbreite',
    },
    fr: {
      chest: 'Tour de poitrine',
      waist: 'Tour de taille',
      backLength: 'Longueur dos',
      sleeveLength: 'Longueur de manche',
      upperArm: 'Tour de bras',
      cuff: 'Tour de poignet',
      neck: 'Tour de cou',
      shoulder: 'Largeur d\'épaule',
    },
    es: {
      chest: 'Circunferencia del pecho',
      waist: 'Circunferencia de la cintura',
      backLength: 'Largo de espalda',
      sleeveLength: 'Largo de manga',
      upperArm: 'Circunferencia del brazo',
      cuff: 'Circunferencia del puño',
      neck: 'Circunferencia del cuello',
      shoulder: 'Ancho de hombros',
    },
    pt: {
      chest: 'Circunferência do peito',
      waist: 'Circunferência da cintura',
      backLength: 'Comprimento das costas',
      sleeveLength: 'Comprimento da manga',
      upperArm: 'Circunferência do braço',
      cuff: 'Circunferência do punho',
      neck: 'Circunferência do pescoço',
      shoulder: 'Largura do ombro',
    },
  };

  const l = labels[lang];
  const sn = sectionNames[lang];

  return {
    id: 'sample-crew-neck-sweater',
    name: names[lang],
    author: 'Stitch & Scale',
    description: descriptions[lang],
    yarnWeight: 'worsted',
    baseSize: 'M',
    gauge: {
      stitchesPer4In: 20,
      rowsPer4In: 28,
      unit: 'in',
    },
    sections: [
      {
        id: 'sample-body',
        name: sn.body,
        measurements: [
          {
            id: 'sample-body-bust',
            label: l.chest,
            measurementType: 'circumference',
            gradingKey: 'bust',
            baseValue: 38,
            stitchRepeat: 4,
          },
          {
            id: 'sample-body-waist',
            label: l.waist,
            measurementType: 'circumference',
            gradingKey: 'waist',
            baseValue: 34,
            stitchRepeat: 4,
          },
          {
            id: 'sample-body-length',
            label: l.backLength,
            measurementType: 'length',
            gradingKey: 'backLength',
            baseValue: 26.5,
            rowRepeat: 2,
          },
        ],
      },
      {
        id: 'sample-sleeve',
        name: sn.sleeve,
        measurements: [
          {
            id: 'sample-sleeve-length',
            label: l.sleeveLength,
            measurementType: 'length',
            gradingKey: 'sleeveLength',
            baseValue: 17,
            rowRepeat: 2,
          },
          {
            id: 'sample-sleeve-upper-arm',
            label: l.upperArm,
            measurementType: 'circumference',
            gradingKey: 'upperArm',
            baseValue: 15,
            stitchRepeat: 4,
          },
          {
            id: 'sample-sleeve-wrist',
            label: l.cuff,
            measurementType: 'circumference',
            gradingKey: 'wrist',
            baseValue: 8,
            stitchRepeat: 4,
          },
        ],
      },
      {
        id: 'sample-neckline',
        name: sn.neckline,
        measurements: [
          {
            id: 'sample-neck-circ',
            label: l.neck,
            measurementType: 'circumference',
            gradingKey: 'neckCircumference',
            baseValue: 16,
            stitchRepeat: 2,
          },
          {
            id: 'sample-shoulder',
            label: l.shoulder,
            measurementType: 'width',
            gradingKey: 'shoulder',
            baseValue: 16,
            stitchRepeat: 2,
          },
        ],
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

export const getSampleBasicBeanie = (lang: LanguageCode = 'en'): PatternProject => {
  const names: Record<LanguageCode, string> = {
    en: 'Basic Ribbed Beanie',
    de: 'Einfache Rippenmütze',
    fr: 'Bonnet côtelé basique',
    es: 'Gorro acanalado básico',
    pt: 'Gorro canelado básico',
  };

  const descriptions: Record<LanguageCode, string> = {
    en: 'A straightforward top-down beanie in DK weight. One size fits most with easy gauge adjustments.',
    de: 'Eine unkomplizierte Top-Down-Mütze in DK-Garnstärke. Einheitsgröße, die den meisten passt, mit einfachen Anpassungen der Maschenprobe.',
    fr: 'Un bonnet simple tricoté du haut vers le bas en laine DK. Taille unique s\'adaptant à la plupart des têtes avec des ajustements faciles de l\'échantillon.',
    es: 'Un gorro sencillo tejido de arriba hacia abajo en lana de grosor DK. Talla única con ajustes fáciles de tensión.',
    pt: 'Um gorro simples trabalhado de cima para baixo em fio de peso DK. Tamanho único que serve à maioria com ajustes fáceis de amostra.',
  };

  const sectionNames: Record<LanguageCode, { brim: string; body: string }> = {
    en: { brim: 'Brim', body: 'Body' },
    de: { brim: 'Bund', body: 'Körper' },
    fr: { brim: 'Rebord', body: 'Corps' },
    es: { brim: 'Borde', body: 'Cuerpo' },
    pt: { brim: 'Aba', body: 'Corpo' },
  };

  const labels: Record<LanguageCode, Record<string, string>> = {
    en: {
      head: 'Head Circumference',
      brimDepth: 'Brim Depth',
      totalHeight: 'Total Hat Height',
      notes: 'Negative ease of ~1-2" for a snug fit',
    },
    de: {
      head: 'Kopfumfang',
      brimDepth: 'Bundtiefe',
      totalHeight: 'Gesamthöhe der Mütze',
      notes: 'Negative Bequemlichkeitszugabe von ~2,5-5 cm für eine enge Passform',
    },
    fr: {
      head: 'Tour de tête',
      brimDepth: 'Profondeur du rebord',
      totalHeight: 'Hauteur totale du bonnet',
      notes: 'Aisance négative de ~2,5-5 cm pour un ajustement serré',
    },
    es: {
      head: 'Circunferencia de la cabeza',
      brimDepth: 'Profundidad del borde',
      totalHeight: 'Altura total del gorro',
      notes: 'Holgura negativa de ~2,5-5 cm para un ajuste ceñido',
    },
    pt: {
      head: 'Circunferência da cabeça',
      brimDepth: 'Profundidade da aba',
      totalHeight: 'Altura total do gorro',
      notes: 'Folga negativa de ~2,5-5 cm para um ajuste justo',
    },
  };

  const l = labels[lang];
  const sn = sectionNames[lang];

  return {
    id: 'sample-basic-beanie',
    name: names[lang],
    author: 'Stitch & Scale',
    description: descriptions[lang],
    yarnWeight: 'DK',
    baseSize: 'M',
    gauge: {
      stitchesPer4In: 22,
      rowsPer4In: 30,
      unit: 'in',
    },
    sections: [
      {
        id: 'sample-beanie-brim',
        name: sn.brim,
        measurements: [
          {
            id: 'sample-beanie-head-circ',
            label: l.head,
            measurementType: 'circumference',
            gradingKey: 'neckCircumference',
            baseValue: 21,
            stitchRepeat: 4,
            notes: l.notes,
          },
          {
            id: 'sample-beanie-brim-depth',
            label: l.brimDepth,
            measurementType: 'direct',
            gradingKey: 'backLength',
            baseValue: 2.5,
            rowRepeat: 2,
          },
        ],
      },
      {
        id: 'sample-beanie-body',
        name: sn.body,
        measurements: [
          {
            id: 'sample-beanie-total-height',
            label: l.totalHeight,
            measurementType: 'direct',
            gradingKey: 'backLength',
            baseValue: 9.5,
            rowRepeat: 2,
          },
        ],
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

// Legacy exports for backward compatibility during refactor
export const SAMPLE_CREW_NECK_SWEATER = getSampleCrewNeckSweater('en');
export const SAMPLE_BASIC_BEANIE = getSampleBasicBeanie('en');
