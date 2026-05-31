import React from 'react';

export const NavBar = ({ onAdd }) => (
  <header className="bg-primary text-white flex items-center justify-between px-6 py-3 shadow-card">
    <h1 className="text-2xl font-semibold">资源整合平台</h1>
    <button
      onClick={onAdd}
      className="bg-primary-light px-3 py-1 rounded hover:bg-primary-dark transition"
    >
      添加资源
    </button>
  </header>
);

