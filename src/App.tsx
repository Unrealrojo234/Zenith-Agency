import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import TaskArea from "./pages/TaskArea";
import Profit from "./pages/Profit";
import Account from "./pages/Account";
import Support from "./pages/Support";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";

import PocketBase from 'pocketbase'



function App() {

  const pb = new PocketBase('https://zenithdb.fly.dev');

  if(pb.authStore.isValid){
    return(
 <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Layout><Dashboard /></Layout>} />
        <Route path="/login" element={<Layout><Login /></Layout>} />
        <Route path="/signup" element={<Layout><Signup /></Layout>} />

          <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
        <Route path="/tasks" element={<ProtectedRoute><Layout><TaskArea /></Layout></ProtectedRoute>} />
        <Route path="/profit" element={<ProtectedRoute><Layout><Profit /></Layout></ProtectedRoute>} />
        <Route path="/account" element={<ProtectedRoute><Layout><Account /></Layout></ProtectedRoute>} />
        <Route path="/support" element={<Layout><Support /></Layout>} />
        <Route path="/privacy" element={<Layout><PrivacyPolicy /></Layout>} />
        <Route path="/terms" element={<Layout><TermsOfService /></Layout>} />
        <Route path="/contact" element={<Layout><Contact /></Layout>} />
        

        {/* IMPORTANT: DO NOT place any routes below this. */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>

    )
  }
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/login" element={<Layout><Login /></Layout>} />
        <Route path="/signup" element={<Layout><Signup /></Layout>} />
        
        {/* Protected routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
        <Route path="/tasks" element={<ProtectedRoute><Layout><TaskArea /></Layout></ProtectedRoute>} />
        <Route path="/profit" element={<ProtectedRoute><Layout><Profit /></Layout></ProtectedRoute>} />
        <Route path="/account" element={<ProtectedRoute><Layout><Account /></Layout></ProtectedRoute>} />
        <Route path="/support" element={<Layout><Support /></Layout>} />
        <Route path="/privacy" element={<Layout><PrivacyPolicy /></Layout>} />
        <Route path="/terms" element={<Layout><TermsOfService /></Layout>} />
        <Route path="/contact" element={<Layout><Contact /></Layout>} />

        {/* IMPORTANT: DO NOT place any routes below this. */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;