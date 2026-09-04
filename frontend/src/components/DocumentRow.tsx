import type { ReactNode } from 'react';
import { FileText } from 'lucide-react';
import type { UploadedDocument } from '../types/document';
import { formatFileSize, getFileKind } from '../lib/format';

interface DocumentRowProps {
  document: UploadedDocument;
  actions?: ReactNode;
}

export const DocumentRow = ({ document, actions }: DocumentRowProps) => {
  const kind = getFileKind(document.filename, document.mimeType);

  return (
    <article className="doc-row">
      <div className={`doc-row__icon doc-row__icon--${kind}`} aria-hidden="true">
        <FileText size={16} strokeWidth={1.75} />
        {kind === 'file' ? null : kind.toUpperCase()}
      </div>

      <div className="doc-row__main">
        <div className="doc-row__title" title={document.filename}>
          {document.filename}
        </div>
        <div className="doc-row__meta">
          <span>{formatFileSize(document.sizeBytes)}</span>
          <span aria-hidden="true">•</span>
          <span>Uploaded by user #{document.userId}</span>
        </div>
      </div>

      {actions ? <div className="doc-row__actions">{actions}</div> : null}
    </article>
  );
};
