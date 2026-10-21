import { contextBridge, ipcRenderer } from 'electron';

export interface DesktopAPI {
  // Window controls
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  setAlwaysOnTop: (flag: boolean) => Promise<boolean>;
  setCompactMode: (compact: boolean) => Promise<void>;
  
  // Native desktop integrations
  sendNotification: (title: string, body: string) => void;
  exportSaveFile: (data: string) => Promise<{ success: boolean; path?: string; error?: string }>;
  importSaveFile: () => Promise<{ success: boolean; data?: string; error?: string }>;
  copyToClipboard: (text: string) => void;

  // Event listeners
  onBossKeyTriggered: (callback: () => void) => () => void;
  isElectron: boolean;
}

const api: DesktopAPI = {
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  setAlwaysOnTop: (flag: boolean) => ipcRenderer.invoke('window-always-on-top', flag),
  setCompactMode: (compact: boolean) => ipcRenderer.invoke('window-set-compact', compact),
  
  sendNotification: (title: string, body: string) => ipcRenderer.send('send-notification', { title, body }),
  exportSaveFile: (data: string) => ipcRenderer.invoke('export-save-file', data),
  importSaveFile: () => ipcRenderer.invoke('import-save-file'),
  copyToClipboard: (text: string) => ipcRenderer.send('clipboard-copy', text),

  onBossKeyTriggered: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('trigger-boss-key', handler);
    return () => ipcRenderer.removeListener('trigger-boss-key', handler);
  },
  isElectron: true,
};

contextBridge.exposeInMainWorld('desktopAPI', api);
