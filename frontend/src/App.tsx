import { useEffect, useMemo, useState } from 'react';
import { Loader2, Menu } from 'lucide-react';
import { AdminSidebar } from './components/AdminSidebar';
import { AuthScreen } from './components/AuthScreen';
import { BrandMark } from './components/BrandMark';
import { ChatSidebar } from './components/ChatSidebar';
import { ConversationRail } from './components/ConversationRail';
import { PasswordModal } from './components/PasswordModal';
import { ChatHistoryPage } from './pages/ChatHistoryPage';
import { ChatPage } from './pages/ChatPage';
import { DashboardPage } from './pages/DashboardPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { SettingsPage } from './pages/SettingsPage';
import { UsersPage } from './pages/UsersPage';
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
import type { AppView } from './types/nav';

export const App = () => {
  const auth = useAuth();
  const chat = useChat(auth.user, auth.token, auth.logout);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState<AppView>('dashboard');
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
      setActiveView(auth.user.role === 'admin' ? 'dashboard' : 'ask');
    }
  }, [auth.user]);

  // Every verified user can list documents; only admins can upload or delete them.
  useEffect(() => {
    if (!auth.user || !auth.token) {
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
    if (!auth.user || auth.user.role !== 'admin' || !auth.token || activeView !== 'users') {
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

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredConversations = useMemo(() => {
    if (!normalizedSearch) {
      return chat.conversations;
    }

    return chat.conversations.filter((conversation) => {
      const combinedText = [conversation.title, conversation.subtitle, ...conversation.tags]
        .join(' ')
        .toLowerCase();

      return combinedText.includes(normalizedSearch);
    });
  }, [chat.conversations, normalizedSearch]);

  const closeSidebarOnMobile = () => {
    if (window.matchMedia('(max-width: 920px)').matches) {
      setIsSidebarOpen(false);
    }
  };

  // Picking or starting a conversation always lands you in the chat, whatever view you were on.
  const handleSelectConversation = (conversationId: string) => {
    chat.selectConversation(conversationId);
    setActiveView('ask');
    closeSidebarOnMobile();
  };

  const handleCreateConversation = () => {
    chat.createNewConversation();
    setSearchTerm('');
    setActiveView('ask');
    closeSidebarOnMobile();
  };

  const handleChangeView = (view: AppView) => {
    setActiveView(view);
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
    if (!auth.token || auth.user?.role !== 'admin' || activeView !== 'users') {
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
        <div className="auth-card auth-loading">
          <BrandMark className="auth-card__brand-mark" size={22} />
          <div className="auth-card__title">Loading workspace…</div>
          <p className="auth-card__subtitle">Preparing your authenticated session.</p>
          <Loader2 size={20} strokeWidth={1.75} className="spinner" />
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

  const isAdmin = auth.user.role === 'admin';

  const renderWorkspace = () => {
    if (activeView === 'ask') {
      return (
        <div className="workspace">
          <ChatPage
            messages={chat.activeConversation?.messages ?? []}
            onSend={chat.sendMessage}
            isSending={chat.isSending}
            rail={
              // Members already have the conversation list in their sidebar.
              isAdmin ? (
                <ConversationRail
                  conversations={filteredConversations}
                  activeConversationId={chat.activeConversationId}
                  searchTerm={searchTerm}
                  onSearchTermChange={setSearchTerm}
                  onSelectConversation={handleSelectConversation}
                  onCreateConversation={handleCreateConversation}
                />
              ) : undefined
            }
          />
        </div>
      );
    }

    return (
      <div className="workspace workspace--scroll">
        <div className="workspace__inner">
          {isAdmin && activeView === 'dashboard' ? (
            <DashboardPage
              user={auth.user}
              documents={uploadedDocuments}
              documentsLoading={documentsLoading}
              documentsError={documentsError}
              conversations={chat.conversations}
              onNavigate={handleChangeView}
            />
          ) : null}

          {activeView === 'documents' ? (
            <DocumentsPage
              documents={uploadedDocuments}
              documentsLoading={documentsLoading}
              documentsError={documentsError}
              canManage={isAdmin}
              onUploadDocument={handleUploadDocument}
              isUploading={isUploading}
              uploadStatus={uploadStatus}
              onDeleteDocument={handleDeleteDocument}
              deletingDocumentId={deletingDocumentId}
              deleteStatus={deleteStatus}
            />
          ) : null}

          {isAdmin && activeView === 'users' ? (
            <UsersPage
              users={users}
              usersLoading={usersLoading}
              usersError={usersError}
              onBlockUser={handleBlockUser}
              onUnblockUser={handleUnblockUser}
              actionUserId={actionUserId}
              actionStatus={actionStatus}
            />
          ) : null}

          {isAdmin && activeView === 'history' ? (
            <ChatHistoryPage
              conversations={filteredConversations}
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
              onSelectConversation={handleSelectConversation}
              onCreateConversation={handleCreateConversation}
            />
          ) : null}

          {activeView === 'settings' ? (
            <SettingsPage
              user={auth.user}
              onChangePassword={handleOpenPasswordModal}
              onLogout={auth.logout}
            />
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className={`app-shell${isSidebarOpen ? ' app-shell--sidebar-open' : ''}`}>
      <div className="app-shell__backdrop" onClick={closeSidebarOnMobile} aria-hidden="true" />

      <button
        className="workspace__toggle"
        type="button"
        onClick={() => setIsSidebarOpen((current) => !current)}
        aria-label={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        aria-pressed={isSidebarOpen}
      >
        <Menu size={18} strokeWidth={1.75} />
      </button>

      {isAdmin ? (
        <AdminSidebar
          activeView={activeView}
          onViewChange={handleChangeView}
          user={auth.user}
          onChangePassword={handleOpenPasswordModal}
          onLogout={auth.logout}
          onCloseSidebar={() => setIsSidebarOpen(false)}
        />
      ) : (
        <ChatSidebar
          activeView={activeView}
          onViewChange={handleChangeView}
          conversations={filteredConversations}
          activeConversationId={chat.activeConversationId}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          onSelectConversation={handleSelectConversation}
          onCreateConversation={handleCreateConversation}
          user={auth.user}
          onChangePassword={handleOpenPasswordModal}
          onLogout={auth.logout}
          onCloseSidebar={() => setIsSidebarOpen(false)}
        />
      )}

      {renderWorkspace()}

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
