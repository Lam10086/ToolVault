import { openDB } from 'idb';

const DB_NAME = 'resource-hub-db';
const DB_VERSION = 1;

export const initDB = async () => {
  return await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('resources')) {
        const store = db.createObjectStore('resources', { keyPath: 'id', autoIncrement: true });
        store.createIndex('byCategory', 'category', { unique: false });
        store.createIndex('byTags', 'tags', { multiEntry: true });
      }
      if (!db.objectStoreNames.contains('categories')) {
        db.createObjectStore('categories', { keyPath: 'id', autoIncrement: true });
      }
    },
  });
};

export const addResource = async (resource) => {
  const db = await initDB();
  return await db.add('resources', resource);
};

export const getResources = async () => {
  const db = await initDB();
  return await db.getAll('resources');
};

export const updateResource = async (resource) => {
  const db = await initDB();
  return await db.put('resources', resource);
};

export const deleteResource = async (id) => {
  const db = await initDB();
  return await db.delete('resources', id);
};

export const addCategory = async (category) => {
  const db = await initDB();
  return await db.add('categories', category);
};

export const getCategories = async () => {
  const db = await initDB();
  return await db.getAll('categories');
};

export const updateCategory = async (category) => {
  const db = await initDB();
  return await db.put('categories', category);
};

export const deleteCategory = async (id) => {
  const db = await initDB();
  return await db.delete('categories', id);
};
