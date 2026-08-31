import React, { useState } from 'react';
import { Staff, Branch, StaffPosition, StaffStatus } from '../types';
import {
  Users,
  Plus,
  Search,
  PenSquare,
  Trash2,
  GitMerge,
  X,
  Mail,
  Phone,
  Building2,
  BadgeAlert,
  Check,
  Briefcase,
} from 'lucide-react';

interface StaffTabProps {
  staffList: Staff[];
  branches: Branch[];
  onSaveStaff: (staff: Partial<Staff>, key?: string) => Promise<void>;
  onDeleteStaff: (key: string) => Promise<void>;
  onMergeDuplicates: () => Promise<void>;
  showToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export const StaffTab: React.FC<StaffTabProps> = ({
  staffList,
  branches,
  onSaveStaff,
  onDeleteStaff,
  onMergeDuplicates,
  showToast,
}) => {
  const [search, setSearch] = useState('');
  const [positionFilter, setPositionFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState<StaffPosition>('CREW');
  const [status, setStatus] = useState<StaffStatus>('ACTIVE');
  const [branch, setBranch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isMerging, setIsMerging] = useState(false);

  const handleOpenAddModal = () => {
    setEditingStaff(null);
    setName('');
    setEmail('');
    setPhone('');
    setPosition('CREW');
    setStatus('ACTIVE');
    setBranch(branches.length > 0 ? branches[0].name : '');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (staff: Staff) => {
    setEditingStaff(staff);
    setName(staff.name || '');
    setEmail(staff.email || '');
    setPhone(staff.phone || '');
    setPosition(staff.position || 'CREW');
    setStatus(staff.status || 'ACTIVE');
    setBranch(staff.branch || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      showToast('Full name and email address are required.', 'error');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const duplicate = staffList.find(
      (s) => s.key !== editingStaff?.key && s.email.toLowerCase() === cleanEmail
    );

    if (duplicate) {
      showToast(`A staff record with email ${cleanEmail} already exists.`, 'error');
      return;
    }

    setIsSaving(true);
    try {
      await onSaveStaff(
        {
          name: name.trim(),
          email: cleanEmail,
          phone: phone.trim(),
          position,
          status,
          branch,
        },
        editingStaff?.key
      );
      setIsModalOpen(false);
      showToast(
        editingStaff ? 'Staff profile updated.' : 'New staff member registered.',
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to save staff.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMerge = async () => {
    setIsMerging(true);
    try {
      await onMergeDuplicates();
    } finally {
      setIsMerging(false);
    }
  };

  const filteredStaff = staffList.filter((s) => {
    const query = search.toLowerCase();
    const matchesSearch =
      s.name.toLowerCase().includes(query) ||
      s.email.toLowerCase().includes(query) ||
      (s.phone && s.phone.includes(query)) ||
      (s.branch && s.branch.toLowerCase().includes(query));

    const matchesPosition = positionFilter === 'ALL' || s.position === positionFilter;
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;

    return matchesSearch && matchesPosition && matchesStatus;
  });

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Staff Personnel Directory</span>
            </h3>
            <p className="text-xs text-slate-500">
              Manage personnel records, positions, and branch allocations
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-52">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search staff..."
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
              />
            </div>

            {/* Position Filter */}
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 focus:bg-white"
            >
              <option value="ALL">All Positions</option>
              <option value="MANAGER">Branch Manager</option>
              <option value="SUPERVISOR">Supervisor</option>
              <option value="SENIOR_CREW">Senior Crew</option>
              <option value="CREW">Crew</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 focus:bg-white"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            {/* Merge Duplicates Button */}
            <button
              onClick={handleMerge}
              disabled={isMerging}
              title="Find and merge records sharing the same email address"
              className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              <GitMerge className="w-3.5 h-3.5" />
              <span>{isMerging ? 'Merging...' : 'Merge Duplicates'}</span>
            </button>

            {/* Add Staff Button */}
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs shadow-indigo-600/30 transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Staff</span>
            </button>
          </div>
        </div>

        {/* Staff Table */}
        <div className="overflow-x-auto mt-4 border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-200 font-semibold tracking-wider">
              <tr>
                <th className="p-3">Staff Name / Email</th>
                <th className="p-3">Contact Phone</th>
                <th className="p-3">Designation</th>
                <th className="p-3">Assigned Branch</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400 text-xs">
                    {staffList.length === 0
                      ? "No staff members registered. Click 'Add Staff' or let employees connect to auto-detect."
                      : 'No staff matching the selected filters.'}
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => {
                  const isActive = staff.status === 'ACTIVE';
                  const isAutoDetected =
                    staff.source === 'presence' && !staff.phone && !staff.branch;

                  return (
                    <tr key={staff.key} className="hover:bg-slate-50/80 transition">
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-xs shrink-0">
                            {staff.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {staff.name}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {staff.email}
                            </span>
                            {isAutoDetected && (
                              <span className="inline-flex items-center gap-1 text-[9px] text-amber-700 font-semibold mt-0.5">
                                <BadgeAlert className="w-3 h-3 text-amber-500" /> Auto-detected — complete profile
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-slate-600 font-mono">
                        {staff.phone ? (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {staff.phone}
                          </span>
                        ) : (
                          '--'
                        )}
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 border border-slate-200 text-slate-700">
                          <Briefcase className="w-3 h-3 text-indigo-600" />
                          {(staff.position || 'CREW').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-3 text-slate-700">
                        {staff.branch ? (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            {staff.branch}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {staff.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEditModal(staff)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-[11px] font-semibold border border-slate-200 transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <PenSquare className="w-3 h-3" /> Edit
                        </button>
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `Remove ${staff.name} from the staff directory? Historical records will remain intact.`
                              )
                            ) {
                              onDeleteStaff(staff.key);
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-semibold border border-rose-200 transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Staff */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>{editingStaff ? 'Edit Staff Profile' : 'Add New Staff Member'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Name */}
              <div>
                <label className="block text-slate-700 mb-1 font-medium">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Ahmad Hafiz Bin Kamal"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-slate-700 mb-1 font-medium">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="e.g. ahmad.hafiz@company.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white font-mono"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-slate-700 mb-1 font-medium">
                  Phone Number (Malaysia)
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 012-3456789"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white font-mono"
                />
              </div>

              {/* Position & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-medium">
                    Position
                  </label>
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value as StaffPosition)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  >
                    <option value="MANAGER">Branch Manager (RM 3,500)</option>
                    <option value="SUPERVISOR">Supervisor (RM 2,500)</option>
                    <option value="SENIOR_CREW">Senior Crew (RM 2,000)</option>
                    <option value="CREW">Crew (RM 1,700)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-medium">
                    Account Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as StaffStatus)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              {/* Branch Assignment */}
              <div>
                <label className="block text-slate-700 mb-1 font-medium">
                  Assigned Outlet / Branch
                </label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                >
                  <option value="">Unassigned / Floating Staff</option>
                  {branches.map((b) => (
                    <option key={b.key} value={b.name}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 shadow-xs shadow-indigo-600/20 transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save Staff'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
