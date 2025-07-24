// frontend/src/pages/Dashboard.jsx

import React, { useEffect, useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { FiInfo, FiBarChart2 } from "react-icons/fi";
import { toast } from "react-toastify";
import { subDays } from "date-fns";
import axiosInstance from "../../axios";
import { PulseLoader } from "react-spinners";
import { useNavigate } from "react-router-dom";

import DateRangeSelector from "../components/DateRangeSelector";

// Helper: Convert a JS Date to “YYYY-MM-DD” in local time
const toLocalYMD = (date) => {
  const istOffset = 330 * 60 * 1000; // 5.5 hours in milliseconds
  const istDate = new Date(date.getTime() + istOffset);
  return istDate.toISOString().split("T")[0];
};

const toISTDateString = (date) => {
  const istOffset = 330 * 60 * 1000; // 5.5 hours in milliseconds
  const istDate = new Date(date.getTime() + istOffset);
  return istDate.toISOString().split("T")[0];
};
// Reusable Card component to reduce repeated Tailwind classes
const Card = ({ children, className = "" }) => (
  <div className={`bg-[#161616] p-4 rounded-xl ${className}`}>{children}</div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({
    summary: [],
    marketing: [],
    website: [],
    shipping: [],
    charts: { performance: {}, websiteTraffic: [], profitLoss: [] },
    products: { bestSelling: [], leastSelling: [] },
    pieCharts: { shipmentStatus: [], prepaidVsCod: [] },
  });
  const [loading, setLoading] = useState(true);
  // Default to last 30 days (calendar) in local time
  const [dateRange, setDateRange] = useState({
    startDate: subDays(new Date(), 29),
    endDate: new Date(),
  });
  const [selectedData, setSelectedData] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);
  const [showDateSelector, setShowDateSelector] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState("Sales");
  const [productView, setProductView] = useState("best");
  // Fetch dashboard whenever dateRange changes
  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get("/data/dashboard", {
          params: {
            startDate: toLocalYMD(dateRange.startDate),
            endDate: toLocalYMD(dateRange.endDate),
          },
        });
        setData(response.data);
        // Pre-select the first month of profitLoss (if exists)
        if (response.data.charts.profitLoss.length > 0) {
          setSelectedData(response.data.charts.profitLoss[0]);
        } else {
          setSelectedData(null);
        }
        toast.success("✅ Dashboard fetched successfully!");
      } catch (error) {
        console.error("Error fetching dashboard:", error);
        toast.error("❌ Failed to fetch dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [dateRange]);

  // Compute gradient stops for the AreaChart, memoized
  const getValueBasedStops = (dataArray) => {
    if (!dataArray || dataArray.length === 0) return [];
    const values = dataArray.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    // If there's only one point, return a single yellow stop
    if (dataArray.length === 1) {
      return [
        <stop key="stop-0" offset="0%" stopColor="#DAD239" stopOpacity={1} />,
      ];
    }
    return dataArray.map((point, idx) => {
      const percent = (idx / (dataArray.length - 1)) * 100;
      const valueRatio = (point.value - min) / range;
      let color;
      if (valueRatio < 0.33) {
        color = interpolateColor("#C82B2B", "#DAD239", valueRatio / 0.33);
      } else if (valueRatio > 0.66) {
        color = interpolateColor(
          "#DAD239",
          "#3ADA83",
          (valueRatio - 0.66) / 0.34
        );
      } else {
        color = "#DAD239";
      }
      return (
        <stop
          key={`stop-${idx}`}
          offset={`${percent}%`}
          stopColor={color}
          stopOpacity={1}
        />
      );
    });
  };

  const interpolateColor = (startColor, endColor, ratio) => {
    const start = hexToRgb(startColor);
    const end = hexToRgb(endColor);
    const r = Math.round(start.r + (end.r - start.r) * ratio);
    const g = Math.round(start.g + (end.g - start.g) * ratio);
    const b = Math.round(start.b + (end.b - start.b) * ratio);
    return rgbToHex(r, g, b);
  };

  const hexToRgb = (hex) => {
    let r = 0,
      g = 0,
      b = 0;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex[1] + hex[2], 16);
      g = parseInt(hex[3] + hex[4], 16);
      b = parseInt(hex[5] + hex[6], 16);
    }
    return { r, g, b };
  };

  const rgbToHex = (r, g, b) => {
    return (
      "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()
    );
  };

  const chartData = data.charts.performance;
  const websiteChart = data.charts.websiteTraffic;
  const profitLoss = data.charts.profitLoss;
  const bestSellingProducts = data.products.bestSelling;
  const leastSellingProducts = data.products.leastSelling;
  const shipmentStatusData = data.pieCharts.shipmentStatus;
  const prepaidCodData = data.pieCharts.prepaidVsCod;

  // Memoize gradient stops whenever chartData[selectedMetric] changes
  const gradientStops = useMemo(() => {
    return getValueBasedStops(chartData[selectedMetric] || []);
  }, [chartData, selectedMetric]);

  const shipmentColors = ["#B5A4F4", "#FDA67D", "#55D88D", "#3256D5", "#F686BC"];
  const codColors = ["#B5A4F4", "#55D88D"];

  const handleBarClick = (dataPayload) => {
    if (dataPayload && dataPayload.activePayload) {
      setSelectedData(dataPayload.activePayload[0].payload);
    }
  };

  const handleApply = (range) => {
    setDateRange(range);
    setShowDateSelector(false);
  };

  const onMouseEnter = (i) => setActiveIndex(i);
  const onMouseLeave = () => setActiveIndex(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0D1D1E]">
        <PulseLoader size={15} color="#12EB8E" />
      </div>
    );
  }

  return (
    <>
      <div className="p-6 text-white space-y-6 overflow-x-hidden bg-[#0D1D1E] min-h-screen">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <div className="flex items-center gap-4 relative overflow-visible">
            <button
              onClick={() => setShowDateSelector(!showDateSelector)}
              className="px-3 py-1 rounded-md text-sm border bg-[#161616] border-gray-700"
            >
              {dateRange
                ? `${dateRange.startDate.toLocaleDateString()} - ${dateRange.endDate.toLocaleDateString()}`
                : "Select Date Range"}
            </button>

            {showDateSelector && (
              <div className="absolute top-full mt-2 right-0 z-50 bg-[#161616] rounded-lg shadow-lg border border-gray-700">
                <DateRangeSelector onApply={handleApply} />
              </div>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 w-full">
          {data.summary.map(({ title, value }) => (
            <Card key={title}>
              <div className="text-sm text-gray-300">{title}</div>
              <div className="text-xl font-bold text-white">
                {value != null ? value : "—"}
              </div>
            </Card>
          ))}
        </div>

        {/* Profit & Loss Section */}
        <div className="bg-[#161616] rounded-xl p-6 flex flex-col lg:flex-row gap-6 z-1">
          {/* Chart Section */}
          <div className="w-full lg:w-3/5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Overall Profit and Loss Breakdown
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={profitLoss} onClick={handleBarClick} style={{ cursor: "pointer" }}>
                <XAxis dataKey="month" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#161616",
                    border: "1px solid #2e2e2e",
                    borderRadius: "8px",
                    color: "#fff",
                    boxShadow: "0 4px 12px rgba(0, 255, 47, 0.4)",
                  }}
                  cursor={{ fill: "#2e2e2e", opacity: 0.1 }}
                />
                <Bar dataKey="sales" stackId="a" fill="#256a28" />
                <Bar dataKey="adsSpend" stackId="a" fill="#4c9a2a" />
                <Bar dataKey="shipping" stackId="a" fill="#76ba1b" />
                <Bar dataKey="cost" stackId="a" fill="#3db042" />
                <Bar
                  dataKey="netProfit"
                  stackId="a"
                  fill="#1ef631"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="flex justify-center mt-4 space-x-6 text-sm">
              <div className="flex items-center space-x-1">
                <span className="w-3 h-3 rounded-sm bg-[#256a28]" />
                <span>Sales</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-3 h-3 rounded-sm bg-[#4c9a2a]" />
                <span>Ads Spend</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-3 h-3 rounded-sm bg-[#76ba1b]" />
                <span>Shipping Spend</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-3 h-3 rounded-sm bg-[#3db042]" />
                <span>Cost</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-3 h-3 rounded-sm bg-[#1ef631]" />
                <span>Net Profit</span>
              </div>
            </div>
          </div>

          {/* Detail Panel */}
          {selectedData && (
            <div className="w-full lg:w-2/5">
              <h3 className="text-lg font-semibold mb-4">
                {selectedData.month} {selectedData.year}
              </h3>
              <div className="space-y-3">
                <div className="bg-[#256a28] text-black p-4 rounded-lg font-medium">
                  Sales: {selectedData.sales}
                </div>
                <div className="bg-[#4c9a2a] text-black p-4 rounded-lg font-medium">
                  Ad Spend: {selectedData.adsSpend}
                </div>
                <div className="bg-[#76ba1b] text-black p-4 rounded-lg font-medium">
                  Shipping: {selectedData.shipping}
                </div>
                <div className="bg-[#3db042] text-black p-4 rounded-lg font-medium">
                  Cost: {selectedData.cost}
                </div>
                <hr className="border-gray-200" />
                <div className="bg-[#1ef631] text-black p-4 rounded-lg font-semibold">
                  Net Profit: {selectedData.netProfit}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Marketing */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Marketing</h2>
        </div>

        {/* Marketing Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 w-full">
          {data.marketing.map(({ title, value }) => (
            <Card key={title}>
              <div className="text-sm text-gray-300">{title}</div>
              <div className="text-xl font-bold text-white">
                {value != null ? value : "—"}
              </div>
            </Card>
          ))}
        </div>

        {/* Marketing Chart */}
        <div className="bg-[#161616] rounded-2xl p-6">
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="space-x-2">
                {["Sales", "Order", "ROAS", "CPP"].map((metric) => (
                  <button
                    key={metric}
                    onClick={() => setSelectedMetric(metric)}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      selectedMetric === metric
                        ? "bg-[#00B0FF] text-white font-bold border"
                        : "bg-[#434343] text-white"
                    }`}
                  >
                    {metric}
                  </button>
                ))}
              </div>
            </div>
            {chartData[selectedMetric] && (
              <div className="h-64 bg-[#161616] rounded-lg p-4 z-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData[selectedMetric]}>
                    <XAxis dataKey="name" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#161616",
                        border: "none",
                      }}
                      labelStyle={{ color: "#fff" }}
                      itemStyle={{ color: "#3ADA83" }}
                    />
                    <defs>
                      <linearGradient id="colorUv" x1="0%" y1="0%" x2="100%" y2="0%">
                        {gradientStops}
                      </linearGradient>
                      <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        {gradientStops}
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="url(#lineGradient)"
                      fill="url(#colorUv)"
                      strokeWidth={3}
                      dot={{ fill: "#3ADA83", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Website Section */}
        <div className="pb-6">
          <h2 className="text-2xl font-bold mb-4">Website</h2>

          {/* Website Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 w-full">
            {data.website.map(({ title, value }) => (
              <Card key={title}>
                <div className="text-sm text-gray-300">{title}</div>
                <div className="text-xl font-bold text-white">
                  {value != null ? value : "—"}
                </div>
              </Card>
            ))}
          </div>

          {/* New vs Returning BarChart */}
          <div className="w-full bg-[#161616] p-4 h-64 rounded-lg mt-12 mb-12 z-1">
            <h3 className="text-lg font-semibold pb-4">
              New/Returning Customers
            </h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={websiteChart}>
                <XAxis dataKey="name" stroke="#888" />
                <YAxis stroke="#888" domain={[0, "auto"]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#161616",
                    border: "1px solid #2e2e2e",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
                    color: "#ffffff",
                  }}
                  cursor={{ fill: "#2e2e2e", opacity: 0.5 }}
                />
                <Bar dataKey="newCustomers" fill="#00FF00" style={{ cursor: "pointer" }} />
                <Bar dataKey="returningCustomers" fill="#FF4C91" style={{ cursor: "pointer" }} />
              </BarChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div className="flex justify-center mt-4 space-x-6 text-sm">
              <div className="flex items-center space-x-1">
                <span className="w-3 h-3 rounded-sm bg-[#00FF00]" />
                <span>New Customers</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-3 h-3 rounded-sm bg-[#FF4C91]" />
                <span>Returning Customers</span>
              </div>
            </div>
          </div>
        </div>

        {/* Best & Least Selling Products */}
        <div className="bg-[#161616] mt-10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="space-x-2">
              {["best", "least"].map((type) => (
                <button
                  key={type}
                  onClick={() => setProductView(type)}
                  className={`px-3 py-2 rounded-lg text-sm ${
                    productView === type
                      ? "bg-[#434343] text-white font-bold border"
                      : "bg-[#434343] text-white"
                  }`}
                >
                  {type === "best" ? "Best Selling Products" : "Least Selling Products"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Table */}
            <div className="lg:col-span-2">
              <table className="w-full text-left text-white">
                <thead className="border-b border-gray-700">
                  <tr className="text-gray-400 text-sm">
                    <th className="py-2">NO.</th>
                    <th className="py-2">Product Name</th>
                    <th className="py-2">Orders</th>
                    <th className="py-2">Total Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {(productView === "best"
                    ? bestSellingProducts
                    : leastSellingProducts
                  ).map((product, idx) => (
                    <tr
                      key={product.id}
                      className="border-b border-gray-800 text-sm"
                    >
                      <td className="py-2">{idx + 1}</td>
                      <td className="py-2">{product.name}</td>
                      <td className="py-2">{product.sales}</td>
                      <td className="py-2">{product.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* (You can add a small chart here if desired.) */}
          </div>
        </div>

        {/* Shipping Section */}
        <div>
          <h2 className="text-2xl font-bold pb-4">Shipping</h2>
          {/* Shipping Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 w-full">
            {data.shipping.map(({ title, value }) => (
              <Card key={title}>
                <div className="text-sm text-gray-300">{title}</div>
                <div className="text-xl font-bold text-white">
                  {value != null ? value : "—"}
                </div>
              </Card>
            ))}
          </div>

          {/* Shipping Analytics */}
          <div>
            <div className="flex justify-between items-center mt-6">
              <h2 className="text-2xl font-bold">Shipping Analytics</h2>
            </div>
            <div className="flex flex-wrap justify-around gap-6 p-6 mt-6">
              {/* Overall Shipment Status */}
              <div className="bg-[#161616] rounded-xl shadow-md p-4 w-[450px] shadow-xl">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-white font-semibold text-sm">
                    Overall Shipment Status
                  </h2>
                  <FiInfo className="text-white text-lg cursor-pointer" />
                </div>
                <PieChart width={400} height={350}>
                  <Pie
                    data={shipmentStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={110}
                    dataKey="value"
                    onClick={undefined}
                    style={{ cursor: "default", pointerEvents: "none" }}
                  >
                    {shipmentStatusData.map((entry, idx) => (
                      <Cell
                        key={`cell-${idx}`}
                        fill={shipmentColors[idx % shipmentColors.length]}
                        style={{
                          filter:
                            activeIndex === idx
                              ? "drop-shadow(0px 0px 10px rgba(3, 201, 0, 0.7))"
                              : "none",
                          transition: "filter 0.3s ease",
                        }}
                        onMouseEnter={() => onMouseEnter(idx)}
                        onMouseLeave={onMouseLeave}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      borderRadius: "8px",
                      border: "none",
                      color: "#000",
                    }}
                    cursor={{ fill: "transparent" }}
                  />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                    iconSize={12}
                    formatter={(value) => (
                      <span className="text-sm text-white">{value}</span>
                    )}
                  />
                </PieChart>
              </div>

              {/* Prepaid vs. COD Orders */}
              <div className="bg-[#161616] rounded-xl shadow-md p-4 w-[450px]">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-white font-semibold text-sm">
                    Prepaid vs. COD Orders
                  </h2>
                  <FiBarChart2 className="text-purple-400 text-lg cursor-pointer" />
                </div>
                <PieChart width={400} height={350}>
                  <Pie
                    data={prepaidCodData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={110}
                    dataKey="value"
                    onClick={undefined}
                    style={{ cursor: "default", pointerEvents: "none" }}
                  >
                    {prepaidCodData.map((entry, idx) => (
                      <Cell
                        key={`cell-cod-${idx}`}
                        fill={codColors[idx % codColors.length]}
                        style={{
                          filter:
                            activeIndex === idx
                              ? "drop-shadow(0px 0px 10px rgba(3, 201, 0, 0.7))"
                              : "none",
                          transition: "filter 0.3s ease",
                        }}
                        onMouseEnter={() => onMouseEnter(idx)}
                        onMouseLeave={onMouseLeave}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      borderRadius: "8px",
                      border: "none",
                      color: "#000",
                    }}
                    cursor={{ fill: "transparent" }}
                  />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                    iconSize={12}
                    formatter={(value) => (
                      <span className="text-sm text-white">{value}</span>
                    )}
                  />
                </PieChart>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
