/**
 * File System Access API helpers
 */

// Ask user to select a directory
export async function selectDirectory() {
  try {
    const dirHandle = await window.showDirectoryPicker({
      mode: 'readwrite',
    });
    return dirHandle;
  } catch (err) {
    console.error('Failed to select directory', err);
    return null;
  }
}

// Verify permission for a directory handle (request if needed)
export async function verifyPermission(fileHandle, readWrite) {
  const options = {};
  if (readWrite) {
    options.mode = 'readwrite';
  }
  // Check if permission was already granted
  if ((await fileHandle.queryPermission(options)) === 'granted') {
    return true;
  }
  // Request permission
  if ((await fileHandle.requestPermission(options)) === 'granted') {
    return true;
  }
  return false;
}

// Write a file to a directory handle
export async function writeToFile(dirHandle, filename, content) {
  try {
    const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
    return true;
  } catch (err) {
    console.error('Failed to write file', err);
    return false;
  }
}

// Implement FIFO logic: ensure only maxFiles of a certain extension are kept
export async function applyFIFO(dirHandle, extension, maxFiles) {
  try {
    const files = [];
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file' && entry.name.endsWith(extension)) {
        // We need to get the file to check its last modified date
        const file = await entry.getFile();
        files.push({ handle: entry, name: entry.name, lastModified: file.lastModified });
      }
    }

    // Sort by oldest first
    files.sort((a, b) => a.lastModified - b.lastModified);

    // If we exceed maxFiles, delete the oldest ones
    if (files.length > maxFiles) {
      const numToDelete = files.length - maxFiles;
      for (let i = 0; i < numToDelete; i++) {
        await dirHandle.removeEntry(files[i].name);
        console.log(`[FIFO] Removed old backup: ${files[i].name}`);
      }
    }
  } catch (err) {
    console.error('Failed to apply FIFO', err);
  }
}

// Trigger standard browser download (fallback for manual export)
export function downloadFile(filename, content, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
