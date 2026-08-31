import React from 'react';
import { ShieldCheck, LogOut, Sparkles, Building2, Wifi } from 'lucide-react';

interface NavbarProps {
  adminEmail: string;
  isOnline: boolean;
  onLogout: () => void;
  branchCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  adminEmail,
  isOnline,
  onLogout,
  branchCount,
}) => {
  return (
    <header className="border-b border-slate-200/90 bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & System Status */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-600/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-900 tracking-tight">
                Admin Control Center
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                <Sparkles className="w-2.5 h-2.5" /> Portal v2.5
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium truncate max-w-[220px] sm:max-w-xs">
              {adminEmail || 'admin@company.com'}
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-600 bg-slate-100/80 border border-slate-200/80 px-3 py-1.5 rounded-xl font-medium">
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>{branchCount} Active Branches</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden sm:inline">Live RTDB</span>
          </div>

          <button
            onClick={onLogout}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 hover:text-rose-800 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-2xs active:scale-95"
            title="Sign out from administrative session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
