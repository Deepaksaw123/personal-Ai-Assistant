const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Frontend files
app.use(express.static(__dirname));

// Home page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Status
app.get("/api/status", (req, res) => {
    res.json({
        success: true,
        message: "Personal AI Assistant is running"
    });
});

// Chat
app.post("/api/chat", async (req, res) => {
    console.log("CHAT REQUEST RECEIVED");

    try {
        const message = req.body?.message;

        console.log("USER:", message);

        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: "Message is required"
            });
        }

        

        const ollamaResponse = await fetch(
            "http://127.0.0.1:11434/api/chat",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "qwen2.5:3b",
                    messages: [
                        {
    role: "system",
    content: `
You are Deepak's Personal AI Assistant.

User's name is Deepak Saw.

IMPORTANT:
- If the user asks "What is my name?", "Mera naam kya hai?", "Who am I?", or similar questions, answer that their name is Deepak Saw.
- Remember the user's name during the conversation.
- Use "Deepak" when addressing the user naturally.
- Give simple and practical answers.
- Use Hinglish when the user uses Hinglish.
- Use English when the user uses English.
`
},
                        {
                            role: "user",
                            content: message
                        }
                    ],
                    stream: false
                })
            }
        );

        const rawText = await ollamaResponse.text();

        console.log("OLLAMA STATUS:", ollamaResponse.status);
        console.log("OLLAMA RESPONSE:", rawText);

        if (!rawText.trim()) {
            return res.status(500).json({
                success: false,
                message: "Ollama returned empty response"
            });
        }

        const data = JSON.parse(rawText);
        const reply = data?.message?.content;

        if (!reply) {
            return res.status(500).json({
                success: false,
                message: "AI reply not found"
            });
        }

        res.json({
            success: true,
            reply: reply
        });

    } catch (error) {
        console.error("SERVER ERROR:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log("================================");
    console.log("PERSONAL AI ASSISTANT");
    console.log("================================");
    console.log("Server: http://localhost:3000");
    console.log("AI: Ollama + Qwen 2.5 3B");
    console.log("================================");
});