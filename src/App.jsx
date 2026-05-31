import { useEffect } from 'react';
import useAppStore from './store/useAppStore';
import TopNav from './components/TopNav';
import LibraryView from './views/LibraryView';
import WorkflowView from './views/WorkflowView';
import AddResourceModal from './components/AddResourceModal';
import Toast from './components/Toast';

import SettingsModal from './components/SettingsModal';
import DataManagementModal from './components/DataManagementModal';
import ImportPreviewModal from './components/ImportPreviewModal';
import useAutoBackup from './hooks/useAutoBackup';

export default function App() {
  useAutoBackup(); // Mount background auto-backup hook

  const { view, loadResources, loadCategories, loadWorkflows, loadTags, addModalOpen, settingsModalOpen, dataModalOpen, importData, closeDataModal, openImportPreview, closeImportPreview } = useAppStore();

  useEffect(() => {
    loadCategories().then(() => loadResources());
    loadTags();
    loadWorkflows();
  }, []);

  return (
    <div className="app-shell">
      <TopNav />
      <div className="app-content">
        {view === 'library'  && <LibraryView />}
        {view === 'workflow' && <WorkflowView />}
      </div>
      {addModalOpen && <AddResourceModal />}
      {settingsModalOpen && <SettingsModal />}
      {dataModalOpen && <DataManagementModal onClose={closeDataModal} onOpenImport={openImportPreview} />}
      {importData && <ImportPreviewModal importData={importData} onClose={closeImportPreview} />}
      <Toast />
    </div>
  );
}
