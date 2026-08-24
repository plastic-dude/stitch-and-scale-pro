import React, { useState } from 'react';
import { PatternProject, PublicationPackage, Contradiction } from '@/lib/grading-engine';
import { compileProject } from '@/lib/pattern-compiler';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSettings } from '@/context/SettingsContext';
import { getWorkspaceCopy, type LanguageCode } from '@/lib/workspace-copy';
import { ShieldCheck, ShieldAlert, ShieldQuestion, Play, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProjectCompilerCardProps {
  project: PatternProject;
  updatePublicationPackage: (pkg: PublicationPackage) => void;
}

export function ProjectCompilerCard({ 
  project, 
  updatePublicationPackage 
}: ProjectCompilerCardProps) {
  const { language } = useSettings();
  const copy = getWorkspaceCopy(language);
  const { toast } = useToast();
  const [isCompiling, setIsCompiling] = useState(false);

  // Find the latest draft package to store IR
  const latestPackage = project.publicationPackages?.find(pkg => pkg.status === 'draft') || 
                       project.publicationPackages?.[0];

  const ir = latestPackage?.compilerIR;

  const handleCompile = () => {
    setIsCompiling(true);
    setTimeout(() => {
      const newIR = compileProject(project);
      
      if (latestPackage) {
        updatePublicationPackage({
          ...latestPackage,
          compilerIR: newIR,
          readinessVerdict: newIR.validation.isValid ? 'ready' : 'blocked',
          updatedAt: new Date().toISOString(),
        });
      }

      setIsCompiling(false);
      toast({
        title: newIR.validation.isValid ? copy.compilerValid : copy.compilerInvalid,
        variant: newIR.validation.isValid ? 'default' : 'destructive',
      });
    }, 800);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <div>
              <CardTitle>{copy.compilerTitle}</CardTitle>
              <CardDescription>{copy.compilerDescription}</CardDescription>
            </div>
          </div>
          <Button 
            onClick={handleCompile} 
            disabled={isCompiling || !latestPackage}
            aria-describedby={!latestPackage ? 'compiler-package-required' : undefined}
            className="gap-2 min-h-11"
          >
            <Play className={`w-4 h-4 ${isCompiling ? 'animate-pulse' : ''}`} />
            {copy.compilerCompile}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!latestPackage && (
          <div id="compiler-package-required" role="status" className="rounded-lg border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
            {copy.publicationNoPackages}
          </div>
        )}
        {ir ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/50">
              {ir.validation.isValid ? (
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              ) : (
                <XCircle className="w-6 h-6 text-destructive" />
              )}
              <div>
                <div className="font-medium">
                  {ir.validation.isValid ? copy.compilerValid : copy.compilerInvalid}
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(ir.validation.compiledAt).toLocaleString(language)}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {copy.compilerContradictions}
              </h4>
              {ir.validation.contradictions.length > 0 ? (
                <div className="space-y-2">
                  {ir.validation.contradictions.map(c => (
                    <div 
                      key={c.id} 
                      className={`p-3 rounded border text-sm flex gap-3 ${
                        c.severity === 'error' ? 'bg-destructive/5 border-destructive/20' : 'bg-amber-500/5 border-amber-500/20'
                      }`}
                    >
                      <Badge variant={c.severity === 'error' ? 'destructive' : 'outline'} className="h-fit">
                        {c.severity === 'error' ? copy.compilerSeverityError : copy.compilerSeverityWarning}
                      </Badge>
                      <div>
                        <div className="font-medium text-xs opacity-70 uppercase tracking-wider mb-1">
                          {c.code} • {c.source} → {c.target}
                        </div>
                        <div>{c.message}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic p-4 text-center border rounded-lg border-dashed">
                  {copy.compilerNoContradictions}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 border rounded-lg border-dashed bg-muted/30 text-center space-y-3">
            <ShieldQuestion className="w-12 h-12 text-muted-foreground/50" />
            <div className="max-w-xs text-sm text-muted-foreground">
              {latestPackage ? copy.compilerDescription : copy.publicationNoPackages}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
