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
    const response = await fetch("/api/ustad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg, history: ustadHistory }),
    });

    const data = await response.json();

    // worker.js returns { success, answer } on success and
    // { success: false, error } on failure — check BOTH response.ok
    // and data.success, and read data.answer (not data.reply).
    if (!response.ok || !data.success) {
      console.error("Ustad backend error:", data);
      document.querySelector(".typing")?.remove();
      appendMessage(`Ustad error: ${data.error || "unknown error"}`, "bot");
      return;
    }

    document.querySelector(".typing")?.remove();
    appendMessage(data.answer, "bot");

    ustadHistory.push({ role: "user", content: msg });
    ustadHistory.push({ role: "assistant", content: data.answer });
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
  const escape = (s) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  let safe = escape(text);

  // Fenced code blocks — strips a leading language tag (e.g. "java") if present
  safe = safe.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre><code>${code.trim()}</code></pre>`;
  });

  // Inline code `like this`
  safe = safe.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Bold **text**
  safe = safe.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // Italic *text*
  safe = safe.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>");

  // Headers
  safe = safe.replace(/^### (.+)$/gm, "<h4>$1</h4>");
  safe = safe.replace(/^## (.+)$/gm, "<h4>$1</h4>");
  safe = safe.replace(/^# (.+)$/gm, "<h4>$1</h4>");

  // Markdown tables
  safe = safe.replace(/((?:\|.*\|\n?)+)/g, (block) => {
    const rows = block.trim().split("\n").filter((r) => r.trim() !== "");
    const dataRows = rows.filter((r) => !/^\|[\s:|-]+\|$/.test(r.trim()));
    if (dataRows.length < 1) return block;

    const toCells = (row) =>
      row.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());

    const [headerRow, ...bodyRows] = dataRows;
    const headerCells = toCells(headerRow);

    let html = "<table><thead><tr>";
    headerCells.forEach((c) => (html += `<th>${c}</th>`));
    html += "</tr></thead><tbody>";
    bodyRows.forEach((r) => {
      html += "<tr>";
      toCells(r).forEach((c) => (html += `<td>${c}</td>`));
      html += "</tr>";
    });
    html += "</tbody></table>";
    return html;
  });

  return safe;
}