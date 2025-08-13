import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useState } from "react";
import Homepage from "./pages/Homepage";
import Contactus from "./pages/Contactus";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ScrollToTop from "./utils/ScrollToTop";
import { ToastContainer } from "react-toastify";
import VerifyEmail from "./pages/VerifyEmail";
import Onboarding from "./pages/Onboarding";
import { isTokenValid } from "./utils/auth";
import Dashboard from "./pages/Dashboard";
import MainDashboard from "./MainDashboard";
import Marketing from "./pages/Marketing";
import Analytics from "./pages/Analytics";
import Shipping from "./pages/Shipping";
import Products from "./pages/Products";
import Returns from "./pages/Returns";
import Blogs from "./pages/Blogs";
import PrivacyPolicy from "./components/privacypolicy";
import RetryPage from "./pages/RetryPage";
import Settings from "./pages/Settings";
import ChatBot from "./pages/ChatBot";
import { TbMessageChatbotFilled } from "react-icons/tb";
import chatbott from "./public/WelcomeAnimation.gif"
function AppWrapper() {
  const isAuthenticated = isTokenValid();
  // const isAuthenticated = true;
  const location = useLocation();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const isDashboardRoute = location.pathname.startsWith("/dashboard");

  const toggleChat = () => setIsChatOpen((prev) => !prev);

  return (
    <>
      <ScrollToTop />
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/contact" element={<Contactus />} />
        <Route path="/blogs" element={<Blogs />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/retry" element={<RetryPage />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route
          path="/onboarding"
          element={
            isAuthenticated ? <Onboarding /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <MainDashboard />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="marketing" element={<Marketing />} />
          <Route path="shipping" element={<Shipping />} />
          <Route path="products" element={<Products />} />
          <Route path="returns" element={<Returns />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Homepage />} />
      </Routes>

      {/* Floating ChatBot Button & Popup (Visible on dashboard routes only) */}
     
   {isDashboardRoute && (
  <>
    <button
      onClick={toggleChat}
      style={{
        position: "fixed",
        bottom: "50px",
        right: "50px",
        // backgroundColor: "#0bcf04",
        color: "white",
        border: "none",
        borderRadius: "50%",
        width: "150px",
        height: "150px",
        fontSize: "24px",
        zIndex: 9,
        cursor: "pointer",
        boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
        display: "flex", // <-- flex container
        alignItems: "center", // <-- vertical center
        justifyContent: "center", // <-- horizontal center
      }}
      title="Chat with us"
    >

      <img height={100} src={chatbott} alt="Chatbot" />

      {/* <TbMessageChatbotFilled /> */}
    </button>

    {isChatOpen && (
      <div
        style={{
          position: "fixed",
          bottom: "120px",
          right: "60px",
          width: "430px",
          height: "550px",
          backgroundColor: "white",
          border: "1px solid #ccc",
          borderRadius: "10px",
          zIndex: 9,
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          overflow: "hidden",
        }}
      >
        <ChatBot />
      </div>
    )}
  </>
)}





      
    </>
  );
}

function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}

export default App;
