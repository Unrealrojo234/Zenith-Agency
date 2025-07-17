import * as React from "react";
import toast from "react-hot-toast";
import { useEffect, useState, useCallback } from "react";
import PocketBase from "pocketbase";



// Initialize PocketBase client outside the component
const pb = new PocketBase("https://zenithdb.fly.dev");


const Profit = () => {
  const [user, setUser] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [formData, setFormData] = useState({
    mpesaNumber: "",
    withdrawAmount: "",
    fullName: ""
  });
  const [errors, setErrors] = useState({
    mpesaNumber: "",
    withdrawAmount: "",
    fullName: ""
  });

  // Calculate earnings from Supabase user data
  const calculateEarnings = useCallback(() => {
    if (!user) return {
      referals: 0,
      tasks: 0,
      total: 0
    };

    // Assuming income includes both task earnings and referral earnings
    // You may need to adjust this based on your actual data structure
    const taskEarnings = user.income || 0;
    const referralEarnings = user.referals || 0;
    
    return {
      referals: referralEarnings,
      tasks: taskEarnings - referralEarnings, // Assuming income includes both
      total: taskEarnings
    };
  }, [user]);

  const earnings = calculateEarnings();
  const lifetimeEarnings = user?.income || 0;
  const availableBalance = user?.balance || 0;

  const fetchUserData = useCallback(async () => {
    try {
         const record = await pb
          .collection("users")
          .getOne(pb.authStore.model.id, {
            expand: "relField1,relField2.subRelField",
          });
      
        setUser(record);
        // Initialize form with user data
        setFormData(prev => ({
          ...prev,
          fullName: record.username || "",
          mpesaNumber: record.phone || ""
        }));
      }
     catch (error) {
      console.error("Failed to fetch user data:", error);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    fetchUserData();

  }, [fetchUserData]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
    
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      mpesaNumber: "",
      withdrawAmount: "",
      fullName: ""
    };

    if (!/^\d{10,}$/.test(formData.mpesaNumber)) {
      newErrors.mpesaNumber = "Please enter a valid Mpesa number (at least 10 digits).";
      isValid = false;
    }

    const amount = parseFloat(formData.withdrawAmount);
    if (
      !formData.withdrawAmount ||
      isNaN(amount) ||
      amount < 1 ||
      amount > availableBalance
    ) {
      newErrors.withdrawAmount = `Enter an amount between KSh 1000 and KSh ${availableBalance}`;
      isValid = false;
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Please enter your full name.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleWithdraw = async () => {
    if (!validateForm()) return;
    
    setWithdrawing(true);
    
    try {
    } catch (error) {
      console.error("Withdrawal failed:", error);
      toast.error("Failed to process withdrawal. Please try again.");
    } finally {
      setWithdrawing(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <p className="text-lg">Loading profit data...</p>
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
            <h2 className="text-lg font-semibold mb-3 text-blue-800">Current Earnings</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>From Referals:</span>
                <span className="font-bold">KSh {earnings.referals}</span>
              </div>
              <div className="flex justify-between">
                <span>From Tasks:</span>
                <span className="font-bold">KSh {earnings.tasks}</span>
              </div>
              <div className="border-t my-2"></div>
              <div className="flex justify-between text-lg">
                <span className="font-semibold">Total:</span>
                <span className="text-green-600 font-bold">KSh {earnings.total}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow p-4 border border-gray-100">
            <h2 className="text-lg font-semibold mb-3 text-blue-800">Balance</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Lifetime Earnings:</span>
                <span className="font-bold">KSh {lifetimeEarnings}</span>
              </div>
              <div className="flex justify-between">
                <span>Available:</span>
                <span className="text-green-600 font-bold">KSh {availableBalance}</span>
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
          <h2 className="text-xl font-semibold mb-4 text-blue-900">Withdraw Funds</h2>
          <div className="space-y-4">
            <div>
              <label className="block font-medium mb-1" htmlFor="fullName">
                Username
              </label>
              <input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                placeholder="Your full name"
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
                className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                placeholder="e.g. 0712345678"
                required
              />
              {errors.mpesaNumber && (
                <p className="text-red-600 text-sm mt-1">{errors.mpesaNumber}</p>
              )}
            </div>

            <div>
              <label className="block font-medium mb-1" htmlFor="withdrawAmount">
                Amount (KSh)
              </label>
              <input
                id="withdrawAmount"
                type="number"
                min={1}
                max={availableBalance}
                value={formData.withdrawAmount}
                onChange={handleInputChange}
                className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                placeholder={`Up to ${availableBalance}`}
                required
              />
              {errors.withdrawAmount && (
                <p className="text-red-600 text-sm mt-1">{errors.withdrawAmount}</p>
              )}
            </div>

            <button
              onClick={handleWithdraw}
              disabled={withdrawing}
              className={`w-full py-3 rounded font-semibold transition-colors shadow ${
                withdrawing
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-yellow-400 hover:bg-yellow-300 text-blue-900"
              }`}
            >
              {withdrawing ? "Processing..." : "Withdraw Funds"}
            </button>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2 text-blue-900">Need Help?</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
            <li>Minimum withdrawal: KSh 1000</li>
            <li>Processing time: Instant (up to 72 hours in rare cases)</li>
            <li>Contact support for any issues</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Profit;