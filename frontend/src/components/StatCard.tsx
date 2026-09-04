import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  /** Rendered as-is. Pass null when the value is not available yet. */
  value: string | null;
  unit?: string;
  meta?: string;
}

export const StatCard = ({ icon: Icon, label, value, unit, meta }: StatCardProps) => (
  <article className="stat-card">
    <div className="stat-card__top">
      <div className="stat-card__icon" aria-hidden="true">
        <Icon size={20} strokeWidth={1.75} />
      </div>
      <div>
        <div className="stat-card__label">{label}</div>
        <div className={`stat-card__value${value === null ? ' stat-card__value--empty' : ''}`}>
          {value ?? '—'}
          {value !== null && unit ? <span className="stat-card__unit">{unit}</span> : null}
        </div>
      </div>
    </div>

    {meta ? <div className="stat-card__meta">{meta}</div> : null}
  </article>
);
