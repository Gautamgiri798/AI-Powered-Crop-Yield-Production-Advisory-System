import os
import google.generativeai as genai
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.conf import settings
from .models import ChatSession, ChatMessage
from .serializers import ChatSessionSerializer
import uuid
import logging

logger = logging.getLogger(__name__)

# Configure Gemini
genai.configure(api_key=os.environ.get('GEMINI_API_KEY'))

class ChatView(APIView):
    permission_classes = [permissions.AllowAny] 

    def post(self, request):
        question = request.data.get('question')
        session_id = request.data.get('sessionId')
        clear_history = request.data.get('clearHistory', False)
        language_code = request.data.get('language', 'en-US')
        
        # Ensure API key is configured (sometimes env loading is delayed in dev)
        api_key = os.environ.get('GEMINI_API_KEY')
        if not api_key:
            return Response({'error': 'AI configuration missing (GEMINI_API_KEY).'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        genai.configure(api_key=api_key)

        # Determine target language
        lang_map = {
            'en-US': 'English',
            'hi-IN': 'Hindi (हिंदी)',
            'or-IN': 'Odia (ଓଡ଼ିଆ)',
            'bn-IN': 'Bengali (বাংলা)',
            'pa-IN': 'Punjabi (ਪੰਜਾਬੀ)',
            'te-IN': 'Telugu (తెలుగు)'
        }
        target_language = lang_map.get(language_code, 'English')

        if not question:
            return Response({'error': 'No question provided.'}, status=status.HTTP_400_BAD_REQUEST)

        # Get/Create Session
        if not session_id:
            session_id = f"session_{uuid.uuid4().hex[:12]}"
        
        session, _ = ChatSession.objects.get_or_create(session_id=session_id)

        if clear_history:
            session.messages.all().delete()

        # Build History
        db_history = session.messages.all().order_by('timestamp')[:30] 
        chat_history = []
        for msg in db_history:
            chat_history.append({"role": "model" if msg.role == "model" else "user", "parts": [msg.text]})

        # System Instruction - Refined for better response
        system_instruction = f"""You are 'Krishi Assistant', a helpful AI for the KrishiSaarthi platform.
Answer all types of questions correctly:
1. Agriculture: Provide expert-level structured Markdown advice.
2. Common Knowledge: Answer accurately and fully (e.g. facts, math, general info).
3. Formatting: Use bullet points, bold text, and clear paragraphs.

CRITICAL: Entire response MUST be in {target_language} language only."""

        # Robust Model Chain
        model_chain = ["gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-1.5-pro", "gemini-2.0-flash-exp"]
        last_error = None

        for model_name in model_chain:
            try:
                model = genai.GenerativeModel(model_name=model_name, system_instruction=system_instruction)
                chat = model.start_chat(history=chat_history)
                
                # Use safety settings to avoid blocked responses for harmless info
                safety_settings = [
                    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_ONLY_HIGH"},
                    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_ONLY_HIGH"},
                    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_ONLY_HIGH"},
                    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_ONLY_HIGH"},
                ]
                
                response = chat.send_message(question, safety_settings=safety_settings)
                reply_text = response.text

                # Save history
                ChatMessage.objects.create(session=session, role='user', text=question)
                ChatMessage.objects.create(session=session, role='model', text=reply_text)

                return Response({'reply': reply_text, 'sessionId': session_id})

            except Exception as e:
                last_error = str(e)
                logger.warning(f"Gemini {model_name} failed: {last_error[:150]}")
                if "429" in last_error or "quota" in last_error.lower():
                    import time; time.sleep(0.5)
                    continue
                continue

        # If all failed, provide helpful context if it's a quota issue
        if last_error and ("429" in last_error or "quota" in last_error.lower()):
            return Response({
                'error': 'The AI assistant is very busy. Please wait a minute. The free daily limit may have been reached.'
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)

        return Response({
            'error': 'The AI assistant is currently recharging. Please try again in 5 minutes.'
        }, status=status.HTTP_502_BAD_GATEWAY)

class ChatHistoryView(APIView):
    permission_classes = [permissions.AllowAny] # Allow non-logged in users to clear their session storage history

    def get(self, request, session_id):
        try:
            session = ChatSession.objects.get(session_id=session_id)
            serializer = ChatSessionSerializer(session)
            return Response(serializer.data)
        except ChatSession.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, session_id):
        try:
            session = ChatSession.objects.get(session_id=session_id)
            session.delete()
            return Response({'message': 'Cleared'})
        except ChatSession.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

