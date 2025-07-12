
import axios from "axios";
import http from "http";
import https from "https";
import NodeCache from "node-cache";
import MetaCredential from "../../model/MetaCredential.js";

const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });

// In-memory cache (10-minute TTL)
const cache = new NodeCache({ stdTTL: 600 });

// Format number to 2 decimals (returns a Number, e.g. 123.45)
const fmt = (v) => Number((v || 0).toFixed(2));

// Ensure full-day ISO for end dates
const toFullDayISO = (dateStr) => {
  if (!dateStr) return undefined;
  return `${dateStr}T23:59:59Z`;
};

// Convert JS Date to YYYY-MM-DD in UTC, preserving local day
const toLocalYMD = (jsDate) => {
  const offsetMs = jsDate.getTimezoneOffset() * 60 * 1000;
  const localDate = new Date(jsDate.getTime() - offsetMs);
  return localDate.toISOString().split("T")[0];
};


async function fetchAllShopifyResources(url, params = {}, headers = {}) {
  const results = [];
  let nextPageInfo = null;
  let isFirst = true;

  do {
    const requestParams = isFirst
      ? { ...params, limit: 250 }
      : { limit: 250, page_info: nextPageInfo };

    const resp = await axios.get(url, {
      headers,
      params: requestParams,
      httpAgent,
      httpsAgent,
    });

    const rootKey = url.includes("/orders.json")
      ? "orders"
      : url.includes("/customers.json")
      ? "customers"
      : null;
    const pageItems = rootKey ? resp.data[rootKey] : [];
    results.push(...(pageItems || []));

    const link = resp.headers.link;
    nextPageInfo = null;
    if (link) {
      const match = link.match(/<[^>]*[?&]page_info=([^>]+)>;\s*rel="next"/);
      if (match) nextPageInfo = match[1];
    }

    isFirst = false;
  } while (nextPageInfo);

  return results;
}

async function fetchShopifySummary({ SHOP, SHOPIFY_TOKEN, startDate, endDate }) {
  const base = `https://${SHOP}/admin/api/2023-10`;
  const headers = { "X-Shopify-Access-Token": SHOPIFY_TOKEN };

  const created_at_min = startDate ? `${startDate}T00:00:00Z` : undefined;
  const created_at_max = endDate ? toFullDayISO(endDate) : undefined;

  const orderFields = "id,total_price,created_at,line_items"; // Only necessary fields
  const orderParams = {
    status: "any",
    financial_status: "paid",
    fields: orderFields,
    ...(created_at_min ? { created_at_min } : {}),
    ...(created_at_max ? { created_at_max } : {}),
  };

  const orders = await fetchAllShopifyResources(`${base}/orders.json`, orderParams, headers);
  const customerFields = "id,created_at,orders_count"; // Only necessary fields
  const customerParams = {
    fields: customerFields,
    ...(created_at_min ? { created_at_min } : {}),
    ...(created_at_max ? { created_at_max } : {}),
  };
  const customers = await fetchAllShopifyResources(`${base}/customers.json`, customerParams, headers);

  let totalRevenue = 0, totalProductSales = 0;
  const productSalesMap = new Map();
  const ordersCount = orders.length;

  // Combine totalRevenue and product sales in one loop
  orders.forEach((order) => {
    totalRevenue += parseFloat(order.total_price || 0);
    order.line_items.forEach((item) => {
      const pid = item.product_id;
      const qty = item.quantity;
      const price = parseFloat(item.price || 0);

      if (!productSalesMap.has(pid)) {
        productSalesMap.set(pid, { quantity: 0, revenue: 0, title: item.title });
      }

      const entry = productSalesMap.get(pid);
      entry.quantity += qty;
      entry.revenue += price * qty;

      totalProductSales += price * qty; // Keep track of total product sales
    });
  });

  const avgOrderValue = ordersCount ? totalRevenue / ordersCount : 0;
  const customersCount = customers.length;
  const newCustomersCount = customers.filter((c) => c.orders_count === 1).length;
  const returningCustomersCount = customersCount - newCustomersCount;
  const returningRate = customersCount ? (returningCustomersCount / customersCount) * 100 : 0;

  // Sorting and extracting best and least selling products
  const sortedProducts = Array.from(productSalesMap.entries()).map(([id, { quantity, revenue, title }]) => ({
    id: parseInt(id, 10),
    name: title,
    quantity,
    revenue,
  }));

  sortedProducts.sort((a, b) => b.quantity - a.quantity);
  const bestSelling = sortedProducts.slice(0, 5);
  const leastSelling = sortedProducts.slice(-5).sort((a, b) => a.quantity - b.quantity);

  return {
    totalRevenue,
    ordersCount,
    avgOrderValue,
    customersCount,
    newCustomersCount,
    returningCustomersCount,
    returningRate,
    totalProductSales,
    bestSelling,
    leastSelling,
  };
}

async function fetchShopifyCharts({ SHOP, SHOPIFY_TOKEN }) {
  const base = `https://${SHOP}/admin/api/2025-04`;
  const headers = { "X-Shopify-Access-Token": SHOPIFY_TOKEN };
  const today = new Date();
  const year = today.getFullYear();
  const created_at_min = `${year}-01-01T00:00:00Z`;
  const created_at_max = toFullDayISO(toLocalYMD(today));
  
  const orderFields = "id,created_at,total_price"; // Only required fields
  const orderParams = {
    status: "any",
    financial_status: "paid",
    fields: orderFields,
    created_at_min,
    created_at_max,
  };
  const orders = await fetchAllShopifyResources(`${base}/orders.json`, orderParams, headers);

  const customerFields = "id,created_at,orders_count"; // Only required fields
  const customerParams = {
    fields: customerFields,
    created_at_min,
    created_at_max,
  };
  const customers = await fetchAllShopifyResources(`${base}/customers.json`, customerParams, headers);

  const monthlySalesMap = {};
  const monthlyOrdersMap = {};
  const monthlyCustomerBreakdownMap = {};

  // Loop once to calculate sales, orders, and customer breakdown
  orders.forEach((order) => {
    const d = new Date(order.created_at);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    
    monthlySalesMap[ym] = (monthlySalesMap[ym] || 0) + parseFloat(order.total_price || 0);
    monthlyOrdersMap[ym] = (monthlyOrdersMap[ym] || 0) + 1;
  });

  customers.forEach((cust) => {
    const d = new Date(cust.created_at);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    
    if (!monthlyCustomerBreakdownMap[ym]) {
      monthlyCustomerBreakdownMap[ym] = { newCustomers: 0, returningCustomers: 0 };
    }
    if (cust.orders_count === 1) {
      monthlyCustomerBreakdownMap[ym].newCustomers++;
    } else {
      monthlyCustomerBreakdownMap[ym].returningCustomers++;
    }
  });

  const sixMonths = [];
  const currentMonthIdx = today.getMonth();
  for (let i = 5; i >= 0; i--) {
    const dt = new Date(year, currentMonthIdx - i, 1);
    const ymKey = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    const monthName = dt.toLocaleString("default", { month: "short", timeZone: "UTC" }).toUpperCase();
    sixMonths.push({ ymKey, monthName });
  }

  const monthlySales = [];
  const monthlyOrders = [];
  const monthlyCustomerBreakdown = [];
  sixMonths.forEach(({ ymKey, monthName }) => {
    monthlySales.push({ name: monthName, value: fmt(monthlySalesMap[ymKey] || 0) });
    monthlyOrders.push({ name: monthName, value: monthlyOrdersMap[ymKey] || 0 });
    const breakdown = monthlyCustomerBreakdownMap[ymKey] || { newCustomers: 0, returningCustomers: 0 };
    monthlyCustomerBreakdown.push({ name: monthName, newCustomers: breakdown.newCustomers, returningCustomers: breakdown.returningCustomers });
  });

  return { monthlySales, monthlyOrders, monthlyCustomerBreakdown };
}




async function fetchAdsSummary({ AD_ACCOUNT_ID, META_TOKEN, startDate, endDate }) {
  const baseUrl = `https://graph.facebook.com/v16.0/act_${AD_ACCOUNT_ID}/insights`;
  const fields = "spend,impressions,clicks,reach,actions";
  const params = {
    access_token: META_TOKEN,
    level: "account",
    fields,
  };

  if (startDate && endDate) {
    params.time_range = JSON.stringify({ since: startDate, until: endDate });
  } else {
    params.date_preset = "last_30d";
  }

  const resp = await axios.get(baseUrl, { params, httpAgent, httpsAgent });
  const dataRow = (resp.data.data && resp.data.data[0]) || {};

  const totalSpend = parseFloat(dataRow.spend || 0);
  const totalImpressions = +dataRow.impressions || 0;
  const totalClicks = +dataRow.clicks || 0;
  const totalReach = +dataRow.reach || 0;

  let totalPurchases = 0, totalPurchaseValue = 0;
  if (Array.isArray(dataRow.actions)) {
    dataRow.actions.forEach((act) => {
      const type = String(act.action_type || "").toLowerCase();
      if (type.includes("purchase")) {
        const val = +act.value || 0;
        totalPurchases += val;
        totalPurchaseValue += val;
      }
    });
  }

  const roas = totalSpend ? totalPurchaseValue / totalSpend : 0;
  const cpp = totalPurchases ? totalSpend / totalPurchases : 0;
  const ctr = totalImpressions ? (totalClicks / totalImpressions) * 100 : 0;
  const cpc = totalClicks ? totalSpend / totalClicks : 0;
  const cpm = totalImpressions ? totalSpend / (totalImpressions / 1000) : 0;

  return {
    totalSpend,
    totalImpressions,
    totalClicks,
    totalReach,
    totalPurchases,
    roas,
    cpp,
    ctr,
    cpc,
    cpm,
  };
}

async function fetchAdsCharts({ AD_ACCOUNT_ID, META_TOKEN }) {
  const baseUrl = `https://graph.facebook.com/v16.0/act_${AD_ACCOUNT_ID}/insights`;
  const fields = "spend,actions";

  const today = new Date();
  const year = today.getFullYear();
  const since = `${year}-01-01`;
  const until = toLocalYMD(today);

  const params = {
    access_token: META_TOKEN,
    level: "account",
    fields,
    time_increment: "monthly",
    time_range: JSON.stringify({ since, until }),
  };

  const resp = await axios.get(baseUrl, { params, httpAgent, httpsAgent });
  const dataRows = resp.data.data || [];

  const monthlyMetrics = dataRows.map((row) => {
    const d = new Date(row.date_start);
    const monthName = d
      .toLocaleString("default", { month: "short", timeZone: "UTC" })
      .toUpperCase();
    const spend = parseFloat(row.spend || 0);

    let purchases = 0;
    let purchaseValue = 0;
    if (Array.isArray(row.actions)) {
      row.actions.forEach((act) => {
        const type = String(act.action_type || "").toLowerCase();
        if (type.includes("purchase")) {
          const val = +act.value || 0;
          purchases += val;
          purchaseValue += val;
        }
      });
    }

    const roas = spend ? purchaseValue / spend : 0;
    const cpp = purchases ? spend / purchases : 0;
    return {
      name: monthName,
      year,
      roas: fmt(roas),
      cpp: fmt(cpp),
    };
  });

  return monthlyMetrics;
}

async function fetchAllShiprocketOrders({
  SHIPROCKET_TOKEN,
  fromDate,
  toDate,
}) {
  const headers = { Authorization: `Bearer ${SHIPROCKET_TOKEN}` };
  let params = { page: 1, per_page: 500 };
  if (fromDate) params.from = fromDate;
  if (toDate) params.to = toDate;

  const allOrders = [];
  while (true) {
    const resp = await axios.get(
      "https://apiv2.shiprocket.in/v1/external/orders",
      {
        headers,
        params,
        httpAgent,
        httpsAgent,
      }
    );
    const ordersPage = resp.data.data || [];
    if (!ordersPage.length) break;
    allOrders.push(...ordersPage);
    if (ordersPage.length < params.per_page) break;
    params.page += 1;
  }
  return allOrders;
}

async function fetchShiprocketSummary({ SHIPROCKET_TOKEN, startDate, endDate }) {
  const fromDate = startDate || undefined;
  const toDate = endDate || undefined;

  const allOrders = await fetchAllShiprocketOrders({ SHIPROCKET_TOKEN, fromDate, toDate });
  const shipments = allOrders.flatMap((o) => Array.isArray(o.shipments) ? o.shipments : o.shipment ? [o.shipment] : []);

  let totalShippingCost = 0, delivered = 0, inTransit = 0, pickupPending = 0, ndrPending = 0;
  let rtoCount = 0, undelivered = 0, codCount = 0, prepaidCount = 0, codPending = 0, codRemitted = 0;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);

  shipments.forEach((s) => {
    const cost = Number(s.cost) || 0;
    totalShippingCost += cost;

    if (s.delivered_date && s.delivered_date !== "0000-00-00 00:00:00") {
      delivered++;
    } else if (s.rto_delivered_date && s.rto_delivered_date !== "0000-00-00 00:00:00") {
      rtoCount++;
    } else if (Number(s.status) === 11) {
      ndrPending++;
    } else if (Number(s.status) === 10) {
      undelivered++;
    } else if (s.pickup_scheduled_date && s.pickup_scheduled_date !== "0000-00-00 00:00:00") {
      pickupPending++;
    } else if (s.shipped_date && s.shipped_date !== "0000-00-00 00:00:00") {
      inTransit++;
    }

    const pm = (s.payment_mode || "").toLowerCase();
    if (pm.includes("cod")) {
      codCount++;
      if (!s.delivered_date || s.delivered_date === "0000-00-00 00:00:00") codPending++;
      const createdAt = new Date(s.created_at);
      if (createdAt <= cutoff) codRemitted += Number(s.cod_amount || 0);
    } else if (pm.includes("prepaid")) {
      prepaidCount++;
    }
  });

  return {
    totalShipments: shipments.length,
    totalShippingCost,
    delivered,
    inTransit,
    pickupPending,
    ndrPending,
    rtoCount,
    undelivered,
    codCount,
    prepaidCount,
    codPending,
    codRemitted,
  };
}


async function fetchShiprocketCharts({ SHIPROCKET_TOKEN }) {
  const today = new Date();
  const year = today.getFullYear();
  const fromDate = `${year}-01-01`;
  const toDate = toLocalYMD(today);

  const allOrders = await fetchAllShiprocketOrders({
    SHIPROCKET_TOKEN,
    fromDate,
    toDate,
  });
  const shipments = allOrders.flatMap((o) =>
    Array.isArray(o.shipments) ? o.shipments : o.shipment ? [o.shipment] : []
  );

  const monthlyCostMap = {};
  shipments.forEach((s) => {
    const shipped =
      s.shipped_date && s.shipped_date !== "0000-00-00 00:00:00"
        ? s.shipped_date
        : s.created_at;
    const d = new Date(shipped);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
    monthlyCostMap[ym] = (monthlyCostMap[ym] || 0) + Number(s.cost || 0);
  });
  const currentMonthIdx = today.getMonth();
  const sixMonths = [];
  for (let i = 5; i >= 0; i--) {
    const dt = new Date(year, currentMonthIdx - i, 1);
    const ymKey = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
    const monthName = dt
      .toLocaleString("default", { month: "short", timeZone: "UTC" })
      .toUpperCase();
    sixMonths.push({ ymKey, monthName });
  }

  const monthlyShip = [];
  sixMonths.forEach(({ ymKey, monthName }) => {
    monthlyShip.push({
      name: monthName,
      shippingCost: fmt(monthlyCostMap[ymKey] || 0),
    });
  });

  return monthlyShip;
}

export const dashboard = async (req, res) => {
  const SHOP = req.user.onboarding.step2.storeUrl;
  const SHOPIFY_TOKEN = req.user.onboarding.step2.accessToken;
  const AD_ACCOUNT_ID = req.user.onboarding.step4.adAccountId;
  const metaCred = await MetaCredential.findOne();
  const META_TOKEN = metaCred?.accessToken || null;
  const SHIPROCKET_TOKEN = req.user.onboarding.step5.token;
  let { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    startDate = toLocalYMD(thirtyDaysAgo);
    endDate = toLocalYMD(today);
  }

  // Cache key based on store + date range
  const cacheKey = `${SHOP}|${startDate}|${endDate}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return res.status(200).json(cached);
  }

  let shopifySummary = {
    totalRevenue: 0,
    ordersCount: 0,
    avgOrderValue: 0,
    customersCount: 0,
    newCustomersCount: 0,
    returningCustomersCount: 0,
    returningRate: 0,
    totalProductSales: 0,
    bestSelling: [],
    leastSelling: [],
  };
  let shopifyCharts = {
    monthlySales: [],
    monthlyOrders: [],
    monthlyCustomerBreakdown: [],
  };
  let adsSummary = {
    totalSpend: 0,
    totalImpressions: 0,
    totalClicks: 0,
    totalReach: 0,
    totalPurchases: 0,
    roas: 0,
    cpp: 0,
    ctr: 0,
    cpc: 0,
    cpm: 0,
  };
  let adsCharts = [];
  let shiprocketSummary = {
    totalShipments: 0,
    totalShippingCost: 0,
    delivered: 0,
    inTransit: 0,
    pickupPending: 0,
    ndrPending: 0,
    rtoCount: 0,
    undelivered: 0,
    codCount: 0,
    prepaidCount: 0,
    codPending: 0,
    codRemitted: 0,
  };
  let shiprocketCharts = [];

  const promises = [
    fetchShopifySummary({ SHOP, SHOPIFY_TOKEN, startDate, endDate }).catch(
      (err) => {
        console.error("Shopify summary error", err);
        return shopifySummary;
      }
    ),
    fetchShopifyCharts({ SHOP, SHOPIFY_TOKEN }).catch((err) => {
      console.error("Shopify charts error", err);
      return shopifyCharts;
    }),
    META_TOKEN
      ? fetchAdsSummary({
          AD_ACCOUNT_ID,
          META_TOKEN,
          startDate,
          endDate,
        }).catch((err) => {
          console.error("Ads summary error", err);
          return adsSummary;
        })
      : Promise.resolve(adsSummary),
    META_TOKEN
      ? fetchAdsCharts({ AD_ACCOUNT_ID, META_TOKEN }).catch((err) => {
          console.error("Ads charts error", err);
          return adsCharts;
        })
      : Promise.resolve(adsCharts),
    fetchShiprocketSummary({ SHIPROCKET_TOKEN, startDate, endDate }).catch(
      (err) => {
        console.error("Shiprocket summary error", err);
        return shiprocketSummary;
      }
    ),
    fetchShiprocketCharts({ SHIPROCKET_TOKEN }).catch((err) => {
      console.error("Shiprocket charts error", err);
      return shiprocketCharts;
    }),
  ];

  [
    shopifySummary,
    shopifyCharts,
    adsSummary,
    adsCharts,
    shiprocketSummary,
    shiprocketCharts,
  ] = await Promise.all(promises);

 const poas = shiprocketSummary.totalShippingCost > 0
    ? shopifySummary.totalRevenue / shiprocketSummary.totalShippingCost
    : null;


    
  const summary = [
    { title: "Revenue", value: fmt(shopifySummary.totalRevenue) },
    { title: "Orders", value: shopifySummary.ordersCount },
    { title: "Ads Spend", value: fmt(adsSummary.totalSpend) },
    {
      title: "Shipping Spend",
      value: fmt(shiprocketSummary.totalShippingCost),
    },
    { title: "Product Sales", value: fmt(shopifySummary.totalProductSales) },
    {
      title: "Gross Profit",
      value: fmt(
        shopifySummary.totalRevenue - shopifySummary.totalProductSales
      ),
    },
    {
      title: "Net Profit",
      value: fmt(
        shopifySummary.totalRevenue -
          shopifySummary.totalProductSales -
          shiprocketSummary.totalShippingCost -
          adsSummary.totalSpend
      ),
    },
    { title: "AOV", value: fmt(shopifySummary.avgOrderValue) },
    { title: "ROAS", value: fmt(adsSummary.roas) },
    { title: "POAS", value: poas !== null ? fmt(poas) : null },
  ];

  const marketing = [
    { title: "Orders No.", value: adsSummary.totalPurchases },
    { title: "Amount Spend", value: fmt(adsSummary.totalSpend) },
    { title: "CPP", value: fmt(adsSummary.cpp) },
    { title: "ROAS", value: fmt(adsSummary.roas) },
    { title: "Link Clicks", value: adsSummary.totalClicks },
    { title: "CPC", value: fmt(adsSummary.cpc) },
    { title: "CTR", value: fmt(adsSummary.ctr) },
    { title: "Impression", value: adsSummary.totalImpressions },
    { title: "CPM", value: fmt(adsSummary.cpm) },
    { title: "Reach", value: adsSummary.totalReach },
  ];

  const website = [
    { title: "Total Sales", value: fmt(shopifySummary.totalRevenue) },
    { title: "Total Orders", value: shopifySummary.ordersCount },
    { title: "Total Customers", value: shopifySummary.customersCount },
    { title: "AOV", value: fmt(shopifySummary.avgOrderValue) },
    { title: "Returning Rate", value: fmt(shopifySummary.returningRate) },
    { title: "Website Visitors", value: null },
    { title: "Conversion Rate", value: null },
    { title: "Sell-Through Rate", value: null },
  ];

  const shipping = [
    { title: "Total Shipments", value: shiprocketSummary.totalShipments },
    { title: "Pickup Pending", value: shiprocketSummary.pickupPending },
    { title: "In-Transit", value: shiprocketSummary.inTransit },
    { title: "Delivered", value: shiprocketSummary.delivered },
    { title: "NDR Pending", value: shiprocketSummary.ndrPending },
    { title: "RTO", value: shiprocketSummary.rtoCount },
    { title: "Total COD", value: shiprocketSummary.codCount },
    { title: "Prepaid Orders", value: shiprocketSummary.prepaidCount },
    { title: "COD Pending", value: shiprocketSummary.codPending },
    { title: "Last COD Remitted", value: fmt(shiprocketSummary.codRemitted) },
  ];

  const performanceCharts = {
    Sales: shopifyCharts.monthlySales,
    Order: shopifyCharts.monthlyOrders,
    ROAS: adsCharts.map((m) => ({ name: m.name, value: m.roas })),
    CPP: adsCharts.map((m) => ({ name: m.name, value: m.cpp })),
  };

  const websiteTraffic = shopifyCharts.monthlyCustomerBreakdown;

  const profitLoss = shopifyCharts.monthlySales.map((m, idx) => {
    const sales = m.value;
    const ordersM = shopifyCharts.monthlyOrders[idx]?.value || 0;
    const avgCostPerOrder =
      shopifySummary.totalRevenue && shopifySummary.ordersCount
        ? shopifySummary.totalRevenue / shopifySummary.ordersCount
        : 0;
    const cost = avgCostPerOrder * ordersM;

    const adEntry = adsCharts.find((x) => x.name === m.name) || { roas: 0 };
    const roasM = adEntry.roas;
    const adSpend = roasM ? sales / roasM : 0;

    const shipEntry = shiprocketCharts.find((x) => x.name === m.name) || {
      shippingCost: 0,
    };
    const shipCost = shipEntry.shippingCost;

    return {
      month: m.name,
      year: adsCharts[0]?.year || new Date().getFullYear(), // fallback if adsCharts is empty
      cost: fmt(cost),
      sales: fmt(sales),
      adsSpend: fmt(adSpend),
      shipping: fmt(shipCost),
      netProfit: fmt(sales - (cost + adSpend + shipCost)),
    };
  });

  const products = {
    bestSelling: shopifySummary.bestSelling.map((p) => ({
      id: p.id,
      name: p.name,
      sales: p.quantity,
      total: fmt(p.revenue),
    })),
    leastSelling: shopifySummary.leastSelling.map((p) => ({
      id: p.id,
      name: p.name,
      sales: p.quantity,
      total: fmt(p.revenue),
    })),
  };

  const pieCharts = {
    shipmentStatus: [
      { name: "Delivered", value: shiprocketSummary.delivered },
      { name: "RTO", value: shiprocketSummary.rtoCount },
      { name: "InTransit", value: shiprocketSummary.inTransit },
      { name: "Undelivered", value: shiprocketSummary.undelivered },
      { name: "NDR Pending", value: shiprocketSummary.ndrPending },
    ],
    prepaidVsCod: [
      { name: "Prepaid", value: shiprocketSummary.prepaidCount },
      { name: "COD", value: shiprocketSummary.codCount },
    ],
  };


   const result = {
    summary,
    marketing,
    website,
    shipping,
    charts: {
      performance: performanceCharts,
      websiteTraffic,
      profitLoss,
    },
    products,
    pieCharts,
  };
  cache.set(cacheKey, result);
  res.status(200).json(result);
};
