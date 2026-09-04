import { useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { AlertCircle, CloudUpload, FileText, Info, Loader2, Search, Trash2, Upload } from 'lucide-react';
import { DocumentRow } from '../components/DocumentRow';
import { PageHeader } from '../components/PageHeader';
import type { UploadedDocument } from '../types/document';

interface DocumentsPageProps {
  documents: UploadedDocument[];
  documentsLoading: boolean;
  documentsError: string | null;
  /** Admins can upload and delete; members get the same list, read-only. */
  canManage: boolean;
  onUploadDocument: (file: File) => void;
  isUploading: boolean;
  uploadStatus: string | null;
  onDeleteDocument: (documentId: number) => void;
  deletingDocumentId: number | null;
  deleteStatus: string | null;
}

export const DocumentsPage = ({
  documents,
  documentsLoading,
  documentsError,
  canManage,
  onUploadDocument,
  isUploading,
  uploadStatus,
  onDeleteDocument,
  deletingDocumentId,
  deleteStatus,
}: DocumentsPageProps) => {
  const [filterTerm, setFilterTerm] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const normalizedFilter = filterTerm.trim().toLowerCase();
  const filteredDocuments = normalizedFilter
    ? documents.filter((document) => document.filename.toLowerCase().includes(normalizedFilter))
    : documents;

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (!isUploading) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOver(false);

    if (isUploading) {
      return;
    }

    const file = event.dataTransfer.files?.[0];

    if (file) {
      onUploadDocument(file);
    }
  };

  return (
    <>
      <PageHeader
        title="Documents"
        subtitle={
          canManage
            ? 'Everything uploaded to the workspace knowledge base.'
            : 'Everything in the knowledge base. Ask questions about any of these in the chat.'
        }
        actions={
          <label className="search-field page-header__search">
            <span className="sr-only">Search documents</span>
            <span className="search-field__icon" aria-hidden="true">
              <Search size={16} strokeWidth={1.75} />
            </span>
            <input
              className="input"
              value={filterTerm}
              onChange={(event) => setFilterTerm(event.target.value)}
              type="search"
              placeholder="Search documents..."
              aria-label="Search documents"
            />
          </label>
        }
      />

      {canManage ? (
        <div
          className={`dropzone${isDraggingOver ? ' dropzone--active' : ''}${isUploading ? ' dropzone--busy' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="dropzone__main">
            <div className="dropzone__icon" aria-hidden="true">
              <CloudUpload size={22} strokeWidth={1.75} />
            </div>
            <div>
              <div className="dropzone__title">
                {isUploading ? 'Uploading your document…' : 'Drag & drop your documents here'}
              </div>
              <div className="dropzone__hint">Supports PDF, DOCX and TXT (max 20MB)</div>
            </div>
          </div>

          <button
            className="btn btn--primary"
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 size={18} strokeWidth={1.75} className="spinner" />
            ) : (
              <Upload size={18} strokeWidth={1.75} />
            )}
            {isUploading ? 'Uploading…' : 'Upload Document'}
          </button>

          <input
            ref={inputRef}
            type="file"
            className="dropzone__input"
            accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            onChange={(event) => {
              const file = event.target.files?.[0];

              if (file) {
                onUploadDocument(file);
              }

              event.target.value = '';
            }}
            disabled={isUploading}
          />
        </div>
      ) : null}

      {canManage && uploadStatus ? (
        <div className="alert alert--info">
          <Info size={16} strokeWidth={1.75} />
          {uploadStatus}
        </div>
      ) : null}

      {canManage && deleteStatus ? (
        <div className="alert">
          <Info size={16} strokeWidth={1.75} />
          {deleteStatus}
        </div>
      ) : null}

      <section className="card">
        <div className="card__header">
          <h2 className="card__title">All documents</h2>
          <span className="stat-card__meta">
            {documents.length} {documents.length === 1 ? 'file' : 'files'}
          </span>
        </div>

        {documentsLoading ? (
          <div className="alert">
            <Loader2 size={16} strokeWidth={1.75} className="spinner" />
            Loading uploaded documents…
          </div>
        ) : documentsError ? (
          <div className="alert alert--error">
            <AlertCircle size={16} strokeWidth={1.75} />
            {documentsError}
          </div>
        ) : documents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">
              <FileText size={20} strokeWidth={1.75} />
            </div>
            <div className="empty-state__title">No documents have been uploaded yet</div>
            <p className="empty-state__text">
              {canManage
                ? 'The backend extracts the text, splits it into chunks, and builds embeddings so answers can cite the right file.'
                : 'Once an admin uploads a document it shows up here and you can ask questions about it.'}
            </p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">
              <Search size={20} strokeWidth={1.75} />
            </div>
            <div className="empty-state__title">No documents match that search</div>
          </div>
        ) : (
          <div className="doc-list">
            {filteredDocuments.map((document) => (
              <DocumentRow
                key={document.id}
                document={document}
                actions={
                  canManage ? (
                    <button
                      className="btn btn--danger btn--sm"
                      type="button"
                      onClick={() => onDeleteDocument(document.id)}
                      disabled={deletingDocumentId === document.id}
                    >
                      <Trash2 size={14} strokeWidth={1.75} />
                      {deletingDocumentId === document.id ? 'Deleting…' : 'Delete'}
                    </button>
                  ) : null
                }
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
};
