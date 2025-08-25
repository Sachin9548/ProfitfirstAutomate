import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../../axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { PulseLoader } from "react-spinners";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false); 
  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { email, password } = formData;

    if (!email || !password) {
      toast.error("Please fill in all fields.");
      setLoading(false);
      return;
    }
    try {
      const response = await axiosInstance.post("/auth/login", {
        email,
        password,
      });
      const token = response.data.token;
      const userId = response.data.userId;
      localStorage.setItem("token", token); 
      localStorage.setItem("userId", userId);
      toast.success("Login successful!");
        // Fetch user details
          const userRes = await axiosInstance.get(`/auth/users/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const isAdmin = userRes.data?.isAdmin;
          setTimeout(() => {
            toast.success("Login successful!");
          }, 500);
          navigate(isAdmin ? "/admindashboard" : "/onboarding");
          setLoading(false);

    } catch (err) {
      setTimeout(() => {
        toast.error(err.response?.data?.message || "Login failed. Please try again.");
      }, 1000);
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
    <div className="flex min-h-screen text-white">
      <ToastContainer position="top-right" autoClose={3000} />
      {/* Left section */}
      <div
        className="hidden md:flex flex-col justify-center items-start px-12 w-1/2"
        style={{
          background:
            "linear-gradient(to bottom, rgb(0, 40, 38), rgb(0, 85, 58))",
        }}
      >
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-6">
            <img src="https://res.cloudinary.com/dqdvr35aj/image/upload/v1748330108/Logo1_zbbbz4.png" alt="Logo" className="w-70 h-70" />
          </div>
          <h2 className="text-7xl font-bold mb-4">
            Hello,
            <br /> welcome!
          </h2>
          <p className="text-sm text-gray-200 max-w-md">
            Lorem Ipsum is simply dummy text of the printing and typesetting
            industry.
          </p>
        </div>
      </div>

      {/* Right section */}
      <div className="w-full md:w-1/2 bg-[#0D191C] flex justify-center items-center p-6">
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="name@mail.com"
              className="w-full px-4 py-3 rounded-md border border-white bg-transparent text-white focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="****************"
              className="w-full px-4 py-3 rounded-md border border-white bg-transparent text-white focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          <div className="flex justify-between items-center text-sm">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                className="form-checkbox text-green-400 accent-green-400 h-4 w-4 mr-2"
              />
              Remember me
            </label>
            {/* <a href="#" className="text-white hover:underline">
              Forgot password?
            </a> */}
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 rounded-full text-black font-semibold hover:text-white transition-colors"
              style={{ backgroundColor: "#12EB8E" }}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
            <button
              type="button"
              className="flex-1 py-2 rounded-full border transition-colors"
              style={{ borderColor: "#12EB8E" }}
              onClick={() => navigate("/signup")}
            >
              Sign up
            </button>
          </div>

          <div className="mt-8 text-sm text-white">
            <span className="mr-2">FOLLOW:</span>
            <div className="inline-flex space-x-2">
              <span className="w-5 h-5 rounded-sm bg-white inline-block"></span>
              <span className="w-5 h-5 rounded-sm bg-white inline-block"></span>
              <span className="w-5 h-5 rounded-sm bg-white inline-block"></span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
