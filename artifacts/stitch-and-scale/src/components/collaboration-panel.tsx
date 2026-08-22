import React, { useState } from 'react';
import { PatternProject, CollaborationMember, CollaborationRole, generateId } from '@/lib/grading-engine';
import { COLLABORATION_COPY } from '@/lib/collaboration-copy';
import { LanguageCode } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Trash2, Mail, Calendar, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollaborationPanelProps {
  project: PatternProject;
  language: LanguageCode;
  onAddMember: (member: CollaborationMember) => void;
  onUpdateMember: (id: string, patch: Partial<CollaborationMember>) => void;
  onDeleteMember: (id: string) => void;
}

export function CollaborationPanel({ 
  project, 
  language,
  onAddMember,
  onUpdateMember,
  onDeleteMember
}: CollaborationPanelProps) {
  const copy = COLLABORATION_COPY[language];
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<CollaborationRole>('tester');
  const [newEmail, setNewEmail] = useState('');

  const handleInvite = () => {
    if (!newName.trim()) return;
    onAddMember({
      name: newName,
      role: newRole,
      email: newEmail
    } as any);
    setNewName('');
    setNewEmail('');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {copy.roster}
          </CardTitle>
          <CardDescription>
            Manage technical editors and test knitters assigned to this project.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/30">
            <div className="space-y-2">
              <Label>{copy.nameLabel}</Label>
              <Input 
                value={newName} 
                onChange={e => setNewName(e.target.value)} 
                placeholder="e.g. Jane Doe"
              />
            </div>
            <div className="space-y-2">
              <Label>{copy.roleLabel}</Label>
              <select 
                className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                value={newRole}
                onChange={e => setNewRole(e.target.value as CollaborationRole)}
              >
                <option value="editor">{copy.editor}</option>
                <option value="tester">{copy.tester}</option>
                <option value="viewer">{copy.viewer}</option>
              </select>
            </div>
            <div className="space-y-2 flex flex-col justify-end">
              <Button onClick={handleInvite} disabled={!newName.trim()}>
                <UserPlus className="h-4 w-4 mr-2" />
                {copy.inviteButton}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {(project.collaborationRoster || []).map(member => (
              <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {member.name}
                      <Badge variant="secondary" className="text-[10px] py-0 h-4 uppercase">
                        {member.role}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(member.invitedAt).toLocaleDateString()}
                      </span>
                      {member.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {member.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select 
                    className={cn(
                      "h-8 rounded-md border text-xs px-2 bg-background",
                      member.status === 'active' ? "text-sky-600 border-sky-200" :
                      member.status === 'completed' ? "text-emerald-600 border-emerald-200" :
                      member.status === 'ghosted' ? "text-destructive border-destructive/20" :
                      "text-muted-foreground"
                    )}
                    value={member.status}
                    onChange={e => onUpdateMember(member.id, { status: e.target.value as any })}
                  >
                    <option value="invited">{copy.invited}</option>
                    <option value="active">{copy.active}</option>
                    <option value="completed">{copy.completed}</option>
                    <option value="ghosted">{copy.ghosted}</option>
                  </select>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => onDeleteMember(member.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {(!project.collaborationRoster || project.collaborationRoster.length === 0) && (
              <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                No collaborators invited yet.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
