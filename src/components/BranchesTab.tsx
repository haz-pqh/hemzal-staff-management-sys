import React, { useState, useEffect, useRef } from 'react';
import { Branch } from '../types';
import {
  Store,
  Plus,
  Search,
  MapPin,
  PenSquare,
  Trash2,
  X,
  Sparkles,
  Building2,
  Check,
  RotateCcw,
} from 'lucide-react';

interface BranchesTabProps {
  branches: Branch[];
  onSaveBranch: (branch: Partial<Branch>, key?: string) => Promise<void>;
  onDeleteBranch: (key: string) => Promise<void>;
  showToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export const BranchesTab: React.FC<BranchesTabProps> = ({
  branches,
  onSaveBranch,
  onDeleteBranch,
  showToast,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  // Form fields
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [isSaving, setIsSaving] = useState(false);

  // Photon Address Autocomplete
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [isAddressDropdownOpen, setIsAddressDropdownOpen] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Generate next automatic branch code
  const generateNextBranchCode = () => {
    const usedCodes = new Set(
      branches.map((b) => String(b.code || '').trim().toUpperCase()).filter(Boolean)
    );
    let counter = 1;
    while (usedCodes.has(`BR-${String(counter).padStart(3, '0')}`)) {
      counter++;
    }
    return `BR-${String(counter).padStart(3, '0')}`;
  };

  const handleOpenAddModal = () => {
    setEditingBranch(null);
    setCode(generateNextBranchCode());
    setName('');
    setAddress('');
    setStatus('ACTIVE');
    setAddressSuggestions([]);
    setIsAddressDropdownOpen(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (branch: Branch) => {
    setEditingBranch(branch);
    setCode(branch.code || generateNextBranchCode());
    setName(branch.name || '');
    setAddress(branch.address || '');
    setStatus(branch.status || 'ACTIVE');
    setAddressSuggestions([]);
    setIsAddressDropdownOpen(false);
    setIsModalOpen(true);
  };

  // Photon Address Lookup
  const handleAddressChange = (val: string) => {
    setAddress(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.trim().length < 3) {
      setAddressSuggestions([]);
      setIsAddressDropdownOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoadingAddress(true);
      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(
            val
          )}&limit=5&countrycode=MY`
        );
        const data = await res.json();
        if (data && data.features && data.features.length > 0) {
          const suggestions = data.features.map((feat: any) => {
            const p = feat.properties || {};
            const parts = [p.name, p.street, p.city, p.state, p.country].filter(Boolean);
            return parts.join(', ');
          });
          setAddressSuggestions(Array.from(new Set(suggestions)));
          setIsAddressDropdownOpen(true);
        } else {
          setAddressSuggestions([]);
          setIsAddressDropdownOpen(false);
        }
      } catch (err) {
        console.error('Photon API address lookup error:', err);
      } finally {
        setIsLoadingAddress(false);
      }
    }, 300);
  };

  // Click outside to close address dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsAddressDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim() || !address.trim()) {
      showToast('Please complete Branch Code, Name, and Address.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await onSaveBranch(
        {
          code: code.trim().toUpperCase(),
          name: name.trim(),
          address: address.trim(),
          status,
        },
        editingBranch?.key
      );
      setIsModalOpen(false);
      showToast(
        editingBranch ? 'Branch updated successfully.' : 'New branch registered successfully.',
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to save branch.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredBranches = branches.filter((b) => {
    const query = search.toLowerCase();
    const matchesSearch =
      b.name.toLowerCase().includes(query) ||
      b.code.toLowerCase().includes(query) ||
      b.address.toLowerCase().includes(query);
    const matchesStatus =
      statusFilter === 'ALL' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Branch Directory</span>
            </h3>
            <p className="text-xs text-slate-500">
              Manage operating locations, outlets, and company branches
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search branch or code..."
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 focus:bg-white"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            {/* Add Branch Button */}
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs shadow-indigo-600/30 transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Branch</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto mt-4 border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-200 font-semibold tracking-wider">
              <tr>
                <th className="p-3">Branch Code / Name</th>
                <th className="p-3">Physical Address (Malaysia)</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredBranches.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-400 text-xs">
                    {branches.length === 0
                      ? "No branches registered yet. Click 'Add New Branch' to create your first location."
                      : 'No branches match your current search and filter criteria.'}
                  </td>
                </tr>
              ) : (
                filteredBranches.map((branch) => {
                  const isActive = branch.status === 'ACTIVE';

                  return (
                    <tr key={branch.key} className="hover:bg-slate-50/80 transition">
                      <td className="p-3">
                        <span className="font-bold text-slate-900 block text-xs">
                          {branch.name}
                        </span>
                        <span className="text-[10px] text-indigo-600 font-mono font-semibold">
                          {branch.code}
                        </span>
                      </td>
                      <td
                        className="p-3 text-slate-600 max-w-sm truncate"
                        title={branch.address}
                      >
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{branch.address}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {branch.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEditModal(branch)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-[11px] font-semibold border border-slate-200 transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <PenSquare className="w-3 h-3" /> Edit
                        </button>
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `Are you sure you want to remove ${branch.name} from the database?`
                              )
                            ) {
                              onDeleteBranch(branch.key);
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

      {/* Modal Add / Edit Branch */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Store className="w-4 h-4 text-indigo-600" />
                <span>{editingBranch ? 'Edit Branch Location' : 'Add New Branch'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Branch Code */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-slate-700 font-medium">
                    Branch Code / Identifier
                  </label>
                  <span className="text-[10px] text-indigo-600 font-mono font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Auto Code
                  </span>
                </div>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  placeholder="e.g. BR-001"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-indigo-700 font-mono font-bold focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              {/* Branch Name */}
              <div>
                <label className="block text-slate-700 mb-1 font-medium">
                  Branch Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Ampang Utama Outlet"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              {/* Physical Address with Photon Autocomplete */}
              <div className="relative" ref={dropdownRef}>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 font-medium">
                    Address Lookup (Malaysia) *
                  </label>
                  <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5" /> Photon API
                  </span>
                </div>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  required
                  placeholder="Start typing street, city, or district in Malaysia..."
                  autoComplete="off"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />

                {isAddressDropdownOpen && addressSuggestions.length > 0 && (
                  <ul className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl max-h-48 overflow-y-auto z-50 shadow-2xl divide-y divide-slate-100 text-xs">
                    {addressSuggestions.map((sug, idx) => (
                      <li
                        key={idx}
                        onClick={() => {
                          setAddress(sug);
                          setIsAddressDropdownOpen(false);
                        }}
                        className="p-2.5 hover:bg-slate-50 cursor-pointer text-slate-700 hover:text-slate-900 transition flex items-center gap-2"
                      >
                        <MapPin className="w-3 h-3 text-indigo-600 shrink-0" />
                        <span className="truncate">{sug}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-slate-700 mb-1 font-medium">
                  Operating Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
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
                  <span>{isSaving ? 'Saving...' : 'Save Branch'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
