import axios from "axios";
import ProductCost from "../../model/ProductCost.js";
import MetaCredential from "../../model/MetaCredential.js";

const FB_APP_ID = "709429934792295";
const FB_APP_SECRET = "2d41b18b81e4d99acde04a4e57fabbd9";
const REDIRECT_URI = 'https://profitfirstanalytics.co.in/api/onboard/auth/callback';

// GET CURRENT STEP
const currentStep = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ step: user.step });
  } catch (error) {
    console.error("Error fetching onboarding step:", error);
    res.status(500).json({ message: "Failed to fetch onboarding step" });
  }
};

// STEP 1
const onboardStep1 = async (req, res) => {
  const user = req.user;
  const { fullName, email, phone, whatsapp, industry, referral } = req.body;

  if (!fullName || !email || !phone || !whatsapp || !industry) {
    return res.status(400).json({ message: "Please fill all required fields" });
  }

  try {
    user.onboarding.step1 = {
      fullName,
      email,
      phone,
      whatsapp,
      industry,
      referral: referral || null,
    };
    user.step = 2;
    await user.save();
    res.json({ message: "Step 1 completed", nextStep: 2 });
  } catch (error) {
    console.error("Error in onboarding step 1:", error);
    res.status(500).json({ message: "Server error" });
  }
};


const Shopifyhelper = async (req, res) => {
  const { shop, password } = req.query;
  try {
    const tokenRes = await axios.get(`https://www.profitfirst.co.in/token`, {
      params: { shop, password },
    });
    res.json(tokenRes.data);
  } catch (error) {
    console.error("Proxy error:", error.message);
    res.status(500).json({ error: "Proxy failed" });
    }
};


// STEP 2 - SHOPIFY
const onboardStep2 = async (req, res) => {
  const user = req.user;
  const { storeUrl, apiKey, apiSecret, accessToken } = req.body;

  if (!storeUrl || !apiKey || !apiSecret || !accessToken) {
    return res.status(400).json({ message: "Please fill all required fields" });
  }

  try {
    const testShopifyResponse = await axios.get(
      `https://${storeUrl}/admin/api/2025-04/shop.json`,
      {
        headers: { "X-Shopify-Access-Token": accessToken },
      }
    );

    if (!testShopifyResponse.data?.shop) {
      return res.status(401).json({ message: "Invalid Shopify credentials" });
    }

    user.onboarding.step2 = {
      storeUrl,
      apiKey,
      apiSecret,
      accessToken,
      platform: "Shopify",
    };
    user.step = 3;
    await user.save();
    res.json({ message: "Step 2 completed", nextStep: 3 });
  } catch (error) {
    console.error("Error in onboarding step 2:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// FETCH PRODUCTS
const fetchproduct = async (req, res) => {
  console.log("Fetching basic product details...");

  const accessToken = req.user.onboarding.step2.accessToken;
  const storeUrl = req.user.onboarding.step2.storeUrl;

  let allProducts = [];
  let nextPageUrl = `https://${storeUrl}/admin/api/2025-04/products.json?limit=50`;

  try {
    while (nextPageUrl) {
      const productRes = await axios.get(nextPageUrl, {
        headers: { "X-Shopify-Access-Token": accessToken },
      });

      const products = productRes.data.products;
      const simplifiedProducts = products.map((product) => ({
        id: product.id,
        title: product.title,
        price: product.variants?.[0]?.price || "",
        image: product.image?.src || null,
      }));

      allProducts.push(...simplifiedProducts);

      const linkHeader = productRes.headers["link"];
      if (linkHeader?.includes('rel="next"')) {
        const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
        nextPageUrl = match ? match[1] : null;
      } else {
        nextPageUrl = null;
      }
    }

    res.status(200).json(allProducts);
  } catch (error) {
    console.error(
      "Error fetching products:",
      error.response?.data || error.message
    );
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

// STEP 3 - COST ENTRY
const manufacture = async (req, res) => {
  const updates = req.body;
  const userId = req.user._id;
  const user = req.user;

  try {
    let userCosts = await ProductCost.findOne({ userId });
    if (!userCosts) {
      userCosts = new ProductCost({
        userId,
        products: updates.map(({ productId, cost }) => ({
          productId,
          cost,
        })),
      });
    } else {
      updates.forEach(({ productId, cost }) => {
        const existing = userCosts.products.find(
          (p) => p.productId === productId
        );
        if (existing) {
          existing.cost = cost;
          existing.updatedAt = new Date();
        } else {
          userCosts.products.push({ productId, cost, updatedAt: new Date() });
        }
      });
    }
    await userCosts.save();
    user.step = 4;
    await user.save();
    res
      .status(200)
      .json({ message: "Costs updated successfully", nextStep: 4 });
  } catch (err) {
    console.error("Modify price error:", err);
    res.status(500).json({ message: "Failed to update costs" });
  }
};


const facebookLogin=async (req,res)=>{
  const url = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${FB_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=ads_read,business_management&response_type=code&state=123`;
   res.json({ redirectUrl: url });
}

const facebookAccesstoken=async (req, res) => {
  console.log("facebookAccesstoken redireact your request")
  const code = req.query.code;

  try {
    const tokenRes = await axios.get(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      querystring.stringify({
        client_id: FB_APP_ID,
        redirect_uri: REDIRECT_URI,
        client_secret: FB_APP_SECRET,
        code,
      })
    );

    const accessToken = tokenRes.data.access_token;

    // Inject token directly into the HTML response
   const html = `
    <html>
      <head>
        <script>
          sessionStorage.setItem('fbAccessToken', '${accessToken}');
          window.location.href = '/onboarding';
        </script>
      </head>
      <body>
        <p>Redirecting to onboarding...</p>
      </body>
    </html>
  `;

  res.send(html);

  } catch (err) {
    console.error('Token Exchange Error:', err.response?.data || err.message);
    res.status(500).send(`
      <html>
        <body>
          <h2>Authentication failed. Please try again.</h2>
        </body>
      </html>
    `);
  }
};
// STEP 4 - META ADS
const onboardStep4 = async (req, res) => {
  const user = req.user;
  const { adAccountId, accessToken } = req.body;
  if (!adAccountId) {
    return res.status(400).json({ message: "Please fill all required fields" });
  }

  const token = accessToken;
  try {
    const testMetaResponse = await axios.get(
      `https://graph.facebook.com/v21.0/act_${adAccountId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!testMetaResponse.data?.id) {
      return res.status(401).json({ message: "Invalid Meta credentials please firly provide the access" });
    }
    user.onboarding.step4.adAccountId =adAccountId;
    user.onboarding.step4.accessToken=token;
    user.step = 5;
    await user.save();
    res.json({ message: "Step 4 completed", nextStep: 5 });
  
  } catch (error) {
    console.error("Meta verification error:", error.response?.data || error.message);

    return res.status(401).json({
      message:
        error.response?.data?.error?.message ||
        "Invalid Meta credentials or Ad Account ID.",
    });
  }
};

// STEP 5 - SHIPROCKET
const onboardStep5 = async (req, res) => {
  const user = req.user;
  const { shiproactId, shiproactPassword } = req.body;
  if (!shiproactId || !shiproactPassword) {
    return res.status(400).json({ message: "Please fill all required fields" });
  }

  try {
    const loginResponse = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/auth/login",
      {
        email: shiproactId,
        password: shiproactPassword,
      },
      { headers: { "Content-Type": "application/json" } }
    );

    const { token, created_at } = loginResponse.data;

    const verifyToken = await axios.get(
      "https://apiv2.shiprocket.in/v1/external/orders",
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (verifyToken.status !== 200 || !verifyToken.data) {
      return res
        .status(401)
        .json({ message: "Invalid Shiprocket credentials" });
    }

    user.onboarding.step5 = {
      shiproactId,
      shiproactPassword,
      token,
      created_at,
      platform: "Shiprocket",
    };

    user.step = 6;
    await user.save();
    res.json({ message: "Step 5 completed", nextStep: 6 });
  } catch (error) {
    console.error("Error in onboarding step 5:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Export all functions
export {
  currentStep,
  onboardStep1,
  onboardStep2,
  onboardStep4,
  onboardStep5,
  fetchproduct,
  manufacture,
  Shopifyhelper,
  facebookLogin,
  facebookAccesstoken
};
