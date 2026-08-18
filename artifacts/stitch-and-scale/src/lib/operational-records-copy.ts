import type { LanguageCode } from '@/lib/i18n';

export interface OperationalRecordsCopy {
  title: string;
  description: string;
  samples: string;
  testKnits: string;
  submissions: string;
  wholesale: string;
  name: string;
  tester: string;
  size: string;
  yarn: string;
  outlet: string;
  account: string;
  location: string;
  deadline: string;
  dueAt: string;
  amount: string;
  currency: string;
  status: string;
  exportCsv: string;
  add: string;
  remove: string;
  empty: string;
  statuses: Record<string, string>;
}

const COPY: Record<LanguageCode, OperationalRecordsCopy> = {
  en: { title: 'Operational records', description: 'Keep samples, test knits, submissions, and wholesale follow-up as durable local records.', samples: 'Samples', testKnits: 'Test knits', submissions: 'Submissions', wholesale: 'Wholesale', name: 'Sample name', tester: 'Tester', size: 'Size', yarn: 'Yarn', outlet: 'Outlet', account: 'Account', location: 'Location', deadline: 'Deadline', dueAt: 'Due date', amount: 'Amount', currency: 'Currency', status: 'Status', exportCsv: 'Export records CSV', add: 'Add record', remove: 'Remove record', empty: 'No records yet.', statuses: { 'in-studio': 'In studio', 'on-loan': 'On loan', returned: 'Returned', sold: 'Sold', missing: 'Missing', planned: 'Planned', active: 'Active', complete: 'Complete', blocked: 'Blocked', submitted: 'Submitted', accepted: 'Accepted', declined: 'Declined', withdrawn: 'Withdrawn', draft: 'Draft', sent: 'Sent', 'partially-paid': 'Partially paid', paid: 'Paid', overdue: 'Overdue', cancelled: 'Cancelled' } },
  de: { title: 'Betriebliche Aufzeichnungen', description: 'Muster, Teststricks, Einreichungen und Großhandelsnachverfolgung dauerhaft lokal festhalten.', samples: 'Muster', testKnits: 'Teststricks', submissions: 'Einreichungen', wholesale: 'Großhandel', name: 'Name des Musters', tester: 'Teststricker:in', size: 'Größe', yarn: 'Garn', outlet: 'Publikation', account: 'Konto', location: 'Ort', deadline: 'Frist', dueAt: 'Fällig am', amount: 'Betrag', currency: 'Währung', status: 'Status', exportCsv: 'Aufzeichnungen als CSV exportieren', add: 'Aufzeichnung hinzufügen', remove: 'Aufzeichnung entfernen', empty: 'Noch keine Aufzeichnungen.', statuses: { 'in-studio': 'Im Studio', 'on-loan': 'Verliehen', returned: 'Zurück', sold: 'Verkauft', missing: 'Vermisst', planned: 'Geplant', active: 'Aktiv', complete: 'Abgeschlossen', blocked: 'Blockiert', submitted: 'Eingereicht', accepted: 'Angenommen', declined: 'Abgelehnt', withdrawn: 'Zurückgezogen', draft: 'Entwurf', sent: 'Gesendet', 'partially-paid': 'Teilweise bezahlt', paid: 'Bezahlt', overdue: 'Überfällig', cancelled: 'Storniert' } },
  fr: { title: 'Registres opérationnels', description: 'Conservez localement les échantillons, tests tricot, soumissions et suivis de vente en gros.', samples: 'Échantillons', testKnits: 'Tests tricot', submissions: 'Soumissions', wholesale: 'Vente en gros', name: 'Nom de l’échantillon', tester: 'Testeur·euse', size: 'Taille', yarn: 'Fil', outlet: 'Publication', account: 'Compte', location: 'Lieu', deadline: 'Date limite', dueAt: 'Échéance', amount: 'Montant', currency: 'Devise', status: 'Statut', exportCsv: 'Exporter les registres en CSV', add: 'Ajouter', remove: 'Supprimer', empty: 'Aucun enregistrement.', statuses: { 'in-studio': 'Au studio', 'on-loan': 'Prêté', returned: 'Retourné', sold: 'Vendu', missing: 'Manquant', planned: 'Prévu', active: 'Actif', complete: 'Terminé', blocked: 'Bloqué', submitted: 'Envoyé', accepted: 'Accepté', declined: 'Refusé', withdrawn: 'Retiré', draft: 'Brouillon', sent: 'Envoyé', 'partially-paid': 'Partiellement payé', paid: 'Payé', overdue: 'En retard', cancelled: 'Annulé' } },
  es: { title: 'Registros operativos', description: 'Conserva localmente muestras, test knits, envíos y seguimientos mayoristas.', samples: 'Muestras', testKnits: 'Test knits', submissions: 'Envíos', wholesale: 'Venta mayorista', name: 'Nombre de la muestra', tester: 'Persona que prueba', size: 'Talla', yarn: 'Hilo', outlet: 'Publicación', account: 'Cuenta', location: 'Ubicación', deadline: 'Fecha límite', dueAt: 'Vencimiento', amount: 'Importe', currency: 'Moneda', status: 'Estado', exportCsv: 'Exportar registros CSV', add: 'Añadir registro', remove: 'Eliminar registro', empty: 'Aún no hay registros.', statuses: { 'in-studio': 'En el estudio', 'on-loan': 'Prestada', returned: 'Devuelta', sold: 'Vendida', missing: 'Perdida', planned: 'Planificado', active: 'Activo', complete: 'Completado', blocked: 'Bloqueado', submitted: 'Enviado', accepted: 'Aceptado', declined: 'Rechazado', withdrawn: 'Retirado', draft: 'Borrador', sent: 'Enviado', 'partially-paid': 'Pagado parcialmente', paid: 'Pagado', overdue: 'Vencido', cancelled: 'Cancelado' } },
  pt: { title: 'Registos operacionais', description: 'Guarde localmente amostras, test knits, submissões e seguimento de vendas por grosso.', samples: 'Amostras', testKnits: 'Test knits', submissions: 'Submissões', wholesale: 'Venda por grosso', name: 'Nome da amostra', tester: 'Pessoa do teste', size: 'Tamanho', yarn: 'Fio', outlet: 'Publicação', account: 'Conta', location: 'Local', deadline: 'Prazo', dueAt: 'Data de vencimento', amount: 'Valor', currency: 'Moeda', status: 'Estado', exportCsv: 'Exportar registos CSV', add: 'Adicionar registo', remove: 'Remover registo', empty: 'Ainda não há registos.', statuses: { 'in-studio': 'No estúdio', 'on-loan': 'Emprestada', returned: 'Devolvida', sold: 'Vendida', missing: 'Em falta', planned: 'Planeado', active: 'Ativo', complete: 'Concluído', blocked: 'Bloqueado', submitted: 'Enviada', accepted: 'Aceite', declined: 'Recusada', withdrawn: 'Retirada', draft: 'Rascunho', sent: 'Enviada', 'partially-paid': 'Parcialmente paga', paid: 'Paga', overdue: 'Em atraso', cancelled: 'Cancelada' } },
};

export function getOperationalRecordsCopy(locale: string): OperationalRecordsCopy {
  return COPY[locale.toLowerCase().split('-')[0] as LanguageCode] ?? COPY.en;
}
