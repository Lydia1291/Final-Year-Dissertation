# Main Class!
# Listens for requests coming from the users browser, routes them to the correct place, and then sends the results back 
import speech_recognition as sr
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from models import OllamaChatbot

# initalising the server 
# i chose FastAPI because of its asynchronous capability, to prevent bottlenecking within the server 
app = FastAPI()
# i did this to seperate my frontend from my backend to make it easier to read 
app.mount("/static", StaticFiles(directory="Static"), name="static")
chatbot = OllamaChatbot(model_name="llama3.2:1b")

#delievers the main webpage 
@app.get("/")
async def read_index():
    return FileResponse("Static/index.html")

#handles the microphone input 
@app.get("/listen")
#async allows the server to handle other requests while Ollama generates its response 
async def listen_and_respond():
    recognizer = sr.Recognizer()
    microphone = sr.Microphone()

    try:
        with microphone as source:
            # to try and block out background noise
            recognizer.adjust_for_ambient_noise(source, duration=0.5)
            audio = recognizer.listen(source, timeout=5, phrase_time_limit=10)
            user_text = recognizer.recognize_google(audio)

            full_response = ""
            for chunk in chatbot.get_response(user_text):
                full_response += chunk

            return JSONResponse({
                "user_text": user_text,
                "bot_full_text": full_response.strip()
            })

    except Exception as e:
        return JSONResponse({
            "user_text": "...",
            "bot_full_text": "I'm sorry, I had trouble hearing that."
        })
        
# handles the typed input 
@app.get("/chat")
async def chat_via_text(text: str):
    # take the text from the URL (sent by JavaScript)
    user_text = text

    # This is done so we dont have to wait for the AI to print it out word by word because its too long, 
    # so we gather it in chunks instead 
    full_response = ""
    for chunk in chatbot.get_response(user_text):
        full_response += chunk

    # send it back to the screen
    return JSONResponse({
        "user_text": user_text,
        "bot_full_text": full_response.strip()
    })

# boots up the server on my machine locally 
# uvicorn runs fastapi 
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)