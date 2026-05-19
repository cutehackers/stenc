export const DOC_TYPE_LABELS = {
  specs: 'Spec',
  plans: 'Plan',
  decisions: 'Decision',
  'agent-context': 'Agent Context',
};

export function sortDocuments(documents) {
  return [...documents].sort((a, b) => {
    const left = a.updatedAt || '';
    const right = b.updatedAt || '';
    if (left !== right) return right.localeCompare(left);
    return a.title.localeCompare(b.title);
  });
}

export function normalizeList(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}
