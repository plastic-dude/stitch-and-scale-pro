import { LanguageCode } from './i18n';

export interface CollaborationCopy {
  title: string;
  roster: string;
  addMember: string;
  nameLabel: string;
  roleLabel: string;
  statusLabel: string;
  inviteButton: string;
  editor: string;
  tester: string;
  viewer: string;
  invited: string;
  active: string;
  completed: string;
  ghosted: string;
  issueTracking: string;
  addIssue: string;
  assigneeLabel: string;
  dueDateLabel: string;
  locationLabel: string;
  comments: string;
  addComment: string;
  commentPlaceholder: string;
}

export const COLLABORATION_COPY: Record<LanguageCode, CollaborationCopy> = {
  en: {
    title: 'Collaboration',
    roster: 'Team Roster',
    addMember: 'Invite Member',
    nameLabel: 'Name',
    roleLabel: 'Role',
    statusLabel: 'Status',
    inviteButton: 'Send Invite',
    editor: 'Technical Editor',
    tester: 'Test Knitter',
    viewer: 'Viewer',
    invited: 'Invited',
    active: 'Active',
    completed: 'Completed',
    ghosted: 'Ghosted',
    issueTracking: 'Issue Tracking',
    addIssue: 'Report Issue',
    assigneeLabel: 'Assignee',
    dueDateLabel: 'Due Date',
    locationLabel: 'Location',
    comments: 'Comments',
    addComment: 'Post Comment',
    commentPlaceholder: 'Write a comment...',
  },
  de: {
    title: 'Zusammenarbeit',
    roster: 'Teamliste',
    addMember: 'Mitglied einladen',
    nameLabel: 'Name',
    roleLabel: 'Rolle',
    statusLabel: 'Status',
    inviteButton: 'Einladung senden',
    editor: 'Technische Redaktion',
    tester: 'Test-Stricker',
    viewer: 'Beobachter',
    invited: 'Eingeladen',
    active: 'Aktiv',
    completed: 'Abgeschlossen',
    ghosted: 'Ghosted',
    issueTracking: 'Fehlerverfolgung',
    addIssue: 'Fehler melden',
    assigneeLabel: 'Zuständig',
    dueDateLabel: 'Fällig am',
    locationLabel: 'Ort',
    comments: 'Kommentare',
    addComment: 'Kommentar posten',
    commentPlaceholder: 'Schreibe einen Kommentar...',
  },
  fr: {
    title: 'Collaboration',
    roster: 'Liste de l\'équipe',
    addMember: 'Inviter un membre',
    nameLabel: 'Nom',
    roleLabel: 'Rôle',
    statusLabel: 'Statut',
    inviteButton: 'Envoyer l\'invitation',
    editor: 'Éditeur technique',
    tester: 'Testeur de tricot',
    viewer: 'Observateur',
    invited: 'Invité',
    active: 'Actif',
    completed: 'Terminé',
    ghosted: 'Disparu',
    issueTracking: 'Suivi des problèmes',
    addIssue: 'Signaler un problème',
    assigneeLabel: 'Assigné à',
    dueDateLabel: 'Date d\'échéance',
    locationLabel: 'Emplacement',
    comments: 'Commentaires',
    addComment: 'Publier un commentaire',
    commentPlaceholder: 'Écrire un commentaire...',
  },
  es: {
    title: 'Colaboración',
    roster: 'Lista del equipo',
    addMember: 'Invitar miembro',
    nameLabel: 'Nombre',
    roleLabel: 'Rol',
    statusLabel: 'Estado',
    inviteButton: 'Enviar invitación',
    editor: 'Editor técnico',
    tester: 'Tejedor de prueba',
    viewer: 'Observador',
    invited: 'Invitado',
    active: 'Activo',
    completed: 'Completado',
    ghosted: 'Desaparecido',
    issueTracking: 'Seguimiento de problemas',
    addIssue: 'Informar problema',
    assigneeLabel: 'Asignado a',
    dueDateLabel: 'Fecha de vencimiento',
    locationLabel: 'Ubicación',
    comments: 'Comentarios',
    addComment: 'Publicar comentario',
    commentPlaceholder: 'Escribir un comentario...',
  },
  pt: {
    title: 'Colaboração',
    roster: 'Lista da equipe',
    addMember: 'Convidar membro',
    nameLabel: 'Nome',
    roleLabel: 'Função',
    statusLabel: 'Status',
    inviteButton: 'Enviar convite',
    editor: 'Editor técnico',
    tester: 'Testador de tricô',
    viewer: 'Observador',
    invited: 'Convidado',
    active: 'Ativo',
    completed: 'Concluído',
    ghosted: 'Desaparecido',
    issueTracking: 'Rastreamento de problemas',
    addIssue: 'Relatar problema',
    assigneeLabel: 'Responsável',
    dueDateLabel: 'Data de entrega',
    locationLabel: 'Localização',
    comments: 'Comentários',
    addComment: 'Publicar comentário',
    commentPlaceholder: 'Escrever um comentário...',
  },
};
