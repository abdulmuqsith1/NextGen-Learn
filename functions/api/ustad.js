export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { message, history = [] } = body;

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.GROQ_API_KEY}`, // key lives ONLY here, server-side
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [
          {
            role: "system",
            content:
              "You are Ustad, a friendly and knowledgeable AI mentor for engineering students on NextGen Learning. " +
              "Explain concepts clearly and simply, give short examples, and encourage students. Keep answers concise.",
          },
          ...history,
          { role: "user", content: message },
        ],
        temperature: 0.7,
        max_tokens: 600,
      }),
    });

    const data = await groqResponse.json();

    if (!groqResponse.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || "Groq API error" }), {
        status: groqResponse.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't process that.";
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