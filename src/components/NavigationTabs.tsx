import React from 'react';
import { TabType } from '../types';
import {
  LayoutDashboard,
  Store,
  Users,
  Clock,
  CalendarDays,
  FileSpreadsheet,
  ReceiptText,
} from 'lucide-react';

interface NavigationTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  pendingLeavesCount: number;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onTabChange,
  pendingLeavesCount,
}) => {
  const tabs = [
    { id: 'dashboard' as TabType, label: 'Overview', icon: LayoutDashboard },
    { id: 'branches' as TabType, label: 'Branches', icon: Store },
    { id: 'staff' as TabType, label: 'Staff', icon: Users },
    { id: 'attendance' as TabType, label: 'Attendance Logs', icon: Clock },
    {
      id: 'leaves' as TabType,
      label: 'Leave Requests',
      icon: CalendarDays,
      badge: pendingLeavesCount,
    },
    { id: 'sales' as TabType, label: 'Sales Reports', icon: FileSpreadsheet },
    { id: 'payslips' as TabType, label: 'Payslips & Payroll', icon: ReceiptText },
  ];

  return (
    <div className="border-b border-slate-200/90 bg-white/90 sticky top-16 z-20 backdrop-blur-md shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto gap-1.5 py-2.5 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-2 relative ${
                isActive
                  ? 'text-indigo-700 bg-indigo-50 border border-indigo-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {typeof tab.badge === 'number' && tab.badge > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-amber-500 text-white ml-1 shadow-2xs">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
