"""
SQLAlchemy models for AtlasField
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Float, Boolean, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB
import enum

from app.database import Base


class SubscriptionTier(str, enum.Enum):
    FREE = "FREE"
    PRO = "PRO"
    ENTERPRISE = "ENTERPRISE"


class SiteType(str, enum.Enum):
    """Type of monitored site"""
    FIELD = "FIELD"
    FOREST = "FOREST"


class AnalysisType(str, enum.Enum):
    NDVI = "NDVI"
    RVI = "RVI"
    MOISTURE = "MOISTURE"
    FUSION = "FUSION"
    YIELD = "YIELD"
    BIOMASS = "BIOMASS"
    COMPLETE = "COMPLETE"  # Comprehensive analysis combining all metrics
    FOREST = "FOREST"  # Forest-specific analysis (NBR, NDMI, canopy)


class AlertSeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class AlertType(str, enum.Enum):
    """Type of alert for different monitoring scenarios"""
    VEGETATION_HEALTH = "VEGETATION_HEALTH"
    MOISTURE = "MOISTURE"
    FIRE_RISK = "FIRE_RISK"
    DEFORESTATION = "DEFORESTATION"
    DROUGHT_STRESS = "DROUGHT_STRESS"
    PEST_DISEASE = "PEST_DISEASE"


class User(Base):
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    subscription_tier: Mapped[SubscriptionTier] = mapped_column(
        SQLEnum(SubscriptionTier), default=SubscriptionTier.FREE
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    sites: Mapped[list["Site"]] = relationship("Site", back_populates="owner", cascade="all, delete-orphan")
    chat_histories: Mapped[list["ChatHistory"]] = relationship("ChatHistory", back_populates="user", cascade="all, delete-orphan")


class Site(Base):
    """
    A monitored site - can be an agricultural field or a forest
    """
    __tablename__ = "sites"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    geometry: Mapped[dict] = mapped_column(JSONB, nullable=False)  # GeoJSON polygon
    area_hectares: Mapped[Optional[float]] = mapped_column(Float)
    
    # Site type discriminator
    site_type: Mapped[SiteType] = mapped_column(SQLEnum(SiteType), default=SiteType.FIELD, nullable=False)
    
    # Field-specific columns (nullable, used when site_type='field')
    crop_type: Mapped[Optional[str]] = mapped_column(String(100))
    planting_date: Mapped[Optional[datetime]] = mapped_column(DateTime)
    
    # Forest-specific columns (nullable, used when site_type='forest')
    forest_type: Mapped[Optional[str]] = mapped_column(String(50))  # coniferous, deciduous, mixed
    tree_species: Mapped[Optional[str]] = mapped_column(String(100))  # e.g., oak, pine, eucalyptus
    protected_status: Mapped[Optional[str]] = mapped_column(String(100))  # e.g., none, national_park, reserve
    
    # Forest baseline columns for year-over-year comparison
    baseline_carbon_t_ha: Mapped[Optional[float]] = mapped_column(Float)
    baseline_canopy_cover: Mapped[Optional[float]] = mapped_column(Float)
    baseline_date: Mapped[Optional[datetime]] = mapped_column(DateTime)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="sites")
    analyses: Mapped[list["Analysis"]] = relationship("Analysis", back_populates="site", cascade="all, delete-orphan")
    alerts: Mapped[list["Alert"]] = relationship("Alert", back_populates="site", cascade="all, delete-orphan")


class Analysis(Base):
    __tablename__ = "analyses"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    site_id: Mapped[int] = mapped_column(ForeignKey("sites.id"), nullable=False)
    analysis_type: Mapped[AnalysisType] = mapped_column(SQLEnum(AnalysisType), nullable=False)
    satellite_date: Mapped[Optional[datetime]] = mapped_column(DateTime)
    data: Mapped[dict] = mapped_column(JSONB, nullable=False)  # Analysis results
    mean_value: Mapped[Optional[float]] = mapped_column(Float)
    min_value: Mapped[Optional[float]] = mapped_column(Float)
    max_value: Mapped[Optional[float]] = mapped_column(Float)
    cloud_coverage: Mapped[Optional[float]] = mapped_column(Float)
    interpretation: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    site: Mapped["Site"] = relationship("Site", back_populates="analyses")


class Alert(Base):
    __tablename__ = "alerts"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    site_id: Mapped[int] = mapped_column(ForeignKey("sites.id"), nullable=False)
    alert_type: Mapped[Optional[AlertType]] = mapped_column(SQLEnum(AlertType))
    severity: Mapped[AlertSeverity] = mapped_column(SQLEnum(AlertSeverity), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    site: Mapped["Site"] = relationship("Site", back_populates="alerts")


class ChatHistory(Base):
    __tablename__ = "chat_histories"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    site_id: Mapped[Optional[int]] = mapped_column(ForeignKey("sites.id"))
    messages: Mapped[list] = mapped_column(JSONB, default=list)  # List of {role, content, timestamp}
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="chat_histories")


# Backwards compatibility aliases
Field = Site
