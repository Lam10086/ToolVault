import React, { createContext, useEffect, useState } from 'react';
import { getResources, getCategories, addResource, addCategory } from '../lib/db';

export const DBContext = createContext({
  resources: [],
  categories: [],
  refreshResources: () => {},
  refreshCategories: () => {},
  addNewResource: async () => {},
  addNewCategory: async () => {}
});

export const DBProvider = ({ children }) => {
  const [resources, setResources] = useState([]);
  const [categories, setCategories] = useState([]);

  const refreshResources = async () => {
    const data = await getResources();
    setResources(data);
  };

  const refreshCategories = async () => {
    const data = await getCategories();
    // ensure at least a default category exists
    if (data.length === 0) {
      const defaultId = await addCategory({ name: 'Unsorted' });
      const newData = await getCategories();
      setCategories(newData);
    } else {
      setCategories(data);
    }
  };

  const addNewResource = async (resource) => {
    await addResource(resource);
    await refreshResources();
  };

  const addNewCategory = async (category) => {
    await addCategory(category);
    await refreshCategories();
  };

  useEffect(() => {
    refreshResources();
    refreshCategories();
  }, []);

  return (
    <DBContext.Provider
      value={{
        resources,
        categories,
        refreshResources,
        refreshCategories,
        addNewResource,
        addNewCategory,
      }}
    >
      {children}
    </DBContext.Provider>
  );
};
