const micBtn = document.getElementById('mic-btn');
const sendBtn = document.getElementById('send-btn');
const userInput = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const statusCircle = document.getElementById('status-indicator');

// We keep this outside the function to prevent the browser from deleting objects from memory to save RAM space
//  since we dont want the bot to randomly stop talking 
let currentUtterance = null;

// turns Koras response into audio
function speak(text) {
    // stop any current speech to prevent overlapping
    window.speechSynthesis.cancel();
    // reset the engine if it got stuck in a paused state
    if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
    }

    currentUtterance = new SpeechSynthesisUtterance(text);
    // a new voice to make the bot sound less robotic and more friendly 
    const voices = window.speechSynthesis.getVoices();
    const samantha = voices.find(voice => voice.name === 'Samantha');

    if (samantha) {
        currentUtterance.voice = samantha;
    } else {
        const fallback = voices.find(voice =>  voice.name.includes('Female'));
        if (fallback) currentUtterance.voice = fallback;
    }
    
    currentUtterance.rate = 0.9; 
    currentUtterance.pitch = 1.3; 
    window.speechSynthesis.speak(currentUtterance);
}

micBtn.addEventListener('click', async () => {
    micBtn.disabled = true;
    const originalText = micBtn.textContent;
    micBtn.textContent = "Listening...";
    if (statusCircle) statusCircle.className = 'listening';
    try {
        const response = await fetch('/listen');
        const data = await response.json();

        if (data.user_text) {
            addMessage(data.user_text, 'user');
        }

        if (data.bot_full_text) {
            addMessage(data.bot_full_text, 'bot');
            speak(data.bot_full_text);
        }
    } catch (error) {
        console.error("Communication error:", error);
        addMessage("I'm having trouble hearing you. Please try again or type your message.", 'bot');
    } finally {
        if (statusCircle) statusCircle.className = 'idle';
        micBtn.disabled = false;
        micBtn.textContent = originalText;
    }
});

async function handleSendClick() {
    const text = userInput.value.trim();
    if (!text) return; 

    // Clear the input box
    userInput.value = "";

    try {
        // We use the text-specific route /chat
        const response = await fetch(`/chat?text=${encodeURIComponent(text)}`);
        const data = await response.json();

        // Show the dialogue on screen
        if (data.user_text) addMessage(data.user_text, 'user');
        if (data.bot_full_text) {
            addMessage(data.bot_full_text, 'bot');
            speak(data.bot_full_text); // Kora speaks the typed reply too
        }

    } catch (error) {
        console.error("Chat error:", error);
        addMessage("I'm having trouble connecting. Is the server running?", 'bot');
    }
}

// Event Listeners for Text
sendBtn.addEventListener('click', handleSendClick);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSendClick();
    }
});

// this physically builds the:
// chat bubbles, 
// the timestamps, 
// and the kora avatar
function addMessage(text, sender) {
    const wrapper = document.createElement('div');
    wrapper.className = `message-row ${sender}`;

    let avatar = null;

    if (sender === 'bot') {
        avatar = document.createElement('div');
        avatar.className = 'avatar';

        const dot = document.createElement('span');
        dot.className = 'status-dot';
        avatar.appendChild(dot);
    }   
    const content = document.createElement('div');
    content.className = 'message-content';

    const name = document.createElement('div');
    name.className = 'message-name';
    name.textContent = sender === 'user' ? 'You' : 'Kora';

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = text;

    const time = document.createElement('div');
    time.className = 'time';
    time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    content.appendChild(name);
    content.appendChild(bubble);
    content.appendChild(time);

    // Keep mirrored layout
    if (sender === 'user') {
        wrapper.appendChild(content);
    } else {
        wrapper.appendChild(avatar);
        wrapper.appendChild(content);
    }

    chatBox.appendChild(wrapper);
    chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });

    return wrapper;
}

//inital greeting 
window.addEventListener('DOMContentLoaded', () => {
    addMessage("Hello! I'm Kora. How can I support you today?", 'bot');
});

// pre-loads samantha voice 
window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
};