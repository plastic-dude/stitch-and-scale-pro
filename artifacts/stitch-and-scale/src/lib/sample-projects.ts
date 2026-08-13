// Sample project seed data — Stitch & Scale
// All objects conform exactly to the PatternProject shape from grading-engine.ts
// Never seed automatically on launch; only seed when the user explicitly requests it.

import { PatternProject } from '@/lib/grading-engine';

export const SAMPLE_CREW_NECK_SWEATER: PatternProject = {
  id: 'sample-crew-neck-sweater',
  name: 'Classic Crew Neck Sweater',
  author: 'Stitch & Scale',
  description:
    'A timeless crew neck pullover in worsted weight yarn. Worked flat in pieces and seamed. Great for first-time graders.',
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
      name: 'Body',
      measurements: [
        {
          id: 'sample-body-bust',
          label: 'Chest Circumference',
          measurementType: 'circumference',
          gradingKey: 'bust',
          baseValue: 38, // 1" positive ease over size M (37")
          stitchRepeat: 4,
        },
        {
          id: 'sample-body-waist',
          label: 'Waist Circumference',
          measurementType: 'circumference',
          gradingKey: 'waist',
          baseValue: 34, // 5" positive ease over size M (29")
          stitchRepeat: 4,
        },
        {
          id: 'sample-body-length',
          label: 'Back Length',
          measurementType: 'length',
          gradingKey: 'backLength',
          baseValue: 26.5,
          rowRepeat: 2,
        },
      ],
    },
    {
      id: 'sample-sleeve',
      name: 'Sleeve',
      measurements: [
        {
          id: 'sample-sleeve-length',
          label: 'Sleeve Length',
          measurementType: 'length',
          gradingKey: 'sleeveLength',
          baseValue: 17, // from underarm
          rowRepeat: 2,
        },
        {
          id: 'sample-sleeve-upper-arm',
          label: 'Upper Arm Circumference',
          measurementType: 'circumference',
          gradingKey: 'upperArm',
          baseValue: 15, // 4" ease over M (11")
          stitchRepeat: 4,
        },
        {
          id: 'sample-sleeve-wrist',
          label: 'Cuff Circumference',
          measurementType: 'circumference',
          gradingKey: 'wrist',
          baseValue: 8, // 1.5" ease over M (6.5")
          stitchRepeat: 4,
        },
      ],
    },
    {
      id: 'sample-neckline',
      name: 'Neckline',
      measurements: [
        {
          id: 'sample-neck-circ',
          label: 'Neck Circumference',
          measurementType: 'circumference',
          gradingKey: 'neckCircumference',
          baseValue: 16,
          stitchRepeat: 2,
        },
        {
          id: 'sample-shoulder',
          label: 'Shoulder Width',
          measurementType: 'width',
          gradingKey: 'shoulder',
          baseValue: 16,
          stitchRepeat: 2,
        },
      ],
    },
  ],
  createdAt: '2025-01-01T10:00:00.000Z',
  updatedAt: '2025-01-01T10:00:00.000Z',
};

export const SAMPLE_BASIC_BEANIE: PatternProject = {
  id: 'sample-basic-beanie',
  name: 'Basic Ribbed Beanie',
  author: 'Stitch & Scale',
  description: 'A straightforward top-down beanie in DK weight. One size fits most with easy gauge adjustments.',
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
      name: 'Brim',
      measurements: [
        {
          id: 'sample-beanie-head-circ',
          label: 'Head Circumference',
          measurementType: 'circumference',
          gradingKey: 'neckCircumference',
          baseValue: 21,
          stitchRepeat: 4,
          notes: 'Negative ease of ~1-2" for a snug fit',
        },
        {
          id: 'sample-beanie-brim-depth',
          label: 'Brim Depth',
          measurementType: 'direct',
          gradingKey: 'backLength',
          baseValue: 2.5,
          rowRepeat: 2,
        },
      ],
    },
    {
      id: 'sample-beanie-body',
      name: 'Body',
      measurements: [
        {
          id: 'sample-beanie-total-height',
          label: 'Total Hat Height',
          measurementType: 'direct',
          gradingKey: 'backLength',
          baseValue: 9.5,
          rowRepeat: 2,
        },
      ],
    },
  ],
  createdAt: '2025-01-02T10:00:00.000Z',
  updatedAt: '2025-01-02T10:00:00.000Z',
};
