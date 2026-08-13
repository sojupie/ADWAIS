// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

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
      <span className={`${className} font-display whitespace-nowrap font-black uppercase tracking-tight`}>ADWAIS</span>
    </Link>
  );
}
