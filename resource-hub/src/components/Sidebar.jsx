import { useContext } from 'react';
import { DBContext } from '../context/DBContext';

export const Sidebar = () => {
  const { categories } = useContext(DBContext);
  return (
    <aside className="w-64 bg-surface p-4 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-2">分类</h2>
      <ul>
        {categories.map((cat) => (
          <li
            key={cat.id}
            className="py-1 px-2 rounded hover:bg-primary-light transition"
          >
            {cat.name}
          </li>
        ))}
      </ul>
    </aside>
  );
};
