import * as React from 'react';
import PocketBase from 'pocketbase';
import { RefreshCw, LogOut, User, Mail, Phone, TrendingUp, DollarSign, Wallet, Users, CheckCircle, AlertCircle } from 'lucide-react';

// Initialize PocketBase client
const pb = new PocketBase("https://zenithdb.fly.dev");

function App() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [refreshing, setRefreshing] = React.useState(false);

  // Use a ref to store the AbortController for the primary fetch operation
  const abortControllerRef = React.useRef(null);

  const fetchUser = React.useCallback(async (isRefresh = false) => {
    // Abort any ongoing fetch request before starting a new one
    if (abortControllerRef.current) {
      abortControllerRef.current.abort('New fetch initiated');
    }

    const newAbortController = new AbortController();
    abortControllerRef.current = newAbortController;
    const signal = newAbortController.signal;

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      if (pb.authStore.isValid && pb.authStore.model) {
        const record = await pb.collection('users').getOne(pb.authStore.model.id, {
          expand: 'relField1,relField2.subRelField',
          signal: signal, // Pass the abort signal to PocketBase
        });
        setUser(record);
      } else {
        setUser(null);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        // This is an expected error when a request is deliberately canceled
        console.log('Fetch aborted:', err.message);
        return; // Don't treat as a general error or update state further
      }
      console.error("Failed to fetch user:", err);
      setError("Failed to load user data. Please ensure you are logged in and the server is accessible. Error: " + err.message);
      setUser(null);
    } finally {
      // Ensure current controller is nullified if this fetch completes successfully or with a non-abort error
      if (abortControllerRef.current === newAbortController) {
        abortControllerRef.current = null;
      }
      setLoading(false);
      setRefreshing(false);
    }
  }, []); // useCallback memoizes the function, preventing unnecessary re-renders

  const handleRefresh = () => {
    fetchUser(true);
  };

  const handleLogout = () => {
    pb.authStore.clear();
    setUser(null);
    setError(null);
    console.log("User logged out from PocketBase.");
  };

  React.useEffect(() => {
    // Initial fetch when the component mounts
    fetchUser();

    // Listen for changes in the authentication state
    // Set immediate to false because fetchUser() is called manually above
    const unsubscribe = pb.authStore.onChange(() => {
      fetchUser();
    }, false);

    return () => {
      unsubscribe();
      // Abort any ongoing fetch when the component unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort('Component unmounted');
      }
    };
  }, [fetchUser]); // Re-run effect if fetchUser changes (though useCallback prevents this usually)

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      console.error("Invalid date string:", dateString, e);
      return 'Invalid Date';
    }
  };

  const getInitials = (username) => {
    return username ? username.charAt(0).toUpperCase() : 'U';
  };

  const getLevelColor = (level) => {
    // Fix: Ensure level is a string before calling toLowerCase()
    const levelString = String(level || '').toLowerCase();
    switch (levelString) {
      case 'premium': return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'gold': return 'bg-gradient-to-r from-yellow-400 to-orange-500';
      case 'silver': return 'bg-gradient-to-r from-gray-400 to-gray-600';
      default: return 'bg-gradient-to-r from-blue-500 to-indigo-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
          <div className="animate-pulse">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
            </div>
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex justify-between items-center bg-gray-50 p-4 rounded-xl">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {user ? getInitials(user.username) : 'U'}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {user ? `Welcome, ${user.username}` : 'Account Dashboard'}
                </h1>
                <p className="text-gray-600">
                  {user ? `Member since ${formatDate(user.created)}` : 'Please log in to continue'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-600 hover:text-blue-600 transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              {user && (
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <strong className="font-semibold">Error!</strong>
              <span className="ml-2">{error}</span>
            </div>
          </div>
        )}

        {/* No User Message */}
        {!user && !error && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No User Data Available</h2>
            <p className="text-gray-600 mb-4">Please log in to view your account information.</p>
            {/* You might want to add a real login button/link here */}
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Sign In
            </button>
          </div>
        )}

        {/* User Information */}
        {user && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Personal Information
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-700">Username</span>
                  </div>
                  <span className="text-gray-900 font-semibold">{user.username}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-700">Email</span>
                  </div>
                  <span className="text-gray-900 font-semibold">{user.email}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-700">Phone</span>
                  </div>
                  <span className="text-gray-900 font-semibold">{user.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-700">Level</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${getLevelColor(user.level)}`}>
                    {user.level || 'Basic'}
                  </span>
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                Financial Overview
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-700">Investment</span>
                  </div>
                  <span className="text-green-900 font-bold text-lg">{formatCurrency(user.investment)}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-700">Income</span>
                  </div>
                  <span className="text-blue-900 font-bold text-lg">{formatCurrency(user.income)}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <Wallet className="w-4 h-4 text-purple-600" />
                    <span className="font-medium text-purple-700">Balance</span>
                  </div>
                  <span className="text-purple-900 font-bold text-lg">{formatCurrency(user.balance)}</span>
                </div>
              </div>
            </div>

            {/* Activity Information */}
            <div className="bg-white rounded-2xl shadow-xl p-6 lg:col-span-2">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-indigo-600" />
                Activity & Engagement
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span className="font-medium text-indigo-700">Referrals</span>
                  </div>
                  <span className="text-indigo-900 font-bold text-xl">{user.referals || 0}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-orange-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-4 h-4 text-orange-600" />
                    <span className="font-medium text-orange-700">Tasks Completed</span>
                  </div>
                  <span className="text-orange-900 font-bold text-xl">{user.tasks_done || 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Last updated: {user ? formatDate(user.updated) : 'N/A'}</p>
        </div>
      </div>
    </div>
  );
}

export default App;