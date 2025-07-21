import * as React from "react";
import toast from "react-hot-toast";
import { useEffect, useState, useCallback } from "react";
import PocketBase from "pocketbase";

// Types
interface User {
  id: string;
  username: string;
  phone: string;
  tasks_done: number;
  income: number;
  referals: number;
  balance: number;
  level: number;
  email?: string;
}

interface FormData {
  mpesaNumber: string;
  withdrawAmount: string;
  fullName: string;
  rememberDetails: boolean;
}

interface Errors {
  mpesaNumber: string;
  withdrawAmount: string;
  fullName: string;
}

interface Earnings {
  referals: number;
  tasks: number;
  total: number;
}

// Constants
const MIN_WITHDRAWAL = 1000;
const MPESA_REGEX = /^(\+?254|0)[17]\d{8}$/;

// Initialize PocketBase client
const pb = new PocketBase("https://zenithdb.fly.dev");

const Profit = () => {
  const [user, setUser] = useState<User | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    mpesaNumber: "",
    withdrawAmount: "",
    fullName: "",
    rememberDetails: false,
  });
  const [errors, setErrors] = useState<Errors>({
    mpesaNumber: "",
    withdrawAmount: "",
    fullName: "",
  });

  // Load saved form data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem("withdrawalFormData");
    if (savedData) {
      setFormData(JSON.parse(savedData));
    }
  }, []);

  // Calculate earnings
  const calculateEarnings = useCallback((): Earnings => {
    if (!user)
      return {
        referals: 0,
        tasks: 0,
        total: 0,
      };

    const taskEarnings = user.income || 0;
    const referralEarnings = user.referals || 0;

    return {
      referals: referralEarnings,
      tasks: taskEarnings - referralEarnings,
      total: taskEarnings,
    };
  }, [user]);

  const earnings = calculateEarnings();
  const lifetimeEarnings = user?.income || 0;
  const availableBalance = user?.balance || 0;

  const fetchUserData = useCallback(async () => {
    try {
      if (!pb.authStore.model?.id) {
        throw new Error("User not authenticated");
      }

      const record = await pb
        .collection("users")
        .getOne(pb.authStore.model.id, {
          
        });

      setUser(record);

      // Initialize form with user data
      setFormData((prev) => ({
        ...prev,
        fullName: record.username || "",
        mpesaNumber: record.phone || "",
      }));

      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      if (!user) {
        // toast.error("Failed to load user data. Please refresh the page.");

        setUser(null);
        setLoading(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type } = e.target;
    const checked =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;

    setFormData((prev) => ({
      ...prev,
      [id]: type === "checkbox" ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[id as keyof Errors]) {
      setErrors((prev) => ({
        ...prev,
        [id]: "",
      }));
    }
  };

  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors: Errors = {
      mpesaNumber: "",
      withdrawAmount: "",
      fullName: "",
    };

    // Validate Mpesa number
    if (!MPESA_REGEX.test(formData.mpesaNumber)) {
      newErrors.mpesaNumber =
        "Please enter a valid Mpesa number (e.g., 0712345678 or 254712345678)";
      isValid = false;
    }

    // Validate amount
    const amount = parseFloat(formData.withdrawAmount);
    if (!formData.withdrawAmount || isNaN(amount)) {
      newErrors.withdrawAmount = "Please enter a valid amount";
      isValid = false;
    } else if (amount < MIN_WITHDRAWAL) {
      newErrors.withdrawAmount = `Minimum withdrawal is KSh ${MIN_WITHDRAWAL}`;
      isValid = false;
    } else if (amount > availableBalance) {
      newErrors.withdrawAmount = `You can't withdraw more than your available balance (KSh ${availableBalance})`;
      isValid = false;
    }

    // Validate full name
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Please enter your full name";
      isValid = false;
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = "Name must be at least 3 characters";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleWithdraw = async () => {
    if (!validateForm() || !user) return;

    setWithdrawing(true);

    try {
      const amount = parseFloat(formData.withdrawAmount);

      // Save form data if rememberDetails is checked
      if (formData.rememberDetails) {
        localStorage.setItem("withdrawalFormData", JSON.stringify(formData));
      } else {
        localStorage.removeItem("withdrawalFormData");
      }

      // Create withdrawal record
      const withdrawalData = {
        user: user.id,
        amount,
        mpesa_number: formData.mpesaNumber,
        full_name: formData.fullName,
        status: "pending",
        processed_at: null,
      };

      await pb.collection("withdrawal").create(withdrawalData);

      // Update user balance
      await pb.collection("users").update(user.id, {
        balance: user.balance - amount,
      });

      toast.success(
        <div>
          <p className="font-bold">Withdrawal request submitted!</p>
          <p className="text-sm">
            KSh {amount} will be sent to {formData.mpesaNumber}
          </p>
        </div>,
        { duration: 5000 }
      );

      // Refresh user data
      await fetchUserData();

      // Reset form (keep remembered details)
      setFormData((prev) => ({
        ...prev,
        withdrawAmount: "",
      }));
    } catch (error: any) {
      console.error("Withdrawal failed:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to process withdrawal";
      toast.error(errorMessage);
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center space-y-4">
          <div className="animate-pulse rounded-full bg-blue-200 h-12 w-12 mx-auto"></div>
          <p className="text-lg text-blue-800">Loading your profit data...</p>
        </div>
      </div>
    );
  }
 if (!user) {
    return (
        <div className="bg-purple-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] py-8 px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-gray-100">
        <h1 className="text-3xl font-bold mb-6 text-blue-900 text-center">
          Profit Overview
        </h1>

        {/* Earnings Summary */}
        <div className="space-y-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow p-4 border border-gray-100">
            <h2 className="text-lg font-semibold mb-3 text-blue-800">
              Current Earnings
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>From Referrals:</span>
                <span className="font-bold">
                  KSh {earnings.referals.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>From Tasks:</span>
                <span className="font-bold">
                  KSh {earnings.tasks.toLocaleString()}
                </span>
              </div>
              <div className="border-t my-2"></div>
              <div className="flex justify-between text-lg">
                <span className="font-semibold">Total:</span>
                <span className="text-green-600 font-bold">
                  KSh {earnings.total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow p-4 border border-gray-100">
            <h2 className="text-lg font-semibold mb-3 text-blue-800">
              Balance
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Lifetime Earnings:</span>
                <span className="font-bold">
                  KSh {lifetimeEarnings.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Available:</span>
                <span className="text-green-600 font-bold">
                  KSh {availableBalance.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Level:</span>
                <span className="font-bold">{user.level}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Withdrawal Form */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-900">
            Withdraw Funds
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block font-medium mb-1" htmlFor="fullName">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleInputChange}
                className={`w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition ${
                  errors.fullName ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Your full name as per Mpesa"
                required
              />
              {errors.fullName && (
                <p className="text-red-600 text-sm mt-1">{errors.fullName}</p>
              )}
            </div>

            <div>
              <label className="block font-medium mb-1" htmlFor="mpesaNumber">
                Mpesa Number
              </label>
              <input
                id="mpesaNumber"
                type="tel"
                value={formData.mpesaNumber}
                onChange={handleInputChange}
                className={`w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition ${
                  errors.mpesaNumber ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g. 0712345678"
                required
              />
              {errors.mpesaNumber && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.mpesaNumber}
                </p>
              )}
            </div>

            <div>
              <label
                className="block font-medium mb-1"
                htmlFor="withdrawAmount"
              >
                Amount (KSh)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  KSh
                </span>
                <input
                  id="withdrawAmount"
                  type="number"
                  min={MIN_WITHDRAWAL}
                  max={availableBalance}
                  value={formData.withdrawAmount}
                  onChange={handleInputChange}
                  className={`w-full border px-3 py-2 pl-10 rounded focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition ${
                    errors.withdrawAmount ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder={`Minimum ${MIN_WITHDRAWAL.toLocaleString()}`}
                  required
                />
              </div>
              {errors.withdrawAmount && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.withdrawAmount}
                </p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Available: KSh {availableBalance.toLocaleString()}
              </p>
            </div>

            <div className="flex items-center">
              <input
                id="rememberDetails"
                type="checkbox"
                checked={formData.rememberDetails}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="rememberDetails"
                className="ml-2 block text-sm text-gray-700"
              >
                Remember my details for next time
              </label>
            </div>

            <button
              onClick={handleWithdraw}
              disabled={withdrawing || availableBalance < MIN_WITHDRAWAL}
              className={`w-full py-3 rounded font-semibold transition-colors shadow ${
                withdrawing
                  ? "bg-gray-400 cursor-not-allowed"
                  : availableBalance < MIN_WITHDRAWAL
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-yellow-400 hover:bg-yellow-300 text-blue-900"
              }`}
            >
              {withdrawing ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </span>
              ) : availableBalance < MIN_WITHDRAWAL ? (
                `Minimum withdrawal is KSh ${MIN_WITHDRAWAL}`
              ) : (
                "Withdraw Funds"
              )}
            </button>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2 text-blue-900">
            Withdrawal Information
          </h2>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
            <li>Minimum withdrawal: KSh {MIN_WITHDRAWAL.toLocaleString()}</li>
            <li>Processing time: Instant (up to 24 hours during peak times)</li>
            <li>Daily withdrawal limit: KSh 70,000</li>
            <li>No withdrawal fees applied</li>
            <li>Contact support@zenith.com for any issues</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Profit;
