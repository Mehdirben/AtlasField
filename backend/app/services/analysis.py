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
    def generate_detailed_report(
        cls,
        analysis_type: AnalysisType,
        mean_value: float,
        min_value: float,
        max_value: float,
        cloud_coverage: float,
        crop_type: Optional[str],
        area_hectares: Optional[float],
        field_name: str
    ) -> dict:
        """Generate a detailed analysis report with recommendations"""
        
        report = {
            "summary": {},
            "health_assessment": {},
            "spatial_analysis": {},
            "recommendations": [],
            "problems": [],
            "monitoring_schedule": [],
            "metadata": {
                "generated_at": datetime.utcnow().isoformat(),
                "field_name": field_name,
                "crop_type": crop_type or "Unknown",
                "area_hectares": area_hectares or 0,
                "analysis_type": analysis_type.value
            }
        }
        
        # Summary
        if analysis_type == AnalysisType.NDVI:
            health_status = cls._get_health_status(mean_value)
            report["summary"] = {
                "index_name": "Normalized Difference Vegetation Index (NDVI)",
                "description": "NDVI measures vegetation health by analyzing the difference between near-infrared and red light reflectance.",
                "mean_value": round(mean_value, 3),
                "min_value": round(min_value, 3),
                "max_value": round(max_value, 3),
                "variability": round(max_value - min_value, 3),
                "health_status": health_status,
                "health_score": round(mean_value * 100, 1),
                "cloud_coverage": cloud_coverage
            }
            
            # Health Assessment
            report["health_assessment"] = {
                "overall_health": health_status,
                "vegetation_density": cls._get_vegetation_density(mean_value),
                "chlorophyll_activity": cls._get_chlorophyll_activity(mean_value),
                "stress_indicators": cls._get_stress_indicators(mean_value, min_value),
                "growth_stage_estimate": cls._estimate_growth_stage(mean_value, crop_type)
            }
            
            # Spatial Analysis
            uniformity = 1 - (max_value - min_value)
            report["spatial_analysis"] = {
                "uniformity_score": round(uniformity * 100, 1),
                "uniformity_status": "Excellent" if uniformity > 0.8 else "Good" if uniformity > 0.6 else "Moderate" if uniformity > 0.4 else "Poor",
                "hotspots": cls._identify_hotspots(mean_value, min_value, max_value),
                "affected_area_estimate": cls._estimate_affected_area(mean_value, area_hectares or 1)
            }
            
            # Generate recommendations based on values
            report["recommendations"] = cls._generate_ndvi_recommendations(mean_value, min_value, max_value, crop_type)
            report["problems"] = cls._generate_ndvi_problems(mean_value, min_value, max_value)
            
        elif analysis_type == AnalysisType.RVI:
            report["summary"] = {
                "index_name": "Radar Vegetation Index (RVI)",
                "description": "RVI uses radar data to assess vegetation structure and biomass, works regardless of cloud cover.",
                "mean_value": round(mean_value, 3),
                "min_value": round(min_value, 3),
                "max_value": round(max_value, 3),
                "variability": round(max_value - min_value, 3),
                "biomass_indicator": cls._get_biomass_indicator(mean_value),
                "cloud_coverage": 0  # Radar penetrates clouds
            }
            
            report["health_assessment"] = {
                "biomass_level": cls._get_biomass_indicator(mean_value),
                "canopy_structure": "Dense" if mean_value > 0.6 else "Moderate" if mean_value > 0.4 else "Sparse",
                "moisture_content": cls._estimate_moisture_from_rvi(mean_value)
            }
            
            report["recommendations"] = cls._generate_rvi_recommendations(mean_value, crop_type)
            report["problems"] = cls._generate_rvi_problems(mean_value)
            
        elif analysis_type == AnalysisType.FUSION:
            health_status = cls._get_health_status(mean_value)
            report["summary"] = {
                "index_name": "Optical-Radar Fusion Analysis",
                "description": "Combined analysis using both optical (NDVI) and radar (RVI) data for comprehensive vegetation assessment.",
                "mean_value": round(mean_value, 3),
                "min_value": round(min_value, 3),
                "max_value": round(max_value, 3),
                "variability": round(max_value - min_value, 3),
                "health_status": health_status,
                "confidence_level": "High" if cloud_coverage < 15 else "Medium" if cloud_coverage < 30 else "Lower",
                "cloud_coverage": cloud_coverage
            }
            
            report["health_assessment"] = {
                "overall_health": health_status,
                "vegetation_density": cls._get_vegetation_density(mean_value),
                "biomass_estimate": cls._get_biomass_indicator(mean_value),
                "stress_indicators": cls._get_stress_indicators(mean_value, min_value)
            }
            
            report["recommendations"] = cls._generate_fusion_recommendations(mean_value, crop_type)
            report["problems"] = cls._generate_ndvi_problems(mean_value, min_value, max_value)
        
        elif analysis_type == AnalysisType.MOISTURE:
            report["summary"] = {
                "index_name": "Soil Moisture Index",
                "description": "Estimates soil water content using spectral analysis.",
                "mean_value": round(mean_value, 3),
                "min_value": round(min_value, 3),
                "max_value": round(max_value, 3),
                "moisture_status": cls._get_moisture_status(mean_value),
                "irrigation_need": cls._get_irrigation_need(mean_value)
            }
            
            report["recommendations"] = cls._generate_moisture_recommendations(mean_value)
            report["problems"] = cls._generate_moisture_problems(mean_value)
        
        # Monitoring Schedule
        report["monitoring_schedule"] = cls._generate_monitoring_schedule(mean_value, analysis_type)
        
        return report
    
    @staticmethod
    def _get_health_status(ndvi: float) -> str:
        if ndvi >= 0.7:
            return "Excellent"
        elif ndvi >= 0.5:
            return "Good"
        elif ndvi >= 0.4:
            return "Moderate"
        elif ndvi >= 0.3:
            return "Poor"
        else:
            return "Critical"
    
    @staticmethod
    def _get_vegetation_density(ndvi: float) -> str:
        if ndvi >= 0.7:
            return "Very Dense"
        elif ndvi >= 0.5:
            return "Dense"
        elif ndvi >= 0.3:
            return "Moderate"
        elif ndvi >= 0.15:
            return "Sparse"
        else:
            return "Very Sparse / Bare Soil"
    
    @staticmethod
    def _get_chlorophyll_activity(ndvi: float) -> str:
        if ndvi >= 0.6:
            return "High - Active photosynthesis"
        elif ndvi >= 0.4:
            return "Moderate - Normal activity"
        elif ndvi >= 0.25:
            return "Low - Reduced activity"
        else:
            return "Very Low - Minimal photosynthesis"
    
    @staticmethod
    def _get_stress_indicators(mean_value: float, min_value: float) -> list:
        indicators = []
        if mean_value < 0.4:
            indicators.append("General vegetation stress detected")
        if min_value < 0.2:
            indicators.append("Localized areas showing severe stress")
        if mean_value - min_value > 0.3:
            indicators.append("High variability indicating inconsistent growth")
        if not indicators:
            indicators.append("No significant stress indicators")
        return indicators
    
    @staticmethod
    def _estimate_growth_stage(ndvi: float, crop_type: Optional[str]) -> str:
        if ndvi < 0.2:
            return "Pre-emergence / Bare soil"
        elif ndvi < 0.35:
            return "Early vegetative / Emergence"
        elif ndvi < 0.5:
            return "Vegetative growth"
        elif ndvi < 0.65:
            return "Late vegetative / Early reproductive"
        elif ndvi < 0.75:
            return "Full canopy / Reproductive"
        else:
            return "Peak growth / Maturity"
    
    @staticmethod
    def _get_biomass_indicator(rvi: float) -> str:
        if rvi >= 0.7:
            return "Very High"
        elif rvi >= 0.5:
            return "High"
        elif rvi >= 0.35:
            return "Moderate"
        else:
            return "Low"
    
    @staticmethod
    def _estimate_moisture_from_rvi(rvi: float) -> str:
        if rvi >= 0.6:
            return "High vegetation water content"
        elif rvi >= 0.4:
            return "Adequate moisture"
        else:
            return "May indicate water stress"
    
    @staticmethod
    def _get_moisture_status(value: float) -> str:
        if value >= 0.6:
            return "Saturated"
        elif value >= 0.4:
            return "Optimal"
        elif value >= 0.25:
            return "Moderate"
        elif value >= 0.15:
            return "Low"
        else:
            return "Critical - Drought"
    
    @staticmethod
    def _get_irrigation_need(value: float) -> str:
        if value >= 0.5:
            return "None needed"
        elif value >= 0.35:
            return "Monitor closely"
        elif value >= 0.2:
            return "Irrigation recommended within 2-3 days"
        else:
            return "Urgent irrigation required"
    
    @staticmethod
    def _identify_hotspots(mean: float, min_value: float, max_value: float) -> dict:
        return {
            "low_vigor_areas": "Detected" if min_value < mean * 0.7 else "None",
            "high_vigor_areas": "Detected" if max_value > mean * 1.3 else "Uniform",
            "variability_zones": "Present" if (max_value - min_value) > 0.25 else "Minimal"
        }
    
    @staticmethod
    def _estimate_affected_area(mean: float, total_area: float) -> dict:
        if mean >= 0.6:
            healthy_pct = 90
        elif mean >= 0.5:
            healthy_pct = 75
        elif mean >= 0.4:
            healthy_pct = 60
        elif mean >= 0.3:
            healthy_pct = 40
        else:
            healthy_pct = 20
        
        return {
            "healthy_area_percent": healthy_pct,
            "healthy_area_hectares": round(total_area * healthy_pct / 100, 2),
            "stressed_area_percent": 100 - healthy_pct,
            "stressed_area_hectares": round(total_area * (100 - healthy_pct) / 100, 2)
        }
    
    @staticmethod
    def _generate_ndvi_recommendations(mean: float, min_val: float, max_val: float, crop_type: Optional[str]) -> list:
        recommendations = []
        
        if mean >= 0.6:
            recommendations.append({
                "priority": "low",
                "category": "Maintenance",
                "title": "Maintain Current Practices",
                "description": "Your crop health is excellent. Continue with current management practices.",
                "actions": [
                    "Continue regular irrigation schedule",
                    "Maintain current fertilization program",
                    "Plan for optimal harvest timing"
                ]
            })
        elif mean >= 0.45:
            recommendations.append({
                "priority": "medium",
                "category": "Optimization",
                "title": "Consider Growth Enhancement",
                "description": "Vegetation health is good but there's room for improvement.",
                "actions": [
                    "Consider foliar fertilizer application",
                    "Review irrigation efficiency",
                    "Scout for early pest/disease signs"
                ]
            })
        else:
            recommendations.append({
                "priority": "high",
                "category": "Intervention",
                "title": "Immediate Action Required",
                "description": "Vegetation shows signs of stress requiring intervention.",
                "actions": [
                    "Conduct immediate field inspection",
                    "Check irrigation system for issues",
                    "Test soil nutrients",
                    "Look for pest or disease symptoms"
                ]
            })
        
        # Uniformity recommendations
        if (max_val - min_val) > 0.3:
            recommendations.append({
                "priority": "medium",
                "category": "Precision Agriculture",
                "title": "Address Field Variability",
                "description": "Significant variation detected across the field.",
                "actions": [
                    "Create management zones based on variability",
                    "Apply variable-rate inputs",
                    "Investigate causes of poor-performing areas"
                ]
            })
        
        return recommendations
    
    @staticmethod
    def _generate_ndvi_problems(mean: float, min_val: float, max_val: float) -> list:
        problems = []
        
        if mean < 0.3:
            problems.append({
                "severity": "critical",
                "title": "Severe Vegetation Stress",
                "description": f"Very low NDVI ({mean:.3f}) indicates severe crop stress or sparse vegetation.",
                "possible_causes": [
                    "Severe drought stress",
                    "Pest infestation",
                    "Disease outbreak",
                    "Nutrient deficiency",
                    "Crop failure"
                ],
                "urgent_actions": [
                    "Immediate field inspection required",
                    "Check for visible damage or disease",
                    "Verify irrigation is functioning",
                    "Collect soil and plant samples for testing"
                ]
            })
        elif mean < 0.4:
            problems.append({
                "severity": "high",
                "title": "Vegetation Stress Detected",
                "description": f"Low NDVI ({mean:.3f}) suggests your crops are experiencing stress.",
                "possible_causes": [
                    "Water stress",
                    "Early disease symptoms",
                    "Nutrient imbalance",
                    "Environmental stress"
                ],
                "urgent_actions": [
                    "Increase monitoring frequency",
                    "Review recent weather patterns",
                    "Check irrigation coverage"
                ]
            })
        
        if min_val < 0.15:
            problems.append({
                "severity": "medium",
                "title": "Localized Problem Areas",
                "description": "Some areas show very low vegetation that needs attention.",
                "possible_causes": [
                    "Localized drainage issues",
                    "Soil compaction",
                    "Shading or competition",
                    "Spot treatments needed"
                ],
                "urgent_actions": [
                    "Map and inspect low-value areas",
                    "Consider targeted interventions"
                ]
            })
        
        return problems
    
    @staticmethod
    def _generate_rvi_recommendations(mean: float, crop_type: Optional[str]) -> list:
        recommendations = []
        
        if mean >= 0.6:
            recommendations.append({
                "priority": "low",
                "category": "Harvest Planning",
                "title": "High Biomass Detected",
                "description": "Radar analysis shows dense vegetation structure.",
                "actions": [
                    "Plan harvesting logistics for high yield",
                    "Consider thinning if overcrowded",
                    "Ensure equipment capacity"
                ]
            })
        elif mean >= 0.4:
            recommendations.append({
                "priority": "medium",
                "category": "Growth",
                "title": "Normal Biomass Development",
                "description": "Vegetation structure appears normal for growth stage.",
                "actions": [
                    "Continue current management",
                    "Monitor for continued development"
                ]
            })
        else:
            recommendations.append({
                "priority": "high",
                "category": "Growth Enhancement",
                "title": "Low Biomass Detected",
                "description": "Consider growth enhancement strategies.",
                "actions": [
                    "Review fertilization program",
                    "Check for growth-limiting factors",
                    "Consider plant growth regulators if appropriate"
                ]
            })
        
        return recommendations
    
    @staticmethod
    def _generate_rvi_problems(mean: float) -> list:
        problems = []
        if mean < 0.3:
            problems.append({
                "severity": "high",
                "title": "Low Biomass",
                "description": "Radar analysis indicates lower than expected biomass.",
                "possible_causes": [
                    "Poor establishment",
                    "Growth limitation",
                    "Early stress"
                ],
                "urgent_actions": [
                    "Investigate growth limitations",
                    "Compare with optical analysis"
                ]
            })
        return problems
    
    @staticmethod
    def _generate_fusion_recommendations(mean: float, crop_type: Optional[str]) -> list:
        recommendations = []
        
        if mean >= 0.55:
            recommendations.append({
                "priority": "low",
                "category": "Maintenance",
                "title": "Healthy Crop Status Confirmed",
                "description": "Combined optical and radar analysis confirms good crop health.",
                "actions": [
                    "Continue current practices",
                    "Schedule next analysis in 7-10 days",
                    "Monitor weather forecasts"
                ]
            })
        else:
            recommendations.append({
                "priority": "high",
                "category": "Investigation",
                "title": "Multi-Sensor Alert",
                "description": "Both optical and radar data indicate potential issues.",
                "actions": [
                    "Conduct thorough field inspection",
                    "Cross-reference with weather data",
                    "Consider soil testing"
                ]
            })
        
        return recommendations
    
    @staticmethod
    def _generate_moisture_recommendations(mean: float) -> list:
        recommendations = []
        
        if mean < 0.2:
            recommendations.append({
                "priority": "critical",
                "category": "Irrigation",
                "title": "Urgent Irrigation Required",
                "description": "Soil moisture is critically low.",
                "actions": [
                    "Begin irrigation immediately",
                    "Check for irrigation system issues",
                    "Apply mulch to reduce evaporation"
                ]
            })
        elif mean < 0.35:
            recommendations.append({
                "priority": "high",
                "category": "Irrigation",
                "title": "Irrigation Recommended",
                "description": "Soil moisture is below optimal levels.",
                "actions": [
                    "Schedule irrigation within 24-48 hours",
                    "Monitor weather forecast",
                    "Check soil moisture at multiple depths"
                ]
            })
        else:
            recommendations.append({
                "priority": "low",
                "category": "Monitoring",
                "title": "Adequate Moisture",
                "description": "Soil moisture levels are acceptable.",
                "actions": [
                    "Continue monitoring",
                    "Adjust irrigation as needed based on forecast"
                ]
            })
        
        return recommendations
    
    @staticmethod
    def _generate_moisture_problems(mean: float) -> list:
        problems = []
        if mean < 0.15:
            problems.append({
                "severity": "critical",
                "title": "Severe Drought Conditions",
                "description": "Soil moisture at critical levels, crop damage likely.",
                "possible_causes": [
                    "Irrigation failure",
                    "Extreme weather",
                    "Poor water retention"
                ],
                "urgent_actions": [
                    "Emergency irrigation",
                    "Check system functionality"
                ]
            })
        return problems
    
    @staticmethod
    def _generate_monitoring_schedule(mean: float, analysis_type: AnalysisType) -> list:
        schedule = []
        
        # More frequent monitoring for stressed crops
        if mean < 0.4:
            interval = "2-3 days"
            urgency = "High"
        elif mean < 0.55:
            interval = "5-7 days"
            urgency = "Medium"
        else:
            interval = "7-10 days"
            urgency = "Low"
        
        schedule.append({
            "task": f"Next {analysis_type.value.upper()} analysis",
            "recommended_interval": interval,
            "urgency": urgency
        })
        
        schedule.append({
            "task": "Field visual inspection",
            "recommended_interval": "Weekly",
            "urgency": "Medium" if mean < 0.5 else "Low"
        })
        
        schedule.append({
            "task": "Weather monitoring",
            "recommended_interval": "Daily",
            "urgency": "High"
        })
        
        if mean < 0.45:
            schedule.append({
                "task": "Soil moisture check",
                "recommended_interval": "Every 2-3 days",
                "urgency": "High"
            })
        
        return schedule
    
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
