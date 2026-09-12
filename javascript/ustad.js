let ustadHistory = [];

function toggleUstad() {
  document.getElementById("ustadWindow").classList.toggle("active");
}

async function sendToUstad() {
  const input = document.getElementById("ustadInput");
  const msg = input.value.trim();
  if (!msg) return;

  appendMessage(msg, "user");
  input.value = "";
  appendMessage("Thinking...", "bot", true);

  try {
    const response = await fetch("/api/ustad", {   // ← your own backend, not Groq directly
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg, history: ustadHistory }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Ustad backend error:", data);
      document.querySelector(".typing")?.remove();
      appendMessage(`Ustad error: ${data.error || "unknown error"}`, "bot");
      return;
    }

    document.querySelector(".typing")?.remove();
    appendMessage(data.reply, "bot");

    ustadHistory.push({ role: "user", content: msg });
    ustadHistory.push({ role: "assistant", content: data.reply });
    if (ustadHistory.length > 10) ustadHistory = ustadHistory.slice(-10);
  } catch (err) {
    console.error("Ustad network error:", err);
    document.querySelector(".typing")?.remove();
    appendMessage("Ustad couldn't respond. Try again.", "bot");
  }
}

function appendMessage(text, sender, isTyping = false) {
  const box = document.getElementById("ustadMessages");
  const wrapper = document.createElement("div");
  wrapper.className = `ustad-msg ${sender}${isTyping ? " typing" : ""}`;

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerHTML = formatMessage(text);

  const time = document.createElement("span");
  time.className = "ustad-time";
  time.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  wrapper.appendChild(bubble);
  wrapper.appendChild(time);
  box.appendChild(wrapper);
  box.scrollTop = box.scrollHeight;
}

function formatMessage(text) {
  const escape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let safe = escape(text);
  safe = safe.replace(/```([\s\S]*?)```/g, (_, code) => `<pre><code>${code.trim()}</code></pre>`);
  safe = safe.replace(/`([^`]+)`/g, "<code>$1</code>");
  return safe;
}