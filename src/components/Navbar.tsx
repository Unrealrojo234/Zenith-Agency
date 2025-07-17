import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import PocketBase from "pocketbase";
import {
  FaHome,
  FaTachometerAlt,
  FaTasks,
  FaMoneyBillWave,
  FaUser,
  FaLifeRing,
  FaSignOutAlt,
} from "react-icons/fa";

// Initialize PocketBase client outside the component
const pb = new PocketBase("https://zenithdb.fly.dev");

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(pb.authStore.isValid);

  const fetchUserData = useCallback(async () => {
    try {
      if (pb.authStore.isValid && pb.authStore.model) {
        const record = await pb
          .collection("users")
          .getOne(pb.authStore.model.id, {
            expand: "relField1,relField2.subRelField",
          });
        setUser(record);
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      setUser(null);
    }
  }, []);

  // Set up auth store listener
  useEffect(() => {
    const handleAuthChange = () => {
      setIsLoggedIn(pb.authStore.isValid);
      if (pb.authStore.isValid) {
        fetchUserData();
      } else {
        setUser(null);
      }
    };

    // Set initial state
    handleAuthChange();

    // Subscribe to future changes
    const unsubscribe = pb.authStore.onChange(handleAuthChange);

    return () => {
      unsubscribe();
    };
  }, [fetchUserData]);

  const navItems = [
    { name: "Dashboard", path: "/dashboard", public: false },
    { name: "Tasks", path: "/tasks", public: false },
    { name: "Profit", path: "/profit", public: false },
    { name: "Account", path: "/account", public: false },
    { name: "Support", path: "/support", public: true },
  ];

  const navIcons = {
    Home: <FaHome size={22} />,
    Dashboard: <FaTachometerAlt size={22} />,
    Tasks: <FaTasks size={22} />,
    Profit: <FaMoneyBillWave size={22} />,
    Account: <FaUser size={22} />,
    Support: <FaLifeRing size={22} />,
  };

  const logout = useCallback(async () => {
    try {
      pb.authStore.clear();
      navigate("/");
      // Soft refresh instead of full page reload
      window.location.href = window.location.href;
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [navigate]);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  return (
    <>
      <nav className="bg-gradient-to-r from-blue-600 to-purple-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center" onClick={closeMenu}>
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-bold text-lg">Z</span>
                </div>
                <span className="text-white text-xl font-bold">
                  Zenith Agency
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems
                .filter((item) => item.public || isLoggedIn)
                .map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location.pathname === item.path
                        ? "bg-white/20 text-white"
                        : "text-white/80 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              {!isLoggedIn ? (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/login"
                    className="text-white/80 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="bg-white text-blue-600 hover:bg-gray-100 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <span className="text-white font-semibold">
                    {user?.username || user?.name || "User"}
                  </span>
                  <button
                    onClick={logout}
                    className="bg-yellow-400 text-blue-900 px-4 py-2 rounded-md text-sm font-semibold hover:bg-yellow-300 transition-colors shadow"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={toggleMenu}
                className="text-white hover:text-white focus:outline-none"
                aria-label="Toggle menu"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {isMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-blue-700">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navItems
                .filter((item) => item.public || isLoggedIn)
                .map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      location.pathname === item.path
                        ? "bg-blue-800 text-white"
                        : "text-white hover:bg-blue-600"
                    }`}
                    onClick={closeMenu}
                  >
                    {item.name}
                  </Link>
                ))}
              {isLoggedIn ? (
                <button
                  onClick={() => {
                    logout();
                    closeMenu();
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white hover:bg-blue-600"
                >
                  Logout
                </button>
              ) : (
                <div className="flex space-x-4 px-3 py-2">
                  <Link
                    to="/login"
                    className="flex-1 text-center text-white hover:bg-blue-600 px-3 py-2 rounded-md text-base font-medium"
                    onClick={closeMenu}
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="flex-1 text-center bg-white text-blue-600 hover:bg-gray-100 px-3 py-2 rounded-md text-base font-medium"
                    onClick={closeMenu}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow md:hidden flex justify-around items-center h-16">
        {navItems
          .filter((item) => item.public || isLoggedIn)
          .map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full text-xs font-medium transition-colors ${
                location.pathname === item.path
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-blue-600"
              }`}
              onClick={closeMenu}
            >
              {navIcons[item.name]}
              <span className="mt-1">{item.name}</span>
            </Link>
          ))}
        {isLoggedIn && (
          <button
            onClick={logout}
            className="flex flex-col items-center justify-center flex-1 h-full text-xs font-medium text-gray-500 hover:text-red-600 transition-colors"
            style={{ background: "none", border: "none" }}
          >
            <FaSignOutAlt size={22} />
            <span className="mt-1">Logout</span>
          </button>
        )}
      </div>
    </>
  );
}

export default Navbar;