let systemPrompt = "";
let chatHistory = []; 

const setupPanel = document.getElementById("setupPanel");
const chatInterface = document.getElementById("chatInterface");
const saveSetupBtn = document.getElementById("saveSetupBtn");
const toggleSetupBtn = document.getElementById("toggleSetupBtn");
const systemPromptInput = document.getElementById("systemPrompt");
const chatMessages = document.getElementById("chatMessages");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const charNameDisplay = document.getElementById("charNameDisplay");
const wallpaperBtn = document.getElementById("wallpaperBtn");
const actionPlusBtn = document.getElementById("actionPlusBtn");
const wallpaperInput = document.getElementById("wallpaperInput");

// 1. Simpan Kustom Karakter
saveSetupBtn.addEventListener("click", () => {
    systemPrompt = systemPromptInput.value.trim();
    
    if (systemPrompt) {
        const nameMatch = systemPrompt.match(/(?:adalah|sebagai)\s+([A-Z][a-zA-Z0-9_]+)/);
        if (nameMatch && nameMatch[1]) {
            charNameDisplay.textContent = nameMatch[1];
        }
    }

    setupPanel.classList.add("hidden");
    chatInterface.classList.remove("hidden");
});

toggleSetupBtn.addEventListener("click", () => {
    setupPanel.classList.toggle("hidden");
});

// 2. Ganti Wallpaper Sementara
const triggerWallpaper = () => wallpaperInput.click();
wallpaperBtn.addEventListener("click", triggerWallpaper);
actionPlusBtn.addEventListener("click", triggerWallpaper);

wallpaperInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
        const blobURL = URL.createObjectURL(file);
        document.body.style.backgroundImage = `url('${blobURL}')`;
    }
});

// 3. Formatter Dialog Kustom Roleplay
function formatRPMessage(text) {
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/(\((.*?)\))/g, '<em>$1</em>');
    return formatted.replace(/\n/g, '<br>');
}

// 4. Masukkan Gelembung Obrolan Baru
function appendMessage(sender, text) {
    const msgGroup = document.createElement("div");
    msgGroup.classList.add("msg-group", sender);

    const bubble = document.createElement("div");
    bubble.classList.add("chat-bubble");
    
    if (sender === "ai") {
        bubble.innerHTML = formatRPMessage(text);
    } else {
        bubble.textContent = text;
    }
    msgGroup.appendChild(bubble);

    if (sender === "ai") {
        const actionContainer = document.createElement("div");
        actionContainer.classList.add("action-container");

        const continueBtn = document.createElement("button");
        continueBtn.classList.add("continue-action-btn");
        continueBtn.innerHTML = `✨ Lanjutkan aksi...`;
        
        continueBtn.addEventListener("click", () => {
            continueBtn.disabled = true;
            continueBtn.style.opacity = "0.4";
            handleSendMessage(true);
        });

        actionContainer.appendChild(continueBtn);
        msgGroup.appendChild(actionContainer);
    }

    chatMessages.appendChild(msgGroup);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 5. Animasi Loading
function showLoading() {
    const loadingGroup = document.createElement("div");
    loadingGroup.classList.add("msg-group", "ai");
    loadingGroup.id = "currentLoading";
    loadingGroup.innerHTML = `
        <div class="chat-bubble loading-bubble">
            <div class="dot"></div><div class="dot"></div><div class="dot"></div>
        </div>`;
    chatMessages.appendChild(loadingGroup);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 6. Transmisi Data ke Serverless Function Vercel (/api/chat)
async function handleSendMessage(isContinueAction = false) {
    let textToSend = "";

    if (isContinueAction) {
        textToSend = "*Lanjutkan aksi, gerakan fisik, atau potongan dialog roleplay kamu selanjutnya secara natural sesuai dengan karaktermu*";
    } else {
        textToSend = userInput.value.trim();
        if (!textToSend) return;

        appendMessage("user", textToSend);
        userInput.value = "";
    }

    chatHistory.push({ role: "user", parts: [{ text: textToSend }] });
    showLoading();

    try {
        const response = await fetch('/api/chat', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chatHistory: chatHistory,
                systemPrompt: systemPrompt
            })
        });

        const loadingElement = document.getElementById("currentLoading");
        if (loadingElement) loadingElement.remove();

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || "Gagal mendapatkan respons AI.");
        }

        const data = await response.json();
        const aiResponse = data.text;

        appendMessage("ai", aiResponse);
        chatHistory.push({ role: "model", parts: [{ text: aiResponse }] });

    } catch (error) {
        const loadingElement = document.getElementById("currentLoading");
        if (loadingElement) loadingElement.remove();
        alert("Terjadi Kesalahan: " + error.message);
    }
}

// Event Bindings
sendBtn.addEventListener("click", () => handleSendMessage(false));
userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage(false);
    }
});
