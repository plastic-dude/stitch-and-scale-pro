import type { GradingKey } from './grading-engine';

export type EaseCategory = 'very-close' | 'close' | 'standard' | 'relaxed' | 'oversized';

export interface EaseProfile {
  id: string;
  name: string;
  category: EaseCategory;
  offsets: Partial<Record<GradingKey, number>>;
}

export const EASE_PROFILES: EaseProfile[] = [
  {
    id: 'very-close',
    name: 'Very Close Fit',
    category: 'very-close',
    offsets: {
      bust: 0,
      waist: 0,
      hip: 0,
      upperArm: 0.5,
    }
  },
  {
    id: 'close',
    name: 'Close Fit',
    category: 'close',
    offsets: {
      bust: 2,
      waist: 1,
      hip: 2,
      upperArm: 1,
    }
  },
  {
    id: 'standard',
    name: 'Standard Fit',
    category: 'standard',
    offsets: {
      bust: 4,
      waist: 2,
      hip: 4,
      upperArm: 2,
    }
  },
  {
    id: 'relaxed',
    name: 'Relaxed Fit',
    category: 'relaxed',
    offsets: {
      bust: 6,
      waist: 4,
      hip: 6,
      upperArm: 3,
    }
  },
  {
    id: 'oversized',
    name: 'Oversized',
    category: 'oversized',
    offsets: {
      bust: 10,
      waist: 8,
      hip: 10,
      upperArm: 4,
    }
  }
];
