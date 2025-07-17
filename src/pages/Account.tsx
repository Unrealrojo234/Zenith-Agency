import * as React from 'react';
import PocketBase from 'pocketbase';
import toast from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSignOutAlt, FaDownload, FaCheckCircle, FaEdit, FaSave } from 'react-icons/fa';
import { ImSpinner8 } from 'react-icons/im';

// Initialize PocketBase client
const pb = new PocketBase("https://zenithdb.fly.dev");

// Types
interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  level: number;
  investment: number;
  referralCount: number;
  stats: {
    referrals: number;
  };
  createdAt: string;
  lastLogin: string;
  passwordLastChanged: string;
}

interface LevelConfig {
  payPerTask: number;
  tasksPerDay: number;
}

const Account = () => {
  const navigate = useNavigate();
  
  // State management
  const [state, setState] = useState<{
    loading: boolean;
    error: string | null;
    retryCount: number;
    profile: UserProfile | null;
    levelConfig: LevelConfig | null;
  }>({
    loading: true,
    error: null,
    retryCount: 0,
    profile: null,
    levelConfig: null
  });

  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [tasksRemaining, setTasksRemaining] = useState(0);
  const [downloading, setDownloading] = useState(false);

  // Load profile data with retry logic
  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (!pb.authStore.model?.id) {
          throw new Error("Authentication required");
        }

        setState(prev => ({ ...prev, loading: true, error: null }));

        // Fetch user profile
        const profile = await pb.collection('users').getOne(pb.authStore.model.id);
        
        // Fetch level configuration (assuming you have a levels collection)
        const levelConfig = await pb.collection('levels').getOne(profile.level.toString());

        // Calculate tasks remaining (example logic)
        const todayTasks = await pb.collection('tasks')
          .getList(1, 1, {
            filter: `user = "${profile.id}" && created >= "${new Date().toISOString().split('T')[0]}"`
          });
        const remaining = levelConfig.tasksPerDay - todayTasks.totalItems;

        setState({
          loading: false,
          error: null,
          retryCount: 0,
          profile: profile as unknown as UserProfile,
          levelConfig: levelConfig as unknown as LevelConfig
        });
        setProfileForm({
          name: profile.name || '',
          email: profile.email || '',
          phone: profile.phone || ''
        });
        setTasksRemaining(remaining > 0 ? remaining : 0);
      } catch (error: any) {
        console.error('Profile load error:', error);
        
        // Automatic retry (max 3 times)
        if (state.retryCount < 3) {
          const retryDelay = [1000, 3000, 5000][state.retryCount];
          setTimeout(() => {
            setState(prev => ({ ...prev, retryCount: prev.retryCount + 1 }));
          }, retryDelay);
          return;
        }

        setState({
          loading: false,
          error: error.response?.data?.message || error.message || 'Failed to load profile data',
          retryCount: 0,
          profile: null,
          levelConfig: null
        });
      }
    };

    loadProfile();
  }, [state.retryCount]);

  // Derived data
  const accountCreated = state.profile?.createdAt ? new Date(state.profile.createdAt).toLocaleDateString() : 'N/A';
  const lastLogin = state.profile?.lastLogin ? new Date(state.profile.lastLogin).toLocaleDateString() : 'N/A';
  const passwordLastChanged = state.profile?.passwordLastChanged ? new Date(state.profile.passwordLastChanged).toLocaleDateString() : 'N/A';
  const referrals = state.profile?.referralCount || 0;
  const referralEarnings = state.profile?.stats?.referrals || 0;
  const profileFields = [state.profile?.name, state.profile?.email, state.profile?.phone];
  const profileComplete = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Generate download data
      const data = {
        profile: state.profile,
        levelConfig: state.levelConfig,
        tasksRemaining,
        downloadedAt: new Date().toISOString()
      };

      // Create download record in PocketBase
      await pb.collection('account_downloads').create({
        user: pb.authStore.model?.id,
        data: JSON.stringify(data)
      });

      // Simulate download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `account-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      
      toast.success('Account data downloaded successfully!');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download account data');
    } finally {
      setDownloading(false);
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!state.profile) throw new Error("No profile data available");

      // Update profile in PocketBase
      await pb.collection('users').update(state.profile.id, {
        name: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone
      });

      // Refresh profile data
      const updatedProfile = await pb.collection('users').getOne(state.profile.id);
      setState(prev => ({ ...prev, profile: updatedProfile as unknown as UserProfile }));

      toast.success('Profile updated successfully!');
      setEditMode(false);
    } catch (error: any) {
      console.error('Profile update failed:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!state.profile) throw new Error("No profile data available");
      if (passwords.new !== passwords.confirm) {
        throw new Error('New passwords do not match');
      }

      // Change password through PocketBase
      await pb.collection('users').update(state.profile.id, {
        oldPassword: passwords.current,
        password: passwords.new,
        passwordConfirm: passwords.confirm
      });

      // Update password change timestamp
      await pb.collection('users').update(state.profile.id, {
        passwordLastChanged: new Date().toISOString()
      });

      // Refresh profile data
      const updatedProfile = await pb.collection('users').getOne(state.profile.id);
      setState(prev => ({ ...prev, profile: updatedProfile as unknown as UserProfile }));

      setPasswords({ current: '', new: '', confirm: '' });
      toast.success('Password changed successfully!');
    } catch (error: any) {
      console.error('Password change failed:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to change password');
    }
  };

  const handleLogout = () => {
    pb.authStore.clear();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  // Loading state
  if (state.loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-lg w-full border border-gray-100">
          <div className="flex flex-col items-center justify-center space-y-6">
            <ImSpinner8 className="animate-spin text-blue-500 text-4xl" />
            <h2 className="text-xl font-semibold text-gray-700">Loading your account details...</h2>
            {state.retryCount > 0 && (
              <p className="text-sm text-gray-500">
                Attempt {state.retryCount + 1} of 3
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (state.error) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-lg w-full border border-gray-100">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-4">Error Loading Account</h2>
            <p className="text-gray-700 mb-6">{state.error}</p>
            <button
              onClick={() => setState(prev => ({ ...prev, retryCount: 0, loading: true, error: null }))}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Retry Loading
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] py-12">
      <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-lg w-full border border-gray-100">
        <h1 className="text-3xl font-bold mb-6 text-blue-900">My Account</h1>
        
        {/* Level/Investment Info */}
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="mb-2 font-semibold text-blue-900">
            Level {state.profile?.level} (Investment: KSh {state.profile?.investment?.toLocaleString() || '0'})
          </div>
          <div className="mb-2">
            Pay per Task: <span className="font-bold">KSh {state.levelConfig?.payPerTask?.toLocaleString() || '0'}</span>
          </div>
          <div className="mb-2">
            Tasks per Day: <span className="font-bold">{state.levelConfig?.tasksPerDay || '0'}</span>
          </div>
          <div className="mb-2">
            Tasks Remaining Today: <span className="font-bold">{tasksRemaining}</span>
          </div>
          <div className="mb-2">
            Referrals: <span className="font-bold">{referrals}</span> (Earnings: KSh {referralEarnings.toLocaleString()})
          </div>
          <div className="mb-2">
            Account Created: <span className="font-bold">{accountCreated}</span>
          </div>
          <div className="mb-2">
            Last Login: <span className="font-bold">{lastLogin}</span>
          </div>
          <div className="mb-2">
            Password Last Changed: <span className="font-bold">{passwordLastChanged}</span>
          </div>
          <div className="mb-2">Profile Completeness:</div>
          <div className="w-full h-3 bg-blue-100 rounded-full overflow-hidden mb-2">
            <div 
              className="h-3 bg-gradient-to-r from-blue-400 to-green-400 rounded-full" 
              style={{ width: `${profileComplete}%` }}
            ></div>
          </div>
          <div className="text-sm text-gray-700 mb-2">{profileComplete}% complete</div>
          <button 
            onClick={handleDownload} 
            disabled={downloading}
            className={`flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 transition-colors shadow text-sm ${
              downloading ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {downloading ? (
              <ImSpinner8 className="animate-spin" />
            ) : (
              <FaDownload />
            )}
            Download Account Data
          </button>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleProfileSave} className="mb-8 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-blue-900">Profile Information</h2>
            <button
              type="button"
              onClick={() => setEditMode(!editMode)}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              {editMode ? (
                <>
                  <FaSave /> Save
                </>
              ) : (
                <>
                  <FaEdit /> Edit
                </>
              )}
            </button>
          </div>
          
          <div>
            <label className="block font-medium mb-1">Name</label>
            <input
              name="name"
              value={profileForm.name}
              onChange={handleProfileChange}
              required
              disabled={!editMode}
              className={`w-full border px-3 py-2 rounded ${
                !editMode ? 'bg-gray-100' : 'bg-white'
              }`}
            />
          </div>
          
          <div>
            <label className="block font-medium mb-1">Email</label>
            <input
              name="email"
              type="email"
              value={profileForm.email}
              onChange={handleProfileChange}
              required
              disabled={!editMode}
              className={`w-full border px-3 py-2 rounded ${
                !editMode ? 'bg-gray-100' : 'bg-white'
              }`}
            />
          </div>
          
          <div>
            <label className="block font-medium mb-1">Phone Number</label>
            <input
              name="phone"
              type="tel"
              value={profileForm.phone}
              onChange={handleProfileChange}
              disabled={!editMode}
              className={`w-full border px-3 py-2 rounded ${
                !editMode ? 'bg-gray-100' : 'bg-white'
              }`}
            />
          </div>
          
          {editMode && (
            <button
              type="submit"
              className="w-full bg-yellow-400 text-blue-900 py-2 rounded font-semibold hover:bg-yellow-300 transition-colors shadow flex items-center justify-center gap-2"
            >
              <FaSave /> Save Changes
            </button>
          )}
        </form>

        {/* Password Change Form */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2 text-blue-900">Change Password</h2>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block font-medium mb-1">Current Password</label>
              <input
                name="current"
                type="password"
                value={passwords.current}
                onChange={handlePasswordChange}
                required
                className="w-full border px-3 py-2 rounded"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">New Password</label>
              <input
                name="new"
                type="password"
                value={passwords.new}
                onChange={handlePasswordChange}
                required
                minLength={8}
                className="w-full border px-3 py-2 rounded"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Confirm New Password</label>
              <input
                name="confirm"
                type="password"
                value={passwords.confirm}
                onChange={handlePasswordChange}
                required
                minLength={8}
                className="w-full border px-3 py-2 rounded"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-yellow-400 text-blue-900 py-2 rounded font-semibold hover:bg-yellow-300 transition-colors shadow flex items-center justify-center gap-2"
            >
              Change Password
            </button>
          </form>
        </div>

        {/* Logout Button */}
        <button
          className="w-full bg-red-500 text-white py-2 rounded font-semibold hover:bg-red-600 transition-colors shadow flex items-center justify-center gap-2 mt-2"
          onClick={handleLogout}
        >
          <FaSignOutAlt /> Logout
        </button>
      </div>
    </div>
  );
};

export default Account;