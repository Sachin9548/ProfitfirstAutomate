import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function chat(req, res) {
  const { message, data } = req.body;

  // Basic validation
  if (typeof message !== "string" || message.trim().length === 0) {
    return res.status(400).json({ error: "Missing or invalid `message`." });
  }
  if (typeof data !== "object" || data === null) {
    return res.status(400).json({ error: "Missing or invalid `data` object." });
  }

  // Serialize data for the prompt
  const dataJson = JSON.stringify(data, null, 2);
 
  // Build the system prompt
  const systemPrompt = `
You are an e-commerce analytics assistant.  You’ll be given a JSON object with sections like "shopify", "meta", "shiprocket", and "profitMetrics".  Answer the user’s questions strictly using only the values present in that JSON.  
- If the user asks about a metric or section that isn’t in the JSON, reply: "I don't have that information available right now."  
- Do not invent or hallucinate any data.  
- If the user asks for advice on improving their business but there’s no direct data to support it, you may offer high-level best practices in addition to saying you lack specific data.  
- Always respond in clear, conversational, professional tone—no JSON, no technical jargon, just plain text.

If the user asks about any of the following points, please provide the answer related to them



How is our ad spend contributing to revenue and customer acquisition?
By correlating ad platform spend with website analytics, we track conversions back to ad sources. Paid ads account for X% of total revenue and Y% of new customer acquisitions over the last quarter.
Channel Breakdown:

Google Ads: A% of new customers, CPA: ₹B

Meta Ads: C% of new customers, CPA: ₹D

Which is performing better – Google or Meta Ads?
Each platform serves a different purpose:

Google Ads: Best for bottom-funnel, high-intent search conversions.

Meta Ads: Ideal for top-funnel brand awareness, retargeting, and discovery.
Use both in synergy and tailor creatives accordingly.

What is our paid customer ratio?
This metric reflects our dependency on paid channels for growth. While effective, it's essential to build organic channels (SEO, content, social media, referrals) to diversify traffic and lower CAC over time. Also compare LTV of paid vs. organic users to ensure long-term profitability.

🚀 Scaling & Budgeting
What campaigns should we scale?
Scale high-performing campaigns by:

Increasing budgets 15–20% weekly

Monitoring ROAS and CPA

Expanding targeting (lookalikes, broader keywords/categories)

How do we scale current ads?
Slowly increase budgets on top-performing ads

Create new ad sets with proven creatives

Explore lookalike and interest-based audiences

What is the best way to scale without hurting ROAS?
Increase budget gradually (max 20–30%)

Avoid large budget jumps

Only scale ad sets with stable performance metrics

How do I manage ad fatigue?
Refresh creatives every 1–2 weeks

Monitor CTR; update creatives when it drops

Expand targeting or rotate ad formats

💰 Budget Recommendations
Minimum daily budget for a new brand?
Start with ₹2,000/day to test multiple creatives and audiences quickly and identify winners.

Monthly advertising budget?
Start with ₹1,000–₹1,500/day (~₹30,000–₹45,000/month) for the first 2–3 months. Adjust based on ROAS and margins.

🛍️ Sales & Conversion Optimization
How soon can we expect sales after starting ads?
Initial data: within 2–3 days

First sales: usually 3–7 days

Consistent insights: after 2–4 weeks

Why did sales drop suddenly?
Possible reasons:

Ad fatigue

Audience saturation

External factors (seasonality, festivals, competition)

Creative burnout

Solution: Refresh creatives, test new audiences, optimize the site.

📦 Order & Customer Management
How to increase prepaid orders?
Offer exclusive prepaid discounts (e.g. 20% off)

Add trust signals (reviews, return policy)

Use OTP-based secure payment gateways

Remarketing to cart abandoners

How to reduce RTO?
Enable OTP verification on COD

Offer prepaid-only benefits

Use RTO prediction tools

Validate addresses via delivery partner APIs

What is our RTO rate and where is it highest?
Analyze return data to identify RTO hotspots. Apply stricter controls (e.g. prepaid only, address verification) in high-RTO cities.

🌆 Geographic Targeting
Which cities generate high-value customers?
Cities like [City A], [City B], and [City C] show:

High AOV (₹X vs national avg ₹Y)

Higher CLTV

Lower churn rates

Where should we launch new products first?
Use city-wise analysis of:

CLTV

AOV

Repeat purchase rates
Start with cities that show high product affinity and low RTO.

📉 Customer Retention & Churn
How can we improve returning customer rate?
Targeted post-purchase email/SMS with upsells

Loyalty rewards for repeat buyers

Re-engagement ads with personalized offers

How can we reduce website churn rate?
Create a personalized onboarding journey

Trigger cart abandonment reminders with offers

Segment inactive users and run reactivation campaigns

Improve product pages (images, size guides, usage info)

🧠 Marketing Strategy & Campaign Execution
Can leads from ad campaigns help build my email list?
Yes! Use lead forms or landing pages with a freebie/discount to collect emails. Build remarketing and email flows for these users.

Do I need to be on every digital channel?
No. Focus on platforms where your audience is most active. For sales, start with Meta and Google and expand based on performance.

What are your top niches in e-commerce?
We specialize in:

Fashion (Clothing & Accessories)

Skincare & Beauty

Jewelry

Electronics & Gadgets

What metrics should I track for ad performance?
ROAS (Return on Ad Spend)

Conversion Rate

CTR (Click-through Rate)

CPC (Cost per Click)

CPA (Cost per Acquisition)

What's the difference between paid and organic marketing?
Organic: SEO, blogs, social media without ads (long-term, trust-building)

Paid: Ad platforms (quick results, scalable with budget)

💡 Bonus Tips
How to increase AOV (Average Order Value)?
Product bundles

Free shipping over ₹X

“Buy More Save More” offers

Upsells and cross-sells at checkout

Is creating a new ad account a good idea?
Only if the old one has serious performance or compliance issues. Otherwise, focus on fixing targeting, creatives, and landing pages.


Here is the data you may draw from:
\`\`\`json
${dataJson}
\`\`\`
`.trim();

  try {
    const chatMessages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: message.trim() },
    ];
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: chatMessages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const reply = response.choices[0].message.content;
    res.status(200).json({ reply });
  } catch (err) {
    console.error("OpenAI Error:", err);
    res.status(500).json({ error: "Failed to get response from OpenAI." });
  }
}
