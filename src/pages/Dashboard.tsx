import { useEffect, useState } from "react";
import PocketBase from "pocketbase";
import { FiRefreshCw, FiUser, FiDollarSign, FiPieChart, FiCreditCard } from "react-icons/fi";

// Types
interface User {
  id: string;
  username: string;
  email: string;
  phone: string;
  level: number;
  investment: number;
  income: number;
  balance: number;
  referals: number;
  tasks_done: number;
  mail: string;
}

interface Withdrawal {
  id: string;
  uid: string;
  amount: number;
  processing: boolean;
  disbursed: boolean;
  declined: boolean;
  created: string;
}

interface Registration {
  id: string;
  uid: string;
  level: number;
  amount: number;
  mpesa_ref: string;
  processing: boolean;
  declined: boolean;
  created: string;
}

const pb = new PocketBase("https://zenithdb.fly.dev");

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      
      // Verify authentication first
      if (!pb.authStore.isValid) {
        throw new Error("Not authenticated");
      }
      
      const userId = pb.authStore.model?.id;
      if (!userId) {
        throw new Error("User ID not found");
      }

      // Fetch user data
      const userRecord = await pb.collection("users").getOne(userId);
      setUser(userRecord);

      // Fetch withdrawals and registrations in parallel
      const [withdrawalRecords, registrationRecords] = await Promise.all([
        pb.collection("withdrawals").getFullList({
          filter: `uid = "${userId}"`,
          sort: '-created',
        }),
        pb.collection("registrations").getFullList({
          filter: `uid = "${userId}"`,
          sort: '-created',
        })
      ]);

      setWithdrawals(withdrawalRecords);
      setRegistrations(registrationRecords);

    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
      console.error("API Error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
          <p className="font-bold">Error</p>
          <p>{error}</p>
          <button 
            onClick={fetchData}
            className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          No user data found
        </div>
      </div>
    );
  }

    return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            icon={<FiUser className="text-blue-500" size={24} />}
            title="Account Level"
            value={user.level}
            change={null}
          />
          <StatCard 
            icon={<FiDollarSign className="text-green-500" size={24} />}
            title="Balance"
            value={`Ksh ${user.balance.toLocaleString()}`}
            change={null}
          />
          <StatCard 
            icon={<FiPieChart className="text-purple-500" size={24} />}
            title="Investment"
            value={`Ksh ${user.investment.toLocaleString()}`}
            change={null}
          />
          <StatCard 
            icon={<FiCreditCard className="text-yellow-500" size={24} />}
            title="Income"
            value={`Ksh ${user.income.toLocaleString()}`}
            change={null}
          />
        </div>

        {/* Transactions Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Withdrawals Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Withdrawals</h3>
            </div>
            <div className="overflow-x-auto">
              <WithdrawalTable withdrawals={withdrawals} />
            </div>
          </div>

          {/* Registrations Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Registration History</h3>
            </div>
            <div className="overflow-x-auto">
              <RegistrationTable registrations={registrations} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Helper Components
const StatCard = ({ icon, title, value, change }: { icon: React.ReactNode, title: string, value: string | number, change: string | null }) => (
  <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="px-4 py-5 sm:p-6 flex items-start">
      <div className="mr-4">
        {icon}
      </div>
      <div>
        <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
        <dd className="mt-1 text-3xl font-semibold text-gray-900">{value}</dd>
        {change && (
          <div className={`mt-1 text-sm ${change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
            {change}
          </div>
        )}
      </div>
    </div>
  </div>
);

const WithdrawalTable = ({ withdrawals }: { withdrawals: Withdrawal[] }) => (
  <table className="min-w-full divide-y divide-gray-200">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      {withdrawals.map((withdrawal) => (
        <tr key={withdrawal.id}>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
            Ksh {withdrawal.amount.toLocaleString()}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {new Date(withdrawal.created).toLocaleDateString()}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <StatusBadge 
              processing={withdrawal.processing}
              declined={withdrawal.declined}
              completed={withdrawal.disbursed}
            />
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

const RegistrationTable = ({ registrations }: { registrations: Registration[] }) => (
  <table className="min-w-full divide-y divide-gray-200">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MPESA Ref</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      {registrations.map((registration) => (
        <tr key={registration.id}>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
            {registration.level}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            Ksh {registration.amount.toLocaleString()}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {registration.mpesa_ref || 'N/A'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <StatusBadge 
              processing={registration.processing}
              declined={registration.declined}
              completed={!registration.processing && !registration.declined}
            />
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

const StatusBadge = ({ processing, declined, completed }: { processing: boolean, declined: boolean, completed: boolean }) => {
  let status = '';
  let color = '';

  if (processing) {
    status = 'Processing';
    color = 'bg-yellow-100 text-yellow-800';
  } else if (declined) {
    status = 'Declined';
    color = 'bg-red-100 text-red-800';
  } else if (completed) {
    status = 'Completed';
    color = 'bg-green-100 text-green-800';
  } else {
    status = 'Pending';
    color = 'bg-gray-100 text-gray-800';
  }

  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${color}`}>
      {status}
    </span>
  );
};

export default Dashboard;