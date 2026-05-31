import type { FormEvent } from 'react';
import { useState } from 'react';

interface AuthScreenProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (
    email: string,
    password: string,
  ) => Promise<{ verificationRequired: boolean; verificationEmailSent: boolean } | null>;
  errorMessage: string | null;
  infoMessage: string | null;
  isSubmitting: boolean;
}

export const AuthScreen = ({ onLogin, onRegister, errorMessage, infoMessage, isSubmitting }: AuthScreenProps) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (mode === 'login') {
      await onLogin(email, password);
      return;
    }

    const result = await onRegister(email, password);

    if (result) {
      setMode('login');
      setPassword('');
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <div className="auth-panel__badge">RAG Workspace</div>
        <h1 className="auth-panel__title">Access your document chat</h1>
        <p className="auth-panel__subtitle">
          Register to create an account, verify your email, then sign in to chat with uploaded documents.
        </p>

        <div className="auth-toggle">
          <button type="button" className={mode === 'login' ? 'auth-toggle__button auth-toggle__button--active' : 'auth-toggle__button'} onClick={() => setMode('login')}>
            Login
          </button>
          <button type="button" className={mode === 'register' ? 'auth-toggle__button auth-toggle__button--active' : 'auth-toggle__button'} onClick={() => setMode('register')}>
            Register
          </button>
        </div>

        <form className="auth-form" onSubmit={submit}>
          <label className="auth-form__field">
            <span>Email</span>
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="user@example.com" autoComplete="email" />
          </label>

          <label className="auth-form__field">
            <span>Password</span>
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Your password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          </label>

          {errorMessage ? <div className="auth-form__message auth-form__message--error">{errorMessage}</div> : null}
          {infoMessage ? <div className="auth-form__message auth-form__message--info">{infoMessage}</div> : null}

          <button className="auth-form__submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Please wait...' : mode === 'login' ? 'Login' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
};
