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
    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"


class AnalysisType(str, enum.Enum):
    NDVI = "NDVI"
    RVI = "RVI"
    MOISTURE = "MOISTURE"
    FUSION = "FUSION"
    YIELD = "YIELD"
    BIOMASS = "BIOMASS"
    COMPLETE = "COMPLETE"  # Comprehensive analysis combining all metrics


class AlertSeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


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
    fields: Mapped[list["Field"]] = relationship("Field", back_populates="owner", cascade="all, delete-orphan")
    chat_histories: Mapped[list["ChatHistory"]] = relationship("ChatHistory", back_populates="user", cascade="all, delete-orphan")


class Field(Base):
    __tablename__ = "fields"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    geometry: Mapped[dict] = mapped_column(JSONB, nullable=False)  # GeoJSON polygon
    area_hectares: Mapped[Optional[float]] = mapped_column(Float)
    crop_type: Mapped[Optional[str]] = mapped_column(String(100))
    planting_date: Mapped[Optional[datetime]] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="fields")
    analyses: Mapped[list["Analysis"]] = relationship("Analysis", back_populates="field", cascade="all, delete-orphan")
    alerts: Mapped[list["Alert"]] = relationship("Alert", back_populates="field", cascade="all, delete-orphan")


class Analysis(Base):
    __tablename__ = "analyses"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    field_id: Mapped[int] = mapped_column(ForeignKey("fields.id"), nullable=False)
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
    field: Mapped["Field"] = relationship("Field", back_populates="analyses")


class Alert(Base):
    __tablename__ = "alerts"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    field_id: Mapped[int] = mapped_column(ForeignKey("fields.id"), nullable=False)
    severity: Mapped[AlertSeverity] = mapped_column(SQLEnum(AlertSeverity), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    field: Mapped["Field"] = relationship("Field", back_populates="alerts")


class ChatHistory(Base):
    __tablename__ = "chat_histories"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    field_id: Mapped[Optional[int]] = mapped_column(ForeignKey("fields.id"))
    messages: Mapped[list] = mapped_column(JSONB, default=list)  # List of {role, content, timestamp}
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="chat_histories")
