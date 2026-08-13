import {Link} from '@tanstack/react-router';
import type {Timeframe} from '../../../schemas';

type BrandLogoLinkProps = {
  timeframe: Timeframe;
  className: string;
  onClick?: () => void;
};

export function BrandLogoLink({timeframe, className, onClick}: BrandLogoLinkProps) {
  return (
    <Link to="/financial" search={{timeframe}} onClick={onClick} className="shrink-0 flex items-center" aria-label="Go to Financial">
      <span className={`${className} whitespace-nowrap font-black uppercase tracking-widest`}>ADWAIS</span>
    </Link>
  );
}
