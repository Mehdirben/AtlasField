"""
Pydantic schemas for request/response validation
"""
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, EmailStr, Field
from app.models import SubscriptionTier, AnalysisType, AlertSeverity


# ============== Auth Schemas ==============

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    is_active: bool
    is_verified: bool
    subscription_tier: SubscriptionTier
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None


# ============== Field Schemas ==============

class FieldCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    geometry: dict  # GeoJSON polygon
    crop_type: Optional[str] = None
    planting_date: Optional[datetime] = None


class FieldUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    crop_type: Optional[str] = None
    planting_date: Optional[datetime] = None


class FieldResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    geometry: dict
    area_hectares: Optional[float]
    crop_type: Optional[str]
    planting_date: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FieldWithAnalysis(FieldResponse):
    latest_ndvi: Optional[float] = None
    latest_analysis_date: Optional[datetime] = None
    alert_count: int = 0


# ============== Analysis Schemas ==============

class AnalysisRequest(BaseModel):
    analysis_type: AnalysisType = AnalysisType.NDVI
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class AnalysisResponse(BaseModel):
    id: int
    field_id: int
    analysis_type: AnalysisType
    satellite_date: Optional[datetime]
    data: dict
    mean_value: Optional[float]
    min_value: Optional[float]
    max_value: Optional[float]
    cloud_coverage: Optional[float]
    interpretation: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class YieldPrediction(BaseModel):
    crop: str
    area_ha: float
    yield_per_ha: float
    total_yield_tonnes: float
    confidence_percent: float
    assessment_date: str


class BiomassEstimate(BaseModel):
    mean_biomass_t_ha: float
    min_biomass_t_ha: float
    max_biomass_t_ha: float
    total_carbon_t_ha: float
    interpretation: str


# ============== Alert Schemas ==============

class AlertResponse(BaseModel):
    id: int
    field_id: int
    severity: AlertSeverity
    title: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ============== Chat Schemas ==============

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: Optional[datetime] = None


class ChatRequest(BaseModel):
    message: str
    field_id: Optional[int] = None  # Optional field context


class ChatResponse(BaseModel):
    response: str
    field_context: Optional[dict] = None


class ChatHistoryResponse(BaseModel):
    id: int
    field_id: Optional[int]
    messages: list[ChatMessage]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============== Dashboard Schemas ==============

class DashboardStats(BaseModel):
    total_fields: int
    total_area_hectares: float
    healthy_fields: int
    fields_needing_attention: int
    unread_alerts: int
    recent_analyses: list[AnalysisResponse]
