import os

routes_dir = r"c:\Users\ollem\Git\motillo project\dashboard\apps\web\src\routes"

# financial
financial_lazy = """import { createLazyFileRoute } from '@tanstack/react-router';
import { Financial } from '../pages/Financial';

export const Route = createLazyFileRoute('/financial')({
  component: Financial,
});
"""
with open(os.path.join(routes_dir, "financial.lazy.tsx"), "w", encoding="utf-8") as f:
    f.write(financial_lazy)

financial_route = """import { createFileRoute } from '@tanstack/react-router';
import { financialSearchSchema } from '../schemas';

export const Route = createFileRoute('/financial')({
  validateSearch: (search) => financialSearchSchema.parse(search),
});
"""
with open(os.path.join(routes_dir, "financial.tsx"), "w", encoding="utf-8") as f:
    f.write(financial_route)

# fleet-status
fleet_lazy = """import { createLazyFileRoute } from '@tanstack/react-router';
import { FleetStatus } from '../pages/FleetStatus';

export const Route = createLazyFileRoute('/fleet-status')({
  component: FleetStatus,
});
"""
with open(os.path.join(routes_dir, "fleet-status.lazy.tsx"), "w", encoding="utf-8") as f:
    f.write(fleet_lazy)

fleet_route = """import { createFileRoute } from '@tanstack/react-router';
import { fleetSearchSchema } from '../schemas';

export const Route = createFileRoute('/fleet-status')({
  validateSearch: (search) => fleetSearchSchema.parse(search),
});
"""
with open(os.path.join(routes_dir, "fleet-status.tsx"), "w", encoding="utf-8") as f:
    f.write(fleet_route)


# intranet
intranet_lazy = """import { createLazyFileRoute } from '@tanstack/react-router';
import { Intranet } from '../pages/Intranet';

export const Route = createLazyFileRoute('/intranet')({
  component: Intranet,
});
"""
with open(os.path.join(routes_dir, "intranet.lazy.tsx"), "w", encoding="utf-8") as f:
    f.write(intranet_lazy)

intranet_route = """import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/intranet')();
"""
with open(os.path.join(routes_dir, "intranet.tsx"), "w", encoding="utf-8") as f:
    f.write(intranet_route)

# settings
settings_lazy = """import { createLazyFileRoute } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/settings')({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-700">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold text-brand-text tracking-tight m-0">Settings & Administration</h1>
        <p className="text-sm text-slate-500 m-0 font-medium tracking-wide">Manage tenants, monitors, and global configuration.</p>
      </header>
      
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 flex items-center justify-center min-h-[300px]">
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Administration features are coming soon.</p>
      </div>
    </div>
  );
}
"""
with open(os.path.join(routes_dir, "settings.lazy.tsx"), "w", encoding="utf-8") as f:
    f.write(settings_lazy)

settings_route = """import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/settings')();
"""
with open(os.path.join(routes_dir, "settings.tsx"), "w", encoding="utf-8") as f:
    f.write(settings_route)

print("Lazy routes setup completed.")
