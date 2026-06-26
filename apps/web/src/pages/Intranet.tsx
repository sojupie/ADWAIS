import { InternalAnnouncements } from '../components/Intranet/InternalAnnouncements';
import { GoLiveCalendar } from '../components/Intranet/GoLiveCalendar';
import { SeoRssAggregator } from '../components/Intranet/SeoRssAggregator';
import { MotilloNews } from '../components/Intranet/MotilloNews';
import { OfficeContext } from '../components/Intranet/OfficeContext';
import { DashboardLayout } from '../components/common/layout/DashboardLayout';

export function Intranet() {
  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 portrait-lg:grid-cols-2 portrait-contained:grid-rows-3 landscape-lg:grid-cols-3 landscape-contained:grid-rows-2 gap-6 flex-1 min-h-0 animate-in fade-in duration-500">
        {/* Top row */}
        <div className="col-span-1 contained:min-h-0 contained:h-full flex flex-col [&>*]:flex-1 [&>*]:min-h-0">
          <OfficeContext />
        </div>
        
        <div className="col-span-1 contained:min-h-0 contained:h-full flex flex-col [&>*]:flex-1 [&>*]:min-h-0">
          <InternalAnnouncements />
        </div>
        
        <div className="col-span-1 contained:min-h-0 contained:h-full flex flex-col [&>*]:flex-1 [&>*]:min-h-0">
          <GoLiveCalendar />
        </div>
        
        {/* Bottom row */}
        <div className="col-span-1 contained:min-h-0 contained:h-full flex flex-col [&>*]:flex-1 [&>*]:min-h-0">
          <SeoRssAggregator />
        </div>
        
        <div className="col-span-1 portrait-lg:col-span-2 landscape-lg:col-span-2 contained:min-h-0 contained:h-full flex flex-col [&>*]:flex-1 [&>*]:min-h-0">
          <MotilloNews />
        </div>
      </div>
    </DashboardLayout>
  );
}
