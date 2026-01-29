"""
Pydantic schemas for request/response validation
"""
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, EmailStr, Field, field_validator
from app.models import SubscriptionTier, AnalysisType, AlertSeverity, AlertType, SiteType


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


# ============== Site Schemas (formerly Field) ==============

class SiteCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    geometry: dict  # GeoJSON polygon
    site_type: SiteType = SiteType.FIELD
    # Field-specific
    crop_type: Optional[str] = None
    planting_date: Optional[datetime] = None
    # Forest-specific
    forest_type: Optional[str] = None  # coniferous, deciduous, mixed (auto-detected if not provided)
    tree_species: Optional[str] = None
    protected_status: Optional[str] = None
    
    @field_validator('forest_type')
    @classmethod
    def validate_forest_type(cls, v):
        if v is not None:
            valid_types = ['coniferous', 'deciduous', 'mixed', 'tropical', 'mangrove']
            if v.lower() not in valid_types:
                raise ValueError(f'forest_type must be one of: {", ".join(valid_types)}')
            return v.lower()
        return v


class SiteUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    # Field-specific
    crop_type: Optional[str] = None
    planting_date: Optional[datetime] = None
    # Forest-specific
    forest_type: Optional[str] = None
    tree_species: Optional[str] = None
    protected_status: Optional[str] = None


class SiteResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    geometry: dict
    area_hectares: Optional[float]
    site_type: SiteType
    # Field-specific
    crop_type: Optional[str]
    planting_date: Optional[datetime]
    # Forest-specific
    forest_type: Optional[str]
    tree_species: Optional[str]
    protected_status: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SiteWithAnalysis(SiteResponse):
    latest_ndvi: Optional[float] = None
    latest_analysis_date: Optional[datetime] = None
    alert_count: int = 0
    # Forest-specific analysis data
    latest_nbr: Optional[float] = None  # Normalized Burn Ratio
    fire_risk_level: Optional[str] = None


# Backwards compatibility aliases
FieldCreate = SiteCreate
FieldUpdate = SiteUpdate
FieldResponse = SiteResponse
FieldWithAnalysis = SiteWithAnalysis


# ============== Analysis Schemas ==============

class AnalysisRequest(BaseModel):
    analysis_type: AnalysisType = AnalysisType.NDVI
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class AnalysisResponse(BaseModel):
    id: int
    site_id: int
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
    site_id: int
    alert_type: Optional[AlertType]
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
    site_id: Optional[int] = None  # Optional site context


class ChatResponse(BaseModel):
    response: str
    site_context: Optional[dict] = None


class ChatHistoryResponse(BaseModel):
    id: int
    site_id: Optional[int]
    messages: list[ChatMessage]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============== Dashboard Schemas ==============

class DashboardStats(BaseModel):
    total_sites: int
    total_fields: int
    total_forests: int
    total_area_hectares: float
    healthy_sites: int
    sites_needing_attention: int
    unread_alerts: int
    recent_analyses: list[AnalysisResponse]


# ============== Forest-specific Schemas ==============

class ForestClassification(BaseModel):
    """Auto-detected forest classification from satellite data"""
    detected_type: str  # coniferous, deciduous, mixed
    confidence: float  # 0-1
    canopy_cover_percent: float
    spectral_signature: dict


class ForestAnalysis(BaseModel):
    """Forest-specific analysis results"""
    nbr: float  # Normalized Burn Ratio
    ndmi: float  # Normalized Difference Moisture Index
    canopy_health: str
    fire_risk_level: str  # low, medium, high, critical
    deforestation_detected: bool
    carbon_estimate_tonnes_ha: float
    interpretation: str


# ============== Forest Trends Schemas (Analysis-by-Analysis Comparison) ==============

class ForestAnalysisData(BaseModel):
    """Forest data for a single analysis"""
    analysis_id: int
    date: datetime
    ndvi: float
    nbr: float
    ndmi: float
    carbon_stock_t_ha: float
    canopy_cover_percent: float
    fire_risk_level: str
    deforestation_risk: str
    # Change from previous analysis
    ndvi_change_pct: Optional[float] = None
    nbr_change_pct: Optional[float] = None
    carbon_change_pct: Optional[float] = None
    canopy_change_pct: Optional[float] = None


class ForestTrends(BaseModel):
    """Analysis-by-analysis forest trends with baseline comparison"""
    analyses: list[ForestAnalysisData]
    overall_trend: str  # improving, stable, declining, unknown
    avg_ndvi_change: Optional[float] = None  # Average change across all analyses
    avg_carbon_change: Optional[float] = None
    baseline_comparison: Optional[dict] = None  # comparison to first recorded baseline
    has_sufficient_data: bool = True
    message: Optional[str] = None

# ============== Field Trends Schemas (Analysis-by-Analysis Comparison) ==============

class FieldAnalysisData(BaseModel):
    """Field data for a single analysis"""
    analysis_id: int
    date: datetime
    ndvi: float
    yield_per_ha: Optional[float] = None
    biomass_t_ha: Optional[float] = None
    moisture_pct: Optional[float] = None
    # Change from previous analysis
    ndvi_change_pct: Optional[float] = None
    yield_change_pct: Optional[float] = None


class FieldTrends(BaseModel):
    """Analysis-by-analysis field trends"""
    analyses: list[FieldAnalysisData]
    overall_trend: str  # improving, stable, declining, unknown
    avg_ndvi_change: Optional[float] = None
    avg_yield_change: Optional[float] = None
    baseline_comparison: Optional[dict] = None
    has_sufficient_data: bool = True
    message: Optional[str] = None
