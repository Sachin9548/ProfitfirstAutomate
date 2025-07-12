import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axiosInstance from "../../axios";
import { useNavigate } from "react-router-dom";
import { PulseLoader } from "react-spinners";

const SignUp = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    rePassword: "",
    terms: false,
  });
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.password ||
      !formData.rePassword
    ) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (!formData.terms) {
      toast.error("Please accept the Terms of Service.");
      return;
    }
    if (formData.password !== formData.rePassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);

    try {
      const response = await axiosInstance.post("/auth/signup", {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      }); 
      toast.success(
        "Signup successful! Please check your email for verification."
      );
      navigate("/verify-email", { state: { email: formData.email } });
    } catch (error) {
      setTimeout(() => {
        toast.error(error.response?.data?.message || "Signup failed. Please try again.");
      }, 1000);
      console.error("Signup error:", error.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0D1D1E]">
        <PulseLoader size={15} color="#12EB8E" />
      </div>
    );
  }
  return (
    <div className="flex flex-col md:flex-row h-full md:h-screen">
      <ToastContainer position="top-right" autoClose={3000} />
      {/* Left side with gradient or image */}
      <div
        className="w-full md:w-[1/4] hidden md:flex items-center justify-center"
        style={{
          background:
            "linear-gradient(to bottom, rgb(0, 40, 38), rgb(0, 85, 58))",
        }}
      >
        <div className="w-full max-w-xs md:max-w-lg rounded-lg overflow-hidden">
          <img
            src="https://cdni.iconscout.com/illustration/premium/thumb/registration-page-illustration-download-in-svg-png-gif-file-formats--word-logo-hello-user-account-setup-new-sign-up-welcome-greetings-pack-people-illustrations-8111289.png"
            alt="Sign up illustration"
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      {/* Right side with the sign-up form */}
      <div className="w-full md:w-[75%] bg-[#0D191C] flex items-center justify-center p-4 sm:p-6">
        <form
          onSubmit={handleSubmit}
          className="bg-[#0D191C] w-full max-w-md p-4 sm:p-6 md:p-8 rounded-lg"
        >
          <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-[#12EB8E] text-center md:text-left">
            Sign Up
          </h1>

          {/* Name fields */}
          <div className="flex flex-col md:flex-row md:space-x-3">
            <div className="mb-4 w-full">
              <label htmlFor="firstName" className="block text-white mb-2">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-md border border-white text-white bg-transparent focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="John"
              />
            </div>
            <div className="mb-4 w-full">
              <label htmlFor="lastName" className="block text-white mb-2">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-md border border-white text-white bg-transparent focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="Doe"
              />
            </div>
          </div>

          {/* Email */}
          <div className="mb-4">
            <label htmlFor="email" className="block text-white mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-md border border-white text-white bg-transparent focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="john.doe@example.com"
            />
          </div>

          {/* Password */}
          <div className="mb-4">
            <label htmlFor="password" className="block text-white mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-md border border-white text-white bg-transparent focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="••••••••"
            />
          </div>

          {/* Re-enter Password */}
          <div className="mb-4">
            <label htmlFor="rePassword" className="block text-white mb-2">
              Re-enter Password
            </label>
            <input
              type="password"
              id="rePassword"
              value={formData.rePassword}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-md border border-white text-white bg-transparent focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="••••••••"
            />
          </div>

          {/* Terms of Service Checkbox */}
          <div className="mb-6 flex items-start gap-2">
            <input
              type="checkbox"
              id="terms"
              checked={formData.terms}
              onChange={handleChange}
              className="h-5 w-5 text-green-400 accent-green-400 focus:ring-green-400 mt-1"
            />
            <label htmlFor="terms" className="text-gray-300 text-sm">
              I’ve read and agree with Terms of Service and our Privacy Policy
            </label>
          </div>

          {/* Sign Up Button */}
          <button
            type="submit"
            className="w-full py-2 mb-4 text-black font-semibold rounded-md hover:text-white transition-colors"
            style={{ backgroundColor: "#12EB8E" }}
          >
            Sign Up
          </button>

          {/* OR divider */}
          <div className="flex items-center mb-4">
            <div className="h-px flex-1 bg-gray-600"></div>
            <span className="px-2 text-gray-400">OR</span>
            <div className="h-px flex-1 bg-gray-600"></div>
          </div>

          {/* Social Sign Up Buttons */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
            <button className="flex-1 py-2 text-white rounded-md transition-colors border border-[#12EB8E] hover:bg-[#12EB8E] hover:text-green-300">
              Sign up with Google
            </button>
            <button className="flex-1 py-2 text-white rounded-md transition-colors border border-[#12EB8E] hover:bg-[#12EB8E] hover:text-green-300">
              Sign up with Facebook
            </button>
          </div>

          {/* Already have an account? */}
          <p className="text-center text-sm text-gray-400">
            Already have an account?{" "}
            <Link to="/login" className="text-green-400 hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
