import { useEffect } from 'react';
import useAppStore from '../store/useAppStore';

export default function Toast() {
  const { toasts } = useAppStore();

  return (
    <div className="toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          {t.type === 'success' && '✅'}
          {t.type === 'error'   && '❌'}
          {t.type === 'warning' && '⚠️'}
          {t.type === 'info'    && '💡'}
          {t.message}
        </div>
      ))}
    </div>
  );
}
