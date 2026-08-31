import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  auth,
  db,
  storage,
  googleProvider,
  isUserAdmin,
  ADMIN_EMAILS,
  INITIAL_BRANCHES,
  INITIAL_STAFF,
} from './services/firebase';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  ref,
  onValue,
  push,
  set,
  update,
  remove,
  get,
  off,
} from 'firebase/database';
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import {
  TabType,
  Branch,
  Staff,
  AttendanceLog,
  LeaveRequest,
  SalesReport,
  PayslipRecord,
  PresenceItem,
  ActiveSession,
  ToastMessage,
  LeaveStatus,
} from './types';
import { Navbar } from './components/Navbar';
import { NavigationTabs } from './components/NavigationTabs';
import { OverviewTab } from './components/OverviewTab';
import { BranchesTab } from './components/BranchesTab';
import { StaffTab } from './components/StaffTab';
import { AttendanceTab } from './components/AttendanceTab';
import { LeavesTab } from './components/LeavesTab';
import { SalesTab } from './components/SalesTab';
import { PayslipsTab } from './components/PayslipsTab';
import { Toast } from './components/Toast';
import { AttachmentModal } from './components/AttachmentModal';
import {
  ShieldCheck,
  UserCheck,
  Sparkles,
  ArrowRight,
  LogIn,
  KeyRound,
  Building,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Real-time Database Collections State
  const [branches, setBranches] = useState<Branch[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [salesReports, setSalesReports] = useState<SalesReport[]>([]);
  const [payslipRecords, setPayslipRecords] = useState<PayslipRecord[]>([]);
  const [presenceData, setPresenceData] = useState<Record<string, PresenceItem>>({});
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);

  // Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // File Attachment Modal
  const [attachmentModal, setAttachmentModal] = useState<{
    isOpen: boolean;
    title: string;
    src: string;
    contentType?: string;
  }>({
    isOpen: false,
    title: '',
    src: '',
  });

  const showToast = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // 1. Firebase Authentication Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Real-time Firebase Database Listeners
  useEffect(() => {
    if (!currentUser) {
      // Clear data on logout
      setBranches([]);
      setStaffList([]);
      setAttendanceLogs([]);
      setLeaveRequests([]);
      setSalesReports([]);
      setPayslipRecords([]);
      setPresenceData({});
      setActiveSession(null);
      return;
    }

    const branchesRef = ref(db, 'branches');
    const staffRef = ref(db, 'staff');
    const attendanceRef = ref(db, 'attendance_logs');
    const leavesRef = ref(db, 'leave_requests');
    const salesRef = ref(db, 'sales_updates');
    const payslipsRef = ref(db, 'payslips');
    const presenceRef = ref(db, 'presence');
    const activeSessionRef = ref(db, 'active_session');

    // Branches Listener
    const unsubBranches = onValue(branchesRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        const list: Branch[] = Object.keys(val).map((key) => ({
          key,
          ...val[key],
        }));
        setBranches(list);
      } else {
        // Populate initial branches if database is completely empty
        INITIAL_BRANCHES.forEach((initB) => {
          push(branchesRef, initB);
        });
      }
    });

    // Staff Listener
    const unsubStaff = onValue(staffRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        const list: Staff[] = Object.keys(val)
          .map((key) => ({ key, ...val[key] }))
          .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setStaffList(list);
      } else {
        // Populate initial staff if empty
        INITIAL_STAFF.forEach((initS) => {
          push(staffRef, initS);
        });
      }
    });

    // Attendance Logs Listener
    const unsubAttendance = onValue(attendanceRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        const list: AttendanceLog[] = Object.keys(val)
          .map((key) => ({ key, ...val[key] }))
          .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setAttendanceLogs(list);
      } else {
        setAttendanceLogs([]);
      }
    });

    // Leave Requests Listener
    const unsubLeaves = onValue(leavesRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        const list: LeaveRequest[] = Object.keys(val)
          .map((key) => ({ key, ...val[key] }))
          .sort((a, b) => (b.appliedAt || 0) - (a.appliedAt || 0));
        setLeaveRequests(list);
      } else {
        setLeaveRequests([]);
      }
    });

    // Sales Updates Listener
    const unsubSales = onValue(salesRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        const list: SalesReport[] = Object.keys(val)
          .map((key) => ({ key, ...val[key] }))
          .sort((a, b) => (b.createdAt || b.updatedAt || 0) - (a.createdAt || a.updatedAt || 0));
        setSalesReports(list);
      } else {
        setSalesReports([]);
      }
    });

    // Payslips Listener
    const unsubPayslips = onValue(payslipsRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        const list: PayslipRecord[] = Object.keys(val)
          .map((key) => ({ key, ...val[key] }))
          .sort((a, b) => (b.uploadedAt || 0) - (a.uploadedAt || 0));
        setPayslipRecords(list);
      } else {
        setPayslipRecords([]);
      }
    });

    // Presence Listener
    const unsubPresence = onValue(presenceRef, (snapshot) => {
      setPresenceData(snapshot.val() || {});
    });

    // Active Session Listener
    const unsubActiveSession = onValue(activeSessionRef, (snapshot) => {
      setActiveSession(snapshot.val());
    });

    return () => {
      off(branchesRef);
      off(staffRef);
      off(attendanceRef);
      off(leavesRef);
      off(salesRef);
      off(payslipsRef);
      off(presenceRef);
      off(activeSessionRef);
    };
  }, [currentUser]);

  // 3. Auto-Absent Cutoff Check (Runs at 11:00 AM)
  const isRunningAutoAbsentRef = useRef(false);
  const runAutoAbsentCheck = useCallback(async () => {
    const now = new Date();
    if (now.getHours() < 11) return; // 11:00 AM cutoff
    if (isRunningAutoAbsentRef.current || !currentUser || staffList.length === 0) return;

    isRunningAutoAbsentRef.current = true;
    try {
      const todayStr = now.toISOString().split('T')[0];
      const attendanceRef = ref(db, 'attendance_logs');
      const snap = await get(attendanceRef);
      const logs = snap.val() || {};

      const alreadyLoggedEmails = new Set<string>();
      Object.values(logs).forEach((item: any) => {
        if (item.date === todayStr && item.userEmail) {
          alreadyLoggedEmails.add(item.userEmail.toLowerCase().trim());
        }
      });

      // Exclude staff on approved leave covering today
      const onApprovedLeaveToday = new Set<string>();
      leaveRequests.forEach((req) => {
        if (
          req.status === 'APPROVED' &&
          req.userEmail &&
          req.startDate &&
          req.endDate &&
          todayStr >= req.startDate &&
          todayStr <= req.endDate
        ) {
          onApprovedLeaveToday.add(req.userEmail.toLowerCase().trim());
        }
      });

      const pushPromises: Promise<any>[] = [];
      staffList.forEach((staff) => {
        const email = (staff.email || '').toLowerCase().trim();
        if (!email) return;

        if (alreadyLoggedEmails.has(email) || onApprovedLeaveToday.has(email)) return;

        const absentRecord: Omit<AttendanceLog, 'key'> = {
          empName: staff.name,
          userEmail: staff.email,
          date: todayStr,
          punctualityStatus: 'ABSENT',
          clockIn: '--',
          clockOut: '--',
          durationText: 'No Clock-In Record',
          remarks: 'Auto-marked absent: no clock-in registered by 11:00 AM cutoff.',
          statusColor: 'red',
          autoGenerated: true,
          createdByAdmin: false,
          timestamp: Date.now(),
        };

        alreadyLoggedEmails.add(email);
        const newRef = push(attendanceRef);
        pushPromises.push(set(newRef, absentRecord));
      });

      if (pushPromises.length > 0) {
        await Promise.all(pushPromises);
        showToast(
          `${pushPromises.length} staff member(s) auto-marked ABSENT (11:00 AM cutoff reached).`,
          'info'
        );
      }
    } catch (err) {
      console.error('Auto-absent check error:', err);
    } finally {
      isRunningAutoAbsentRef.current = false;
    }
  }, [currentUser, staffList, leaveRequests, showToast]);

  useEffect(() => {
    if (!currentUser) return;
    runAutoAbsentCheck();
    const interval = setInterval(runAutoAbsentCheck, 5 * 60 * 1000); // Check every 5 mins
    return () => clearInterval(interval);
  }, [currentUser, runAutoAbsentCheck]);

  // Handle Login / Sign-In Actions
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const email = user.email || '';

      if (!isUserAdmin(email)) {
        showToast(
          `Logged in as ${email}. You have full preview & management capabilities.`,
          'success'
        );
      } else {
        showToast(`Admin session verified for ${email}.`, 'success');
      }
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      showToast(err.message || 'Failed to sign in with Google.', 'error');
    }
  };

  const handleAdminDemoLogin = () => {
    // Allows immediate evaluation of the full dashboard
    const demoUser = {
      uid: 'admin_demo_id',
      email: 'hemzaladmin@gmail.com',
      displayName: 'System Administrator',
      photoURL: '',
    } as User;
    setCurrentUser(demoUser);
    showToast('Entered as Administrator (hemzaladmin@gmail.com).', 'success');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (_) {
      // Ignored
    }
    setCurrentUser(null);
    showToast('Signed out of administrative portal.', 'info');
  };

  // Branch CRUD Handlers
  const handleSaveBranch = async (branchData: Partial<Branch>, key?: string) => {
    const branchesRef = ref(db, 'branches');
    if (key) {
      await update(ref(db, `branches/${key}`), {
        ...branchData,
        updatedAt: Date.now(),
      });
    } else {
      await push(branchesRef, {
        ...branchData,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  };

  const handleDeleteBranch = async (key: string) => {
    await remove(ref(db, `branches/${key}`));
    showToast('Branch removed from directory.', 'success');
  };

  // Staff CRUD Handlers
  const handleSaveStaff = async (staffData: Partial<Staff>, key?: string) => {
    const staffRef = ref(db, 'staff');
    if (key) {
      await update(ref(db, `staff/${key}`), {
        ...staffData,
        updatedAt: Date.now(),
      });
    } else {
      await push(staffRef, {
        ...staffData,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  };

  const handleDeleteStaff = async (key: string) => {
    await remove(ref(db, `staff/${key}`));
    showToast('Staff profile removed.', 'success');
  };

  const handleMergeDuplicateStaff = async () => {
    const groups = new Map<string, Staff[]>();
    staffList.forEach((s) => {
      const email = (s.email || '').toLowerCase().trim();
      if (!email) return;
      if (!groups.has(email)) groups.set(email, []);
      groups.get(email)!.push(s);
    });

    const duplicateGroups = Array.from(groups.values()).filter((g) => g.length > 1);
    if (duplicateGroups.length === 0) {
      showToast('No duplicate staff records found.', 'info');
      return;
    }

    const totalDups = duplicateGroups.reduce((acc, g) => acc + (g.length - 1), 0);
    if (
      !confirm(
        `Found ${totalDups} duplicate staff record(s) across ${duplicateGroups.length} unique email(s). Merge now? The most complete record for each email will be retained.`
      )
    ) {
      return;
    }

    const scoreRecord = (s: Staff) => {
      let score = 0;
      if (s.source !== 'presence') score += 4;
      if (s.phone) score += 2;
      if (s.branch) score += 2;
      if (s.position && s.position !== 'CREW') score += 1;
      return score;
    };

    let removedCount = 0;
    for (const group of duplicateGroups) {
      const sorted = [...group].sort((a, b) => {
        const diff = scoreRecord(b) - scoreRecord(a);
        if (diff !== 0) return diff;
        return (a.createdAt || 0) - (b.createdAt || 0);
      });
      const [, ...duplicates] = sorted;
      for (const dup of duplicates) {
        await remove(ref(db, `staff/${dup.key}`));
        removedCount++;
      }
    }
    showToast(`Merged and removed ${removedCount} duplicate record(s).`, 'success');
  };

  // Helper to convert File to Base64
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const res = reader.result as string;
        const commaIdx = res.indexOf(',');
        resolve(commaIdx >= 0 ? res.slice(commaIdx + 1) : res);
      };
      reader.onerror = () => reject(new Error('Failed to read file.'));
      reader.readAsDataURL(file);
    });
  };

  // Attendance Handlers
  const handleSaveManualAttendance = async (
    logData: Partial<AttendanceLog>,
    file?: File | null
  ) => {
    let fileBase64: string | undefined;
    let fileName: string | undefined;
    let contentType: string | undefined;

    if (file) {
      fileBase64 = await readFileAsBase64(file);
      fileName = file.name;
      contentType = file.type;
    }

    const payload = {
      ...logData,
      hasAttachment: !!file,
      attachmentBase64: fileBase64 ? `data:${contentType};base64,${fileBase64}` : undefined,
      attachmentFileName: fileName,
      attachmentContentType: contentType,
      timestamp: Date.now(),
    };

    await push(ref(db, 'attendance_logs'), payload);
  };

  const handleUpdateAttendanceLog = async (key: string, updates: Partial<AttendanceLog>) => {
    await update(ref(db, `attendance_logs/${key}`), updates);
  };

  const handleDeleteAttendanceLog = async (key: string) => {
    await remove(ref(db, `attendance_logs/${key}`));
    showToast('Attendance log removed.', 'success');
  };

  // Leaves Handlers
  const handleUpdateLeaveStatus = async (key: string, status: LeaveStatus) => {
    await update(ref(db, `leave_requests/${key}`), {
      status,
      updatedByAdminAt: Date.now(),
    });
    showToast(`Leave application status updated to ${status}.`, 'success');
  };

  const handleEditLeaveRequest = async (key: string, updates: Partial<LeaveRequest>) => {
    await update(ref(db, `leave_requests/${key}`), updates);
  };

  const handleDeleteLeaveRequest = async (key: string) => {
    await remove(ref(db, `leave_requests/${key}`));
    showToast('Leave request deleted.', 'success');
  };

  // Sales Handlers
  const handleSaveSalesReport = async (reportData: Partial<SalesReport>, key?: string) => {
    if (key) {
      await update(ref(db, `sales_updates/${key}`), reportData);
    } else {
      await push(ref(db, 'sales_updates'), {
        ...reportData,
        createdAt: Date.now(),
      });
    }
  };

  // Payslip Handlers
  const handleSavePayslip = async (
    payslipData: Omit<PayslipRecord, 'key'>,
    file?: File | null
  ) => {
    // Build payload starting from the required fields only. Firebase Realtime
    // Database throws a runtime error if any field in the write payload is
    // `undefined`, so optional fields are only added when they actually have
    // a value (e.g. when no attachment file was selected).
    const payload: Record<string, unknown> = { ...payslipData };

    if (file) {
      payload.fileData = await readFileAsBase64(file);
      payload.fileName = file.name;
      payload.contentType = file.type;
    }

    const duplicate = payslipRecords.find(
      (r) =>
        r.staffEmail.toLowerCase() === payslipData.staffEmail.toLowerCase() &&
        r.period === payslipData.period
    );

    if (duplicate) {
      if (!confirm('A payslip for this staff and pay period already exists. Overwrite?')) {
        // Surface the cancellation to the caller instead of silently
        // resolving, which previously caused a false "saved successfully"
        // toast even though nothing was written.
        const cancelled = new Error('Save cancelled.');
        cancelled.name = 'PayslipSaveCancelled';
        throw cancelled;
      }
      await update(ref(db, `payslips/${duplicate.key}`), payload);
    } else {
      await push(ref(db, 'payslips'), payload);
    }
  };

  const handleDeletePayslip = async (key: string) => {
    await remove(ref(db, `payslips/${key}`));
    showToast('Payslip record removed.', 'success');
  };

  const openAttachmentViewer = (title: string, src: string, contentType?: string) => {
    setAttachmentModal({
      isOpen: true,
      title,
      src,
      contentType,
    });
  };

  const pendingLeavesCount = leaveRequests.filter((l) => l.status === 'PENDING').length;

  // ==================== AUTH / LOGIN SCREEN ====================
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="font-medium text-slate-600">Connecting to Administrative Gateway...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/70 via-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Toast toasts={toasts} onDismiss={dismissToast} />

        <div className="w-full max-w-md bg-white border border-slate-200/90 p-8 sm:p-10 rounded-3xl shadow-xl relative text-center">
          {/* Badge Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-3xl mb-5 shadow-2xs">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Admin Management Portal
          </h1>
          <p className="text-xs text-slate-500 mt-2 mb-8 leading-relaxed">
            Enterprise backend for staff attendance, branches, SME Malaysia payroll, and daily sales & inventory analytics.
          </p>

          <div className="space-y-3">
            {/* Google Sign In */}
            <button
              onClick={handleGoogleLogin}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl shadow-sm shadow-indigo-600/30 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-3 text-sm cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In with Admin Account</span>
            </button>

            {/* Direct Admin Demo Bypass */}
            <button
              onClick={handleAdminDemoLogin}
              className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 font-medium rounded-2xl border border-slate-300 transition flex items-center justify-center gap-2 text-xs shadow-2xs cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
              <span>Continue with Administrator Profile</span>
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
            <Lock className="w-3.5 h-3.5" />
            <span>End-to-End Realtime Database Synchronization</span>
          </div>
        </div>
      </div>
    );
  }

  // ==================== MAIN ADMIN PORTAL ====================
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Centralized Toast Stack */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Top Navigation Bar */}
      <Navbar
        adminEmail={currentUser.email || 'Administrator'}
        isOnline={true}
        onLogout={handleLogout}
        branchCount={branches.filter((b) => b.status === 'ACTIVE').length}
      />

      {/* Horizontal Nav Tabs */}
      <NavigationTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pendingLeavesCount={pendingLeavesCount}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <OverviewTab
                presenceData={presenceData}
                activeSession={activeSession}
                attendanceLogs={attendanceLogs}
                leaveRequests={leaveRequests}
                branches={branches}
                staffList={staffList}
                onNavigateTab={setActiveTab}
              />
            </motion.div>
          )}

          {activeTab === 'branches' && (
            <motion.div
              key="branches"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <BranchesTab
                branches={branches}
                onSaveBranch={handleSaveBranch}
                onDeleteBranch={handleDeleteBranch}
                showToast={showToast}
              />
            </motion.div>
          )}

          {activeTab === 'staff' && (
            <motion.div
              key="staff"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <StaffTab
                staffList={staffList}
                branches={branches}
                onSaveStaff={handleSaveStaff}
                onDeleteStaff={handleDeleteStaff}
                onMergeDuplicates={handleMergeDuplicateStaff}
                showToast={showToast}
              />
            </motion.div>
          )}

          {activeTab === 'attendance' && (
            <motion.div
              key="attendance"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <AttendanceTab
                attendanceLogs={attendanceLogs}
                staffList={staffList}
                onSaveManualAttendance={handleSaveManualAttendance}
                onUpdateAttendanceLog={handleUpdateAttendanceLog}
                onDeleteAttendanceLog={handleDeleteAttendanceLog}
                onViewAttachment={openAttachmentViewer}
                showToast={showToast}
              />
            </motion.div>
          )}

          {activeTab === 'leaves' && (
            <motion.div
              key="leaves"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <LeavesTab
                leaveRequests={leaveRequests}
                staffList={staffList}
                onUpdateLeaveStatus={handleUpdateLeaveStatus}
                onEditLeaveRequest={handleEditLeaveRequest}
                onDeleteLeaveRequest={handleDeleteLeaveRequest}
                onViewAttachment={openAttachmentViewer}
                showToast={showToast}
              />
            </motion.div>
          )}

          {activeTab === 'sales' && (
            <motion.div
              key="sales"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <SalesTab
                salesReports={salesReports}
                branches={branches}
                currentAdminEmail={currentUser.email || ''}
                onSaveSalesReport={handleSaveSalesReport}
                showToast={showToast}
              />
            </motion.div>
          )}

          {activeTab === 'payslips' && (
            <motion.div
              key="payslips"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <PayslipsTab
                staffList={staffList}
                attendanceLogs={attendanceLogs}
                payslipRecords={payslipRecords}
                currentAdminEmail={currentUser.email || ''}
                onSavePayslip={handleSavePayslip}
                onDeletePayslip={handleDeletePayslip}
                onViewAttachment={openAttachmentViewer}
                showToast={showToast}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Global Attachment Previewer Modal */}
      <AttachmentModal
        isOpen={attachmentModal.isOpen}
        title={attachmentModal.title}
        src={attachmentModal.src}
        contentType={attachmentModal.contentType}
        onClose={() => setAttachmentModal({ isOpen: false, title: '', src: '' })}
      />
    </div>
  );
}
