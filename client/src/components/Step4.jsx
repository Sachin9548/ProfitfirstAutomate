import React, { useState } from "react";
import { toast } from "react-toastify";
import { PulseLoader } from "react-spinners";
import axiosInstance from "../../axios";

const Step4 = ({ onComplete }) => {
  const [platform, setPlatform] = useState("Meta");
  const [MetaData, setMetaData] = useState({
    adAccountId: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setMetaData({ ...MetaData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const accessToken = sessionStorage.getItem("fbAccessToken");

    if (!MetaData.adAccountId.trim()) {
      toast.error("Please enter your Ad account ID.");
      setLoading(false);
      return;
    }

    if (!accessToken) {
      toast.error("Missing access token. Please connect Meta first.");
      setLoading(false);
      return;
    }

    try {
      await axiosInstance.post("/onboard/step4", {
        adAccountId: MetaData.adAccountId,
        accessToken,
      });

      toast.success("Ad account connected!");
      onComplete();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to connect ad account."
      );
      console.error("Submission error:", err);
    } finally {
      setLoading(false);
    }
  };
  const handleMetaConnect = async () => {
    try {
      const response = await axiosInstance.get("/onboard/login", {
        withCredentials: true,
      });

      if (response.data?.redirectUrl) {
        window.location.href = response.data.redirectUrl;
      }
    } catch (err) {
      toast.error("Failed to initiate Meta login.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0D1D1E]">
        <PulseLoader size={60} color="#12EB8E" />
        {/* <ClipLoader size={60} color="#4f46e5" /> */}
      </div>
    );
  }
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-6 bg-[#0D1D1E] text-white">
      {/* Add the two blurred circles */}
      <div
        className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px] opacity-50 z-0"
        style={{
          background:
            "linear-gradient(to right, rgb(18, 235, 142), rgb(18, 235, 142))",
        }}
      ></div>

      <div
        className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-[100px] opacity-50 z-0"
        style={{
          background:
            "linear-gradient(to left, rgb(18, 235, 142), rgb(18, 235, 142))",
        }}
      ></div>
      <div className="flex flex-col lg:flex-row items-center gap-10 max-w-7xl w-full">
        {/* Left side: Video and Logo */}
        <div className="w-full lg:w-1/2 text-center">
          <img
            src="https://res.cloudinary.com/dqdvr35aj/image/upload/v1748330108/Logo1_zbbbz4.png"
            alt="Profit First Logo"
            className=" w-48 sm:w-64"
          />
          <div className="bg-white rounded-xl w-full h-[300px] sm:h-[350px] mb-4"></div>
          <p className="text-green-400">
            Watch this video to connect your Meta account to Profit First
          </p>
        </div>

        {/* Right side: Form */}
        <div className="w-full lg:w-1/2 p-8 rounded-xl myshopifybox">
          <h2 className="text-xl font-semibold mb-4">
            Connect your Ad Account
          </h2>

          <div className="flex gap-4 mb-6">
            <button
              className={`px-4 py-2 rounded border ${
                platform === "Meta"
                  ? "bg-green-500 text-black font-semibold"
                  : "border-gray-500"
              }`}
              onClick={() => setPlatform("Meta")}
            >
              Meta
            </button>
            <button
              className={`px-4 py-2 rounded border ${
                platform === "Google"
                  ? "bg-green-500 text-black font-semibold"
                  : "border-gray-500"
              }`}
              onClick={() => setPlatform("Google")}
            >
              Google
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="mb-4 text-yellow-300">
              Please give <strong>profitfirstoffice@gmail.com</strong> access to
              your Meta Ad Account before proceeding.
            </p>
            <div>
              <label className="block text-sm mb-1">
                Enter your Ad account I’D:
              </label>
              <input
                type="text"
                name="adAccountId"
                value={MetaData.adAccountId}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-md bg-transparent border border-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <button
              type="button"
              className="w-full py-3 mb-4 rounded-md font-semibold bg-blue-500 text-white"
              onClick={handleMetaConnect}
            >
              Connect to Meta
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 mt-4 rounded-md font-semibold transition ${
                loading ? "opacity-50 cursor-not-allowed" : "hover:text-white"
              }`}
              style={{ backgroundColor: "#12EB8E" }}
            >
              {loading ? "Connecting..." : "Connect"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Step4;
