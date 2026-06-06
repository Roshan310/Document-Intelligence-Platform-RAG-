import type { AuthUser } from '../types/auth';
import type { UploadedDocument } from '../types/document';

interface AdminPanelProps {
  documents: UploadedDocument[];
  documentsLoading: boolean;
  documentsError: string | null;
  onDeleteDocument: (documentId: number) => void;
  deletingDocumentId: number | null;
  deleteStatus: string | null;
  users: AuthUser[];
  usersLoading: boolean;
  usersError: string | null;
  onUploadDocument: (file: File) => void;
  onBlockUser: (userId: number) => void;
  onUnblockUser: (userId: number) => void;
  uploadStatus: string | null;
  isUploading: boolean;
  actionUserId: number | null;
  actionStatus: string | null;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const AdminPanel = ({
  documents,
  documentsLoading,
  documentsError,
  onDeleteDocument,
  deletingDocumentId,
  deleteStatus,
  users,
  usersLoading,
  usersError,
  onUploadDocument,
  onBlockUser,
  onUnblockUser,
  uploadStatus,
  isUploading,
  actionUserId,
  actionStatus,
  isSidebarOpen,
  onToggleSidebar,
}: AdminPanelProps) => {
  return (
    <main className="chat-panel admin-panel">
      <button
        className="workspace-toggle chat-header__menu-button"
        type="button"
        onClick={onToggleSidebar}
        aria-label={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        aria-pressed={isSidebarOpen}
      >
        {isSidebarOpen ? '✕' : '☰'}
      </button>

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

            {deleteStatus ? <div className="admin-card__status admin-card__status--info">{deleteStatus}</div> : null}

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

                    <div className="admin-document-row__actions">
                      <div className="admin-document-row__badge">{formatFileSize(document.sizeBytes)}</div>
                      <button
                        type="button"
                        className="admin-document-row__delete"
                        onClick={() => onDeleteDocument(document.id)}
                        disabled={deletingDocumentId === document.id}
                      >
                        {deletingDocumentId === document.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="admin-card admin-card--users">
            <div className="admin-card__eyebrow">Workspace users</div>
            <h2 className="admin-card__title">All users registered on the platform</h2>
            <p className="admin-card__text">
              Blocked users cannot sign in until you unblock them. Admin accounts are shown here only if they are not the current user.
            </p>

            {actionStatus ? <div className="admin-card__status admin-card__status--info">{actionStatus}</div> : null}

            {usersLoading ? (
              <div className="admin-card__status">Loading workspace users...</div>
            ) : usersError ? (
              <div className="admin-card__status admin-card__status--error">{usersError}</div>
            ) : users.length === 0 ? (
              <div className="admin-card__status">No other users found.</div>
            ) : (
              <div className="admin-users-list">
                {users.map((user) => {
                  const isActionPending = actionUserId === user.id;

                  return (
                    <article key={user.id} className="admin-user-row">
                      <div className="admin-user-row__main">
                        <div className="admin-user-row__title">{user.email}</div>
                        <div className="admin-user-row__meta">
                          <span>{user.role}</span>
                          <span>User #{user.id}</span>
                        </div>
                      </div>

                      <div className="admin-user-row__actions">
                        <span className={`pill ${user.isBlocked ? 'pill--blocked' : 'pill--accent'}`}>
                          {user.isBlocked ? 'Blocked' : 'Active'}
                        </span>
                        <button
                          type="button"
                          className={`admin-user-row__action${user.isBlocked ? ' admin-user-row__action--positive' : ' admin-user-row__action--negative'}`}
                          onClick={() => (user.isBlocked ? onUnblockUser(user.id) : onBlockUser(user.id))}
                          disabled={isActionPending}
                        >
                          {isActionPending
                            ? 'Updating...'
                            : user.isBlocked
                              ? 'Unblock'
                              : 'Block'}
                        </button>
                      </div>
                    </article>
                  );
                })}
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
