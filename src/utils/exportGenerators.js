/**
 * Generate formatted text representations of the resource library.
 */

export function generateMarkdown(resources, categories, tags) {
  let md = `# My ToolVault Library\n\n`;
  md += `*Generated at: ${new Date().toLocaleString()}*\n\n`;
  md += `---\n\n`;

  // Group resources by category
  const catMap = {};
  categories.forEach(c => { catMap[c.id] = c; });

  const grouped = {};
  resources.forEach(res => {
    // If resource has no categories, put in 'Uncategorized'
    const catIds = res.categoryIds && res.categoryIds.length > 0 ? res.categoryIds : ['uncategorized'];
    catIds.forEach(cid => {
      if (!grouped[cid]) grouped[cid] = [];
      grouped[cid].push(res);
    });
  });

  // Render by category
  for (const [cid, resList] of Object.entries(grouped)) {
    const catName = cid === 'uncategorized' ? '未分类 (Uncategorized)' : (catMap[cid]?.name || '未知分类');
    const emoji = cid === 'uncategorized' ? '📁' : (catMap[cid]?.emoji || '📌');
    
    md += `## ${emoji} ${catName}\n\n`;

    resList.forEach(res => {
      md += `### [${res.title}](${res.url || '#'})\n`;
      if (res.rating > 0) md += `**Rating:** ${res.rating} / 5.0  \n`;
      if (res.purpose) md += `**用途:** ${res.purpose}  \n`;
      if (res.description) md += `> ${res.description.replace(/\n/g, '\n> ')}\n\n`;
      
      // Pricings
      if (res.pricings && res.pricings.length > 0) {
        md += `- **价格方案:** ${res.pricings.map(p => `${p.type === 'free' ? '免费' : p.type === 'subscription' ? '订阅' : '买断'} ${p.model ? `(${p.model})` : ''} ${p.priceNum > 0 ? `${p.currency ?? '¥'}${p.priceNum}` : ''}`).join(' | ')}\n`;
      }
      
      // Tags
      const resTags = [];
      if (res.tagIds) {
        res.tagIds.forEach(tid => {
          const t = tags.find(x => x.id === tid);
          if (t) resTags.push(t.name);
        });
      }
      if (res.tags) resTags.push(...res.tags);
      if (resTags.length > 0) md += `- **标签:** ${resTags.map(t => '`#' + t + '`').join(', ')}\n`;

      if (res.scenario || res.scenarios) md += `- **适用场景:** ${res.scenario || res.scenarios}\n`;
      if (res.diffValue) md += `- **差异化价值:** ${res.diffValue}\n`;
      if (res.pitfalls || res.remarks) md += `- **备注/坑点:** ${res.pitfalls || res.remarks}\n`;

      md += `\n---\n\n`;
    });
  }

  return md;
}

export function generatePlainText(resources, categories, tags) {
  let txt = `=== My ToolVault Library ===\n`;
  txt += `Generated at: ${new Date().toLocaleString()}\n\n`;

  resources.forEach(res => {
    txt += `[ ${res.title} ]\n`;
    if (res.url) txt += `URL: ${res.url}\n`;
    if (res.purpose) txt += `用途: ${res.purpose}\n`;
    if (res.description) txt += `描述: ${res.description}\n`;
    
    const catNames = (res.categoryIds || []).map(cid => categories.find(c => c.id === cid)?.name).filter(Boolean);
    if (catNames.length > 0) txt += `分类: ${catNames.join(', ')}\n`;

    txt += `\n`;
  });

  txt += `============================\n`;
  return txt;
}
