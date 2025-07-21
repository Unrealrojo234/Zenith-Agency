import * as React from "react";
import PocketBase from "pocketbase";
import toast, { Toaster } from "react-hot-toast"; // Import Toaster and toast
import {
  RefreshCw,
  LogOut,
  User,
  Mail,
  Phone,
  TrendingUp,
  DollarSign,
  Wallet,
  Users,
  CheckCircle,
  AlertCircle,
  Edit,
  Save,
  X,
  Trash2,
} from "lucide-react";

// Initialize PocketBase client
const pb = new PocketBase("https://zenithdb.fly.dev");

function App() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [refreshing, setRefreshing] = React.useState(false);

  // States for editing profile
  const [isEditing, setIsEditing] = React.useState(false);
  const [editUsername, setEditUsername] = React.useState("");
  const [editEmail, setEditEmail] = React.useState("");
  const [editPhone, setEditPhone] = React.useState("");
  const [updating, setUpdating] = React.useState(false);
  const [updateError, setUpdateError] = React.useState(null);

  // States for deleting account
  const [deleting, setDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState(null);

  // Use a ref to store the AbortController for the primary fetch operation
  const abortControllerRef = React.useRef(null);

  const fetchUser = React.useCallback(async (isRefresh = false) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort("New fetch initiated");
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
        const record = await pb
          .collection("users")
          .getOne(pb.authStore.model.id, {
            expand: "relField1,relField2.subRelField",
            signal: signal,
          });
        setUser(record);
        // Initialize edit states when user data is fetched
        setEditUsername(record.username || "");
        setEditEmail(record.mail || "");
        setEditPhone(record.phone || "");
      } else {
        setUser(null);
      }
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("Fetch aborted:", err.message);
        return;
      }
      console.error("Failed to fetch user:", err);
      // setError("Failed to load user data. Please ensure you are logged in and the server is accessible. Error: " + err.message);
      setUser(null);
    } finally {
      if (abortControllerRef.current === newAbortController) {
        abortControllerRef.current = null;
      }
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleRefresh = () => {
    fetchUser(true);
  };

  const handleLogout = () => {
    pb.authStore.clear();
    setUser(null);
    setError(null);
    toast.success("Logged out successfully!");
    console.log("User logged out from PocketBase.");
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setUpdateError(null);
    try {
      const updatedData = {
        username: editUsername,
        mail: editEmail,
        phone: editPhone || null, // PocketBase might expect null for empty numbers
      };
      // Only send fields that have actually changed
      const changes = {};
      if (updatedData.username !== user.username)
        changes.username = updatedData.username;
      if (updatedData.mail !== user.mail) changes.mail = updatedData.mail;
      if (updatedData.phone !== user.phone) changes.phone = updatedData.phone;

      if (Object.keys(changes).length === 0) {
        toast("No changes to save!", { icon: "ℹ️" });
        setIsEditing(false);
        return;
      }

      const updatedRecord = await pb
        .collection("users")
        .update(pb.authStore.model.id, changes);
      setUser(updatedRecord);
      setIsEditing(false); // Exit edit mode
      toast.success("Profile updated successfully! 🎉");
    } catch (err) {
      console.error("Failed to update user:", err);
      setUpdateError(
        "Failed to update profile. " + (err.message || "Please try again.")
      );
      toast.error("Failed to update profile.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    ) {
      return; // User canceled deletion
    }

    setDeleting(true);
    setDeleteError(null);
    try {
      await pb.collection("users").delete(pb.authStore.model.id);
      pb.authStore.clear(); // Log out after successful deletion
      setUser(null);
      toast.success("Account deleted successfully! 👋");
      console.log("Account deleted from PocketBase.");
    } catch (err) {
      console.error("Failed to delete account:", err);
      setDeleteError(
        "Failed to delete account. " + (err.message || "Please try again.")
      );
      toast.error("Failed to delete account.");
    } finally {
      setDeleting(false);
    }
  };

  React.useEffect(() => {
    fetchUser();
    const unsubscribe = pb.authStore.onChange(() => {
      fetchUser();
    }, false);
    return () => {
      unsubscribe();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort("Component unmounted");
      }
    };
  }, [fetchUser]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      console.error("Invalid date string:", dateString, e);
      return "Invalid Date";
    }
  };

  const getInitials = (username) => {
    return username ? username.charAt(0).toUpperCase() : "U";
  };

  const getLevelColor = (level) => {
    const levelString = String(level || "").toLowerCase();
    switch (levelString) {
      case "premium":
        return "bg-gradient-to-r from-purple-500 to-pink-500";
      case "gold":
        return "bg-gradient-to-r from-yellow-400 to-orange-500";
      case "silver":
        return "bg-gradient-to-r from-gray-400 to-gray-600";
      default:
        return "bg-gradient-to-r from-blue-500 to-indigo-600";
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
                <div
                  key={i}
                  className="flex justify-between items-center bg-gray-50 p-4 rounded-xl"
                >
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
      <Toaster position="bottom-right" reverseOrder={false} />{" "}
      {/* Toaster for notifications */}
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {user ? getInitials(user.username) : "U"}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {user ? `Welcome, ${user.username}` : "Account Dashboard"}
                </h1>
                <p className="text-gray-600">
                  {user
                    ? `Member since ${formatDate(user.created)}`
                    : "Please log in to continue"}
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
                <RefreshCw
                  className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
                />
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

        {/* Update Error Message */}
        {updateError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <strong className="font-semibold">Update Error!</strong>
              <span className="ml-2">{updateError}</span>
            </div>
          </div>
        )}

        {/* Delete Error Message */}
        {deleteError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <strong className="font-semibold">Deletion Error!</strong>
              <span className="ml-2">{deleteError}</span>
            </div>
          </div>
        )}

        {/* No User Message */}
        {!user && !error && (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
              <div className="animate-pulse">
                <div className="flex items-center justify-center mb-6">
                  <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                </div>
                <div className="space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center bg-gray-50 p-4 rounded-xl"
                    >
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Information and Edit Form */}
        {user && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information / Edit Form */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-600" />
                  Personal Information
                </h2>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 text-blue-600 hover:text-blue-800 transition-colors flex items-center space-x-1"
                    title="Edit Profile"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="text-sm font-medium hidden sm:inline">
                      Edit
                    </span>
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleUpdateProfile}
                      disabled={updating}
                      className="p-2 text-green-600 hover:text-green-800 transition-colors flex items-center space-x-1 disabled:opacity-50"
                      title="Save Changes"
                    >
                      <Save className="w-4 h-4" />
                      <span className="text-sm font-medium hidden sm:inline">
                        {updating ? "Saving..." : "Save"}
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        // Reset edit states to current user data if canceled
                        setEditUsername(user.username || "");
                        setEditEmail(user.mail || "");
                        setEditPhone(user.phone || "");
                        setUpdateError(null);
                      }}
                      className="p-2 text-red-600 hover:text-red-800 transition-colors flex items-center space-x-1"
                      title="Cancel Edit"
                    >
                      <X className="w-4 h-4" />
                      <span className="text-sm font-medium hidden sm:inline">
                        Cancel
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label
                      htmlFor="username"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Username
                    </label>
                    <input
                      type="text"
                      id="username"
                      value={editEmail}
                      onChange={(e) => setEditUsername(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Your username"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Phone
                    </label>
                    <input
                      type="tel" // Use tel for phone number input
                      id="phone"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="+1234567890"
                    />
                  </div>
                  {/* Save and Cancel buttons moved to header but can be kept here too */}
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-700">
                        Username
                      </span>
                    </div>
                    <span className="text-gray-900 font-semibold">
                      {user.username}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-700">Email</span>
                    </div>
                    <span className="text-gray-900 font-semibold">
                      {user.email}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-700">Phone</span>
                    </div>
                    <span className="text-gray-900 font-semibold">
                      {user.phone || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-700">Level</span>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${getLevelColor(
                        user.level
                      )}`}
                    >
                      {user.level || "Basic"}
                    </span>
                  </div>
                </div>
              )}
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
                    <span className="font-medium text-green-700">
                      Investment
                    </span>
                  </div>
                  <span className="text-green-900 font-bold text-lg">
                    {formatCurrency(user.investment)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-700">Income</span>
                  </div>
                  <span className="text-blue-900 font-bold text-lg">
                    {formatCurrency(user.income)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <Wallet className="w-4 h-4 text-purple-600" />
                    <span className="font-medium text-purple-700">Balance</span>
                  </div>
                  <span className="text-purple-900 font-bold text-lg">
                    {formatCurrency(user.balance)}
                  </span>
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
                    <span className="font-medium text-indigo-700">
                      Referrals
                    </span>
                  </div>
                  <span className="text-indigo-900 font-bold text-xl">
                    {user.referals || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-orange-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-4 h-4 text-orange-600" />
                    <span className="font-medium text-orange-700">
                      Tasks Completed
                    </span>
                  </div>
                  <span className="text-orange-900 font-bold text-xl">
                    {user.tasks_done || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Delete Account Section */}
            <div className="bg-red-50 rounded-2xl shadow-xl p-6 lg:col-span-2">
              <h2 className="text-xl font-semibold text-red-800 mb-4 flex items-center">
                <Trash2 className="w-5 h-5 mr-2 text-red-600" />
                Danger Zone
              </h2>
              <p className="text-red-700 mb-4">
                Permanently delete your account and all associated data. This
                action is irreversible.
              </p>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold flex items-center space-x-2 disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    <span>Delete My Account</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Last updated: {user ? formatDate(user.updated) : "N/A"}</p>
        </div>
      </div>
    </div>
  );
}

export default App;
