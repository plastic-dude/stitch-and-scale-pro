import type { LanguageCode } from '@/lib/i18n';

export interface McpAssistantCopy {
  title: string;
  description: string;
  optional: string;
  privacyTitle: string;
  privacyBody: string;
  mathTitle: string;
  mathBody: string;
  prepare: string;
  preparedTitle: string;
  preparedBody: string;
  copyBrief: string;
  copied: string;
  copyFailed: string;
  factsTitle: string;
  caveatTitle: string;
  noData: string;
  disabledForIncomplete: string;
}

const en: McpAssistantCopy = {
  title: 'AI Grading Assistant',
  description: 'Prepare a grounded brief for an AI tutor to explain this grading result or help you learn the next step.',
  optional: 'Optional — Stitch & Scale does the calculation; the AI only explains it.',
  privacyTitle: 'Your data boundary',
  privacyBody: 'Nothing is sent anywhere by this button. It prepares text locally. You choose whether to paste it into an AI service or connect a read-only MCP client.',
  mathTitle: 'Trust boundary',
  mathBody: 'The assistant must not invent measurements, replace the grading engine, or make changes. Review every suggestion before using it.',
  prepare: 'Prepare AI brief',
  preparedTitle: 'Brief ready',
  preparedBody: 'The brief contains the current project snapshot, deterministic grading facts, warnings, and strict explanation rules.',
  copyBrief: 'Copy brief',
  copied: 'AI brief copied',
  copyFailed: 'Copy failed — select the brief manually.',
  factsTitle: 'Calculated facts',
  caveatTitle: 'Caveats',
  noData: 'Add at least one measurement before preparing an AI brief.',
  disabledForIncomplete: 'The brief stays disabled until this project has a measurement.',
};

const de: McpAssistantCopy = {
  ...en,
  title: 'KI-Gradierungsassistent',
  description: 'Bereite einen verankerten Brief vor, damit ein KI-Tutor dieses Ergebnis erklärt oder den nächsten Schritt vermittelt.',
  optional: 'Optional — Stitch & Scale rechnet; die KI erklärt nur.',
  privacyTitle: 'Deine Datengrenze',
  privacyBody: 'Diese Schaltfläche sendet nichts. Sie bereitet Text lokal vor. Du entscheidest, ob du ihn in einen KI-Dienst einfügst oder einen schreibgeschützten MCP-Client verbindest.',
  mathTitle: 'Vertrauensgrenze',
  mathBody: 'Der Assistent darf keine Maße erfinden, die Gradierungslogik ersetzen oder Änderungen vornehmen. Prüfe jeden Vorschlag.',
  prepare: 'KI-Brief vorbereiten',
  preparedTitle: 'Brief bereit',
  preparedBody: 'Der Brief enthält den aktuellen Projektschnappschuss, deterministische Fakten, Warnungen und feste Erklärungsregeln.',
  copyBrief: 'Brief kopieren',
  copied: 'KI-Brief kopiert',
  copyFailed: 'Kopieren fehlgeschlagen — Brief manuell auswählen.',
  factsTitle: 'Berechnete Fakten',
  caveatTitle: 'Hinweise',
  noData: 'Füge mindestens ein Maß hinzu, bevor du einen KI-Brief vorbereitest.',
  disabledForIncomplete: 'Der Brief bleibt deaktiviert, bis das Projekt ein Maß enthält.',
};

const fr: McpAssistantCopy = {
  ...en,
  title: 'Assistant IA de gradation',
  description: 'Préparez un brief ancré pour qu’un tuteur IA explique ce résultat ou vous aide à apprendre l’étape suivante.',
  optional: 'Optionnel — Stitch & Scale calcule ; l’IA explique seulement.',
  privacyTitle: 'Votre limite de données',
  privacyBody: 'Ce bouton n’envoie rien. Il prépare le texte localement. Vous choisissez de le coller dans un service IA ou de connecter un client MCP en lecture seule.',
  mathTitle: 'Limite de confiance',
  mathBody: 'L’assistant ne doit pas inventer de mesures, remplacer le moteur de gradation ni modifier le projet. Vérifiez chaque suggestion.',
  prepare: 'Préparer le brief IA',
  preparedTitle: 'Brief prêt',
  preparedBody: 'Le brief contient l’instantané du projet, les faits déterministes, les avertissements et les règles d’explication.',
  copyBrief: 'Copier le brief',
  copied: 'Brief IA copié',
  copyFailed: 'Échec de la copie — sélectionnez le brief manuellement.',
  factsTitle: 'Faits calculés',
  caveatTitle: 'Réserves',
  noData: 'Ajoutez au moins une mesure avant de préparer un brief IA.',
  disabledForIncomplete: 'Le brief reste désactivé tant que le projet ne contient aucune mesure.',
};

const es: McpAssistantCopy = {
  ...en,
  title: 'Asistente de gradación con IA',
  description: 'Prepara un resumen fundamentado para que un tutor de IA explique este resultado o enseñe el siguiente paso.',
  optional: 'Opcional — Stitch & Scale calcula; la IA solo explica.',
  privacyTitle: 'Tu límite de datos',
  privacyBody: 'Este botón no envía nada. Prepara el texto localmente. Tú decides si lo pegas en un servicio de IA o conectas un cliente MCP de solo lectura.',
  mathTitle: 'Límite de confianza',
  mathBody: 'El asistente no debe inventar medidas, sustituir el motor de gradación ni hacer cambios. Revisa cada sugerencia.',
  prepare: 'Preparar resumen para IA',
  preparedTitle: 'Resumen listo',
  preparedBody: 'Incluye el proyecto actual, hechos deterministas, advertencias y reglas estrictas de explicación.',
  copyBrief: 'Copiar resumen',
  copied: 'Resumen de IA copiado',
  copyFailed: 'No se pudo copiar — selecciona el resumen manualmente.',
  factsTitle: 'Hechos calculados',
  caveatTitle: 'Advertencias',
  noData: 'Añade al menos una medida antes de preparar un resumen para IA.',
  disabledForIncomplete: 'El resumen seguirá desactivado hasta que el proyecto tenga una medida.',
};

const pt: McpAssistantCopy = {
  ...en,
  title: 'Assistente de gradação com IA',
  description: 'Prepare um resumo fundamentado para que um tutor de IA explique este resultado ou ensine o próximo passo.',
  optional: 'Opcional — o Stitch & Scale calcula; a IA apenas explica.',
  privacyTitle: 'O seu limite de dados',
  privacyBody: 'Este botão não envia nada. Prepara o texto localmente. Escolha se o cola num serviço de IA ou liga um cliente MCP só de leitura.',
  mathTitle: 'Limite de confiança',
  mathBody: 'O assistente não deve inventar medidas, substituir o motor de gradação nem alterar o projeto. Reveja todas as sugestões.',
  prepare: 'Preparar resumo para IA',
  preparedTitle: 'Resumo pronto',
  preparedBody: 'Inclui o projeto atual, factos determinísticos, avisos e regras rigorosas de explicação.',
  copyBrief: 'Copiar resumo',
  copied: 'Resumo de IA copiado',
  copyFailed: 'Não foi possível copiar — selecione o resumo manualmente.',
  factsTitle: 'Factos calculados',
  caveatTitle: 'Ressalvas',
  noData: 'Adicione pelo menos uma medida antes de preparar um resumo para IA.',
  disabledForIncomplete: 'O resumo fica desativado até o projeto ter uma medida.',
};

export const MCP_ASSISTANT_COPY: Record<LanguageCode, McpAssistantCopy> = { en, de, fr, es, pt };
