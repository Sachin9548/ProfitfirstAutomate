import axios from "axios";
import NodeCache from "node-cache";
import ProductCost from "../../model/ProductCost.js";
import { format, eachDayOfInterval, parseISO } from "date-fns";
const dashboardCache = new NodeCache({ stdTTL: 3600 });

const formatToINR = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const toYMD = (date) => date.toISOString().split("T")[0];

const toISTDate = (dateStr) => {
  const date = new Date(dateStr);
  const istOffset = 330 * 60 * 1000; // +5:30 in ms
  const istDate = new Date(date.getTime() + istOffset);
  return istDate.toISOString().split("T")[0];
};

const getProductCosts = async (userId) => {
  const costData = await ProductCost.findOne({ userId });
  if (!costData) return new Map();
  return new Map(costData.products.map((p) => [p.productId, p.cost]));
};

const fetchMetaOverview = async (apiToken, adAccountId, startDate, endDate) => {
  const url = `https://graph.facebook.com/v20.0/act_${adAccountId}/insights`;
  const params = {
    access_token: apiToken,
    time_range: JSON.stringify({ since: startDate, until: endDate }),
    fields:
      "spend,impressions,cpm,ctr,clicks,cpc,reach,purchase_roas,website_purchase_roas",
  };

  const { data } = await axios.get(url, { params });

  if (!data.data || data.data.length === 0) {
    return {
      spend: 0,
      impressions: 0,
      cpm: 0,
      ctr: 0,
      clicks: 0,
      cpc: 0,
      reach: 0,
      purchase_roas: 0,
      website_purchase_roas: 0,
    };
  }

  const insight = data.data[0];

  const spend = parseFloat(insight.spend || 0);
  const impressions = parseInt(insight.impressions || 0, 10);
  const clicks = parseInt(insight.clicks || 0, 10);
  const ctr = parseFloat(insight.ctr || 0);
  const cpc = parseFloat(insight.cpc || 0);
  const cpm = parseFloat(insight.cpm || 0);
  const reach = parseInt(insight.reach || 0, 10);
  const purchase_roas = insight.purchase_roas
    ? parseFloat(insight.purchase_roas[0]?.value || 0)
    : 0;
  const website_purchase_roas = insight.website_purchase_roas
    ? parseFloat(insight.website_purchase_roas[0]?.value || 0)
    : 0;

  return {
    spend,
    impressions,
    ctr,
    clicks,
    cpc,
    cpm,
    reach,
    purchase_roas,
    website_purchase_roas,
  };
};
const fetchMetaDaily = async (apiToken, adAccountId, startDate, endDate) => {
  const url = `https://graph.facebook.com/v20.0/act_${adAccountId}/insights`;
  const params = {
    access_token: apiToken,
    time_range: JSON.stringify({ since: startDate, until: endDate }),
    fields: "spend,purchase_roas,clicks,impressions,reach,ctr,cpc,cpm",
    time_increment: 1,
  };

  const { data } = await axios.get(url, { params });

  // Build full interval so missing days are zero-filled
  const interval = eachDayOfInterval({
    start: parseISO(startDate),
    end: parseISO(endDate),
  });
  const zeroedTemplate = interval.map((day) => {
    const name = format(day, "MMM d");
    return {
      name,
      reach: 0,
      spend: 0,
      roas: 0,
      linkClicks: 0,
      impressions: 0,
      ctr: 0,
      cpc: 0,
      cpm: 0,
    };
  });

  if (!data.data || data.data.length === 0) {
    return zeroedTemplate;
  }

  // Map each day from API into a lookup
  const dailyMap = {};
  data.data.forEach((ins) => {
    const spend = parseFloat(ins.spend || 0);
    const roas = ins.purchase_roas
      ? parseFloat(ins.purchase_roas[0]?.value || 0)
      : 0;
    const linkClicks = parseInt(ins.clicks || 0, 10);
    const impressions = parseInt(ins.impressions || 0, 10);
    const reach = parseInt(ins.reach || 0, 10);
    const ctr = parseFloat(ins.ctr || 0);
    const cpc = parseFloat(ins.cpc || 0);
    const cpm = parseFloat(ins.cpm || 0);
    const date = ins.date_start; // e.g., "2025-08-01"
    const name = format(parseISO(date), "MMM d");

    dailyMap[name] = {
      name,
      reach,
      spend,
      roas,
      linkClicks,
      impressions,
      ctr,
      cpc,
      cpm,
    };
  });

  // Merge into full array preserving order
  return zeroedTemplate.map((d) => dailyMap[d.name] || d);
};

const toNum = (v) => {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const t = v.trim().toLowerCase();
    if (!t || t === "n/a" || t === "na" || t === "-") return 0;
    const cleaned = t.replace(/,/g, ""); // remove thousands separators
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

const getShiprocketData = async (apiToken, startDate, endDate) => {
  const url = `https://apiv2.shiprocket.in/v1/external/shipments`;
  const headers = { Authorization: `Bearer ${apiToken}` };

  const { data } = await axios.get(url, {
    headers,
    params: { from: startDate, to: endDate, per_page: 100 }, // Added per_page for safety
  });

  if (!data || !data.data) {
    // Return the new data structure even on failure
    return {
      totalShippingCost: 0,
      dailyShippingCosts: new Map(),
      shipping: [],
    };
  }

  let totalShippingCost = 0;
  const dailyShippingCosts = new Map(); // To store shipping cost per day // Initialize counters

  let totalShipments = 0,
    pickupPending = 0,
    inTransit = 0,
    delivered = 0;
  let ndrPending = 0,
    canceled = 0,
    rto = 0,
    codOrders = 0,
    prepaidOrders = 0;

  for (const order of data.data) {
    totalShipments++;

    const ch = order?.charges || {};
    const freight = toNum(ch.freight_charges);
    const codFee = toNum(ch.cod_charges);
    let orderCost = freight + codFee; // Base cost for any order

    const st = (order.status || "").toLowerCase();
    let isRTO = false; // Classify status

    if (st.startsWith("rto") || st.includes(" rto")) {
      rto++;
      isRTO = true;
    } else if (st.includes("pickup pending")) pickupPending++;
    else if (st.includes("in-transit") || st.includes("in transit"))
      inTransit++;
    else if (st.includes("ndr")) ndrPending++;
    else if (st.includes("delivered")) delivered++;
    else if (st.includes("cancelled") || st.includes("canceled")) canceled++; // **CORRECTION**: Only add RTO charges for RTO orders

    if (isRTO) {
      const rtoAmt =
        toNum(ch.charged_weight_amount_rto) ||
        toNum(ch.applied_weight_amount_rto);
      orderCost += rtoAmt;
    }

    totalShippingCost += orderCost;

    const orderDateStr = order.order_date;
    if (orderDateStr) {
      const istDate = toISTDate(new Date(orderDateStr).toISOString());
      const dayKey = format(parseISO(istDate), "MMM d");
      dailyShippingCosts.set(
        dayKey,
        (dailyShippingCosts.get(dayKey) || 0) + orderCost
      );
    }

    const pm = (order.payment_method || "").toLowerCase();
    if (pm === "cod") codOrders++;
    else if (pm === "prepaid") prepaidOrders++;
  }

  const shippingSummary = [
    {
      title: "Total Shipments",
      value: totalShipments,
      formula: "Total orders",
    },
    {
      title: "Pickup Pending",
      value: pickupPending,
      formula: "Orders still waiting to be picked up",
    },
    {
      title: "In-Transit",
      value: inTransit,
      formula: "Parcels currently moving through the network",
    },
    {
      title: "Delivered",
      value: delivered,
      formula: "Shipments delivered to the customer",
    },
    {
      title: "NDR Pending",
      value: ndrPending,
      formula: "Non-Delivery Reports awaiting action",
    },
    { title: "RTO", value: rto, formula: "Return-to-Origin" },
    { title: "CANCELED", value: canceled, formula: "Canceled orders before shipments " },
    { title: "COD", value: codOrders, formula: "COD Orders" },
    {
      title: "Prepaid Orders",
      value: prepaidOrders,
      formula: "Prepaid Orders",
    },
  ];

  return {
    totalShippingCost: +totalShippingCost.toFixed(2),
    dailyShippingCosts,
    shipping: shippingSummary,
  };
};

const getShopifyData = async (apiToken, shopUrl, startDateRaw, endDateRaw) => {
  const shopifyEndpoint = `https://${shopUrl}/admin/api/2025-07/graphql.json`;
  const headers = {
    "X-Shopify-Access-Token": apiToken,
    "Content-Type": "application/json",
  };
  const istStartString = `${startDateRaw}T00:00:00.000+05:30`;
  const istEndString = `${endDateRaw}T23:59:59.999+05:30`;
  const startISO = new Date(istStartString).toISOString();
  const endISO = new Date(istEndString).toISOString();

  const filterString = `created_at:>='${startISO}' AND created_at:<='${endISO}'`;

  const fetchOrders = async (afterCursor = null, accumulated = []) => {
    const query = `
      query($filter: String!, $after: String) {
        orders(first: 250, query: $filter, after: $after) {
          edges {
            node {
              createdAt
              totalPriceSet { shopMoney { amount } }
              customer { id }
              lineItems(first: 50) {
                edges {
                  node {
                    quantity
                    product { id title }
                  }
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;

    const variables = { filter: filterString, after: afterCursor };
    const resp = await axios.post(
      shopifyEndpoint,
      { query, variables },
      { headers }
    );
    const data = resp.data;

    if (data.errors && data.errors.length) {
      throw new Error(
        `Shopify GraphQL error: ${data.errors.map((e) => e.message).join("; ")}`
      );
    }

    if (!data.data || !data.data.orders) {
      throw new Error("Invalid Shopify Response: missing orders field");
    }

    const nodes = data.data.orders.edges.map((e) => e.node);
    accumulated.push(...nodes);

    if (data.data.orders.pageInfo.hasNextPage) {
      return fetchOrders(data.data.orders.pageInfo.endCursor, accumulated);
    }

    return accumulated;
  };

  return fetchOrders(null);
};

export const dashboard = async (req, res) => {
  try {
    const { user } = req;
    const SHOP = user.onboarding.step2.storeUrl;
    const SHOPIFY_TOKEN = user.onboarding.step2.accessToken;
    const AD_ACCOUNT_ID = user.onboarding.step4.adAccountId;
    const META_TOKEN = user.onboarding.step4.accessToken;
    const SHIPROCKET_TOKEN = user.onboarding.step5.token;
    let { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      const today = new Date();
      endDate = toYMD(today);
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
      startDate = toYMD(thirtyDaysAgo);
    }

    console.log("start state", startDate, "end date ", endDate);

    const formattedStart = toISTDate(new Date(startDate).toISOString());
    const formattedEnd = toISTDate(new Date(endDate).toISOString());
    const cacheKey = `dashboard_${user._id}_${formattedStart}_${formattedEnd}`;
    const cachedData = dashboardCache.get(cacheKey);
    // if (cachedData) {
    //   return res.status(200).json(cachedData);
    // }
    const [
      productCostsMap,
      metaDailyRaw,
      metaOverview,
      shiprocketDetails,
      shopifyOrders,
    ] = await Promise.all([
      getProductCosts(user._id),
      fetchMetaDaily(META_TOKEN, AD_ACCOUNT_ID, formattedStart, formattedEnd),
      fetchMetaOverview(
        META_TOKEN,
        AD_ACCOUNT_ID,
        formattedStart,
        formattedEnd
      ),
      getShiprocketData(SHIPROCKET_TOKEN, formattedStart, formattedEnd),
      getShopifyData(SHOPIFY_TOKEN, SHOP, formattedStart, formattedEnd),
    ]);

    const safeShiprocketDetails = shiprocketDetails || {
      totalShippingCost: 0,
      dailyShippingCosts: new Map(), // Use the new map
      shipping: [],
    };

    let totalRevenue = 0;
    let totalCOGS = 0;
    const customerOrders = {};
    const customerOrderCounts = {};
    const productSales = {};

    const dateInterval = eachDayOfInterval({
      start: parseISO(formattedStart),
      end: parseISO(formattedEnd),
    });

    const totalDays = dateInterval.length;

    const dailyAdsSpendMap = new Map(
      metaDailyRaw.map((d) => [d.name, d.spend || 0])
    );

    const dailyData = {};
    dateInterval.forEach((day) => {
      const dayKey = format(day, "MMM d");
      const adsSpendForDay = dailyAdsSpendMap.get(dayKey) || 0;

      const shippingCostForDay =
        safeShiprocketDetails.dailyShippingCosts.get(dayKey) || 0;

      dailyData[dayKey] = {
        name: dayKey,
        revenue: 0,
        cogs: 0,
        totalCosts: adsSpendForDay + shippingCostForDay,
        netProfit: 0,
        netProfitMargin: 0,
      };
    });



    const dailyCustomerBreakdown = {};
    dateInterval.forEach((day) => {
      const dayKey = format(day, "MMM d");
      dailyCustomerBreakdown[dayKey] = {
        newCustomers: 0,
        returningCustomers: 0,
      };
    });
    shopifyOrders.forEach((order) => {
      const orderRevenue = parseFloat(
        order.totalPriceSet?.shopMoney?.amount || 0
      );
      totalRevenue += orderRevenue;

      const orderDateObj = parseISO(order.createdAt);
      const dayKey = format(orderDateObj, "MMM d");
      if (dailyData[dayKey]) {
        dailyData[dayKey].revenue += orderRevenue;
      }

      const customerId = order.customer?.id;
      if (customerId) {
        customerOrderCounts[customerId] =
          (customerOrderCounts[customerId] || 0) + 1;
        if (!customerOrders[customerId]) customerOrders[customerId] = [];
        customerOrders[customerId].push(orderDateObj);
      }

      let orderCOGS = 0;
      order.lineItems?.edges?.forEach(({ node: item }) => {
        const productId = item.product.id.split("/").pop();
        const cost = productCostsMap.get(productId) || 0;
        const itemCOGS = cost * item.quantity;
        orderCOGS += itemCOGS;

        if (!productSales[productId]) {
          productSales[productId] = {
            name: item.product.title,
            sales: 0,
            total: 0,
          };
        }
        productSales[productId].sales += item.quantity;
        productSales[productId].total += orderRevenue;
      });

      totalCOGS += orderCOGS;
      if (dailyData[dayKey]) {
        dailyData[dayKey].cogs += orderCOGS;
      }
    });

    let newCustomers = 0;
    let returningCustomers = 0;
    Object.values(customerOrderCounts).forEach((count) => {
      if (count > 1) returningCustomers++;
      else newCustomers++;
    });
    const totalCustomers = newCustomers + returningCustomers;

    Object.entries(customerOrders).forEach(([customerId, dates]) => {
      if (!dates || dates.length === 0) return;
      const sorted = dates
        .map((d) => d)
        .sort((a, b) => a.getTime() - b.getTime());
      const firstDayKey = format(sorted[0], "MMM d");
      if (dailyCustomerBreakdown[firstDayKey]) {
        dailyCustomerBreakdown[firstDayKey].newCustomers += 1;
      }
      if (sorted.length > 1) {
        const laterDayKeys = sorted.slice(1).map((d) => format(d, "MMM d"));
        laterDayKeys.forEach((dk) => {
          if (dailyCustomerBreakdown[dk]) {
            dailyCustomerBreakdown[dk].returningCustomers += 1;
          }
        });
      }
    });
    Object.values(dailyData).forEach((day) => {
      day.totalCosts += day.cogs;
      day.netProfit = day.revenue - day.totalCosts;
      day.netProfitMargin =
        day.revenue > 0 ? (day.netProfit / day.revenue) * 100 : 0;
    });
    const totalOrders = shopifyOrders.length;
    const grossProfit = totalRevenue - totalCOGS;
    const adsSpend = metaOverview.spend;
    const netProfit =
      grossProfit - adsSpend - shiprocketDetails.totalShippingCost;
    const grossProfitMargin =
      totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const netProfitMargin =
      totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const poas = adsSpend > 0 ? netProfit / adsSpend : 0;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const cpp = totalOrders > 0 ? adsSpend / totalOrders : 0;
    const returningRate =
      totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;

    const sortedProducts = Object.values(productSales).sort(
      (a, b) => b.sales - a.sales
    );
    const bestSelling = sortedProducts
      .slice(0, 10)
      .map((p, i) => ({ ...p, id: i + 1, total: formatToINR(p.total) }));
    const leastSelling = sortedProducts
      .slice(-10)
      .reverse()
      .map((p, i) => ({ ...p, id: i + 11, total: formatToINR(p.total) }));
    const roasValue =
      typeof metaOverview.purchase_roas === "number"
        ? metaOverview.purchase_roas
        : 0;
    const customerChartData = dateInterval.map((day) => {
      const dayKey = format(day, "MMM d");
      const { newCustomers: nc = 0, returningCustomers: rc = 0 } =
        dailyCustomerBreakdown[dayKey] || {};
      return {
        name: dayKey,
        newCustomers: nc,
        returningCustomers: rc,
      };
    });
    const marketingChartData = metaDailyRaw.map((d) => ({
      name: d.name,
      reach: d.reach || 0,
      spend: d.spend || 0,
      roas: d.roas || 0,
      linkClicks: d.linkClicks || 0,
    }));
    const shipping = safeShiprocketDetails.shipping;
    const totalShippingCost = safeShiprocketDetails.totalShippingCost;
    const responseData = {
      summary: [
        {
          title: "Total Orders",
          value: totalOrders,
          formula: "Total Sales",s
        },
        {
          title: "Revenue",
          value: formatToINR(totalRevenue),
          formula: "Total value of all sales",
        },
        {
          title: "COGS",
          value: formatToINR(totalCOGS),
          formula: "Cost of Goods Sold",
        },
        {
          title: "Ads Spend",
          value: formatToINR(adsSpend),
          formula: "Total spend from all ad campaigns",
        },
        {
          title: "Shipping Cost",
          value: formatToINR(totalShippingCost),
          formula: "Total cost for shipping orders",
        },
        {
          title: "Net Profit",
          value: formatToINR(netProfit),
          formula: "Revenue - COGS - Ads Spend - Shipping",
        },
        {
          title: "Gross Profit",
          value: formatToINR(grossProfit),
          formula: "Revenue - COGS",
        },
        {
          title: "Gross Profit Margin",
          value: `${grossProfitMargin.toFixed(2)}%`,
          formula: "(Gross Profit / Revenue) * 100",
        },
        {
          title: "Net Profit Margin",
          value: `${netProfitMargin.toFixed(2)}%`,
          formula: "(Net Profit / Revenue) * 100",
        },
        {
          title: "ROAS",
          value: roasValue.toFixed(2),
          formula: "Return On Ad Spend (from Meta)",
        },
        {
          title: "POAS",
          value: `${poas.toFixed(2)}%`,
          formula: "(Net Profit / Ads Spend) * 100",
        },
        {
          title: "Avg. Order Value",
          value: formatToINR(avgOrderValue),
          formula: "Revenue / Total Orders",
        },
      ],
      marketing: [
        {
          title: "Amount Spent",
          value: formatToINR(adsSpend),
          formula: "Total ad spend",
        },
        {
          title: "CPP",
          value: formatToINR(cpp),
          formula: "Ads Spend / Total Orders",
        },
        {
          title: "ROAS",
          value: roasValue.toFixed(2),
          formula: "Return On Ad Spend (from Meta)",
        },
        {
          title: "Link Clicks",
          value: metaOverview.clicks || 0,
          formula: "Total clicks on ad links",
        },
        {
          title: "CPC",
          value: formatToINR(metaOverview.cpc || 0),
          formula: "Ads Spend / Link Clicks",
        },
        {
          title: "CTR",
          value: `${(metaOverview.ctr || 0).toFixed(2)}%`,
          formula: "(Link Clicks / Impressions)", //(Link Clicks / Impressions) * 100
        },
        {
          title: "Impressions",
          value: metaOverview.impressions || 0,
          formula: "Total times ads were shown",
        },
        {
          title: "CPM",
          value: formatToINR(metaOverview.cpm || 0),
          formula: "(Ads Spend / Impressions) * 1000",
        },
        {
          title: "Reach",
          value: metaOverview.reach || 0,
          formula: "Total unique users who saw ads",
        },
      ],
      website: [
        {
          title: "Total Sales",
          value: formatToINR(totalRevenue),
          formula: "Total revenue from sales",
        },
        {
          title: "Total Orders",
          value: totalOrders,
          formula: "Total count of orders",
        },
        {
          title: "Total Customers",
          value: totalCustomers,
          formula: "New + Returning Customers",
        },
        {
          title: "Returning Rate",
          value: `${returningRate.toFixed(2)}%`,
          formula: "(Returning Customers / Total Customers) * 100",
        },
      ],
      shipping,
      products: {
        bestSelling,
        leastSelling,
      },
      performanceChartData: Object.values(dailyData),
      financialsBreakdownData: {
        revenue: totalRevenue,
        list: [
          { name: "Revenue", value: totalRevenue, color: "#16A34A" },
          { name: "Gross Profit", value: grossProfit, color: "#2563EB" },
          { name: "Net Profit", value: netProfit, color: "#FBBF24" },
          { name: "COGS", value: totalCOGS, color: "#F43F5E" },
          { name: "Ads Spend", value: adsSpend, color: "#A855F7" },
          {
            name: "Shipping",
            value: shiprocketDetails.totalShippingCost,
            color: "#6366F1",
          },
        ],
        pieData: [
          { name: "COGS", value: totalCOGS, color: "#F43F5E" },
          { name: "Ads Spend", value: adsSpend, color: "#A855F7" },
          {
            name: "Shipping",
            value: shiprocketDetails.totalShippingCost,
            color: "#6366F1",
          },
          ...(netProfit > 0
            ? [{ name: "Net Profit", value: netProfit, color: "#FBBF24" }]
            : []),
        ],
      },
      charts: {
        websiteTraffic: [
          { name: "New Customers", value: newCustomers },
          { name: "Returning Customers", value: returningCustomers },
        ],
        customerTypeByDay: customerChartData,
        marketing: marketingChartData,
      },
    };
    dashboardCache.set(cacheKey, responseData);
    res.status(200).json(responseData);
  } catch (error) {
    console.error("Dashboard API Error:", error.message);
    res.status(500).json({
      message: "Failed to fetch dashboard data.",
      error: error.message,
    });
  }
};
