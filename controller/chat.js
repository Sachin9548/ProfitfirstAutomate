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
