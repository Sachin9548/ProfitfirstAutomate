import React, { useState } from "react";
import { PulseLoader } from "react-spinners";
import { toast } from "react-toastify";
import axiosInstance from "../../axios";

const Step5 = ({ onComplete }) => {
  const [platform, setPlatform] = useState("Shiprocket");

  // 1. SIMPLIFY the state. We no longer need separate fields for shiproact.
  const [formData, setFormData] = useState({
    access_token: "",
    secret_key: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Clear fields that don't belong to the selected platform before sending
      let payload = { platform };
      switch (platform) {
        case "Shiprocket":
        case "Nimbuspost":
          payload.email = formData.email;
          payload.password = formData.password;
          break;
        case "Shipway":
          payload.email = formData.email;
          payload.password = formData.password; // Backend knows this is the license key
          break;
        case "Dilevery":
          payload.access_token = formData.access_token;
          break;
        case "Ithink Logistics":
          payload.access_token = formData.access_token;
          payload.secret_key = formData.secret_key;
          break;
        default:
          break;
      }

      await axiosInstance.post("/onboard/step5", payload);
      toast.success("Shipping account connected!");
      onComplete();
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to connect shipping account.";
      toast.error(errorMessage);
      console.error("Submission error:", err.response || err);
    } finally {
      setLoading(false);
    }
  };

  const renderFields = () => {
    switch (platform) {
      case "Shiprocket":
        return (
          <>
            <InputField
              label="Shiprocket Email" // Changed label for clarity
              name="email"             // Use 'email'
              value={formData.email}
              onChange={handleChange}
            />
            <InputField
              label="Password"
              type="password"
              name="password"          // Use 'password'
              value={formData.password}
              onChange={handleChange}
            />
          </>
        );
      case "Dilevery":
        return (
          <InputField
            label="Access Token"
            name="access_token"
            value={formData.access_token}
            onChange={handleChange}
          />
        );
      case "Shipway":
        return (
          <>
            <InputField
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
            <InputField
              label="License Key"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
            />
          </>
        );
      case "Ithink Logistics":
        return (
          <>
            <InputField
              label="Access Token"
              name="access_token"
              value={formData.access_token}
              onChange={handleChange}
            />
            <InputField
              label="Secret Key"
              name="secret_key"
              value={formData.secret_key}
              onChange={handleChange}
            />
          </>
        );
      case "Nimbuspost":
        return (
          <>
            <InputField
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
            <InputField
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
            />
          </>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0D1D1E]">
        <PulseLoader size={60} color="#12EB8E" />
      </div>
    );
  }

  // --- The rest of your JSX remains the same ---
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-6 bg-[#0D1D1E] text-white relative">
      {/* Blur circles */}
      <div
        className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px] opacity-50 z-0"
        style={{
          background: "linear-gradient(to right, rgb(18, 235, 142), rgb(18, 235, 142))",
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-[100px] opacity-50 z-0"
        style={{
          background: "linear-gradient(to left, rgb(18, 235, 142), rgb(18, 235, 142))",
        }}
      />
      <div className="flex flex-col lg:flex-row items-center gap-10 max-w-7xl w-full relative z-10">
        {/* Left */}
        <div className="w-full lg:w-1/2 text-center">
          <img
            src="https://res.cloudinary.com/dqdvr35aj/image/upload/v1748330108/Logo1_zbbbz4.png"
            alt="Logo"
            className="w-48 sm:w-64 mx-auto" // Added mx-auto for centering
          />
          <div className="bg-white rounded-xl w-full h-[300px] sm:h-[350px] my-4">
            {/* Placeholder for video */}
          </div>
          <p className="text-green-400">
            Watch this video to connect your shipping platform
          </p>
        </div>
        {/* Right */}
        <div className="w-full lg:w-1/2 p-8 rounded-xl myshopifybox">
          <h2 className="text-xl font-semibold mb-4">
            Connect your Shipping Account
          </h2>
          <div className="flex gap-4 mb-6 flex-wrap">
            {[
              "Shiprocket",
              "Dilevery",
              "Shipway",
              "Ithink Logistics",
              "Nimbuspost",
            ].map((name) => (
              <button
                key={name}
                className={`px-4 py-2 rounded border ${
                  platform === name
                    ? "bg-green-500 text-black font-semibold"
                    : "border-gray-500"
                }`}
                onClick={() => setPlatform(name)}
              >
                {name}
              </button>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {renderFields()}
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

const InputField = ({ label, name, value, onChange, type = "text" }) => (
  <div>
    <label className="block text-sm mb-1">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      className="w-full px-4 py-2 rounded-md bg-transparent border border-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
      autoComplete="off"
    />
  </div>
);

export default Step5;