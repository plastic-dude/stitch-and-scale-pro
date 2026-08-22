import React, { useState } from 'react';
import { useParams } from 'wouter';
import { useProject } from '@/context/ProjectsContext';
import { useSettings } from '@/context/SettingsContext';
import { TECH_EDIT_COPY } from '@/lib/tech-edit-copy';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Trash2, Wand2, FileText, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PatternDocumentContent } from '@/lib/grading-engine';

export const CompositionPanel: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const projectHook = useProject(id);
  const { language } = useSettings();

  if (!projectHook) return null;
  const { project, setDraftContent, compilePackage } = projectHook;
  const copy = TECH_EDIT_COPY[language];

  const content = project.draftContent || {
    sections: [],
    abbreviations: [],
    construction: [],
    finishing: '',
    care: ''
  };

  const [compiling, setCompiling] = useState(false);

  const updateContent = (patch: Partial<PatternDocumentContent>) => {
    setDraftContent({ ...content, ...patch });
  };

  const handleCompile = async () => {
    setCompiling(true);
    // Simulate compilation delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    // For simplicity, compile to the first package if it exists, or create a default one
    const pkgId = project.publicationPackages?.[0]?.id || 'default-pkg';
    compilePackage(pkgId, content);
    setCompiling(false);
  };

  const addSection = () => {
    updateContent({
      sections: [...content.sections, { id: crypto.randomUUID(), name: '', steps: [''] }]
    });
  };

  const updateSection = (id: string, patch: Partial<{ name: string; steps: string[] }>) => {
    updateContent({
      sections: content.sections.map((s: any) => s.id === id ? { ...s, ...patch } : s)
    });
  };

  const removeSection = (id: string) => {
    updateContent({
      sections: content.sections.filter((s: any) => s.id !== id)
    });
  };

  const addStep = (sectionId: string) => {
    updateContent({
      sections: content.sections.map((s: any) => s.id === sectionId ? { ...s, steps: [...s.steps, ''] } : s)
    });
  };

  const updateStep = (sectionId: string, index: number, value: string) => {
    updateContent({
      sections: content.sections.map((s: any) => s.id === sectionId ? {
        ...s,
        steps: s.steps.map((step: string, i: number) => i === index ? value : step)
      } : s)
    });
  };

  const removeStep = (sectionId: string, index: number) => {
    updateContent({
      sections: content.sections.map((s: any) => s.id === sectionId ? {
        ...s,
        steps: s.steps.filter((_: string, i: number) => i !== index)
      } : s)
    });
  };

  const addAbbreviation = () => {
    updateContent({
      abbreviations: [...content.abbreviations, { term: '', definition: '' }]
    });
  };

  const updateAbbreviation = (index: number, patch: Partial<{ term: string; definition: string }>) => {
    updateContent({
      abbreviations: content.abbreviations.map((a: any, i: number) => i === index ? { ...a, ...patch } : a)
    });
  };

  const removeAbbreviation = (index: number) => {
    updateContent({
      abbreviations: content.abbreviations.filter((_: any, i: number) => i !== index)
    });
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{copy.compositionTitle}</h2>
          <p className="text-muted-foreground">{copy.compositionDescription}</p>
        </div>
        <Button 
          onClick={handleCompile} 
          disabled={compiling}
          className="gap-2"
        >
          {compiling ? <Wand2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          {compiling ? copy.compositionCompiling : copy.compositionCompile}
        </Button>
      </div>

      {project.publicationPackages?.[0]?.updatedAt && project.publicationPackages[0].compiledContent && (
        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-md border border-green-100">
          <CheckCircle2 className="h-4 w-4" />
          <span>{copy.compositionLastCompiled(new Date(project.publicationPackages[0].updatedAt).toLocaleString())}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{copy.compositionAbbreviations}</CardTitle>
          <CardDescription>{copy.compositionGlossary}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {content.abbreviations.map((abbr: any, i: number) => (
            <div key={i} className="flex gap-2">
              <Input 
                placeholder={copy.compositionTermPlaceholder}
                value={abbr.term}
                onChange={e => updateAbbreviation(i, { term: e.target.value })}
                className="w-1/3"
              />
              <Input 
                placeholder={copy.compositionDefPlaceholder}
                value={abbr.definition}
                onChange={e => updateAbbreviation(i, { definition: e.target.value })}
                className="flex-1"
              />
              <Button variant="ghost" size="icon" onClick={() => removeAbbreviation(i)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addAbbreviation} className="gap-2">
            <Plus className="h-4 w-4" /> {copy.compositionAddSection}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {content.sections.map((section: any) => (
          <Card key={section.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div className="flex-1 mr-4">
                <Input 
                  placeholder={copy.compositionSectionPlaceholder}
                  value={section.name}
                  onChange={e => updateSection(section.id, { name: e.target.value })}
                  className="font-bold text-lg"
                />
              </div>
              <Button variant="ghost" size="icon" onClick={() => removeSection(section.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {section.steps.map((step: string, i: number) => (
                <div key={i} className="flex gap-2">
                  <span className="mt-2 text-muted-foreground font-mono text-xs w-4">{i + 1}.</span>
                  <Textarea 
                    placeholder={copy.compositionStepPlaceholder}
                    value={step}
                    onChange={e => updateStep(section.id, i, e.target.value)}
                    className="flex-1 min-h-[60px]"
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeStep(section.id, i)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => addStep(section.id)} className="gap-2">
                <Plus className="h-4 w-4" /> {copy.compositionAddStep}
              </Button>
            </CardContent>
          </Card>
        ))}
        <Button variant="outline" className="w-full py-8 border-2 border-dashed gap-2" onClick={addSection}>
          <Plus className="h-4 w-4" /> {copy.compositionAddSection}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{copy.compositionFinishing}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{copy.compositionFinishing}</label>
            <Textarea 
              value={content.finishing}
              onChange={e => updateContent({ finishing: e.target.value })}
              className="min-h-[100px]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{copy.compositionCare}</label>
            <Textarea 
              value={content.care}
              onChange={e => updateContent({ care: e.target.value })}
              className="min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
