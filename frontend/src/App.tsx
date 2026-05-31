import { useEffect, useState } from 'react';
import { AdminPanel } from './components/AdminPanel';
import { AuthScreen } from './components/AuthScreen';
import { ChatHeader } from './components/ChatHeader';
import { Composer } from './components/Composer';
import { MessageList } from './components/MessageList';
import { Sidebar } from './components/Sidebar';
import { ApiError, uploadRequest } from './lib/api';
import { useAuth } from './hooks/useAuth';
import { useChat } from './hooks/useChat';

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

  useEffect(() => {
    if (auth.user) {
      setIsSidebarOpen(true);
      setActiveView(auth.user.role === 'admin' ? 'admin' : 'chat');
    }
  }, [auth.user]);

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
    } catch (error) {
      setUploadStatus(error instanceof Error ? error.message : 'Upload failed');

      if (error instanceof ApiError) {
        auth.handleApiError(error);
      }
    } finally {
      setIsUploading(false);
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
        user={auth.user}
        activeView={activeView}
        onViewChange={setActiveView}
        onCloseSidebar={() => setIsSidebarOpen(false)}
      />

      {auth.user.role === 'admin' && activeView === 'admin' ? (
        <AdminPanel
          user={auth.user}
          onUploadDocument={handleUploadDocument}
          uploadStatus={uploadStatus}
          isUploading={isUploading}
          onToggleSidebar={() => setIsSidebarOpen((current) => !current)}
        />
      ) : (
        <main className="chat-panel">
          <ChatHeader
            conversation={chat.activeConversation}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen((current) => !current)}
            user={auth.user}
          />

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
    </div>
  );
};
