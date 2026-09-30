// ===============================
// PERSONAL AI ASSISTANT
// ===============================

const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");





const timeElement = document.getElementById("time");

function updateTime() {
    const now = new Date();

    timeElement.textContent = now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
    });
}

updateTime();
setInterval(updateTime, 1000);

// ===============================
// ESCAPE HTML
// ===============================

function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}


// ===============================
// ADD USER MESSAGE
// ===============================

function addUserMessage(message) {

    const messageDiv = document.createElement("div");

    messageDiv.className = "message";

    messageDiv.style.justifyContent = "flex-end";

    messageDiv.innerHTML = `
        <div
            class="message-content"
            style="
                border-radius: 15px 4px 15px 15px;
                background: rgba(90,70,255,0.15);
            "
        >
            ${escapeHTML(message)}
        </div>

        <div class="message-avatar">
            👤
        </div>
    `;

    chatBox.appendChild(messageDiv);

    scrollChat();
}


// ===============================
// ADD AI MESSAGE
// ===============================

function addAIMessage(message) {

    const messageDiv = document.createElement("div");

    messageDiv.className = "message ai-message";

    messageDiv.innerHTML = `
        <div class="message-avatar">
            🤖
        </div>

        <div class="message-content">
            ${escapeHTML(message).replace(/\n/g, "<br>")}
        </div>
    `;

    chatBox.appendChild(messageDiv);

    scrollChat();
}


// ===============================
// THINKING MESSAGE
// ===============================

function addThinkingMessage() {

    const messageDiv = document.createElement("div");

    messageDiv.className = "message ai-message";

    messageDiv.id = "thinkingMessage";

    messageDiv.innerHTML = `
        <div class="message-avatar">
            🤖
        </div>

        <div class="message-content">
            Thinking... 🤔
        </div>
    `;

    chatBox.appendChild(messageDiv);

    scrollChat();
}


// ===============================
// REMOVE THINKING
// ===============================

function removeThinkingMessage() {

    const thinking =
        document.getElementById("thinkingMessage");

    if (thinking) {
        thinking.remove();
    }
}


// ===============================
// SEND MESSAGE
// ===============================

async function sendMessage(message) {

    message = message || userInput.value.trim();

    if (!message) {
        return;
    }

    console.log("👤 User:", message);


    // Remove welcome screen after first message
    const welcome =
        document.getElementById("welcome");

    if (welcome) {

        // Keep the chat but remove suggestion cards
        const suggestions =
            welcome.querySelector(".suggestions");

        if (suggestions) {
            suggestions.remove();
        }
    }


    // Show user message
    addUserMessage(message);

    userInput.value = "";

    addThinkingMessage();


    try {

        console.log("🔄 Sending request to backend...");


        const response = await fetch("/api/chat", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                message: message
            })

        });


        console.log(
            "Backend status:",
            response.status
        );


        // Read response as TEXT first
        const rawText = await response.text();

        console.log(
            "Backend response:",
            rawText
        );


        removeThinkingMessage();


        if (!rawText.trim()) {

            throw new Error(
                "Backend returned an empty response"
            );

        }


        let data;

        try {

            data = JSON.parse(rawText);

        } catch (jsonError) {

            throw new Error(
                "Backend returned invalid JSON: " +
                rawText
            );

        }


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "AI response failed"
            );

        }


        // Show AI response
        addAIMessage(data.reply);


    } catch (error) {

        console.error(
            "❌ Chat Error:",
            error
        );


        removeThinkingMessage();


        addAIMessage(
            "❌ AI response nahi aa raha.\n\n" +
            error.message
        );

    }

}


// ===============================
// FORM SUBMIT
// ===============================

chatForm.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();

        sendMessage();

    }
);


// ===============================
// SUGGESTION BUTTONS
// ===============================

const suggestionButtons =
    document.querySelectorAll(".suggestion");


suggestionButtons.forEach(
    function (button) {

        button.addEventListener(
            "click",
            function () {

                const message =
                    button.dataset.message;

                sendMessage(message);

            }
        );

    }
);


// ===============================
// ENTER KEY
// ===============================

userInput.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            chatForm.requestSubmit();

        }

    }
);



// ===============================
// SCROLL
// ===============================

function scrollChat() {

    chatBox.scrollTop =
        chatBox.scrollHeight;

}

// ============================================
// VOICE INPUT
// ============================================

const voiceBtn = document.getElementById("voiceBtn");
const stopVoiceBtn = document.getElementById("stopVoiceBtn");

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

let recognition = null;
let isListening = false;

if (SpeechRecognition) {

    recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-IN";

    recognition.onstart = function () {

        isListening = true;

        voiceBtn.textContent = "🔴";

        userInput.placeholder =
            "Listening... Speak now";

    };

    recognition.onresult = function (event) {

        const transcript =
            event.results[0][0].transcript;

        console.log("🎤 Voice:", transcript);

        userInput.value = transcript;

    };

    recognition.onerror = function (event) {

        console.error(
            "Voice Error:",
            event.error
        );

        userInput.placeholder =
            "Voice error. Try again.";

    };

    recognition.onend = function () {

        isListening = false;

        voiceBtn.textContent = "🎤";

        userInput.placeholder =
            "Ask your Personal AI anything...";

    };


    voiceBtn.addEventListener(
        "click",
        function () {

            if (isListening) {

                recognition.stop();

                return;

            }

            try {

                recognition.start();

            } catch (error) {

                console.error(error);

            }

        }
    );

} else {

    voiceBtn.disabled = true;

    voiceBtn.title =
        "Voice recognition is not supported in this browser.";

}


// ============================================
// AI RESPONSE → VOICE
// ============================================

function speakAIResponse(text) {

    if (!("speechSynthesis" in window)) {

        console.log(
            "Speech synthesis not supported."
        );

        return;

    }


    // Stop previous speech
    speechSynthesis.cancel();


    // Remove markdown symbols
    const cleanText =
        text
            .replace(/[*#_`]/g, "")
            .replace(/<[^>]*>/g, "");


    const speech =
        new SpeechSynthesisUtterance(
            cleanText
        );


    speech.lang =
        /[\u0900-\u097F]/.test(cleanText)
            ? "hi-IN"
            : "en-IN";


    speech.rate = 1;

    speech.pitch = 1;

    speech.volume = 1;


    speechSynthesis.speak(speech);

}


// ============================================
// STOP AI VOICE
// ============================================

stopVoiceBtn.addEventListener(
    "click",
    function () {

        speechSynthesis.cancel();

    }
);


console.log(
    "🤖 Personal AI Assistant loaded successfully"
);

// ===============================
// SIDEBAR NAVIGATION
// ===============================

const menuLinks = document.querySelectorAll(".menu a");

menuLinks.forEach((link) => {
    link.addEventListener("click", function (event) {
        event.preventDefault();

        // Remove active from all
        menuLinks.forEach((item) => {
            item.classList.remove("active");
        });

        // Add active to clicked item
        this.classList.add("active");

        const sectionName = this.querySelector("span:last-child").textContent;

        console.log("Selected section:", sectionName);

        if (sectionName === "AI Assistant") {
            showAssistant();
        }

        if (sectionName === "Dashboard") {
            showDashboard();
        }

        if (sectionName === "Notes") {
            showNotes();
        }

        if (sectionName === "Projects") {
            showProjects();
        }

        if (sectionName === "Settings") {
            showSettings();
        }
    });
});
// ===============================
// SECTION FUNCTIONS
// ===============================

function showAssistant() {
    document.querySelector(".topbar h1").innerHTML =
        'Personal <span>AI</span> Assistant';

    document.getElementById("chatBox").style.display = "block";
    document.getElementById("chatForm").style.display = "block";
}


function showDashboard() {
    document.querySelector(".topbar h1").innerHTML =
        '📊 <span>Dashboard</span>';

    document.getElementById("chatBox").innerHTML = `
        <div class="section-page">
            <h2>📊 Dashboard</h2>

            <div class="dashboard-grid">

                <div class="dashboard-card">
                    <h3>💬 Chats</h3>
                    <p>0</p>
                    <small>Total conversations</small>
                </div>

                <div class="dashboard-card">
                    <h3>📝 Notes</h3>
                    <p>0</p>
                    <small>Saved notes</small>
                </div>

                <div class="dashboard-card">
                    <h3>📁 Projects</h3>
                    <p>0</p>
                    <small>Your projects</small>
                </div>

                <div class="dashboard-card">
                    <h3>🤖 AI Status</h3>
                    <p>Online</p>
                    <small>Qwen 2.5 3B</small>
                </div>

            </div>
        </div>
    `;

    document.getElementById("chatForm").style.display = "none";
}


function showNotes() {
    document.querySelector(".topbar h1").innerHTML =
        '📝 <span>Notes</span>';

    document.getElementById("chatBox").innerHTML = `
        <div class="section-page">
            <h2>📝 Notes</h2>

            <textarea
                id="noteInput"
                class="notes-input"
                placeholder="Write your note here..."
            ></textarea>

            <button class="save-btn" onclick="saveNote()">
                💾 Save Note
            </button>

            <div id="notesList"></div>
        </div>
    `;

    document.getElementById("chatForm").style.display = "none";
}


function showProjects() {
    document.querySelector(".topbar h1").innerHTML =
        '📁 <span>Projects</span>';

    document.getElementById("chatBox").innerHTML = `
        <div class="section-page">

            <h2>📁 Projects</h2>

            <div class="project-card">
                <h3>🤖 Personal AI Assistant</h3>
                <p>
                    AI assistant using HTML, CSS, JavaScript,
                    Node.js, Express, Ollama and Qwen.
                </p>

                <span>In Progress</span>
            </div>

            <div class="project-card">
                <h3>📝 AI BlogHub</h3>
                <p>
                    Full Stack blogging system with
                    authentication and MongoDB.
                </p>

                <span>In Progress</span>
            </div>

        </div>
    `;

    document.getElementById("chatForm").style.display = "none";
}


function showSettings() {
    document.querySelector(".topbar h1").innerHTML =
        '⚙️ <span>Settings</span>';

    document.getElementById("chatBox").innerHTML = `
        <div class="section-page">

            <h2>⚙️ Settings</h2>

            <div class="settings-card">

                <label>
                    Assistant Name
                </label>

                <input
                    type="text"
                    value="Personal AI"
                >

                <label>
                    AI Model
                </label>

                <input
                    type="text"
                    value="Qwen 2.5 3B"
                    readonly
                >

                <label>
                    Theme
                </label>

                <select>
                    <option>Dark</option>
                    <option>Light</option>
                </select>

            </div>

        </div>
    `;

    document.getElementById("chatForm").style.display = "none";
}