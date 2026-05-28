import os
import re

base_dir = r'c:\Users\ollem\Git\motillo project\dashboard\apps\web\src\components\Intranet'

# 1. Update InternalAnnouncements.tsx
announcements_file = os.path.join(base_dir, 'InternalAnnouncements.tsx')
with open(announcements_file, 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace(
    '<CollectionPanel title="Internal Announcements" className="h-full">',
    """<CollectionPanel 
      title="Internal Announcements" 
      className="h-full"
      actions={
        <button className="bg-brand-bg-secondary text-white px-3 py-1 rounded-[4px] text-[10px] font-black uppercase tracking-widest hover:bg-brand-text transition-all shadow-sm cursor-pointer">
          + New Post
        </button>
      }
    >"""
)
with open(announcements_file, 'w', encoding='utf-8') as f: f.write(c)

# 2. Update GoLiveCalendar.tsx
calendar_file = os.path.join(base_dir, 'GoLiveCalendar.tsx')
with open(calendar_file, 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace(
    '<CollectionPanel title="E-Commerce Go-Live Calendar" className="h-full">',
    """<CollectionPanel 
      title="E-Commerce Go-Live Calendar" 
      className="h-full"
      actions={
        <button className="bg-brand-bg-secondary text-white px-3 py-1 rounded-[4px] text-[10px] font-black uppercase tracking-widest hover:bg-brand-text transition-all shadow-sm cursor-pointer">
          + Milestone
        </button>
      }
    >"""
)
with open(calendar_file, 'w', encoding='utf-8') as f: f.write(c)

# 3. Update AgencySocialWall.tsx
social_file = os.path.join(base_dir, 'AgencySocialWall.tsx')
with open(social_file, 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace(
    '<CollectionPanel title="Agency Social Wall" className="h-full">',
    """<CollectionPanel 
      title="Agency Social Wall" 
      className="h-full"
      actions={
        <button className="bg-[#0077b5] text-white px-3 py-1 rounded-[4px] text-[10px] font-black uppercase tracking-widest hover:bg-[#005e93] transition-all shadow-sm cursor-pointer">
          + Share Update
        </button>
      }
    >"""
)
with open(social_file, 'w', encoding='utf-8') as f: f.write(c)

# 4. Update OfficeContext.tsx
office_file = os.path.join(base_dir, 'OfficeContext.tsx')
with open(office_file, 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace(
    '<span className="text-[10px] font-bold text-white/40">{events.length} Events</span>',
    """<div className="flex items-center gap-3">
               <span className="text-[10px] font-bold text-white/40">{events.length} Events</span>
               <button className="bg-white/10 text-white hover:bg-white/20 border border-white/20 px-2 py-0.5 rounded-[4px] text-[9px] font-black uppercase tracking-widest transition-all shadow-sm cursor-pointer">
                 + Add Event
               </button>
            </div>"""
)
with open(office_file, 'w', encoding='utf-8') as f: f.write(c)


# 5. Update Intranet.tsx layout
intranet_file = r'c:\Users\ollem\Git\motillo project\dashboard\apps\web\src\pages\Intranet.tsx'
with open(intranet_file, 'r', encoding='utf-8') as f:
    c = f.read()

layout_replacement = """<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top row: 320px height for optimal density */}
        <div className="col-span-1 h-[320px]">
          <OfficeContext />
        </div>
        
        <div className="col-span-1 h-[320px]">
          <InternalAnnouncements />
        </div>
        
        <div className="col-span-1 h-[320px]">
          <GoLiveCalendar />
        </div>
        
        {/* Bottom row: 400px height for richer media/content */}
        <div className="col-span-1 h-[400px]">
          <SeoRssAggregator />
        </div>
        
        <div className="col-span-1 lg:col-span-2 h-[400px]">
          <AgencySocialWall />
        </div>
      </div>"""

c = re.sub(r'<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-\[420px\]">.*</div>\s*</div>', layout_replacement + '\n    </div>', c, flags=re.DOTALL)

with open(intranet_file, 'w', encoding='utf-8') as f: f.write(c)

print("Intranet layout and action components generated.")
