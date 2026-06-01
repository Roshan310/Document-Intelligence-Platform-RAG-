import type { AuthUser } from '../types/auth';
import type { UploadedDocument } from '../types/document';
import { UserAvatar } from './UserAvatar';

interface AdminPanelProps {
  user: AuthUser;
  documents: UploadedDocument[];
  documentsLoading: boolean;
  documentsError: string | null;
  onUploadDocument: (file: File) => void;
  uploadStatus: string | null;
  isUploading: boolean;
  onToggleSidebar: () => void;
}

export const AdminPanel = ({
  user,
  documents,
  documentsLoading,
  documentsError,
  onUploadDocument,
  uploadStatus,
  isUploading,
  onToggleSidebar,
}: AdminPanelProps) => {
  return (
    <main className="chat-panel admin-panel">
      <header className="chat-header">
        <div className="chat-header__left">
          <button
            className="chat-header__menu-button"
            type="button"
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
          >
            ☰
          </button>

          <div>
            <div className="chat-header__eyebrow">Admin workspace</div>
            <h1 className="chat-header__title">Document uploads</h1>
          </div>
        </div>

        <div className="chat-header__meta">
          <UserAvatar user={user} size={38} />
          <div className="chat-header__meta-copy">
            <span className="chat-header__eyebrow">{user.email}</span>
            <span className="chat-header__subtitle">Admin workspace access</span>
          </div>
          <span className="pill pill--accent">{user.role}</span>
        </div>
      </header>

      <section className="chat-panel__stream admin-panel__stream">
        <div className="chat-panel__surface admin-panel__surface">
          <div className="admin-card">
            <div className="admin-card__eyebrow">Admin only</div>
            <h2 className="admin-card__title">Upload a document for workspace chat</h2>
            <p className="admin-card__text">
              Supported formats are PDF, DOCX, and TXT. The backend will extract text, chunk it, and build embeddings for retrieval.
            </p>

            <label className="admin-upload">
              <input
                type="file"
                className="admin-upload__input"
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
              <span>{isUploading ? 'Uploading...' : 'Choose file'}</span>
            </label>

            <div className="admin-card__status">
              {uploadStatus ?? 'No upload in progress.'}
            </div>
          </div>

          <div className="admin-card admin-card--documents">
            <div className="admin-card__eyebrow">Uploaded documents</div>
            <h2 className="admin-card__title">All files stored in the workspace</h2>
           

            {documentsLoading ? (
              <div className="admin-card__status">Loading uploaded documents...</div>
            ) : documentsError ? (
              <div className="admin-card__status admin-card__status--error">{documentsError}</div>
            ) : documents.length === 0 ? (
              <div className="admin-card__status">No documents have been uploaded yet.</div>
            ) : (
              <div className="admin-documents-list">
                {documents.map((document) => (
                  <article key={document.id} className="admin-document-row">
                    <div className="admin-document-row__main">
                      <div className="admin-document-row__title">{document.filename}</div>
                      <div className="admin-document-row__meta">
                        <span>{document.mimeType}</span>
                        <span>Uploaded by user #{document.userId}</span>
                      </div>
                    </div>

                    <div className="admin-document-row__badge">{formatFileSize(document.sizeBytes)}</div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
};

function formatFileSize(sizeBytes: number) {
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
