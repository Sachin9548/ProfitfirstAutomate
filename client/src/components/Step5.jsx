import React, { useState } from "react";
import { PulseLoader } from "react-spinners";
import { toast } from "react-toastify";
import axiosInstance from "../../axios";

const Step5 = ({ onComplete }) => {
  const [platform, setPlatform] = useState("Shiproact");
  const [shippingData, setShippingData] = useState({
    shiproactId: "",
    shiproactPassword: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setShippingData({ ...shippingData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosInstance.post("/onboard/step5", { platform, ...shippingData });
      toast.success("Shipping account connected!");
      onComplete();
    } catch (err) {
      toast.error("Failed to connect shipping account.");
      console.error("Submission error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0D1D1E]">
        <PulseLoader size={60} color="#12EB8E" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-6 bg-[#0D1D1E] text-white relative">
      {/* Blurred circles */}
      <div
        className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px] opacity-50 z-0"
        style={{
          background:
            "linear-gradient(to right, rgb(18, 235, 142), rgb(18, 235, 142))",
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-[100px] opacity-50 z-0"
        style={{
          background:
            "linear-gradient(to left, rgb(18, 235, 142), rgb(18, 235, 142))",
        }}
      />

      <div className="flex flex-col lg:flex-row items-center gap-10 max-w-7xl w-full relative z-10">
        {/* Left section */}
        <div className="w-full lg:w-1/2 text-center">
          <img src="https://res.cloudinary.com/dqdvr35aj/image/upload/v1748330108/Logo1_zbbbz4.png" alt="Profit First Logo" className="w-48 sm:w-64" />
          <div className="bg-white rounded-xl w-full h-[300px] sm:h-[350px] mb-4"></div>
          <p className="text-green-400">
            Watch this video to connect your shipping platform to Profit First
          </p>
        </div>

        {/* Right section: Form */}
        <div className="w-full lg:w-1/2 p-8 rounded-xl myshopifybox">
          <h2 className="text-xl font-semibold mb-4">
            Connect your Shipping Account
          </h2>

          <div className="flex gap-4 mb-6">
            <button
              className={`px-4 py-2 rounded border ${
                platform === "Shiproact"
                  ? "bg-green-500 text-black font-semibold"
                  : "border-gray-500"
              }`}
              onClick={() => setPlatform("Shiproact")}
            >
              Shiproact
            </button>
            <button
              className={`px-4 py-2 rounded border ${
                platform === "Dilevery"
                  ? "bg-green-500 text-black font-semibold"
                  : "border-gray-500"
              }`}
              onClick={() => setPlatform("Dilevery")}
            >
              Dilevery
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">
                Enter your Shiproact ID:
              </label>
              <input
                type="text"
                name="shiproactId"
                value={shippingData.shiproactId}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-md bg-transparent border border-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Enter your Password:</label>
              <input
                type="password"
                name="shiproactPassword"
                value={shippingData.shiproactPassword}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-md bg-transparent border border-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 mt-4 rounded-md text-black font-semibold transition hover:text-white"
              style={{ backgroundColor: "#12EB8E" }}
            >
              Connect
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Step5;
