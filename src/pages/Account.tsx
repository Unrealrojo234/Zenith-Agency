import * as React from 'react';
import PocketBase from 'pocketbase';

// Initialize PocketBase client
const pb = new PocketBase("https://zenithdb.fly.dev");

// Main Account component
function App() {
  // State to store user data
  const [user, setUser] = React.useState(null);
  // State to manage loading status
  const [loading, setLoading] = React.useState(true);
  // State to store any error messages
  const [error, setError] = React.useState(null);

  // useEffect hook to fetch user data when the component mounts
  // or when the PocketBase authStore model changes (e.g., after login)
  React.useEffect(() => {
    const fetchUser = async () => {
      setLoading(true); // Set loading to true before fetching
      setError(null);   // Clear previous errors

      try {
        // Check if a user is authenticated
        if (pb.authStore.isValid && pb.authStore.model) {
          const record = await pb.collection('users').getOne(pb.authStore.model.id, {
            // Expand related fields if necessary, as provided by the user
            // Make sure these relationships are correctly set up in your PocketBase instance
            expand: 'relField1,relField2.subRelField',
          });
          setUser(record); // Set the fetched user record to state
        } else {
          // If no user is authenticated, clear the user state
          setUser(null);
          // Optionally, you might want to redirect to a login page or show a message
          // console.log("No authenticated user found.");
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
        setError("Failed to load user data. Please try again."); // Set error message
        setUser(null); // Clear user data on error
      } finally {
        setLoading(false); // Set loading to false after fetching (or error)
      }
    };

    // Listen for changes in the authentication state
    // This ensures data is fetched/re-fetched when a user logs in/out
    const unsubscribe = pb.authStore.onChange(() => {
      fetchUser();
    }, true); // `true` makes it run immediately on mount

    // Initial fetch when the component mounts
    fetchUser();

    // Cleanup function: unsubscribe from authStore changes when the component unmounts
    return () => {
      unsubscribe();
    };
  }, []); // Empty dependency array means this effect runs once on mount and cleanup on unmount

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Account Info</h1>

        {loading && (
          <div className="text-center text-gray-600">Loading user data...</div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mb-4" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline ml-2">{error}</span>
          </div>
        )}

        {!loading && !user && !error && (
          <div className="text-center text-gray-600">No user data available. Please log in.</div>
        )}

        {!loading && user && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg">
              <span className="font-semibold text-blue-800">Username:</span>
              <span className="text-gray-700">{user.username}</span>
            </div>
            <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg">
              <span className="font-semibold text-blue-800">Email:</span>
              <span className="text-gray-700">{user.email}</span>
            </div>
            <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg">
              <span className="font-semibold text-blue-800">Phone:</span>
              <span className="text-gray-700">{user.phone || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg">
              <span className="font-semibold text-blue-800">Level:</span>
              <span className="text-gray-700">{user.level || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg">
              <span className="font-semibold text-blue-800">Investment:</span>
              <span className="text-gray-700">${user.investment?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg">
              <span className="font-semibold text-blue-800">Income:</span>
              <span className="text-gray-700">${user.income?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg">
              <span className="font-semibold text-blue-800">Balance:</span>
              <span className="text-gray-700">${user.balance?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg">
              <span className="font-semibold text-blue-800">Referrals:</span>
              <span className="text-gray-700">{user.referals || '0'}</span>
            </div>
            <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg">
              <span className="font-semibold text-blue-800">Tasks Done:</span>
              <span className="text-gray-700">{user.tasks_done || '0'}</span>
            </div>
            {/* You can add more fields here as needed */}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
