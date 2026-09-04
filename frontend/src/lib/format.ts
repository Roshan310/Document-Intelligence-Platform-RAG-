export type FileKind = 'pdf' | 'docx' | 'txt' | 'file';

export function formatFileSize(sizeBytes: number) {
  if (!Number.isFinite(sizeBytes) || sizeBytes < 1024) {
    return `${Math.max(0, sizeBytes)} B`;
  }

  const units = ['KB', 'MB', 'GB'];
  let value = sizeBytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

export function getFileKind(filename: string, mimeType: string): FileKind {
  const extension = filename.slice(filename.lastIndexOf('.') + 1).toLowerCase();

  if (extension === 'pdf' || mimeType === 'application/pdf') {
    return 'pdf';
  }

  if (
    extension === 'docx' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return 'docx';
  }

  if (extension === 'txt' || mimeType === 'text/plain') {
    return 'txt';
  }

  return 'file';
}

export function getDisplayName(email: string | undefined) {
  const localPart = (email ?? '').split('@')[0] ?? '';

  if (!localPart) {
    return 'there';
  }

  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function getRoleLabel(role: string | undefined) {
  return role === 'admin' ? 'Administrator' : 'Member';
}
