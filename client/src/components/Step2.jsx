import React, { useState } from "react";
import { toast } from "react-toastify";
import axiosInstance from "../../axios";
import { PulseLoader } from "react-spinners";
import axios from "axios";
const Step2 = ({ onComplete }) => {
  const [platform, setPlatform] = useState("Shopify");

  const [storeUrl, setStoreUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    if (!storeUrl) return toast.error("Please enter your store URL");

    let correctedStoreUrl = storeUrl.trim().toLowerCase();

    if (!correctedStoreUrl.endsWith(".myshopify.com")) {
      return toast.error(
        "Invalid Shopify store URL. Please enter a URL that ends with '.myshopify.com'"
      );
    }

    const url = `https://www.profitfirst.co.in/connect?shop=${storeUrl}`;
    window.open(url, "_blank", "width=800,height=600");
  };

  const handleDone = async () => {
    if (!storeUrl) return toast.error("Please enter a Shopify store URL");

    setLoading(true);
    try {
      const res = await axiosInstance.get("/onboard/proxy/token", {
        params: {
          shop: storeUrl,
          password: "Sachin369",
        },
      });

      const accessToken = res.data.accessToken;

      await axiosInstance.post("/onboard/step2", {
        storeUrl,
        apiKey: "oauth",
        apiSecret: "oauth",
        accessToken,
      });

      toast.success("✅ Shopify store connected successfully!");
      onComplete();
    } catch (err) {
      console.error("Done error:", err);
      toast.error(
        "❌ Failed to complete onboarding. Make sure app is installed."
      );
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
    <div className="min-h-screen flex items-center justify-center px-4 py-6 bg-[#0D1D1E] text-white">
      {/* Blurred background circles */}
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
        {/* Left section: video + logo */}
        <div className="w-full lg:w-1/2 text-center">
          <img
            src="https://res.cloudinary.com/dqdvr35aj/image/upload/v1748330108/Logo1_zbbbz4.png"
            alt="Profit First Logo"
            className="w-48 sm:w-64"
          />
          <div className="bg-white rounded-xl w-full h-[300px] sm:h-[350px] mb-4"></div>
          <p className="text-green-400">
            Watch this video to connect your Shopify store to Profit First
          </p>
        </div>

        {/* Right section: forms */}
        <div className="w-full lg:w-1/2 p-8 rounded-xl myshopifybox">
          <h2 className="text-xl font-semibold mb-4">
            Connect your Shopify Store
          </h2>

          {/* Platform selection buttons */}
          <div className="flex gap-4 mb-4">
            <button
              className={`px-4 py-2 rounded border ${
                platform === "Shopify"
                  ? "bg-green-500 text-black font-semibold"
                  : "border-gray-500"
              }`}
              onClick={() => setPlatform("Shopify")}
            >
              Shopify
            </button>
            <button
              className={`px-4 py-2 rounded border ${
                platform === "Wordpress"
                  ? "bg-green-500 text-black font-semibold"
                  : "border-gray-500"
              }`}
              onClick={() => setPlatform("Wordpress")}
            >
              Wordpress
            </button>
          </div>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <label className="block text-sm mb-1">Your Shopify Store URL</label>
            <input
              type="text"
              value={storeUrl}
              onChange={(e) => setStoreUrl(e.target.value)}
              placeholder="example.myshopify.com"
              className="w-full px-4 py-2 rounded-md bg-transparent border border-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            />

            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleConnect}
                className="flex-1 py-3 rounded-md text-black font-semibold transition hover:text-white"
                style={{ backgroundColor: "#12EB8E" }}
              >
                Connect
              </button>

              <button
                type="button"
                onClick={handleDone}
                className="flex-1 py-3 rounded-md text-black font-semibold transition hover:text-white"
                style={{ backgroundColor: "#12EB8E" }}
              >
                Done
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Step2;
