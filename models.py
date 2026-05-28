#Model class!
# wrap all my AI code in here so it doesnt mess with main 
import ollama

class OllamaChatbot:
    def __init__(self, model_name="llama3.2:1b"):
        self.model_name = model_name
        
        #short term emmory 
        # This list will store all previous exchanges to provide context
        self.history = []
        
        # Trigger words to detect high-risk user input 
        self.crisis_keywords = [
            "suicide", "hurt myself", "end my life", "kill myself", 
            "self-harm", "overdose", "emergency", "suicidal", "dont want to be alive"
        ]
        
        # A pre-defined safe fall-back message 
        self.emergency_response = (
            "I'm concerned about what you're sharing. Please know you're not alone. "
            "If you are in immediate danger, please call 999 or go to your local A&E. "
            "You can also call the Samaritans at 116 123 for free support. They are a 24/7 hotline."
        )

        # Sets the personality of the AI
        self.system_message = {
            'role': 'system',
            'content': (
                "You are Kora, a warm, welcoming, and empathetic mental health support bot. "
                "Your goal is to provide a safe space for users to vent and feel heard. "
                "CRITICAL RULES: "
                "1. Keep every response to a maximum of 3 sentences. "
                "2. Do not be repetitive. "
                "3. Use the user's previous context to provide more personalized support."
            )
        }

    def _is_crisis(self, text: str) -> bool:
        #Helper method to check for high-risk keywords.
        return any(keyword in text.lower() for keyword in self.crisis_keywords)

    def get_response(self, user_text: str):
        if self._is_crisis(user_text):
            yield self.emergency_response
            return

        self.history.append({'role': 'user', 'content': user_text})

        try:
            response = ollama.chat(
                model=self.model_name,
                messages=[self.system_message] + self.history,
                stream=True,
            )
            full_bot_reply = ""
            for chunk in response:
                if 'message' in chunk and 'content' in chunk['message']:
                    content = chunk['message']['content']
                    full_bot_reply += content
                    yield content
            
            self.history.append({'role': 'assistant', 'content': full_bot_reply})
            
        except Exception as e:
            yield f"I'm sorry, I encountered an internal error: {str(e)}"

    def clear_history(self):
        self.history = []