import axios from "axios";
import MetaCredential from "../model/MetaCredential.js";

function formatValue(num) {
  if (typeof num !== "number" || isNaN(num)) return num;
  if (num >= 100000) {
    return (num / 100000).toFixed(2) + "L";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(2) + "K";
  } else {
    return num.toFixed(2);
  }
}

function formatPercent(ratio) {
  if (typeof ratio !== "number" || isNaN(ratio)) return ratio;
  return (ratio * 100).toFixed(2) + "%";
}

async function fetchAllShopifyOrders(storeUrl, accessToken) {
  const cleanStore = storeUrl.replace(/\/$/, "");
  const baseUrl = `https://${cleanStore}/admin/api/2023-04/orders.json`;
  const headers = {
    "X-Shopify-Access-Token": accessToken,
    "Content-Type": "application/json",
  };

  const allOrders = [];
  let nextPageInfo = null;
  let isFirstPage = true;

  try {
    do {
      let url = baseUrl;
      if (isFirstPage) {
        url += "?status=any&limit=250";
      } else {
        url += `?limit=250&page_info=${encodeURIComponent(nextPageInfo)}`;
      }

      const response = await axios.get(url, { headers, timeout: 10000 });
      const orders = response.data?.orders;

      if (!Array.isArray(orders)) {
        throw new Error("Invalid Shopify payload (orders is not an array)");
      }
      allOrders.push(...orders);

      const linkHeader = response.headers.link || "";
      const match = linkHeader.match(
        /<[^>]*page_info=([^&>]+)[^>]*>;\s*rel="next"/
      );
      nextPageInfo = match ? match[1] : null;
      isFirstPage = false;
    } while (nextPageInfo);

    return allOrders;
  } catch (err) {
    if (err.response) {
      console.error(
        "Shopify responded with status",
        err.response.status,
        "| body:",
        err.response.data
      );
    } else {
      console.error("Error fetching Shopify orders:", err.message);
    }
    throw new Error("Failed to fetch Shopify orders");
  }
}

function processShopifyData(orders) {
  if (!orders || !orders.length) return null;

  const metrics = {
    totalOrders: orders.length,
    totalSales: 0,
    totalProductsSold: 0,
    totalDiscounts: 0,
    totalTaxes: 0,
    totalShipping: 0,
    totalRefunds: 0,
    productSales: {},
    customerSet: new Set(),
    deliveredOrders: 0,
  };

  orders.forEach((order) => {
    metrics.totalSales += parseFloat(order.total_price || "0");
    metrics.totalDiscounts += parseFloat(order.total_discounts || "0");
    metrics.totalTaxes += parseFloat(order.total_tax || "0");
    metrics.totalShipping += parseFloat(
      order.total_shipping_price_set?.presentment_money?.amount || "0"
    );
    metrics.totalRefunds += parseFloat(order.total_refunded || "0");

    (order.line_items || []).forEach((item) => {
      const qty = item.quantity || 0;
      const price = parseFloat(item.price || "0");
      metrics.totalProductsSold += qty;

      if (!metrics.productSales[item.product_id]) {
        metrics.productSales[item.product_id] = {
          name: item.name,
          totalSold: 0,
          totalRevenue: 0,
        };
      }
      metrics.productSales[item.product_id].totalSold += qty;
      metrics.productSales[item.product_id].totalRevenue += price * qty;
    });

    if (order.customer?.id) {
      metrics.customerSet.add(order.customer.id);
    }

    if (
      order.financial_status === "paid" &&
      order.fulfillment_status === "fulfilled"
    ) {
      metrics.deliveredOrders++;
    }
  });

  const totalOrders = metrics.totalOrders;
  const totalSales = metrics.totalSales;
  const totalRefunds = metrics.totalRefunds;

  const avgOrderValue = totalSales / totalOrders;
  const uniqueCustomers = metrics.customerSet.size;
  const refundRate = totalSales > 0 ? totalRefunds / totalSales : 0;

  const productArray = Object.values(metrics.productSales);
  productArray.sort((a, b) => b.totalRevenue - a.totalRevenue);

  const bestSelling = productArray.slice(0, 3).map((p) => ({
    name: p.name,
    totalSold: p.totalSold,
    totalRevenue: p.totalRevenue,
  }));
  const worstSelling = productArray
    .slice(-3)
    .reverse()
    .map((p) => ({
      name: p.name,
      totalSold: p.totalSold,
      totalRevenue: p.totalRevenue,
    }));

  return {
    totalOrders,
    totalSales,
    totalProductsSold: metrics.totalProductsSold,
    totalDiscounts: metrics.totalDiscounts,
    totalTaxes: metrics.totalTaxes,
    totalShipping: metrics.totalShipping,
    totalRefunds,
    avgOrderValue,
    uniqueCustomers,
    refundRate,
    bestSellingProducts: bestSelling,
    worstSellingProducts: worstSelling,
  };
}

function processMetaData(insights) {
  if (!insights || !insights.length) return null;

  const metrics = {
    totalSpend: 0,
    totalImpressions: 0,
    totalClicks: 0,
    totalReach: 0,
    campaigns: {}, // { [campaign_id]: { name, spend, impressions, clicks, reach } }
  };

  insights.forEach((camp) => {
    const spend = parseFloat(camp.spend || "0");
    const impressions = parseInt(camp.impressions || "0", 10);
    const clicks = parseInt(camp.clicks || "0", 10);
    const reach = parseInt(camp.reach || "0", 10);

    metrics.totalSpend += spend;
    metrics.totalImpressions += impressions;
    metrics.totalClicks += clicks;
    metrics.totalReach += reach;
    if (!metrics.campaigns[camp.campaign_id]) {
      metrics.campaigns[camp.campaign_id] = {
        name: camp.campaign_name || "",
        spend: 0,
        impressions: 0,
        clicks: 0,
        reach: 0,
      };
    }
    const record = metrics.campaigns[camp.campaign_id];
    record.spend += spend;
    record.impressions += impressions;
    record.clicks += clicks;
    record.reach += reach;
  });

  const { totalSpend, totalImpressions, totalClicks } = metrics;
  const cpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;
  const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
  const ctr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
  const campaignMetrics = Object.values(metrics.campaigns).map(
    ({ name, spend, impressions, clicks, reach }) => ({
      name,
      spend,
      impressions,
      clicks,
      reach,
      cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
      cpc: clicks > 0 ? spend / clicks : 0,
      ctr: impressions > 0 ? clicks / impressions : 0,
    })
  );
  return {
    totalSpend,
    totalImpressions,
    totalClicks,
    totalReach: metrics.totalReach,
    cpm,
    cpc,
    ctr,
    campaignMetrics,
  };
}

function processShiprocketData(shipments) {
  if (!shipments || !shipments.length) return null;

  const metrics = {
    totalShipments: shipments.length,
    delivered: 0,
    inTransit: 0,
    rto: 0,
    undelivered: 0,
    totalDeliveryDays: 0,
    deliveryCount: 0,
  };

  shipments.forEach((shp) => {
    switch (shp.status) {
      case "Delivered":
        metrics.delivered++;
        if (shp.ship_date && shp.delivered_date) {
          const shipDate = new Date(shp.ship_date);
          const delivDate = new Date(shp.delivered_date);
          const diffMs = delivDate - shipDate;
          const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          metrics.totalDeliveryDays += days;
          metrics.deliveryCount++;
        }
        break;
      case "In Transit":
        metrics.inTransit++;
        break;
      case "RTO":
        metrics.rto++;
        break;
      default:
        metrics.undelivered++;
        break;
    }
  });

  const deliveryRate =
    metrics.totalShipments > 0 ? metrics.delivered / metrics.totalShipments : 0;
  const rtoRate =
    metrics.totalShipments > 0 ? metrics.rto / metrics.totalShipments : 0;
  const avgDeliveryTime =
    metrics.deliveryCount > 0
      ? metrics.totalDeliveryDays / metrics.deliveryCount
      : 0;

  return {
    totalShipments: metrics.totalShipments,
    delivered: metrics.delivered,
    inTransit: metrics.inTransit,
    rto: metrics.rto,
    undelivered: metrics.undelivered,
    deliveryRate,
    rtoRate,
    avgDeliveryTime,
  };
}

export const getDataAi = async (req, res) => {
  try {
    if (!req.user?.onboarding) {
      return res.status(400).json({ error: "User onboarding data not found" });
    }

    const { storeUrl, accessToken } = req.user.onboarding.step2 || {};
    if (!storeUrl || !accessToken) {
      return res.status(400).json({ error: "Shopify credentials not found" });
    }

    const adAccountIdRaw = req.user.onboarding.step4?.adAccountId;
    const metaToken=req.user.onboarding.step4.accessToken;

    // const metaCred = await MetaCredential.findOne();


    // const metaToken = metaCred?.accessToken || null;
    let adAccountPath = null;
    if (adAccountIdRaw) {
      adAccountPath = adAccountIdRaw.startsWith("act_")
        ? adAccountIdRaw
        : "act_" + adAccountIdRaw;
    }

    const shiprocketToken = req.user.onboarding.step5?.token;
    const shopifyPromise = fetchAllShopifyOrders(storeUrl, accessToken);
    const metaPromise =
      adAccountPath && metaToken
        ? axios.get(
            `https://graph.facebook.com/v15.0/${adAccountPath}/insights`,
            {
              params: {
                access_token: metaToken,
                date_preset: "last_30d",
                fields:
                  "campaign_id,campaign_name,spend,impressions,clicks,reach",
              },
              timeout: 10000,
            }
          )
        : Promise.resolve(null);

    const shiprocketPromise = shiprocketToken
      ? axios.get("https://apiv2.shiprocket.in/v1/external/orders", {
          headers: {
            Authorization: `Bearer ${shiprocketToken}`,
          },
          params: { per_page: 100 },
          timeout: 10000,
        })
      : Promise.resolve(null);
    const settled = await Promise.allSettled([
      shopifyPromise,
      metaPromise,
      shiprocketPromise,
    ]);
    let shopifyData;
    if (settled[0].status === "fulfilled") {
      const ordersArr = settled[0].value;
      if (Array.isArray(ordersArr)) {
        shopifyData = processShopifyData(ordersArr);
      } else {
        shopifyData = { error: "Invalid Shopify payload" };
      }
    } else {
      console.error("Shopify error:", settled[0].reason);
      shopifyData = { error: "Failed to fetch Shopify data" };
    }
    let metaData;
    if (settled[1].status === "fulfilled" && settled[1].value) {
      const insightsArr = settled[1].value.data?.data || null;
      if (settled[1].value.data?.error) {
        const fbErr = settled[1].value.data.error;
        metaData = { error: fbErr.message || "Facebook API error" };
      } else if (Array.isArray(insightsArr)) {
        metaData = processMetaData(insightsArr);
      } else {
        metaData = { error: "Invalid Meta payload" };
      }
    } else {
      if (settled[1].status === "rejected" && settled[1].reason.response) {
        const fbErrBody = settled[1].reason.response.data;
        const fbErrMsg =
          fbErrBody.error?.message || "Failed to fetch Meta data";
        metaData = { error: fbErrMsg };
      } else {
        metaData = { error: "Failed to fetch Meta data" };
      }
    }

    // — Shiprocket
    let shiprocketData;
    if (settled[2].status === "fulfilled" && settled[2].value) {
      const shipmentsArr = settled[2].value.data?.data || null;
      if (Array.isArray(shipmentsArr)) {
        shiprocketData = processShiprocketData(shipmentsArr);
      } else {
        shiprocketData = { error: "Invalid Shiprocket payload" };
      }
    } else {
      if (settled[2].status === "rejected" && settled[2].reason.response) {
        console.error(
          "Shiprocket error body:",
          settled[2].reason.response.data
        );
      } else {
        console.error("Shiprocket error:", settled[2].reason);
      }
      shiprocketData = { error: "Failed to fetch Shiprocket data" };
    }

    // — Profit metrics
    const grossRevenue = shopifyData?.totalSales || 0;
    const totalAdSpend = metaData?.totalSpend || 0;
    const shippingCost = shopifyData?.totalShipping || 0;
    const netRevenue = grossRevenue - totalAdSpend;
    const estimatedProfit = netRevenue - shippingCost;
    const roas = totalAdSpend > 0 ? grossRevenue / totalAdSpend : 0;

    // Build and return the trimmed, formatted response
    const formattedResponse = {
      shopify: shopifyData.error
        ? { error: shopifyData.error }
        : {
            totalOrders: shopifyData.totalOrders,
            totalSales: formatValue(shopifyData.totalSales),
            totalProductsSold: formatValue(shopifyData.totalProductsSold),
            totalDiscounts: formatValue(shopifyData.totalDiscounts),
            totalTaxes: formatValue(shopifyData.totalTaxes),
            totalShipping: formatValue(shopifyData.totalShipping),
            totalRefunds: formatValue(shopifyData.totalRefunds),
            avgOrderValue: formatValue(shopifyData.avgOrderValue),
            uniqueCustomers: shopifyData.uniqueCustomers,
            refundRate: formatPercent(shopifyData.refundRate),
            bestSellingProducts: shopifyData.bestSellingProducts.map((p) => ({
              name: p.name,
              totalSold: p.totalSold,
              totalRevenue: formatValue(p.totalRevenue),
            })),
            worstSellingProducts: shopifyData.worstSellingProducts.map((p) => ({
              name: p.name,
              totalSold: p.totalSold,
              totalRevenue: formatValue(p.totalRevenue),
            })),
          },
      meta: metaData.error
        ? { error: metaData.error }
        : {
            totalSpend: formatValue(metaData.totalSpend),
            totalImpressions: formatValue(metaData.totalImpressions),
            totalClicks: formatValue(metaData.totalClicks),
            totalReach: formatValue(metaData.totalReach),
            cpm: formatValue(metaData.cpm),
            cpc: formatValue(metaData.cpc),
            ctr: formatPercent(metaData.ctr),
            campaignBreakdown: metaData.campaignMetrics.map((c) => {
              // allocate a share of total Shopify revenue to this campaign
              const revenueByCampaign =
                totalAdSpend > 0 ? grossRevenue * (c.spend / totalAdSpend) : 0;
              // ROAS = revenue generated ÷ ad spend
              const campaignRoas =
                c.spend > 0 ? revenueByCampaign / c.spend : 0;
              return {
                name: c.name,
                spend: formatValue(c.spend),
                impressions: formatValue(c.impressions),
                clicks: formatValue(c.clicks),
                reach: formatValue(c.reach),
                cpm: formatValue(c.cpm),
                cpc: formatValue(c.cpc),
                ctr: formatPercent(c.ctr),
                roas: formatValue(campaignRoas),
              };
            }),
          },
      shiprocket: shiprocketData.error
        ? { error: shiprocketData.error }
        : {
            totalShipments: shiprocketData.totalShipments,
            delivered: shiprocketData.delivered,
            inTransit: shiprocketData.inTransit,
            rto: shiprocketData.rto,
            undelivered: shiprocketData.undelivered,
            deliveryRate: formatPercent(shiprocketData.deliveryRate),
            rtoRate: formatPercent(shiprocketData.rtoRate),
            avgDeliveryTime:
              shiprocketData.avgDeliveryTime.toFixed(2) + " days",
          },
      profitMetrics: {
        grossRevenue: formatValue(grossRevenue),
        totalAdSpend: formatValue(totalAdSpend),
        netRevenue: formatValue(netRevenue),
        shippingCost: formatValue(shippingCost),
        estimatedProfit: formatValue(estimatedProfit),
        roas: formatValue(roas),
      },
      timestamp: new Date().toISOString(),
    };

    return res.status(200).json(formattedResponse);
  } catch (err) {
    console.error("Error in getDataAi controller:", err);
    return res.status(500).json({
      error: `Data processing failed: ${err.message}`,
    });
  }
};
