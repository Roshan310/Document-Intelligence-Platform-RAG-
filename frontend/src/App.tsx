import { useEffect, useState } from 'react';
import { AdminPanel } from './components/AdminPanel';
import { AuthScreen } from './components/AuthScreen';
import { Composer } from './components/Composer';
import { MessageList } from './components/MessageList';
import { PasswordModal } from './components/PasswordModal';
import { Sidebar } from './components/Sidebar';
import {
  ApiError,
  blockUserRequest,
  deleteUploadedDocumentRequest,
  listUploadedDocumentsRequest,
  listUsersRequest,
  unblockUserRequest,
  updatePasswordRequest,
  uploadRequest,
} from './lib/api';
import { useAuth } from './hooks/useAuth';
import { useChat } from './hooks/useChat';
import type { AuthUser } from './types/auth';
import type { UploadedDocument } from './types/document';

export const App = () => {
  const auth = useAuth();
  const chat = useChat(auth.user, auth.token, auth.logout);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState<'chat' | 'admin'>('chat');
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [deletingDocumentId, setDeletingDocumentId] = useState<number | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<string | null>(null);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [actionUserId, setActionUserId] = useState<number | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);

  useEffect(() => {
    if (auth.user) {
      setIsSidebarOpen(true);
      setActiveView(auth.user.role === 'admin' ? 'admin' : 'chat');
    }
  }, [auth.user]);

  useEffect(() => {
    if (!auth.user || auth.user.role !== 'admin' || !auth.token) {
      setUploadedDocuments([]);
      setDocumentsLoading(false);
      setDocumentsError(null);
      setDeletingDocumentId(null);
      setDeleteStatus(null);
      return;
    }

    let isCancelled = false;
    const token = auth.token;

    const loadDocuments = async () => {
      setDocumentsLoading(true);
      setDocumentsError(null);

      try {
        const result = await listUploadedDocumentsRequest(token);

        if (!isCancelled) {
          setUploadedDocuments(result.documents);
        }
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setUploadedDocuments([]);
        setDocumentsError(error instanceof Error ? error.message : 'Failed to load uploaded documents');

        if (error instanceof ApiError) {
          auth.handleApiError(error);
        }
      } finally {
        if (!isCancelled) {
          setDocumentsLoading(false);
        }
      }
    };

    void loadDocuments();

    return () => {
      isCancelled = true;
    };
  }, [auth.token, auth.user]);

  useEffect(() => {
    if (!auth.user || auth.user.role !== 'admin' || !auth.token || activeView !== 'admin') {
      setUsers([]);
      setUsersLoading(false);
      setUsersError(null);
      return;
    }

    let isCancelled = false;
    const token = auth.token;

    const loadUsers = async () => {
      setUsersLoading(true);
      setUsersError(null);

      try {
        const result = await listUsersRequest(token);

        if (!isCancelled) {
          setUsers(result.users);
        }
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setUsers([]);
        setUsersError(error instanceof Error ? error.message : 'Failed to load users');

        if (error instanceof ApiError) {
          auth.handleApiError(error);
        }
      } finally {
        if (!isCancelled) {
          setUsersLoading(false);
        }
      }
    };

    void loadUsers();

    return () => {
      isCancelled = true;
    };
  }, [activeView, auth.token, auth.user]);

  const closeSidebarOnMobile = () => {
    if (window.matchMedia('(max-width: 920px)').matches) {
      setIsSidebarOpen(false);
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    chat.selectConversation(conversationId);
    closeSidebarOnMobile();
  };

  const handleCreateConversation = () => {
    chat.createNewConversation();
    setSearchTerm('');
    closeSidebarOnMobile();
  };

  const handleLogin = async (email: string, password: string) => {
    setIsAuthenticating(true);
    setAuthError(null);
    setAuthMessage(null);

    try {
      await auth.login(email, password);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleRegister = async (email: string, password: string) => {
    setIsAuthenticating(true);
    setAuthError(null);
    setAuthMessage(null);

    try {
      const result = await auth.register(email, password);

      if (result.verificationEmailSent) {
        setAuthMessage('Registration complete. Check your email to verify your account, then log in.');
      } else {
        setAuthMessage('Registration complete. Verify your email, then log in.');
      }

      return result;
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Registration failed');
      return null;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleUploadDocument = async (file: File) => {
    if (!auth.token || auth.user?.role !== 'admin') {
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);

    try {
      const result = await uploadRequest(auth.token, file);
      setUploadStatus(`Uploaded ${file.name} (${result.chunkCount} chunks)`);
      const documentsResult = await listUploadedDocumentsRequest(auth.token);
      setUploadedDocuments(documentsResult.documents);
    } catch (error) {
      setUploadStatus(error instanceof Error ? error.message : 'Upload failed');

      if (error instanceof ApiError) {
        auth.handleApiError(error);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const refreshAdminDocuments = async () => {
    if (!auth.token || auth.user?.role !== 'admin') {
      return;
    }

    const result = await listUploadedDocumentsRequest(auth.token);
    setUploadedDocuments(result.documents);
  };

  const handleDeleteDocument = async (documentId: number) => {
    if (!auth.token || auth.user?.role !== 'admin') {
      return;
    }

    const shouldDelete = window.confirm('Delete this document and its chunks? This cannot be undone.');

    if (!shouldDelete) {
      return;
    }

    setDeletingDocumentId(documentId);
    setDeleteStatus(null);

    try {
      const result = await deleteUploadedDocumentRequest(auth.token, documentId);
      setDeleteStatus(result.message);
      await refreshAdminDocuments();
    } catch (error) {
      setDeleteStatus(error instanceof Error ? error.message : 'Delete failed');

      if (error instanceof ApiError) {
        auth.handleApiError(error);
      }
    } finally {
      setDeletingDocumentId(null);
    }
  };

  const refreshAdminUsers = async () => {
    if (!auth.token || auth.user?.role !== 'admin' || activeView !== 'admin') {
      return;
    }

    const result = await listUsersRequest(auth.token);
    setUsers(result.users);
  };

  const handleBlockUser = async (userId: number) => {
    if (!auth.token || auth.user?.role !== 'admin') {
      return;
    }

    setActionUserId(userId);
    setActionStatus(null);

    try {
      const result = await blockUserRequest(auth.token, userId);
      setActionStatus(result.message);
      await refreshAdminUsers();
    } catch (error) {
      setActionStatus(error instanceof Error ? error.message : 'Block failed');

      if (error instanceof ApiError) {
        auth.handleApiError(error);
      }
    } finally {
      setActionUserId(null);
    }
  };

  const handleUnblockUser = async (userId: number) => {
    if (!auth.token || auth.user?.role !== 'admin') {
      return;
    }

    setActionUserId(userId);
    setActionStatus(null);

    try {
      const result = await unblockUserRequest(auth.token, userId);
      setActionStatus(result.message);
      await refreshAdminUsers();
    } catch (error) {
      setActionStatus(error instanceof Error ? error.message : 'Unblock failed');

      if (error instanceof ApiError) {
        auth.handleApiError(error);
      }
    } finally {
      setActionUserId(null);
    }
  };

  const handleOpenPasswordModal = () => {
    setPasswordError(null);
    setPasswordStatus(null);
    setIsPasswordModalOpen(true);
  };

  const handleClosePasswordModal = () => {
    if (isUpdatingPassword) {
      return;
    }

    setIsPasswordModalOpen(false);
    setPasswordError(null);
    setPasswordStatus(null);
  };

  const handleUpdatePassword = async (currentPassword: string, newPassword: string) => {
    if (!auth.token) {
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordError(null);
    setPasswordStatus(null);

    try {
      const result = await updatePasswordRequest(auth.token, currentPassword, newPassword);
      auth.updateUser(result.user);
      setPasswordStatus(result.message);
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Password update failed');

      if (error instanceof ApiError) {
        auth.handleApiError(error);
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (!auth.isReady) {
    return (
      <div className="auth-shell">
        <div className="auth-panel">
          <div className="auth-panel__badge">RAG Workspace</div>
          <h1 className="auth-panel__title">Loading workspace...</h1>
          <p className="auth-panel__subtitle">Preparing your authenticated session.</p>
        </div>
      </div>
    );
  }

  if (!auth.user) {
    return (
      <AuthScreen
        onLogin={handleLogin}
        onRegister={handleRegister}
        errorMessage={authError}
        infoMessage={authMessage}
        isSubmitting={isAuthenticating}
      />
    );
  }

  return (
    <div className={`app-shell${isSidebarOpen ? ' app-shell--sidebar-open' : ''}`}>
      <div className="app-shell__backdrop" onClick={closeSidebarOnMobile} aria-hidden="true" />

      <Sidebar
        conversations={chat.conversations}
        activeConversationId={chat.activeConversationId}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        onSelectConversation={handleSelectConversation}
        onCreateConversation={handleCreateConversation}
        onLogout={auth.logout}
        onOpenPasswordModal={handleOpenPasswordModal}
        user={auth.user}
        activeView={activeView}
        onViewChange={setActiveView}
        onCloseSidebar={() => setIsSidebarOpen(false)}
      />

      {auth.user.role === 'admin' && activeView === 'admin' ? (
        <AdminPanel
          documents={uploadedDocuments}
          documentsLoading={documentsLoading}
          documentsError={documentsError}
          onDeleteDocument={handleDeleteDocument}
          deletingDocumentId={deletingDocumentId}
          deleteStatus={deleteStatus}
          users={users}
          usersLoading={usersLoading}
          usersError={usersError}
          onUploadDocument={handleUploadDocument}
          onBlockUser={handleBlockUser}
          onUnblockUser={handleUnblockUser}
          uploadStatus={uploadStatus}
          isUploading={isUploading}
          actionUserId={actionUserId}
          actionStatus={actionStatus}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((current) => !current)}
        />
      ) : (
        <main className="chat-panel">
          <button
            className="workspace-toggle chat-header__menu-button"
            type="button"
            onClick={() => setIsSidebarOpen((current) => !current)}
            aria-label={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            aria-pressed={isSidebarOpen}
          >
            {isSidebarOpen ? '✕' : '☰'}
          </button>

          <section className="chat-panel__stream">
            <div className="chat-panel__surface">
              <MessageList messages={chat.activeConversation?.messages ?? []} />
            </div>
          </section>

          <footer className="chat-panel__composer-wrap">
            <Composer onSend={chat.sendMessage} disabled={chat.isSending} />
          </footer>
        </main>
      )}

      <PasswordModal
        isOpen={isPasswordModalOpen}
        isSubmitting={isUpdatingPassword}
        errorMessage={passwordError}
        successMessage={passwordStatus}
        onClose={handleClosePasswordModal}
        onSubmit={handleUpdatePassword}
      />
    </div>
  );
};
