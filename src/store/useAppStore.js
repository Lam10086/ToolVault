import { create } from 'zustand';
import Fuse from 'fuse.js';
import {
  getAllResources, saveResource, deleteResource,
  getAllCategories, saveCategory, deleteCategory,
  getAllWorkflows, saveWorkflow, deleteWorkflow,
  getAllTags, saveTag, deleteTag,
} from '../db/storage';

const useAppStore = create((set, get) => ({

  // ── View ──────────────────────────────────────────────────────────────────
  view: 'library', // 'library' | 'workflow'
  setView: (view) => set({ view }),

  // ── Resources ─────────────────────────────────────────────────────────────
  resources: [],
  filteredResources: [],
  selectedResourceType: null,
  selectedTags: [],
  selectedPricings: [],
  selectedStatuses: [],
  sortBy: 'createdAt',
  viewType: 'card', // 'card' | 'list' | 'mindmap'
  detailResource: null,
  searchQuery: '',

  loadResources: async () => {
    const resources = await getAllResources();
    set({ resources });
    get()._applyFilters();
  },

  addOrUpdateResource: async (resource) => {
    const saved = await saveResource(resource);
    await get().loadResources();
    return saved;
  },

  removeResource: async (id) => {
    await deleteResource(id);
    await get().loadResources();
  },

  setFilter: (resourceType) => {
    set({ selectedResourceType: resourceType });
    get()._applyFilters();
  },

  setSearch: (query) => {
    set({ searchQuery: query });
    get()._applyFilters();
  },

  setSelectedTags: (tags) => {
    set({ selectedTags: tags });
    get()._applyFilters();
  },

  setSelectedPricings: (pricings) => {
    set({ selectedPricings: pricings });
    get()._applyFilters();
  },

  setSelectedStatuses: (statuses) => {
    set({ selectedStatuses: statuses });
    get()._applyFilters();
  },

  setSortBy: (sortBy) => {
    set({ sortBy });
    get()._applyFilters();
  },

  setViewType: (viewType) => set({ viewType }),

  openDetailModal: (resource) => set({ detailResource: resource }),
  closeDetailModal: () => set({ detailResource: null }),

  _applyFilters: () => {
    const { resources, selectedResourceType, selectedTags, selectedPricings, selectedStatuses, searchQuery, sortBy, categories } = get();
    let filtered = [...resources];

    // 1. ResourceType Filter
    if (selectedResourceType) {
      filtered = filtered.filter(r => (r.resourceType || 'website') === selectedResourceType);
    }

    // 2. Tags Filter (supports filtering if resource has all selected tags)
    if (selectedTags.length > 0) {
      filtered = filtered.filter(r => 
        selectedTags.every(t => r.tagIds?.includes(t) || r.tags?.includes(t))
      );
    }

    // 3. Status Filter
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(r => selectedStatuses.includes(r.status || 'common'));
    }

    // 4. Pricings Filter
    if (selectedPricings.length > 0) {
      filtered = filtered.filter(r => 
        r.pricings && r.pricings.some(p => selectedPricings.includes(p.type))
      );
    }

    // 5. Global Search (Fuse.js)
    if (searchQuery?.trim()) {
      // Map category names virtually for Fuse
      const searchItems = filtered.map(r => {
        const catNames = categories ? categories.filter(c => r.categoryIds?.includes(c.id)).map(c => c.name) : [];
        return { ...r, categoryNames: catNames };
      });

      const fuse = new Fuse(searchItems, {
        keys: [
          { name: 'title', weight: 1.0 },
          { name: 'purpose', weight: 0.8 },
          { name: 'categoryNames', weight: 0.8 },
          { name: 'tags', weight: 0.8 },
          { name: 'description', weight: 0.6 },
          { name: 'scenario', weight: 0.6 },
          { name: 'diffValue', weight: 0.5 },
          { name: 'pitfalls', weight: 0.5 }
        ],
        threshold: 0.35,
      });
      filtered = fuse.search(searchQuery.trim()).map(res => res.item);
    }

    // 6. Custom Sorting
    filtered.sort((a, b) => {
      if (sortBy === 'rating') {
        return (b.rating ?? 0) - (a.rating ?? 0) || b.createdAt - a.createdAt;
      } else if (sortBy === 'usageCount') {
        return (b.usageCount ?? 0) - (a.usageCount ?? 0) || b.createdAt - a.createdAt;
      } else if (sortBy === 'price_asc') {
        const getMinPrice = (res) => {
          if (!res.pricings || res.pricings.length === 0) return Infinity;
          return Math.min(...res.pricings.map(p => p.priceNum ?? Infinity));
        };
        return getMinPrice(a) - getMinPrice(b) || b.createdAt - a.createdAt;
      } else {
        // default: createdAt (newest first)
        return b.createdAt - a.createdAt;
      }
    });

    set({ filteredResources: filtered });
  },

  // ── Categories ────────────────────────────────────────────────────────────
  categories: [],

  loadCategories: async () => {
    const categories = await getAllCategories();
    set({ categories });
  },

  addOrUpdateCategory: async (category) => {
    const saved = await saveCategory(category);
    await get().loadCategories();
    return saved;
  },

  removeCategory: async (id) => {
    await deleteCategory(id);
    await get().loadCategories();
    // remove from filter if was active
    if (get().selectedCategoryId === id) get().setFilter(null);
  },

  // ── Tags ──────────────────────────────────────────────────────────────────
  tags: [],

  loadTags: async () => {
    const tags = await getAllTags();
    set({ tags });
  },

  addOrUpdateTag: async (tag) => {
    const saved = await saveTag(tag);
    await get().loadTags();
    return saved;
  },

  removeTag: async (id) => {
    const tag = get().tags.find(t => t.id === id);
    await deleteTag(id);
    await get().loadTags();
    if (tag) {
      set(s => ({ selectedTags: s.selectedTags.filter(t => t !== tag.name) }));
      get()._applyFilters();
    }
  },

  // ── Workflows ─────────────────────────────────────────────────────────────
  workflows: [],
  activeWorkflowId: null,

  loadWorkflows: async () => {
    const workflows = await getAllWorkflows();
    set({ workflows });
  },

  addOrUpdateWorkflow: async (workflow) => {
    const saved = await saveWorkflow(workflow);
    await get().loadWorkflows();
    return saved;
  },

  removeWorkflow: async (id) => {
    await deleteWorkflow(id);
    if (get().activeWorkflowId === id) set({ activeWorkflowId: null });
    await get().loadWorkflows();
  },

  setActiveWorkflow: (id) => set({ activeWorkflowId: id }),

  // ── UI state ──────────────────────────────────────────────────────────────
  addModalOpen: false,
  editingResource: null,
  catPanelOpen: true,

  openAddModal: (resource = null) =>
    set({ addModalOpen: true, editingResource: resource ?? null }),
  closeAddModal: () =>
    set({ addModalOpen: false, editingResource: null }),
  toggleCatPanel: () =>
    set(s => ({ catPanelOpen: !s.catPanelOpen })),

  settingsModalOpen: false,
  openSettingsModal: () => set({ settingsModalOpen: true }),
  closeSettingsModal: () => set({ settingsModalOpen: false }),

  dataModalOpen: false,
  openDataModal: () => set({ dataModalOpen: true }),
  closeDataModal: () => set({ dataModalOpen: false }),

  importData: null,
  openImportPreview: (data) => set({ importData: data }),
  closeImportPreview: () => set({ importData: null }),

  // ── Toast notifications ────────────────────────────────────────────────────
  toasts: [],
  showToast: (message, type = 'success') => {
    const id = Date.now();
    set(s => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }));
    }, 3000);
  },
}));

export default useAppStore;
