export const RESOURCE_TYPES = {
  website: { id: 'website', label: '网站 / SaaS', icon: '🌐', color: 'var(--cat-sky)' },
  software: { id: 'software', label: '应用 / 软件', icon: '📦', color: 'var(--cat-violet)' },
  api: { id: 'api', label: 'API / 插件', icon: '⚡', color: 'var(--cat-amber)' },
  account: { id: 'account', label: '账号 / 订阅', icon: '🔑', color: 'var(--cat-rose)' },
  secret: { id: 'secret', label: '密钥 / Token', icon: '🛡️', color: 'var(--error)' },
  snippet: { id: 'snippet', label: '代码片段', icon: '💻', color: 'var(--cat-emerald)' },
  document: { id: 'document', label: '书籍 / 教程', icon: '📚', color: 'var(--cat-teal)' },
  other: { id: 'other', label: '其他资产', icon: '📁', color: 'var(--text-3)' },
};

export const RESOURCE_TYPE_OPTIONS = Object.values(RESOURCE_TYPES);

export const getResourceType = (id) => RESOURCE_TYPES[id] || RESOURCE_TYPES.website;
