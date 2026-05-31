import { get, set } from 'idb-keyval';

// ── Storage keys ─────────────────────────────────────────────────────────────
const K = {
  RESOURCES:  'tv:resources',
  CATEGORIES: 'tv:categories',
  WORKFLOWS:  'tv:workflows',
  TAGS:       'tv:tags',
};

// ── ID generator ─────────────────────────────────────────────────────────────
export function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ── Default seed data ─────────────────────────────────────────────────────────
const DEFAULT_CATEGORIES = [
  { id: 'cat-init-1', name: 'AI 模型',   color: 'cat-violet', emoji: '🤖', createdAt: Date.now() },
  { id: 'cat-init-2', name: '设计资产', color: 'cat-pink',   emoji: '🎨', createdAt: Date.now() },
  { id: 'cat-init-3', name: '开发组件', color: 'cat-cyan',   emoji: '⚡', createdAt: Date.now() },
  { id: 'cat-init-4', name: '效率神兵', color: 'cat-lime',   emoji: '🚀', createdAt: Date.now() },
  { id: 'cat-init-5', name: '教程研报', color: 'cat-amber',  emoji: '📚', createdAt: Date.now() },
];

// ── Resources ─────────────────────────────────────────────────────────────────
export async function getAllResources() {
  return (await get(K.RESOURCES)) ?? [];
}

export async function saveResource(resource) {
  const all = await getAllResources();
  if (resource.id) {
    const idx = all.findIndex(r => r.id === resource.id);
    if (idx !== -1) all[idx] = { ...resource, updatedAt: Date.now() };
    else all.push(resource);
  } else {
    resource = { ...resource, id: uid(), createdAt: Date.now(), updatedAt: Date.now() };
    all.push(resource);
  }
  await set(K.RESOURCES, all);
  return resource;
}

export async function deleteResource(id) {
  const all = await getAllResources();
  await set(K.RESOURCES, all.filter(r => r.id !== id));
}

export async function bulkSaveResources(newResources) {
  const all = await getAllResources();
  const existingIds = new Set(all.map(r => r.id));
  const toAdd = newResources.filter(r => !existingIds.has(r.id));
  if (toAdd.length > 0) {
    await set(K.RESOURCES, [...all, ...toAdd]);
  }
  return toAdd.length;
}

export async function updateResourceCanvasPos(id, position) {
  const all = await getAllResources();
  const idx = all.findIndex(r => r.id === id);
  if (idx !== -1) {
    all[idx] = { ...all[idx], canvasPosition: position };
    await set(K.RESOURCES, all);
  }
}

// ── Categories ─────────────────────────────────────────────────────────────────
export async function getAllCategories() {
  const data = await get(K.CATEGORIES);
  if (!data || data.length === 0) {
    await set(K.CATEGORIES, DEFAULT_CATEGORIES);
    return DEFAULT_CATEGORIES;
  }
  return data;
}

export async function saveCategory(category) {
  const all = await getAllCategories();
  if (category.id) {
    const idx = all.findIndex(c => c.id === category.id);
    if (idx !== -1) all[idx] = category;
    else all.push(category);
  } else {
    category = { ...category, id: uid(), createdAt: Date.now() };
    all.push(category);
  }
  await set(K.CATEGORIES, all);
  return category;
}

export async function deleteCategory(id) {
  const all = await getAllCategories();
  await set(K.CATEGORIES, all.filter(c => c.id !== id));
}

// ── Workflows ──────────────────────────────────────────────────────────────────
export async function getAllWorkflows() {
  return (await get(K.WORKFLOWS)) ?? [];
}

export async function saveWorkflow(workflow) {
  const all = await getAllWorkflows();
  const now = Date.now();
  if (workflow.id) {
    const idx = all.findIndex(w => w.id === workflow.id);
    if (idx !== -1) all[idx] = { ...workflow, updatedAt: now };
    else all.push({ ...workflow, updatedAt: now });
  } else {
    workflow = { ...workflow, id: uid(), createdAt: now, updatedAt: now };
    all.push(workflow);
  }
  await set(K.WORKFLOWS, all);
  return workflow;
}

export async function deleteWorkflow(id) {
  const all = await getAllWorkflows();
  await set(K.WORKFLOWS, all.filter(w => w.id !== id));
}

// ── Tags ───────────────────────────────────────────────────────────────────────
export async function getAllTags() {
  const data = await get(K.TAGS);
  if (!data || data.length === 0) {
    const defaultTags = [
      { id: 'tag-init-1', name: '完全免费', createdAt: Date.now() },
      { id: 'tag-init-2', name: '免费商用', createdAt: Date.now() },
      { id: 'tag-init-3', name: '开源项目', createdAt: Date.now() },
      { id: 'tag-init-4', name: '部分付费', createdAt: Date.now() },
      { id: 'tag-init-5', name: '在线可用', createdAt: Date.now() },
      { id: 'tag-init-6', name: '免安装',   createdAt: Date.now() },
      { id: 'tag-init-7', name: '无需登录', createdAt: Date.now() },
      { id: 'tag-init-8', name: 'Chrome插件', createdAt: Date.now() },
      { id: 'tag-init-9', name: '客户端软件', createdAt: Date.now() },
      { id: 'tag-init-10', name: '中文界面', createdAt: Date.now() },
      { id: 'tag-init-11', name: '免版权',   createdAt: Date.now() },
      { id: 'tag-init-12', name: '国内加速', createdAt: Date.now() },
      { id: 'tag-init-13', name: '小巧实用', createdAt: Date.now() },
    ];
    await set(K.TAGS, defaultTags);
    return defaultTags;
  }
  return data;
}

export async function saveTag(tag) {
  const all = await getAllTags();
  if (tag.id) {
    const idx = all.findIndex(t => t.id === tag.id);
    if (idx !== -1) all[idx] = { ...tag };
    else all.push(tag);
  } else {
    tag = { ...tag, id: uid(), createdAt: Date.now() };
    all.push(tag);
  }
  await set(K.TAGS, all);
  return tag;
}

export async function deleteTag(id) {
  const all = await getAllTags();
  await set(K.TAGS, all.filter(t => t.id !== id));
}

// ── Export Full DB ─────────────────────────────────────────────────────────────
export async function getFullDbState() {
  return {
    resources: await getAllResources(),
    categories: await getAllCategories(),
    workflows: await getAllWorkflows(),
    tags: await getAllTags(),
  };
}
