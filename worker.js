export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // =========================
    // 1. USTAD AI CHATBOT
    // =========================
    if (url.pathname === "/api/ustad" && request.method === "POST") {
      return handleUstad(request, env);
    }

    // =========================
    // 2. AI EXAM ASSISTANT
    // =========================
    if (
      url.pathname === "/api/exam-assistant" &&
      request.method === "POST"
    ) {
      return handleExamAssistant(request, env);
    }

    // =========================
    // 3. AI REVISION TRICKS
    // =========================
    if (
      url.pathname === "/api/revision-tricks" &&
      request.method === "POST"
    ) {
      return handleRevisionTricks(request, env);
    }

    // Serve frontend files
    return env.ASSETS.fetch(request);
  },
};


// ======================================================
// COMMON GROQ FUNCTION
// ======================================================

async function callGroq(messages, env) {
  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
      },

      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: messages,
        temperature: 0.7,
        max_tokens: 1500,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    console.error("Groq Error:", errorText);

    throw new Error("Groq API request failed");
  }

  const data = await response.json();

  return data.choices?.[0]?.message?.content || "No response generated.";
}


// ======================================================
// 1. USTAD CHATBOT
// ======================================================

async function handleUstad(request, env) {
  try {
    const { message, history = [] } = await request.json();

    if (!message) {
      return jsonResponse(
        {
          success: false,
          error: "Message is required",
        },
        400
      );
    }

    const messages = [
      {
        role: "system",
        content:
          "You are Ustad, a helpful AI study assistant. Explain concepts clearly and simply. Help students understand programming, academics, exam preparation, and technical topics.",
      },

      ...history,

      {
        role: "user",
        content: message,
      },
    ];

    const answer = await callGroq(messages, env);

    return jsonResponse({
      success: true,
      answer: answer,
    });
  } catch (error) {
    console.error("Ustad Error:", error);

    return jsonResponse(
      {
        success: false,
        error: "Unable to generate Ustad response.",
      },
      500
    );
  }
}


// ======================================================
// 2. AI EXAM ASSISTANT
// ======================================================

async function handleExamAssistant(request, env) {
  try {
    const {
      subject,
      chapter,
      examType,
    } = await request.json();

    if (!subject || !chapter || !examType) {
      return jsonResponse(
        {
          success: false,
          error: "Subject, chapter and exam type are required.",
        },
        400
      );
    }

    let examInstruction = "";

    if (examType === "entrance") {
      examInstruction = `
Focus on entrance-exam preparation.

Explain:
- Important concepts
- Key formulas
- Important facts
- Common question patterns
- Short tricks where useful
- What the student should remember for the exam

Keep the explanation concise and exam-oriented.
`;
    } else {
      examInstruction = `
Focus on university examination preparation.

Explain:
- Important definitions
- Concepts
- Detailed points
- Important subtopics
- Possible long-answer points
- Possible short-answer questions
- Important points to remember

Make the explanation suitable for writing in an examination.
`;
    }

    const prompt = `
You are an AI Exam Assistant.

Subject: ${subject}
Chapter: ${chapter}

${examInstruction}

Generate a clear study explanation for this chapter.

Use headings and bullet points.

Do not make up specific university syllabus information unless it is provided.
`;

    const answer = await callGroq(
      [
        {
          role: "system",
          content:
            "You are an educational AI assistant that helps students prepare for exams.",
        },

        {
          role: "user",
          content: prompt,
        },
      ],
      env
    );

    return jsonResponse({
      success: true,
      answer: answer,
    });
  } catch (error) {
    console.error("Exam Assistant Error:", error);

    return jsonResponse(
      {
        success: false,
        error: "Unable to generate exam explanation.",
      },
      500
    );
  }
}


// ======================================================
// 3. AI REVISION TRICKS
// ======================================================

async function handleRevisionTricks(request, env) {
  try {
    const {
      subject,
      chapter,
    } = await request.json();

    if (!subject || !chapter) {
      return jsonResponse(
        {
          success: false,
          error: "Subject and chapter are required.",
        },
        400
      );
    }

    const prompt = `
You are an AI Revision Assistant.

Subject: ${subject}
Chapter: ${chapter}

Create useful revision material for this chapter.

Include:

1. Quick Revision
2. Important Points
3. Memory Tricks / Mnemonics
4. Important Formulas or Keywords if applicable
5. Common Confusions
6. 5 Quick Self-Test Questions

Keep everything concise and easy to revise.

Do not invent facts that are not relevant to the subject.
`;

    const answer = await callGroq(
      [
        {
          role: "system",
          content:
            "You are a smart revision assistant helping students revise academic subjects quickly.",
        },

        {
          role: "user",
          content: prompt,
        },
      ],
      env
    );

    return jsonResponse({
      success: true,
      answer: answer,
    });
  } catch (error) {
    console.error("Revision Tricks Error:", error);

    return jsonResponse(
      {
        success: false,
        error: "Unable to generate revision tricks.",
      },
      500
    );
  }
}


// ======================================================
// JSON RESPONSE HELPER
// ======================================================

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status: status,

    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}