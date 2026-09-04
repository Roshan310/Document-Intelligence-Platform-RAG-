import { Aperture } from 'lucide-react';

interface BrandMarkProps {
  className?: string;
  size?: number;
}

export const BrandMark = ({ className = 'side-nav__brand-mark', size = 20 }: BrandMarkProps) => (
  <div className={className} aria-hidden="true">
    <Aperture size={size} strokeWidth={1.75} />
  </div>
);
