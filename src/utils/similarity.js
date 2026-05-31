/**
 * Calculate similarity scores between a target resource and all other resources.
 * Returns an array of resources sorted by similarity (highest first).
 */
export function getRelatedResources(targetResource, allResources, limit = 5) {
  if (!targetResource || !allResources || allResources.length === 0) return [];

  const targetTags = new Set(targetResource.tags || []);
  const targetTagIds = new Set(targetResource.tagIds || []);
  const targetCats = new Set(targetResource.categoryIds || []);

  const scoredResources = allResources
    .filter(r => r.id !== targetResource.id)
    .map(res => {
      let score = 0;

      // 1. Category match (+10 points per shared category)
      if (res.categoryIds) {
        res.categoryIds.forEach(cid => {
          if (targetCats.has(cid)) score += 10;
        });
      }

      // 2. Tag match (+20 points per shared tag/tagId)
      if (res.tagIds) {
        res.tagIds.forEach(tid => {
          if (targetTagIds.has(tid)) score += 20;
        });
      }
      if (res.tags) {
        res.tags.forEach(t => {
          if (targetTags.has(t)) score += 20;
        });
      }

      // TODO: Workflow co-occurrence (+50 points) can be added here if we pass workflow data

      return { resource: res, score };
    })
    .filter(r => r.score > 0) // Only return those with some similarity
    .sort((a, b) => b.score - a.score); // Highest score first

  return scoredResources.slice(0, limit).map(r => r.resource);
}
