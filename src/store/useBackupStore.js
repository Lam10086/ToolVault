import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { get, set } from 'idb-keyval';

// We store the directory handle in IndexedDB because it can't be serialized to localStorage
export const setDirHandle = async (handle) => {
  await set('tv:backupDirHandle', handle);
};

export const getDirHandle = async () => {
  return await get('tv:backupDirHandle');
};

const useBackupStore = create(
  persist(
    (set) => ({
      autoBackupEnabled: true,
      backupIntervalHours: 24, // 1, 12, 24, etc.
      maxBackups: 10, // FIFO limit
      formats: { json: true, md: true, txt: false },
      lastBackupTime: null,
      dirName: null, // Just for display

      setAutoBackupEnabled: (enabled) => set({ autoBackupEnabled: enabled }),
      setBackupInterval: (hours) => set({ backupIntervalHours: hours }),
      setMaxBackups: (max) => set({ maxBackups: max }),
      setFormats: (formats) => set({ formats }),
      setLastBackupTime: (time) => set({ lastBackupTime: time }),
      setDirName: (name) => set({ dirName: name }),
    }),
    {
      name: 'tv-backup-settings', // localStorage key
    }
  )
);

export default useBackupStore;
