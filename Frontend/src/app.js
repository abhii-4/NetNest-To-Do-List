import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AuthPage from "@/pages/AuthPage";
import Dashboard from "@/pages/Dashboard";
import FirebaseSetupNotice from "@/components/FirebaseSetupNotice";
import CustomCursor from "@/components/CustomCursor";
import { Toaster } from "sonner";
import "sonner/dist/styles.css";
import "@/app.css";

const AppRoutes = () => {
  const { user, loading, configured } = useAuth();


  if (!configured) {
    return <FirebaseSetupNotice />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0B0B] text-[#8A8A8E] font-medium text-lg">
        Loading...
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
        }
      />
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />}
      />
      <Route
        path="/dashboard"
        element={user ? <Dashboard /> : <Navigate to="/login" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <div className="App">
      <CustomCursor />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
      <Toaster richColors position="top-right" closeButton />
    </div>
  );
}

export default App;