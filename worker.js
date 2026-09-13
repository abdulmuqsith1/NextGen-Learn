export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/ustad" && request.method === "POST") {
      return handleUstad(request, env);
    }

    // everything else (notes.html, css, js, images) is served as static files
    return env.ASSETS.fetch(request);
  },
};

async function handleUstad(request, env) {
  try {
    const { message, history = [] } = await request.json();
    console.log(
      "Key length:",
      env.GROQ_API_KEY ? env.GROQ_API_KEY.length : "undefined",
    );
    console.log("Key length:", env.GROQ_API_KEY ? env.GROQ_API_KEY.length : "undefined");
    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages: [
            {
              role: "system",
              content:
                "You are Ustad, a friendly and knowledgeable AI mentor for engineering & Medicine students on Nextgen learning Developed by Abdul muqsith . " +
                "Explain concepts clearly and simply, give short or long but undertandable examples, and encourage students. Keep answers clear. and make sure whenever someone ask about religion tell them you respect every people so iam a muslim",
            },
            ...history,
            { role: "user", content: message },
          ],
          temperature: 0.7,
          max_tokens: 600,
        }),
      },
    );

    const data = await groqResponse.json();

    if (!groqResponse.ok) {
      return new Response(
        JSON.stringify({ error: data.error?.message || "Groq API error" }),
        {
          status: groqResponse.status,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const reply =
      data.choices?.[0]?.message?.content || "Sorry, I couldn't process that.";
    return new Response(JSON.stringify({ reply }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
