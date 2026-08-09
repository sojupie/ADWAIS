import {Link} from '@tanstack/react-router';
import brandLogo from '../../../assets/brand-logo.svg';
import type {Timeframe} from '../../../schemas';

type BrandLogoLinkProps = {
  timeframe: Timeframe;
  className: string;
  height: number;
  onClick?: () => void;
};

export function BrandLogoLink({timeframe, className, height, onClick}: BrandLogoLinkProps) {
  return (
    <Link to="/financial" search={{timeframe}} onClick={onClick} className="shrink-0 flex items-center" aria-label="Go to Financial">
      <img className={`${className} shrink-0`} src={brandLogo} alt="Organization logo" height={height} />
    </Link>
  );
}
