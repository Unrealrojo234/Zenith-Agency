import { useState, type FormEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import "react-phone-number-input/style.css";
import PocketBase from "pocketbase";
import Swal from "sweetalert2";

const pb = new PocketBase("https://zenithdb.fly.dev");

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {  loading, error, user } = useAuthStore();
  const navigate = useNavigate();
  function Alert(type: "success" | "error") {
    const purplePinkTheme = {
      success: {
        background: "#f3e8ff", // Light purple background
        color: "#7e22ce", // Deep purple text
        iconColor: "#9333ea", // Purple icon
        confirmButton: "#a855f7", // Medium purple button
      },
      error: {
        background: "#fdf2f8", // Light pink background
        color: "#be185d", // Deep pink text
        iconColor: "#ec4899", // Pink icon
        confirmButton: "#f472b6", // Medium pink button
      },
    };

    const theme = purplePinkTheme[type];

    if (type === "success") {
      Swal.fire({
        icon: "success",
        title: "Successfully Logged In",
        showConfirmButton: false,
        timer: 2500,
        background: theme.background,
        color: theme.color,
        iconColor: theme.iconColor,
        customClass: {
          popup: "rounded-2xl shadow-lg border border-opacity-20",
          title: "font-serif text-xl",
        },
      });
    } else if (type === "error") {
      Swal.fire({
        icon: "error",
        title: "Login Error",
        text: "Invalid username or password",
        showConfirmButton: true,
        confirmButtonColor: theme.confirmButton,
        background: theme.background,
        color: theme.color,
        iconColor: theme.iconColor,
        customClass: {
          popup: "rounded-2xl shadow-lg border border-opacity-20",
          title: "font-serif text-xl",
          confirmButton: "px-4 py-2 rounded-lg",
        },
      });
    }
  }
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    pb.authStore.clear();

    setFormError("")

    try {
      const authData = await pb
        .collection("users")
        .authWithPassword(username, password);

      if (authData.token) {
        setPassword("");
        setUsername("");
        Alert("success");
        navigate("/dashboard");
      } else {
        throw new Error("Authentication failed");
      }
    } catch (err) {
      setPassword("");
      setUsername("");
      Alert("error");
      setFormError("Invalid username or password");
      console.error("Login error:", err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] py-12">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full space-y-6 border border-gray-100"
      >
        <div className="flex flex-col items-center mb-2">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-2">
            <span className="text-white font-bold text-2xl">Z</span>
          </div>
          <h2 className="text-2xl font-bold text-blue-900">
            Sign in to Zenith Agency
          </h2>
          <p className="text-blue-700 mt-1 text-sm">
            Welcome back! Enter your credentials to continue.
          </p>
        </div>
        {(formError || error) && (
          <div className="text-red-500 text-center text-sm">
            {/* {formError || error} */}
          </div>
        )}
        <div>
          <label className="block mb-1 font-medium" htmlFor="phone">
            Username
          </label>
          <input
            className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition pr-10"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium" htmlFor="password">
            Password
            <span className="ml-1 inline-block align-middle cursor-pointer group relative">
              <svg
                className="w-4 h-4 text-blue-400 inline"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01"
                />
              </svg>
              <span className="absolute left-5 top-0 z-10 hidden group-hover:block bg-white border border-gray-200 text-xs text-gray-700 rounded px-2 py-1 shadow-lg w-48">
                Enter your account password.
              </span>
            </span>
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition pr-10"
              aria-describedby="passwordHelp"
            />
            <button
              type="button"
              tabIndex={-1}
              className="absolute right-2 top-2 text-gray-400"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.336-3.236.938-4.675M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              )}
            </button>
          </div>
          <div className="flex justify-end mt-1">
            <a href="#" className="text-blue-600 hover:underline text-sm">
              Forgot password?
            </a>
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-yellow-400 text-blue-900 py-2 rounded font-semibold hover:bg-yellow-300 transition-colors shadow"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Sign in"}
        </button>
        {/* <div className="flex items-center my-2">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="mx-2 text-gray-400 text-xs">or</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded py-2 font-semibold hover:bg-gray-50 transition"
          >
            <svg className="h-5 w-5" viewBox="0 0 48 48">
              <g>
                <circle fill="#fff" cx="24" cy="24" r="24" />
                <path
                  fill="#4285F4"
                  d="M35.3 24.2c0-.7-.1-1.4-.2-2H24v4.1h6.4c-.3 1.4-1.5 3.5-4.4 3.5-2.7 0-5-2.2-5-5s2.2-5 5-5c1.5 0 2.5.6 3.1 1.1l2.1-2.1C29.9 17.7 27.9 17 26 17c-5 0-9 4-9 9s4 9 9 9c5.2 0 8.7-3.7 8.7-8.7z"
                />
                <path
                  fill="#34A853"
                  d="M24 35c2.4 0 4.4-.8 5.9-2.1l-2.9-2.3c-.8.5-1.8.8-3 .8-2.3 0-4.2-1.6-4.9-3.7H12v2.3C13.6 32.9 18.4 35 24 35z"
                />
                <path
                  fill="#FBBC05"
                  d="M19.1 27.7c-.2-.5-.3-1-.3-1.7s.1-1.2.3-1.7v-2.3H12c-.5 1-1 2.1-1 3.3s.5 2.3 1 3.3l7.1-2.3z"
                />
                <path
                  fill="#EA4335"
                  d="M24 17c1.3 0 2.5.4 3.4 1.1l2.6-2.6C28.4 13.7 26.3 13 24 13c-5.6 0-10.4 2.1-13.1 5.7l7.1 2.3c.7-2.1 2.6-3.7 4.9-3.7z"
                />
              </g>
            </svg>
            Sign in with Google
          </button>
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded py-2 font-semibold hover:bg-gray-50 transition"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#1877F2"
                d="M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 6.006 4.438 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.797c0-3.007 1.792-4.668 4.533-4.668 1.312 0 2.686.235 2.686.235v2.953h-1.513c-1.491 0-1.953.926-1.953 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.562 22.954 24 18.006 24 12z"
              />
            </svg>
            Sign in with Facebook
          </button>
        </div> */}
        <div className="text-center text-sm">
          Don&apos;t have an account?{" "}
          <a href="/signup" className="text-blue-600 hover:underline">
            Sign up
          </a>
        </div>
      </form>
    </div>
  );
};

export default Login;
