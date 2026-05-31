import { useEffect, useRef } from 'react';
import useBackupStore, { getDirHandle } from '../store/useBackupStore';
import { getFullDbState } from '../db/storage';
import { verifyPermission, writeToFile, applyFIFO } from '../utils/fileSystem';
import { generateMarkdown, generatePlainText } from '../utils/exportGenerators';

export default function useAutoBackup() {
  const { autoBackupEnabled, backupIntervalHours, maxBackups, formats, setLastBackupTime } = useBackupStore();
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!autoBackupEnabled) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const runBackup = async () => {
      try {
        const dbState = await getFullDbState();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        let success = true;

        // Desktop (Electron) privileged silent backup
        if (window.electronAPI) {
          if (formats.json) {
            const content = JSON.stringify(dbState, null, 2);
            const res = await window.electronAPI.saveBackup({ filename: `ToolVault_Backup_${timestamp}.json`, content, extension: '.json', maxBackups });
            if (!res.success) success = false;
          }
          if (formats.md) {
            const content = generateMarkdown(dbState.resources, dbState.categories, dbState.tags);
            const res = await window.electronAPI.saveBackup({ filename: `ToolVault_Backup_${timestamp}.md`, content, extension: '.md', maxBackups });
            if (!res.success) success = false;
          }
          if (formats.txt) {
            const content = generatePlainText(dbState.resources, dbState.categories, dbState.tags);
            const res = await window.electronAPI.saveBackup({ filename: `ToolVault_Backup_${timestamp}.txt`, content, extension: '.txt', maxBackups });
            if (!res.success) success = false;
          }
        } else {
          // Web environment (requires pre-authorized directory handle)
          const dirHandle = await getDirHandle();
          if (!dirHandle) {
            console.warn('Auto backup enabled but no directory handle found.');
            return;
          }

          const hasPerm = await verifyPermission(dirHandle, true);
          if (!hasPerm) {
            console.warn('Lost directory permission. Cannot auto backup.');
            return;
          }

          if (formats.json) {
            const jsonContent = JSON.stringify(dbState, null, 2);
            const ok = await writeToFile(dirHandle, `ToolVault_Backup_${timestamp}.json`, jsonContent);
            if (ok) await applyFIFO(dirHandle, '.json', maxBackups); else success = false;
          }

          if (formats.md) {
            const mdContent = generateMarkdown(dbState.resources, dbState.categories, dbState.tags);
            const ok = await writeToFile(dirHandle, `ToolVault_Backup_${timestamp}.md`, mdContent);
            if (ok) await applyFIFO(dirHandle, '.md', maxBackups); else success = false;
          }

          if (formats.txt) {
            const txtContent = generatePlainText(dbState.resources, dbState.categories, dbState.tags);
            const ok = await writeToFile(dirHandle, `ToolVault_Backup_${timestamp}.txt`, txtContent);
            if (ok) await applyFIFO(dirHandle, '.txt', maxBackups); else success = false;
          }
        }

        if (success) {
          setLastBackupTime(Date.now());
          console.log('Auto backup completed successfully at', new Date().toLocaleString());
        }
      } catch (err) {
        console.error('Auto backup failed', err);
      }
    };

    // Calculate milliseconds
    const intervalMs = backupIntervalHours * 60 * 60 * 1000;
    
    // Initial run check (we won't run immediately unless it's past the interval, but for simplicity, we just set interval)
    intervalRef.current = setInterval(runBackup, intervalMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoBackupEnabled, backupIntervalHours, maxBackups, formats, setLastBackupTime]);
}
