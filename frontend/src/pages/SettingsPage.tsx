import { KeyRound, LogOut, Mail, ShieldCheck } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { UserAvatar } from '../components/UserAvatar';
import { getDisplayName, getRoleLabel } from '../lib/format';
import type { AuthUser } from '../types/auth';

interface SettingsPageProps {
  user: AuthUser | null;
  onChangePassword: () => void;
  onLogout: () => void;
}

export const SettingsPage = ({ user, onChangePassword, onLogout }: SettingsPageProps) => (
  <>
    <PageHeader title="Settings" subtitle="Your account details and workspace access." />

    <div className="settings-grid">
      <section className="card">
        <div className="card__header">
          <h2 className="card__title">Account</h2>
        </div>

        <div className="user-row">
          <UserAvatar user={user} size={46} />
          <div className="user-row__main">
            <div className="user-row__title">{getDisplayName(user?.email)}</div>
            <div className="user-row__meta">
              <Mail size={13} strokeWidth={1.75} />
              <span>{user?.email ?? 'Signed in'}</span>
            </div>
          </div>
        </div>

        <div className="detail-list">
          <div className="detail-row">
            <span className="detail-row__label">Role</span>
            <span className="detail-row__value">{getRoleLabel(user?.role)}</span>
          </div>
          <div className="detail-row">
            <span className="detail-row__label">Account status</span>
            <span className={`badge ${user?.isBlocked ? 'badge--danger' : 'badge--success'}`}>
              {user?.isBlocked ? 'Blocked' : 'Active'}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-row__label">User ID</span>
            <span className="detail-row__value">#{user?.id ?? '—'}</span>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card__header">
          <h2 className="card__title">Security</h2>
        </div>

        <div className="detail-list">
          <div className="detail-row">
            <div>
              <div className="detail-row__value">Password</div>
              <div className="detail-row__label">Use at least 8 characters.</div>
            </div>
            <button className="btn btn--secondary btn--sm" type="button" onClick={onChangePassword}>
              <KeyRound size={14} strokeWidth={1.75} />
              Change
            </button>
          </div>

          <div className="detail-row">
            <div>
              <div className="detail-row__value">Session</div>
              <div className="detail-row__label">Signing out clears this browser session.</div>
            </div>
            <button className="btn btn--danger btn--sm" type="button" onClick={onLogout}>
              <LogOut size={14} strokeWidth={1.75} />
              Log out
            </button>
          </div>

          <div className="detail-row">
            <div>
              <div className="detail-row__value">Verification</div>
              <div className="detail-row__label">Email verification is required before sign in.</div>
            </div>
            <span className="badge badge--success">
              <ShieldCheck size={13} strokeWidth={1.75} />
              Verified
            </span>
          </div>
        </div>
      </section>
    </div>
  </>
);
