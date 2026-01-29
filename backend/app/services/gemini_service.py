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
    
    SYSTEM_PROMPT = """Tu es AtlasField AI, un assistant agricole expert spécialisé dans:
- L'analyse des données satellite (NDVI, indices de végétation, radar)
- Les conseils agronomiques pour l'agriculture et la foresterie
- L'interprétation des indicateurs de santé des cultures
- Les recommandations d'irrigation et de traitement
- La prédiction des rendements et l'estimation de la biomasse

Tu travailles avec des données satellite Sentinel-1 (radar) et Sentinel-2 (optique) pour fournir des insights en temps réel.

Règles:
1. Réponds toujours en français sauf si l'utilisateur parle une autre langue
2. Base tes conseils sur les données satellite quand disponibles
3. Sois concis mais précis dans tes recommandations
4. Mentionne les limitations si les données sont insuffisantes
5. Propose des actions concrètes quand possible

Si des données de champ sont fournies, utilise-les pour contextualiser tes réponses."""

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
            return self._get_fallback_response(message, field_context)
        
        try:
            # Build context message
            context_parts = [self.SYSTEM_PROMPT]
            
            if field_context:
                context_parts.append(f"\n\nContexte du champ sélectionné:")
                context_parts.append(f"- Nom: {field_context.get('field_name', 'Non spécifié')}")
                context_parts.append(f"- Culture: {field_context.get('crop_type', 'Non spécifiée')}")
                context_parts.append(f"- Surface: {field_context.get('area_hectares', 'N/A')} hectares")
                
                if field_context.get('planting_date'):
                    context_parts.append(f"- Date de plantation: {field_context['planting_date']}")
                
                if field_context.get('analyses'):
                    context_parts.append("\nDernières analyses satellite:")
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
                full_message = f"{full_prompt}\n\nUtilisateur: {message}"
            else:
                full_message = message
            
            response = chat.send_message(full_message)
            
            return response.text
            
        except Exception as e:
            return self._get_fallback_response(message, field_context)
    
    def _get_fallback_response(self, message: str, field_context: Optional[dict] = None) -> str:
        """Provide fallback responses when API is unavailable"""
        message_lower = message.lower()
        
        # Basic keyword matching for common questions
        if any(word in message_lower for word in ["ndvi", "végétation", "santé"]):
            if field_context and field_context.get('analyses'):
                analyses = field_context['analyses']
                ndvi_analysis = next((a for a in analyses if a['type'] == 'ndvi'), None)
                if ndvi_analysis:
                    return (
                        f"D'après la dernière analyse NDVI de votre champ '{field_context.get('field_name', '')}', "
                        f"l'indice de végétation est de {ndvi_analysis.get('mean_value', 'N/A')}. "
                        f"{ndvi_analysis.get('interpretation', '')}\n\n"
                        "Un NDVI entre 0.6 et 0.8 indique une végétation saine. "
                        "Si la valeur est inférieure à 0.4, envisagez de vérifier l'irrigation et les nutriments."
                    )
            return (
                "L'indice NDVI (Normalized Difference Vegetation Index) mesure la santé de la végétation. "
                "Valeurs typiques:\n"
                "- < 0.2: Sol nu ou végétation très faible\n"
                "- 0.2-0.4: Végétation en stress\n"
                "- 0.4-0.6: Végétation modérée\n"
                "- 0.6-0.8: Végétation saine\n"
                "- > 0.8: Végétation très dense"
            )
        
        if any(word in message_lower for word in ["irrigation", "arrosage", "eau"]):
            return (
                "Pour optimiser l'irrigation, je recommande:\n\n"
                "1. **Surveillance NDWI**: L'indice d'eau permet de détecter le stress hydrique\n"
                "2. **Heures d'arrosage**: Privilégiez tôt le matin ou en soirée\n"
                "3. **Fréquence**: Adaptez selon le type de sol et la météo\n\n"
                "Lancez une analyse satellite pour obtenir des recommandations personnalisées "
                "basées sur les données actuelles de votre champ."
            )
        
        if any(word in message_lower for word in ["rendement", "récolte", "production"]):
            if field_context:
                crop = field_context.get('crop_type', 'culture')
                area = field_context.get('area_hectares', 1)
                return (
                    f"Pour estimer le rendement de votre {crop} sur {area} hectares, "
                    "j'utilise les données NDVI historiques et les indices radar.\n\n"
                    "Facteurs clés:\n"
                    "- Historique NDVI sur la saison\n"
                    "- Conditions météorologiques\n"
                    "- Type de sol\n\n"
                    "Utilisez la fonction 'Prédiction de rendement' pour une estimation détaillée."
                )
            return (
                "La prédiction de rendement utilise:\n"
                "- L'historique des indices de végétation (NDVI)\n"
                "- Les données radar pour la biomasse\n"
                "- Le type de culture et la surface\n\n"
                "Sélectionnez un champ pour obtenir une prédiction personnalisée."
            )
        
        # Default response
        return (
            "Je suis AtlasField AI, votre assistant agricole. Je peux vous aider avec:\n\n"
            "🛰️ **Analyse satellite**: NDVI, indices de végétation, détection de stress\n"
            "💧 **Irrigation**: Recommandations basées sur les données d'humidité\n"
            "📊 **Rendement**: Prédictions basées sur l'historique de croissance\n"
            "🌱 **Santé des cultures**: Détection précoce de problèmes\n\n"
            "Posez-moi une question spécifique ou sélectionnez un champ pour des conseils personnalisés!"
        )
