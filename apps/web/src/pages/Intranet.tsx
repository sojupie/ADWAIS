import { InternalAnnouncements } from '../components/Intranet/InternalAnnouncements';
import { GoLiveCalendar } from '../components/Intranet/GoLiveCalendar';
import { SeoRssAggregator } from '../components/Intranet/SeoRssAggregator';
import { AgencySocialWall } from '../components/Intranet/AgencySocialWall';
import { OfficeContext } from '../components/Intranet/OfficeContext';

export function Intranet() {
  return (
    <div className="flex flex-col w-full flex-1 min-h-0 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 lg:grid-rows-2 gap-6 flex-1 min-h-0">
        {/* Top row */}
        <div className="col-span-1 min-h-0 h-full flex flex-col [&>*]:flex-1 [&>*]:min-h-0">
          <OfficeContext />
        </div>
        
        <div className="col-span-1 min-h-0 h-full flex flex-col [&>*]:flex-1 [&>*]:min-h-0">
          <InternalAnnouncements />
        </div>
        
        <div className="col-span-1 min-h-0 h-full flex flex-col [&>*]:flex-1 [&>*]:min-h-0">
          <GoLiveCalendar />
        </div>
        
        {/* Bottom row */}
        <div className="col-span-1 min-h-0 h-full flex flex-col [&>*]:flex-1 [&>*]:min-h-0">
          <SeoRssAggregator />
        </div>
        
        <div className="col-span-1 lg:col-span-2 min-h-0 h-full flex flex-col [&>*]:flex-1 [&>*]:min-h-0">
          <AgencySocialWall />
        </div>
      </div>
    </div>
  );
}
