import type { AuthUser } from '../types/auth';

interface AdminPanelProps {
  user: AuthUser;
  onUploadDocument: (file: File) => void;
  uploadStatus: string | null;
  isUploading: boolean;
  onToggleSidebar: () => void;
}

export const AdminPanel = ({
  user,
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
          <span className="pill pill--accent">{user.role}</span>
          <span className="chat-header__subtitle">Upload PDFs, DOCX files, and TXT documents</span>
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
        </div>
      </section>
    </main>
  );
};
