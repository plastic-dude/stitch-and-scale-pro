import { 
  PatternProject, 
  CompilerIR, 
  Contradiction, 
  gradePattern, 
  resolveProjectStandards,
  ALL_SIZES
} from './grading-engine';

/**
 * Generates a Compiled Intermediate Representation (IR) for a project,
 * including cross-surface contradiction checking.
 */
export function compileProject(project: PatternProject): CompilerIR {
  const standards = resolveProjectStandards(project);
  const gradedData = gradePattern(project, standards);
  const contradictions: Contradiction[] = [];

  // 1. Validate Gauge Consistency
  if (project.gauge.stitchesPer4In <= 0 || project.gauge.rowsPer4In <= 0) {
    contradictions.push({
      id: crypto.randomUUID(),
      severity: 'error',
      source: 'gauge',
      target: 'pattern',
      message: 'Gauge values must be greater than zero.',
      code: 'ERR_GAUGE_ZERO'
    });
  }

  // 2. Validate Measurement Integrity
  project.sections.forEach(section => {
    section.measurements.forEach(m => {
      if (m.baseValue <= 0) {
        contradictions.push({
          id: crypto.randomUUID(),
          severity: 'error',
          source: `measurement:${m.id}`,
          target: 'grading',
          message: `Measurement "${m.label}" in section "${section.name}" has an invalid base value (${m.baseValue}).`,
          code: 'ERR_MEASUREMENT_INVALID'
        });
      }
    });
  });

  // 3. Cross-check graded counts (e.g., zero stitch counts)
  gradedData.forEach(section => {
    section.measurements.forEach(m => {
      m.gradedValues.forEach(v => {
        if (v.stitchCount <= 0) {
          contradictions.push({
            id: crypto.randomUUID(),
            severity: 'error',
            source: `grading:${m.measurementId}:${v.size}`,
            target: 'instruction',
            message: `Graded stitch count for "${m.label}" at size ${v.size} is zero or negative.`,
            code: 'ERR_GRADING_ZERO_STITCHES'
          });
        }
      });
    });
  });

  // 4. Validate Metadata Authoritativeness
  if (!project.name || project.name.trim() === '') {
    contradictions.push({
      id: crypto.randomUUID(),
      severity: 'warning',
      source: 'metadata',
      target: 'publication',
      message: 'Project title is missing.',
      code: 'WARN_METADATA_TITLE'
    });
  }

  return {
    version: '1.0.0',
    metadata: {
      title: project.name,
      author: project.author,
      copyright: `© ${new Date().getFullYear()} ${project.author}`,
      gauge: project.gauge,
      sizes: ALL_SIZES,
    },
    gradedData,
    validation: {
      contradictions,
      isValid: contradictions.every(c => c.severity !== 'error'),
      compiledAt: new Date().toISOString(),
    }
  };
}
