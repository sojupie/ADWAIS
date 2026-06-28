import {Link} from '@tanstack/react-router';
import motilloLogo from '../../../assets/motillo-logo.svg';
import type {Timeframe} from '../../../schemas';

type MotilloLogoLinkProps = {
  timeframe: Timeframe;
  className: string;
  height: number;
  onClick?: () => void;
};

export function MotilloLogoLink({timeframe, className, height, onClick}: MotilloLogoLinkProps) {
  return (
    <Link to="/financial" search={{timeframe}} onClick={onClick} aria-label="Go to Financial">
      <img className={className} src={motilloLogo} alt="Motillo" height={height} />
    </Link>
  );
}
