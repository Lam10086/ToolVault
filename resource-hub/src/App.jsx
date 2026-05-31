import React, { useContext } from 'react';
import { DBContext } from './context/DBContext';
import { NavBar } from './components/NavBar';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';

export const App = () => {
  const { addNewResource } = useContext(DBContext);

  const handleAdd = () => {
    // Placeholder: create a dummy resource
    const dummy = {
      title: '新资源',
      description: '描述',
      url: '',
      categoryId: null,
    };
    addNewResource(dummy);
  };

  return (
    <div className="flex flex-col h-screen bg-bg text-gray-900">
      <NavBar onAdd={handleAdd} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-4 overflow-auto">
          <Canvas />
        </main>
      </div>
    </div>
  );
};

export default App;
