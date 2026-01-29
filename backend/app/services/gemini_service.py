"""
Gemini Service - AI-powered agricultural assistant
Uses Google's Gemini API for natural language understanding
"""
from typing import Optional
import google.generativeai as genai

from app.config import settings


class GeminiService:
    """
    Service for AI-powered agricultural advice using Gemini
    """
    
    SYSTEM_PROMPT = """You are AtlasField AI, an expert agricultural assistant specialized in:
- Satellite data analysis (NDVI, vegetation indices, radar)
- Agronomic advice for agriculture and forestry
- Interpretation of crop health indicators
- Irrigation and treatment recommendations
- Yield prediction and biomass estimation

You work with Sentinel-1 (radar) and Sentinel-2 (optical) satellite data to provide real-time insights.

Rules:
1. Always respond in English unless the user speaks another language
2. Base your advice on satellite data when available
3. Be concise but precise in your recommendations
4. Mention limitations if data is insufficient
5. Suggest concrete actions when possible

If field data is provided, use it to contextualize your responses."""

    def __init__(self):
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.model = genai.GenerativeModel(settings.GEMINI_MODEL)
        else:
            self.model = None
    
    async def chat(
        self,
        message: str,
        field_context: Optional[dict] = None,
        history: Optional[list] = None
    ) -> str:
        """
        Send a message to Gemini and get a response
        
        Args:
            message: User's message
            field_context: Optional field data for context
            history: Previous conversation messages
        """
        if not self.model:
            print("Gemini API key not configured, using fallback responses")
            return self._get_fallback_response(message, field_context)
        
        try:
            # Build context message
            context_parts = [self.SYSTEM_PROMPT]
            
            if field_context:
                context_parts.append(f"\n\nSelected field context:")
                context_parts.append(f"- Name: {field_context.get('field_name', 'Not specified')}")
                context_parts.append(f"- Crop: {field_context.get('crop_type', 'Not specified')}")
                context_parts.append(f"- Area: {field_context.get('area_hectares', 'N/A')} hectares")
                
                if field_context.get('planting_date'):
                    context_parts.append(f"- Planting date: {field_context['planting_date']}")
                
                if field_context.get('analyses'):
                    context_parts.append("\nLatest satellite analyses:")
                    for analysis in field_context['analyses'][:3]:
                        context_parts.append(
                            f"  - {analysis['type'].upper()}: {analysis.get('mean_value', 'N/A')} "
                            f"({analysis.get('interpretation', '')})"
                        )
            
            # Build conversation
            full_prompt = "\n".join(context_parts)
            
            # Add history if available
            chat_messages = []
            if history:
                for msg in history[-6:]:  # Last 6 messages
                    role = "user" if msg.get("role") == "user" else "model"
                    chat_messages.append({
                        "role": role,
                        "parts": [msg.get("content", "")]
                    })
            
            # Start chat with system context
            chat = self.model.start_chat(history=chat_messages)
            
            # If no history, include system prompt in first message
            if not history:
                full_message = f"{full_prompt}\n\nUser: {message}"
            else:
                full_message = message
            
            response = chat.send_message(full_message)
            
            return response.text
            
        except Exception as e:
            # Log the actual error for debugging
            print(f"Gemini API Error: {str(e)}")
            # Return error message instead of fallback
            return f"I encountered an error connecting to AI: {str(e)}. Please try again."
    
    def _get_fallback_response(self, message: str, field_context: Optional[dict] = None) -> str:
        """Provide fallback responses when API is unavailable"""
        message_lower = message.lower()
        
        # Basic keyword matching for common questions
        if any(word in message_lower for word in ["ndvi", "vegetation", "health"]):
            if field_context and field_context.get('analyses'):
                analyses = field_context['analyses']
                ndvi_analysis = next((a for a in analyses if a['type'] == 'ndvi'), None)
                if ndvi_analysis:
                    return (
                        f"According to the latest NDVI analysis of your field '{field_context.get('field_name', '')}', "
                        f"the vegetation index is {ndvi_analysis.get('mean_value', 'N/A')}. "
                        f"{ndvi_analysis.get('interpretation', '')}\n\n"
                        "An NDVI between 0.6 and 0.8 indicates healthy vegetation. "
                        "If the value is below 0.4, consider checking irrigation and nutrients."
                    )
            return (
                "The NDVI (Normalized Difference Vegetation Index) measures vegetation health. "
                "Typical values:\n"
                "- < 0.2: Bare soil or very low vegetation\n"
                "- 0.2-0.4: Vegetation under stress\n"
                "- 0.4-0.6: Moderate vegetation\n"
                "- 0.6-0.8: Healthy vegetation\n"
                "- > 0.8: Very dense vegetation"
            )
        
        if any(word in message_lower for word in ["irrigation", "watering", "water"]):
            return (
                "To optimize irrigation, I recommend:\n\n"
                "1. **NDWI Monitoring**: The water index helps detect water stress\n"
                "2. **Watering times**: Prefer early morning or evening\n"
                "3. **Frequency**: Adapt according to soil type and weather\n\n"
                "Run a satellite analysis to get personalized recommendations "
                "based on your field's current data."
            )
        
        if any(word in message_lower for word in ["yield", "harvest", "production"]):
            if field_context:
                crop = field_context.get('crop_type', 'crop')
                area = field_context.get('area_hectares', 1)
                return (
                    f"To estimate the yield of your {crop} on {area} hectares, "
                    "I use historical NDVI data and radar indices.\n\n"
                    "Key factors:\n"
                    "- NDVI history over the season\n"
                    "- Weather conditions\n"
                    "- Soil type\n\n"
                    "Use the 'Yield Prediction' function for a detailed estimate."
                )
            return (
                "Yield prediction uses:\n"
                "- Vegetation index history (NDVI)\n"
                "- Radar data for biomass\n"
                "- Crop type and area\n\n"
                "Select a field to get a personalized prediction."
            )
        
        # Default response
        return (
            "I'm AtlasField AI, your agricultural assistant. I can help you with:\n\n"
            "🛰️ **Satellite Analysis**: NDVI, vegetation indices, stress detection\n"
            "💧 **Irrigation**: Recommendations based on moisture data\n"
            "📊 **Yield**: Predictions based on growth history\n"
            "🌱 **Crop Health**: Early problem detection\n\n"
            "Ask me a specific question or select a field for personalized advice!"
        )
