import { AlertCircle, ArrowRight, FileText, HardDrive, Loader2, MessageSquare, MessagesSquare, Sparkles, Upload, Users } from 'lucide-react';
import { DocumentRow } from '../components/DocumentRow';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { formatFileSize, getDisplayName } from '../lib/format';
import type { AuthUser } from '../types/auth';
import type { ChatConversation } from '../types/chat';
import type { UploadedDocument } from '../types/document';
import type { AppView } from '../types/nav';

interface DashboardPageProps {
  user: AuthUser | null;
  documents: UploadedDocument[];
  documentsLoading: boolean;
  documentsError: string | null;
  conversations: ChatConversation[];
  onNavigate: (view: AppView) => void;
}

const RECENT_DOCUMENT_LIMIT = 5;
const RECENT_ACTIVITY_LIMIT = 5;

export const DashboardPage = ({
  user,
  documents,
  documentsLoading,
  documentsError,
  conversations,
  onNavigate,
}: DashboardPageProps) => {
  const totalBytes = documents.reduce((total, document) => total + document.sizeBytes, 0);
  const recentDocuments = documents.slice(0, RECENT_DOCUMENT_LIMIT);
  const recentConversations = conversations.slice(0, RECENT_ACTIVITY_LIMIT);

  return (
    <>
      <PageHeader
        title={`Welcome back, ${getDisplayName(user?.email)}`}
        subtitle="Here's what's happening with your documents today."
      />

      <div className="stat-grid">
        <StatCard
          icon={FileText}
          label="Total Documents"
          value={documentsLoading ? null : String(documents.length)}
          meta={documentsLoading ? 'Loading…' : 'Across the whole workspace'}
        />
        <StatCard
          icon={HardDrive}
          label="Storage Used"
          value={documentsLoading ? null : formatFileSize(totalBytes)}
          meta={documentsLoading ? 'Loading…' : 'Sum of every uploaded file'}
        />
        <StatCard
          icon={MessagesSquare}
          label="Conversations"
          value={String(conversations.length)}
          meta="Your chat threads"
        />
        <StatCard
          icon={Sparkles}
          label="Questions Asked"
          value={null}
          meta="Not tracked yet"
        />
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-column">
          <section className="card">
            <div className="card__header">
              <h2 className="card__title">Recent Documents</h2>
              {documents.length > RECENT_DOCUMENT_LIMIT ? (
                <button className="card__link" type="button" onClick={() => onNavigate('documents')}>
                  View all
                </button>
              ) : null}
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
                <div className="empty-state__title">No documents yet</div>
                <p className="empty-state__text">
                  Upload a PDF, DOCX, or TXT file and it becomes searchable for every member of the
                  workspace.
                </p>
                <button className="btn btn--primary" type="button" onClick={() => onNavigate('documents')}>
                  <Upload size={18} strokeWidth={1.75} />
                  Upload Document
                </button>
              </div>
            ) : (
              <div className="doc-list">
                {recentDocuments.map((document) => (
                  <DocumentRow key={document.id} document={document} />
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="dashboard-column">
          <section className="card">
            <div className="card__header">
              <h2 className="card__title">Quick Actions</h2>
            </div>

            <button className="quick-action" type="button" onClick={() => onNavigate('documents')}>
              <span className="quick-action__icon">
                <Upload size={18} strokeWidth={1.75} />
              </span>
              <span className="quick-action__copy">
                <span className="quick-action__title">Upload Document</span>
                <span className="quick-action__text">Add new documents to your library</span>
              </span>
              <ArrowRight size={16} strokeWidth={1.75} className="quick-action__arrow" />
            </button>

            <button className="quick-action" type="button" onClick={() => onNavigate('ask')}>
              <span className="quick-action__icon">
                <MessagesSquare size={18} strokeWidth={1.75} />
              </span>
              <span className="quick-action__copy">
                <span className="quick-action__title">Ask a Question</span>
                <span className="quick-action__text">Get answers from your documents</span>
              </span>
              <ArrowRight size={16} strokeWidth={1.75} className="quick-action__arrow" />
            </button>

            <button className="quick-action" type="button" onClick={() => onNavigate('users')}>
              <span className="quick-action__icon">
                <Users size={18} strokeWidth={1.75} />
              </span>
              <span className="quick-action__copy">
                <span className="quick-action__title">Manage Users</span>
                <span className="quick-action__text">Block or unblock workspace members</span>
              </span>
              <ArrowRight size={16} strokeWidth={1.75} className="quick-action__arrow" />
            </button>
          </section>

          <section className="card">
            <div className="card__header">
              <h2 className="card__title">Recent Activity</h2>
              {conversations.length > RECENT_ACTIVITY_LIMIT ? (
                <button className="card__link" type="button" onClick={() => onNavigate('history')}>
                  View all
                </button>
              ) : null}
            </div>

            {recentConversations.length === 0 ? (
              <p className="stat-card__meta">No conversations yet.</p>
            ) : (
              <div>
                {recentConversations.map((conversation) => (
                  <article key={conversation.id} className="activity-item">
                    <div className="activity-item__icon" aria-hidden="true">
                      <MessageSquare size={16} strokeWidth={1.75} />
                    </div>
                    <div className="activity-item__body">
                      <div className="activity-item__text">
                        Conversation
                        <span className="activity-item__subject">{conversation.title}</span>
                      </div>
                      <div className="activity-item__time">Updated {conversation.updatedAt}</div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
};
