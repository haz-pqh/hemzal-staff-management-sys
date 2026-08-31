import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getDatabase,
  ref,
  onValue,
  push,
  set,
  update,
  remove,
  get,
  query,
  orderByChild,
  equalTo,
  off,
  DatabaseReference,
} from 'firebase/database';
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import {
  Branch,
  Staff,
  AttendanceLog,
  LeaveRequest,
  SalesReport,
  PayslipRecord,
  PresenceItem,
  ActiveSession,
} from '../types';

export const firebaseConfig = {
  apiKey: "AIzaSyD8PVd9v61cAmKoe_RjB2Wc1AswASLIFWo",
  authDomain: "staffportal-f740f.firebaseapp.com",
  databaseURL: "https://staffportal-f740f-default-rtdb.firebaseio.com",
  projectId: "staffportal-f740f",
  storageBucket: "staffportal-f740f.firebasestorage.app",
  messagingSenderId: "739455943513",
  appId: "1:739455943513:web:84850f115af46cafcb8248",
  measurementId: "G-2BK6WZV8TC",
};

// Initialize Firebase safely
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export const ADMIN_EMAILS = [
  "hemzaladmin@gmail.com",
  "admin@company.com",
  "hassanhazril@gmail.com",
];

// Helper to test if user email is authorized admin
export function isUserAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.map((e) => e.toLowerCase().trim()).includes(email.toLowerCase().trim());
}

// Initial Sample Seed Data in case Firebase Realtime Database is completely empty
export const INITIAL_BRANCHES: Omit<Branch, 'key'>[] = [
  {
    code: 'BR-001',
    name: 'Ampang Utama Branch',
    address: 'No. 12, Jalan Ampang Utama 1/1, Taman Ampang Utama, 68000 Ampang, Selangor',
    status: 'ACTIVE',
    createdAt: Date.now() - 30 * 86400000,
  },
  {
    code: 'BR-002',
    name: 'Bangsar South Express',
    address: 'Unit G-05, The Sphere, No. 1, Avenue 1, Bangsar South, 59200 Kuala Lumpur',
    status: 'ACTIVE',
    createdAt: Date.now() - 20 * 86400000,
  },
  {
    code: 'BR-003',
    name: 'Subang Jaya SS15',
    address: 'No. 45, Jalan SS 15/4, 47500 Subang Jaya, Selangor',
    status: 'ACTIVE',
    createdAt: Date.now() - 10 * 86400000,
  },
];

export const INITIAL_STAFF: Omit<Staff, 'key'>[] = [
  {
    name: 'Ahmad Hafiz',
    email: 'hafiz@company.com',
    phone: '012-3456789',
    position: 'MANAGER',
    status: 'ACTIVE',
    branch: 'Ampang Utama Branch',
    createdAt: Date.now() - 25 * 86400000,
  },
  {
    name: 'Nurul Ain Binti Yusof',
    email: 'ain.yusof@company.com',
    phone: '017-8899221',
    position: 'SUPERVISOR',
    status: 'ACTIVE',
    branch: 'Bangsar South Express',
    createdAt: Date.now() - 20 * 86400000,
  },
  {
    name: 'Muhammad Farhan',
    email: 'farhan.kitchen@company.com',
    phone: '019-3322114',
    position: 'SENIOR_CREW',
    status: 'ACTIVE',
    branch: 'Ampang Utama Branch',
    createdAt: Date.now() - 15 * 86400000,
  },
  {
    name: 'Siti Sarah binti Zakaria',
    email: 'sarah.service@company.com',
    phone: '011-2345678',
    position: 'CREW',
    status: 'ACTIVE',
    branch: 'Subang Jaya SS15',
    createdAt: Date.now() - 10 * 86400000,
  },
  {
    name: 'Danial Haziq',
    email: 'danial.crew@company.com',
    phone: '013-9988776',
    position: 'CREW',
    status: 'ACTIVE',
    branch: 'Ampang Utama Branch',
    createdAt: Date.now() - 5 * 86400000,
  },
];
