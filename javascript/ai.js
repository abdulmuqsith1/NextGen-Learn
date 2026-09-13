// ======================================================
// COMMON RESPONSE ELEMENT
// ======================================================

const responseContainer =
    document.getElementById("ai-response");


// ======================================================
// SHOW LOADING
// ======================================================

function showLoading(message) {

    responseContainer.innerHTML = `
        <div class="loading">
            <div class="loader"></div>

            <p>${message}</p>
        </div>
    `;

}


// ======================================================
// DISPLAY AI RESPONSE
// ======================================================

function displayResponse(text) {

    responseContainer.innerHTML = formatAIResponse(text);

    responseContainer.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


// ======================================================
// MARKDOWN-LIKE FORMATTER (headings, bold, italic, lists,
// tables, horizontal rules)
// ======================================================

function formatAIResponse(text) {

    let formatted = escapeHTML(text);

    // Fenced code blocks — do this FIRST so nothing inside gets
    // mangled by the bold/italic/table rules below
    formatted = formatted.replace(
        /```(\w*)\n?([\s\S]*?)```/g,
        (_, lang, code) => `<pre><code>${code.trim()}</code></pre>`
    );

    // Inline code
    formatted = formatted.replace(
        /`([^`]+)`/g,
        "<code>$1</code>"
    );

    // Markdown tables — | col | col |  →  real <table>
    // Must run BEFORE heading/list rules since table rows also
    // start with non-heading, non-bullet characters.
    formatted = formatted.replace(
        /((?:^\|.*\|\s*$\n?)+)/gm,
        (block) => {
            const rows = block.trim().split("\n").filter((r) => r.trim() !== "");
            // drop separator rows like |---|---|
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
        }
    );

    // Horizontal rules  ---  or  ***  on their own line
    formatted = formatted.replace(
        /^\s*(-{3,}|\*{3,})\s*$/gm,
        "<hr>"
    );

    // Headings
    formatted = formatted.replace(
        /^### (.*)$/gm,
        '<h4>$1</h4>'
    );

    formatted = formatted.replace(
        /^## (.*)$/gm,
        '<h3>$1</h3>'
    );

    formatted = formatted.replace(
        /^# (.*)$/gm,
        '<h2>$1</h2>'
    );

    // Bold
    formatted = formatted.replace(
        /\*\*(.*?)\*\*/g,
        "<strong>$1</strong>"
    );

    // Italic (single * not part of a **; bold above already converted
    // ** pairs to <strong>, so remaining single *'s are genuine italics)
    formatted = formatted.replace(
        /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g,
        "<em>$1</em>"
    );

    // Bullet points
    formatted = formatted.replace(
        /^\s*[-*]\s+(.*)$/gm,
        "<li>$1</li>"
    );

    // Numbered points
    formatted = formatted.replace(
        /^\s*(\d+)\.\s+(.*)$/gm,
        "<li><strong>$1.</strong> $2</li>"
    );

    // Convert groups of li into ul
    formatted = formatted.replace(
        /(<li>.*?<\/li>(?:\s*<li>.*?<\/li>)*)/gs,
        "<ul>$1</ul>"
    );

    // New lines
    formatted = formatted.replace(
        /\n{2,}/g,
        "<br>"
    );

    return formatted;
}


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHTML(text) {

    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}


// ======================================================
// 1. GENERATE EXAM EXPLANATION
// ======================================================

async function generateExplanation() {

    const subject =
        document.getElementById("subject-name").value.trim();

    const chapter =
        document.getElementById("chapter-name").value.trim();

    const examType =
        document.getElementById("exam-type").value;


    if (!subject || !chapter || !examType) {

        responseContainer.innerHTML = `
            <div class="error">
                ⚠️ Please enter subject, chapter
                and select exam type.
            </div>
        `;

        return;
    }


    showLoading(
        "Ustad is preparing your exam explanation..."
    );


    try {

        const response = await fetch(
            "/api/exam-assistant",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    subject: subject,
                    chapter: chapter,
                    examType: examType
                })
            }
        );


        const data = await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.error ||
                "Failed to generate explanation."
            );

        }


        displayResponse(data.answer);


    } catch (error) {

        console.error(error);

        responseContainer.innerHTML = `
            <div class="error">
                ❌ ${escapeHTML(error.message)}
            </div>
        `;

    }
}


// ======================================================
// 2. GENERATE REVISION TRICKS
// ======================================================

async function generateRevisionTricks() {

    const subject =
        document
            .getElementById("revision-subject")
            .value
            .trim();

    const chapter =
        document
            .getElementById("revision-chapter")
            .value
            .trim();


    if (!subject || !chapter) {

        responseContainer.innerHTML = `
            <div class="error">
                ⚠️ Please enter subject and chapter.
            </div>
        `;

        return;
    }


    showLoading(
        "Creating smart revision tricks..."
    );


    try {

        const response = await fetch(
            "/api/revision-tricks",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    subject: subject,
                    chapter: chapter
                })
            }
        );


        const data = await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.error ||
                "Failed to generate revision tricks."
            );

        }


        displayResponse(data.answer);


    } catch (error) {

        console.error(error);

        responseContainer.innerHTML = `
            <div class="error">
                ❌ ${escapeHTML(error.message)}
            </div>
        `;

    }
}