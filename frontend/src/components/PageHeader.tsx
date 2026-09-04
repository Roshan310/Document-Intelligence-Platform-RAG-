import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}

export const PageHeader = ({ title, subtitle, actions }: PageHeaderProps) => (
  <header className="page-header">
    <div>
      <h1 className="page-header__title">{title}</h1>
      {subtitle ? <p className="page-header__subtitle">{subtitle}</p> : null}
    </div>

    {actions ? <div className="page-header__actions">{actions}</div> : null}
  </header>
);
