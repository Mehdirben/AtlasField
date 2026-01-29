"""
Analysis Service - Yield prediction, biomass estimation, and data interpretation
"""
from datetime import datetime
from typing import Optional
import numpy as np

from app.models import AnalysisType


class AnalysisService:
    """
    Service for agricultural analysis calculations
    """
    
    # Crop yield coefficients (calibrated for Mediterranean agriculture)
    CROP_COEFFICIENTS = {
        "wheat": {"base_yield": 2.5, "ndvi_factor": 4.0},      # tonnes/ha
        "barley": {"base_yield": 2.2, "ndvi_factor": 3.8},
        "olives": {"base_yield": 3.0, "ndvi_factor": 3.5},
        "citrus": {"base_yield": 25.0, "ndvi_factor": 15.0},
        "tomatoes": {"base_yield": 60.0, "ndvi_factor": 40.0},
        "potatoes": {"base_yield": 25.0, "ndvi_factor": 18.0},
        "corn": {"base_yield": 8.0, "ndvi_factor": 6.0},
        "sunflower": {"base_yield": 2.0, "ndvi_factor": 2.5},
        "grapes": {"base_yield": 8.0, "ndvi_factor": 5.0},
        "almonds": {"base_yield": 2.5, "ndvi_factor": 2.0},
    }
    
    @classmethod
    def predict_yield(
        cls,
        ndvi_history: list[float],
        crop_type: str,
        area_ha: float
    ) -> dict:
        """
        Predict yield based on NDVI history
        
        Args:
            ndvi_history: List of NDVI values over growing season
            crop_type: Type of crop
            area_ha: Field area in hectares
        """
        # Get crop coefficients (default to wheat if unknown)
        crop_lower = crop_type.lower() if crop_type else "wheat"
        coef = cls.CROP_COEFFICIENTS.get(crop_lower, cls.CROP_COEFFICIENTS["wheat"])
        
        # Calculate integrated NDVI (average over season)
        if ndvi_history:
            integrated_ndvi = np.mean([v for v in ndvi_history if v is not None and v > 0])
        else:
            integrated_ndvi = 0.5
        
        # Simple yield model: base + (factor × NDVI)
        yield_per_ha = coef["base_yield"] + (coef["ndvi_factor"] * integrated_ndvi)
        
        # Add some realistic variation
        yield_per_ha *= np.random.uniform(0.9, 1.1)
        
        total_yield = yield_per_ha * area_ha
        
        # Confidence based on data quality
        confidence = min(95, 50 + len(ndvi_history) * 5)
        
        return {
            "crop": crop_type or "wheat",
            "area_ha": round(area_ha, 2),
            "yield_per_ha": round(yield_per_ha, 2),
            "total_yield_tonnes": round(total_yield, 2),
            "confidence_percent": confidence,
            "assessment_date": datetime.utcnow().isoformat()
        }
    
    @classmethod
    def estimate_biomass(cls, ndvi: float, rvi: float = None) -> dict:
        """
        Estimate above-ground biomass in tonnes/hectare
        Uses both optical (NDVI) and radar (RVI) data when available
        
        Formula: Biomass = a × RVI^b × NDVI^c (calibrated for Mediterranean crops)
        """
        # Empirical coefficients
        a = 15.0  # Base coefficient
        b = 0.8   # RVI exponent
        c = 0.6   # NDVI exponent
        
        # Safe values
        ndvi_safe = max(0.01, min(1.0, ndvi if ndvi else 0.5))
        rvi_safe = max(0.01, min(1.0, rvi if rvi else 0.5))
        
        # Calculate biomass
        biomass = a * (rvi_safe ** b) * (ndvi_safe ** c)
        
        # Add realistic variation
        variation = np.random.uniform(0.85, 1.15)
        
        mean_biomass = biomass * variation
        min_biomass = mean_biomass * 0.7
        max_biomass = mean_biomass * 1.4
        
        # Carbon content (approximately 47% of dry biomass)
        carbon = mean_biomass * 0.47
        
        return {
            "mean_biomass_t_ha": round(mean_biomass, 2),
            "min_biomass_t_ha": round(min_biomass, 2),
            "max_biomass_t_ha": round(max_biomass, 2),
            "total_carbon_t_ha": round(carbon, 2),
            "interpretation": cls._interpret_biomass(mean_biomass)
        }
    
    @staticmethod
    def _interpret_biomass(biomass: float) -> str:
        """Interpret biomass value"""
        if biomass < 2:
            return "Low biomass - early season or stressed vegetation"
        elif biomass < 5:
            return "Moderate biomass - normal growth"
        elif biomass < 10:
            return "High biomass - well-developed vegetation"
        else:
            return "Very high biomass - dense and mature vegetation"
    
    @classmethod
    def get_mock_analysis(cls, analysis_type: AnalysisType, bbox: tuple) -> dict:
        """
        Generate mock analysis data for development/demo
        """
        if analysis_type == AnalysisType.NDVI:
            mean = 0.45 + np.random.uniform(-0.15, 0.2)
            return {
                "mean": round(mean, 3),
                "min": round(max(0, mean - 0.2), 3),
                "max": round(min(1, mean + 0.25), 3),
                "cloud_coverage": round(np.random.uniform(0, 25), 1),
                "interpretation": cls._interpret_ndvi(mean),
                "raw_data": {"source": "mock", "type": "ndvi"}
            }
        
        elif analysis_type == AnalysisType.RVI:
            mean = 0.5 + np.random.uniform(-0.1, 0.15)
            return {
                "mean": round(mean, 3),
                "min": round(max(0, mean - 0.15), 3),
                "max": round(min(1, mean + 0.2), 3),
                "cloud_coverage": 0,
                "interpretation": cls._interpret_ndvi(mean),
                "raw_data": {"source": "mock", "type": "rvi"}
            }
        
        elif analysis_type == AnalysisType.MOISTURE:
            mean = 0.3 + np.random.uniform(-0.1, 0.2)
            return {
                "mean": round(mean, 3),
                "min": round(max(0, mean - 0.15), 3),
                "max": round(min(1, mean + 0.2), 3),
                "cloud_coverage": round(np.random.uniform(0, 20), 1),
                "interpretation": cls._interpret_moisture(mean),
                "raw_data": {"source": "mock", "type": "moisture"}
            }
        
        elif analysis_type == AnalysisType.FUSION:
            ndvi = 0.45 + np.random.uniform(-0.1, 0.15)
            rvi = 0.5 + np.random.uniform(-0.1, 0.1)
            fused = 0.6 * ndvi + 0.4 * rvi
            return {
                "mean": round(fused, 3),
                "min": round(max(0, fused - 0.2), 3),
                "max": round(min(1, fused + 0.2), 3),
                "cloud_coverage": round(np.random.uniform(0, 15), 1),
                "interpretation": cls._interpret_ndvi(fused),
                "raw_data": {
                    "source": "mock",
                    "type": "fusion",
                    "ndvi": round(ndvi, 3),
                    "rvi": round(rvi, 3)
                }
            }
        
        else:
            # Default
            mean = 0.5 + np.random.uniform(-0.15, 0.15)
            return {
                "mean": round(mean, 3),
                "min": round(max(0, mean - 0.2), 3),
                "max": round(min(1, mean + 0.2), 3),
                "cloud_coverage": round(np.random.uniform(0, 20), 1),
                "interpretation": "Analysis completed",
                "raw_data": {"source": "mock"}
            }
    
    @staticmethod
    def _interpret_ndvi(value: float) -> str:
        """Interpret NDVI/vegetation index value"""
        if value < 0.2:
            return "Very low vegetation or bare soil - attention required"
        elif value < 0.4:
            return "Stressed vegetation - monitoring and action recommended"
        elif value < 0.6:
            return "Moderate vegetation - normal development"
        elif value < 0.8:
            return "Healthy vegetation - good growth"
        else:
            return "Very dense and vigorous vegetation"
    
    @staticmethod
    def _interpret_moisture(value: float) -> str:
        """Interpret moisture index value"""
        if value < 0.1:
            return "Very dry soil - urgent irrigation recommended"
        elif value < 0.25:
            return "Low moisture - plan irrigation soon"
        elif value < 0.4:
            return "Moderate moisture - acceptable conditions"
        elif value < 0.6:
            return "Good moisture - optimal conditions"
        else:
            return "Very wet soil - reduce irrigation if necessary"
