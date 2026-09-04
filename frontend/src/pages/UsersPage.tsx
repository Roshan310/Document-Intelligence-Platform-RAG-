import { AlertCircle, Ban, Info, Loader2, UserCheck, Users } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { UserAvatar } from '../components/UserAvatar';
import { getRoleLabel } from '../lib/format';
import type { AuthUser } from '../types/auth';

interface UsersPageProps {
  users: AuthUser[];
  usersLoading: boolean;
  usersError: string | null;
  onBlockUser: (userId: number) => void;
  onUnblockUser: (userId: number) => void;
  actionUserId: number | null;
  actionStatus: string | null;
}

export const UsersPage = ({
  users,
  usersLoading,
  usersError,
  onBlockUser,
  onUnblockUser,
  actionUserId,
  actionStatus,
}: UsersPageProps) => {
  return (
    <>
      <PageHeader
        title="Users"
        subtitle="Blocked members cannot sign in until you unblock them. Admin accounts cannot be changed here."
      />

      {actionStatus ? (
        <div className="alert">
          <Info size={16} strokeWidth={1.75} />
          {actionStatus}
        </div>
      ) : null}

      <section className="card">
        <div className="card__header">
          <h2 className="card__title">Workspace members</h2>
          <span className="stat-card__meta">
            {users.length} {users.length === 1 ? 'member' : 'members'}
          </span>
        </div>

        {usersLoading ? (
          <div className="alert">
            <Loader2 size={16} strokeWidth={1.75} className="spinner" />
            Loading workspace users…
          </div>
        ) : usersError ? (
          <div className="alert alert--error">
            <AlertCircle size={16} strokeWidth={1.75} />
            {usersError}
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">
              <Users size={20} strokeWidth={1.75} />
            </div>
            <div className="empty-state__title">No other users found</div>
            <p className="empty-state__text">Members appear here once they register an account.</p>
          </div>
        ) : (
          <div className="user-list">
            {users.map((user) => {
              const isActionPending = actionUserId === user.id;

              return (
                <article key={user.id} className="user-row">
                  <UserAvatar user={user} size={38} />

                  <div className="user-row__main">
                    <div className="user-row__title">{user.email}</div>
                    <div className="user-row__meta">
                      <span>{getRoleLabel(user.role)}</span>
                      <span aria-hidden="true">•</span>
                      <span>User #{user.id}</span>
                    </div>
                  </div>

                  <div className="user-row__actions">
                    <span className={`badge ${user.isBlocked ? 'badge--danger' : 'badge--success'}`}>
                      {user.isBlocked ? 'Blocked' : 'Active'}
                    </span>

                    <button
                      className={`btn btn--sm ${user.isBlocked ? 'btn--secondary' : 'btn--danger'}`}
                      type="button"
                      onClick={() => (user.isBlocked ? onUnblockUser(user.id) : onBlockUser(user.id))}
                      disabled={isActionPending}
                    >
                      {user.isBlocked ? (
                        <UserCheck size={14} strokeWidth={1.75} />
                      ) : (
                        <Ban size={14} strokeWidth={1.75} />
                      )}
                      {isActionPending ? 'Updating…' : user.isBlocked ? 'Unblock' : 'Block'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
};
