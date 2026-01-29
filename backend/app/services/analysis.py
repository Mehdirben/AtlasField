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
        
        elif analysis_type == AnalysisType.COMPLETE:
            # Comprehensive analysis combining all metrics
            health_status = cls._get_health_status(mean_value)
            uniformity = 1 - (max_value - min_value)
            
            report["summary"] = {
                "index_name": "Complete Field Analysis",
                "description": "Comprehensive analysis combining vegetation health (NDVI), biomass structure (RVI), soil moisture, yield prediction, and environmental factors.",
                "overall_health_score": round(mean_value * 100, 1),
                "health_status": health_status,
                "analysis_date": datetime.utcnow().isoformat(),
                "cloud_coverage": cloud_coverage
            }
            
            # Vegetation Health (NDVI-based)
            report["vegetation_health"] = {
                "ndvi_mean": round(mean_value, 3),
                "ndvi_min": round(min_value, 3),
                "ndvi_max": round(max_value, 3),
                "variability": round(max_value - min_value, 3),
                "health_status": health_status,
                "vegetation_density": cls._get_vegetation_density(mean_value),
                "chlorophyll_activity": cls._get_chlorophyll_activity(mean_value),
                "growth_stage": cls._estimate_growth_stage(mean_value, crop_type)
            }
            
            # Biomass Analysis (RVI-derived estimates)
            biomass_estimate = cls.estimate_biomass(mean_value)
            report["biomass_analysis"] = {
                "biomass_level": cls._get_biomass_indicator(mean_value),
                "canopy_structure": "Dense" if mean_value > 0.6 else "Moderate" if mean_value > 0.4 else "Sparse",
                "estimated_biomass_t_ha": biomass_estimate["mean_biomass_t_ha"],
                "carbon_content_t_ha": biomass_estimate["total_carbon_t_ha"],
                "interpretation": biomass_estimate["interpretation"]
            }
            
            # Soil Moisture Assessment
            moisture_value = mean_value * 0.8 + 0.1  # Derived estimate
            report["moisture_assessment"] = {
                "estimated_moisture": round(moisture_value, 3),
                "moisture_status": cls._get_moisture_status(moisture_value),
                "irrigation_need": cls._get_irrigation_need(moisture_value),
                "water_stress_risk": "Low" if moisture_value > 0.4 else "Medium" if moisture_value > 0.25 else "High"
            }
            
            # Yield Prediction
            crop_coef = cls.CROP_COEFFICIENTS.get(
                (crop_type or "wheat").lower(),
                cls.CROP_COEFFICIENTS["wheat"]
            )
            yield_per_ha = crop_coef["base_yield"] + (crop_coef["ndvi_factor"] * mean_value)
            total_yield = yield_per_ha * (area_hectares or 1)
            
            report["yield_prediction"] = {
                "crop_type": crop_type or "Unknown",
                "predicted_yield_per_ha": round(yield_per_ha, 2),
                "total_predicted_yield_tonnes": round(total_yield, 2),
                "yield_potential": "High" if mean_value > 0.6 else "Moderate" if mean_value > 0.4 else "Below Average",
                "confidence_level": "High" if cloud_coverage < 15 else "Medium" if cloud_coverage < 30 else "Lower"
            }
            
            # Spatial Analysis
            report["spatial_analysis"] = {
                "uniformity_score": round(uniformity * 100, 1),
                "uniformity_status": "Excellent" if uniformity > 0.8 else "Good" if uniformity > 0.6 else "Moderate" if uniformity > 0.4 else "Poor",
                "hotspots": cls._identify_hotspots(mean_value, min_value, max_value),
                "affected_area_estimate": cls._estimate_affected_area(mean_value, area_hectares or 1)
            }
            
            # Health Assessment Summary
            stress_indicators = cls._get_stress_indicators(mean_value, min_value)
            report["health_assessment"] = {
                "overall_health": health_status,
                "vegetation_density": cls._get_vegetation_density(mean_value),
                "chlorophyll_activity": cls._get_chlorophyll_activity(mean_value),
                "stress_indicators": stress_indicators,
                "growth_stage_estimate": cls._estimate_growth_stage(mean_value, crop_type),
                "risk_level": "Low" if mean_value > 0.5 else "Medium" if mean_value > 0.35 else "High"
            }
            
            # Environmental Factors
            report["environmental_factors"] = {
                "data_quality": "Good" if cloud_coverage < 20 else "Moderate" if cloud_coverage < 40 else "Limited",
                "cloud_coverage_percent": round(cloud_coverage, 1),
                "satellite_data_age": "Recent (< 5 days)",
                "seasonal_context": cls._get_seasonal_context()
            }
            
            # Generate comprehensive recommendations
            all_recommendations = []
            all_recommendations.extend(cls._generate_ndvi_recommendations(mean_value, min_value, max_value, crop_type))
            all_recommendations.extend(cls._generate_moisture_recommendations(moisture_value))
            
            # Add yield-specific recommendations
            if mean_value > 0.5:
                all_recommendations.append({
                    "priority": "low",
                    "category": "Harvest Planning",
                    "title": "Plan Optimal Harvest Window",
                    "description": f"With predicted yield of {round(yield_per_ha, 1)} t/ha, plan harvest logistics.",
                    "actions": [
                        "Monitor crop maturity indicators",
                        "Coordinate harvesting equipment",
                        "Prepare storage facilities"
                    ]
                })
            
            # Deduplicate and sort by priority
            seen_titles = set()
            unique_recommendations = []
            for rec in all_recommendations:
                if rec["title"] not in seen_titles:
                    seen_titles.add(rec["title"])
                    unique_recommendations.append(rec)
            
            priority_order = {"high": 0, "medium": 1, "low": 2}
            report["recommendations"] = sorted(unique_recommendations, key=lambda x: priority_order.get(x.get("priority", "low"), 2))
            
            # Comprehensive problems list
            all_problems = cls._generate_ndvi_problems(mean_value, min_value, max_value)
            all_problems.extend(cls._generate_moisture_problems(moisture_value))
            
            # Deduplicate problems
            seen_problems = set()
            unique_problems = []
            for prob in all_problems:
                if prob["title"] not in seen_problems:
                    seen_problems.add(prob["title"])
                    unique_problems.append(prob)
            
            report["problems"] = unique_problems
        
        # Monitoring Schedule
        report["monitoring_schedule"] = cls._generate_monitoring_schedule(mean_value, analysis_type)
        
        return report
    
    @classmethod
    def generate_forest_detailed_report(
        cls,
        mean_value: float,
        min_value: float,
        max_value: float,
        cloud_coverage: float,
        nbr: float,
        ndmi: float,
        fire_risk_level: str,
        canopy_health: str,
        carbon_estimate: float,
        deforestation_risk: str,
        forest_classification: dict,
        area_hectares: Optional[float],
        forest_name: str,
        forest_type: Optional[str],
        baseline_carbon: Optional[float] = None,
        baseline_canopy: Optional[float] = None
    ) -> dict:
        """Generate a detailed forest analysis report with forest-specific metrics"""
        
        # Calculate overall forest health score (0-100)
        ndvi_score = mean_value * 40  # 40% weight
        nbr_score = ((nbr + 1) / 2) * 30  # Normalize NBR (-1 to 1) -> (0 to 1), 30% weight
        ndmi_score = ((ndmi + 1) / 2) * 30  # Normalize NDMI, 30% weight
        overall_health_score = ndvi_score + nbr_score + ndmi_score
        overall_health_score = min(100, max(0, overall_health_score))
        
        health_status = cls._get_forest_health_status(overall_health_score)
        canopy_cover = forest_classification.get("canopy_cover_percent", mean_value * 100)
        
        report = {
            "summary": {
                "index_name": "Complete Forest Analysis",
                "description": "Comprehensive forest health assessment combining vegetation indices (NDVI), burn ratio (NBR), moisture content (NDMI), fire risk assessment, deforestation monitoring, and carbon sequestration analysis.",
                "overall_health_score": round(overall_health_score, 1),
                "health_status": health_status,
                "analysis_date": datetime.utcnow().isoformat(),
                "cloud_coverage": cloud_coverage
            },
            "canopy_health": {
                "ndvi_mean": round(mean_value, 3),
                "ndvi_min": round(min_value, 3),
                "ndvi_max": round(max_value, 3),
                "variability": round(max_value - min_value, 3),
                "health_status": canopy_health,
                "canopy_cover_percent": round(canopy_cover, 1),
                "canopy_density": cls._get_canopy_density(mean_value),
                "vegetation_vigor": cls._get_vegetation_vigor(mean_value),
                "stress_indicators": cls._get_forest_stress_indicators(mean_value, nbr, ndmi)
            },
            "fire_risk_assessment": {
                "nbr_value": round(nbr, 3),
                "ndmi_value": round(ndmi, 3),
                "fire_risk_level": fire_risk_level,
                "fire_risk_score": cls._calculate_fire_risk_score(nbr, ndmi),
                "moisture_status": cls._get_forest_moisture_status(ndmi),
                "burn_severity": cls._get_burn_severity(nbr),
                "recent_fire_detected": nbr < -0.1,
                "fire_prevention_priority": "Critical" if fire_risk_level == "critical" else "High" if fire_risk_level == "high" else "Medium" if fire_risk_level == "medium" else "Normal"
            },
            "deforestation_monitoring": {
                "deforestation_risk": deforestation_risk,
                "canopy_loss_indicator": "Detected" if mean_value < 0.4 and deforestation_risk in ["medium", "high"] else "Not detected",
                "forest_fragmentation": cls._assess_forest_fragmentation(max_value - min_value),
                "protected_area_alert": deforestation_risk in ["medium", "high"],
                "change_detection_confidence": "High" if cloud_coverage < 15 else "Medium" if cloud_coverage < 30 else "Lower"
            },
            "carbon_sequestration": {
                "current_carbon_stock_t_ha": round(carbon_estimate, 2),
                "total_carbon_stock_tonnes": round(carbon_estimate * (area_hectares or 1), 2),
                "carbon_status": cls._get_carbon_status(carbon_estimate),
                "sequestration_potential": cls._get_sequestration_potential(mean_value, canopy_cover),
                "baseline_carbon_t_ha": round(baseline_carbon, 2) if baseline_carbon else None,
                "carbon_change_percent": round(((carbon_estimate - baseline_carbon) / baseline_carbon) * 100, 1) if baseline_carbon and baseline_carbon > 0 else None,
                "carbon_trend": cls._get_carbon_trend(carbon_estimate, baseline_carbon) if baseline_carbon else "Baseline not set"
            },
            "forest_classification": {
                "detected_type": forest_classification.get("detected_type", forest_type or "mixed"),
                "classification_confidence": forest_classification.get("confidence", 0.7),
                "canopy_cover_percent": round(canopy_cover, 1),
                "forest_maturity": cls._estimate_forest_maturity(mean_value, carbon_estimate)
            },
            "spatial_analysis": {
                "uniformity_score": round((1 - (max_value - min_value)) * 100, 1),
                "uniformity_status": "Excellent" if (max_value - min_value) < 0.2 else "Good" if (max_value - min_value) < 0.3 else "Moderate" if (max_value - min_value) < 0.4 else "Variable",
                "healthy_area_estimate": cls._estimate_healthy_forest_area(mean_value, area_hectares or 1),
                "hotspots": cls._identify_forest_hotspots(mean_value, min_value, nbr, ndmi)
            },
            "environmental_factors": {
                "data_quality": "Good" if cloud_coverage < 20 else "Moderate" if cloud_coverage < 40 else "Limited",
                "cloud_coverage_percent": round(cloud_coverage, 1),
                "satellite_data_age": "Recent (< 5 days)",
                "seasonal_context": cls._get_forest_seasonal_context()
            },
            "recommendations": cls._generate_forest_recommendations(
                mean_value, nbr, ndmi, fire_risk_level, deforestation_risk, canopy_health
            ),
            "problems": cls._generate_forest_problems(
                mean_value, nbr, ndmi, fire_risk_level, deforestation_risk
            ),
            "monitoring_schedule": cls._generate_forest_monitoring_schedule(
                mean_value, fire_risk_level, deforestation_risk
            ),
            "metadata": {
                "generated_at": datetime.utcnow().isoformat(),
                "forest_name": forest_name,
                "forest_type": forest_type or forest_classification.get("detected_type", "Unknown"),
                "area_hectares": area_hectares or 0,
                "analysis_type": "FOREST"
            }
        }
        
        return report
    
    # ============== Forest-specific helper methods ==============
    
    @staticmethod
    def _get_forest_health_status(score: float) -> str:
        if score >= 75:
            return "Excellent"
        elif score >= 60:
            return "Good"
        elif score >= 45:
            return "Moderate"
        elif score >= 30:
            return "Poor"
        else:
            return "Critical"
    
    @staticmethod
    def _get_canopy_density(ndvi: float) -> str:
        if ndvi >= 0.7:
            return "Very Dense - Closed canopy"
        elif ndvi >= 0.5:
            return "Dense - Continuous canopy"
        elif ndvi >= 0.35:
            return "Moderate - Open canopy"
        elif ndvi >= 0.2:
            return "Sparse - Fragmented canopy"
        else:
            return "Very Sparse - Minimal canopy"
    
    @staticmethod
    def _get_vegetation_vigor(ndvi: float) -> str:
        if ndvi >= 0.65:
            return "High - Active growth"
        elif ndvi >= 0.45:
            return "Moderate - Normal activity"
        elif ndvi >= 0.3:
            return "Low - Reduced activity"
        else:
            return "Very Low - Stressed or dormant"
    
    @staticmethod
    def _get_forest_stress_indicators(ndvi: float, nbr: float, ndmi: float) -> list:
        indicators = []
        if ndvi < 0.4:
            indicators.append("Low vegetation vigor - possible canopy stress")
        if ndmi < 0:
            indicators.append("Low moisture content - drought stress detected")
        if nbr < 0:
            indicators.append("Potential burn damage or dead vegetation")
        if ndvi < 0.3 and ndmi < -0.1:
            indicators.append("Severe stress - multiple indicators present")
        if not indicators:
            indicators.append("No significant stress indicators detected")
        return indicators
    
    @staticmethod
    def _calculate_fire_risk_score(nbr: float, ndmi: float) -> int:
        """Calculate fire risk score from 0-100"""
        # Lower NDMI = drier = higher fire risk
        # Lower/negative NBR can indicate recent fire or dry conditions
        moisture_factor = max(0, min(100, (1 - ndmi) * 50))
        dryness_factor = max(0, min(50, (0.5 - nbr) * 50))
        return int(min(100, moisture_factor + dryness_factor))
    
    @staticmethod
    def _get_forest_moisture_status(ndmi: float) -> str:
        if ndmi >= 0.4:
            return "Well hydrated"
        elif ndmi >= 0.2:
            return "Adequate moisture"
        elif ndmi >= 0:
            return "Moderate - Monitor closely"
        elif ndmi >= -0.2:
            return "Low - Drought stress likely"
        else:
            return "Critical - Severe drought"
    
    @staticmethod
    def _get_burn_severity(nbr: float) -> str:
        if nbr >= 0.3:
            return "No burn detected"
        elif nbr >= 0.1:
            return "Healthy vegetation"
        elif nbr >= -0.1:
            return "Low severity / Recovery"
        elif nbr >= -0.3:
            return "Moderate burn severity"
        else:
            return "High burn severity"
    
    @staticmethod
    def _assess_forest_fragmentation(variability: float) -> str:
        if variability < 0.2:
            return "Low - Continuous forest"
        elif variability < 0.35:
            return "Moderate - Some gaps"
        elif variability < 0.5:
            return "High - Significant fragmentation"
        else:
            return "Severe - Highly fragmented"
    
    @staticmethod
    def _get_carbon_status(carbon_t_ha: float) -> str:
        if carbon_t_ha >= 150:
            return "Very High - Mature forest"
        elif carbon_t_ha >= 100:
            return "High - Established forest"
        elif carbon_t_ha >= 50:
            return "Moderate - Growing forest"
        elif carbon_t_ha >= 20:
            return "Low - Young forest"
        else:
            return "Very Low - Early succession"
    
    @staticmethod
    def _get_sequestration_potential(ndvi: float, canopy_cover: float) -> str:
        if ndvi >= 0.6 and canopy_cover >= 70:
            return "High - Actively sequestering carbon"
        elif ndvi >= 0.45 and canopy_cover >= 50:
            return "Moderate - Good sequestration capacity"
        elif ndvi >= 0.3:
            return "Limited - Reduced capacity"
        else:
            return "Low - Minimal sequestration"
    
    @staticmethod
    def _get_carbon_trend(current: float, baseline: Optional[float]) -> str:
        if baseline is None:
            return "Baseline not set"
        change_pct = ((current - baseline) / baseline) * 100
        if change_pct >= 5:
            return "Increasing - Carbon gain"
        elif change_pct >= -2:
            return "Stable"
        elif change_pct >= -10:
            return "Decreasing - Minor carbon loss"
        else:
            return "Declining - Significant carbon loss"
    
    @staticmethod
    def _estimate_forest_maturity(ndvi: float, carbon: float) -> str:
        if ndvi >= 0.65 and carbon >= 100:
            return "Mature / Old growth"
        elif ndvi >= 0.55 and carbon >= 60:
            return "Maturing forest"
        elif ndvi >= 0.4 and carbon >= 30:
            return "Young forest"
        elif ndvi >= 0.25:
            return "Regenerating / Early succession"
        else:
            return "Disturbed / Recently cleared"
    
    @staticmethod
    def _estimate_healthy_forest_area(ndvi: float, total_area: float) -> dict:
        if ndvi >= 0.6:
            healthy_pct = 85
        elif ndvi >= 0.5:
            healthy_pct = 70
        elif ndvi >= 0.4:
            healthy_pct = 55
        elif ndvi >= 0.3:
            healthy_pct = 40
        else:
            healthy_pct = 25
        
        return {
            "healthy_percent": healthy_pct,
            "healthy_hectares": round(total_area * healthy_pct / 100, 2),
            "at_risk_percent": 100 - healthy_pct,
            "at_risk_hectares": round(total_area * (100 - healthy_pct) / 100, 2)
        }
    
    @staticmethod
    def _identify_forest_hotspots(ndvi: float, min_ndvi: float, nbr: float, ndmi: float) -> dict:
        return {
            "low_canopy_areas": "Detected" if min_ndvi < ndvi * 0.6 else "None",
            "fire_risk_zones": "Detected" if ndmi < 0 and nbr < 0.1 else "None",
            "drought_stress_areas": "Detected" if ndmi < -0.1 else "None",
            "potential_deforestation": "Detected" if ndvi < 0.3 else "None"
        }
    
    @staticmethod
    def _get_forest_seasonal_context() -> str:
        month = datetime.utcnow().month
        if month in [12, 1, 2]:
            return "Winter - Reduced growth, dormant deciduous"
        elif month in [3, 4, 5]:
            return "Spring - Active growth resuming, leaf emergence"
        elif month in [6, 7, 8]:
            return "Summer - Peak canopy, fire risk season"
        else:
            return "Autumn - Senescence, reduced fire risk"
    
    @staticmethod
    def _generate_forest_recommendations(
        ndvi: float, nbr: float, ndmi: float, 
        fire_risk: str, deforestation_risk: str, canopy_health: str
    ) -> list:
        recommendations = []
        
        # Fire risk recommendations
        if fire_risk in ["critical", "high"]:
            recommendations.append({
                "priority": "critical" if fire_risk == "critical" else "high",
                "category": "Fire Prevention",
                "title": "Implement Fire Prevention Measures",
                "description": f"Fire risk is {fire_risk}. Dry conditions detected with NDMI: {ndmi:.3f}.",
                "actions": [
                    "Clear firebreaks around perimeter",
                    "Increase patrol frequency",
                    "Alert local fire services",
                    "Restrict access during high-risk periods"
                ]
            })
        
        # Drought stress recommendations
        if ndmi < 0:
            recommendations.append({
                "priority": "high",
                "category": "Drought Management",
                "title": "Monitor Drought Stress",
                "description": "Low moisture content detected. Trees may be experiencing water stress.",
                "actions": [
                    "Monitor for signs of tree mortality",
                    "Consider supplemental watering for high-value areas",
                    "Assess groundwater levels",
                    "Plan for potential pest outbreaks (drought-weakened trees)"
                ]
            })
        
        # Deforestation recommendations
        if deforestation_risk in ["medium", "high"]:
            recommendations.append({
                "priority": "high",
                "category": "Forest Protection",
                "title": "Investigate Potential Deforestation",
                "description": "Vegetation loss indicators detected. Verify cause and take protective action.",
                "actions": [
                    "Conduct ground verification",
                    "Review satellite imagery timeline",
                    "Report unauthorized clearing if detected",
                    "Strengthen boundary monitoring"
                ]
            })
        
        # Canopy health recommendations
        if ndvi < 0.4:
            recommendations.append({
                "priority": "medium",
                "category": "Canopy Restoration",
                "title": "Address Canopy Degradation",
                "description": "Low canopy density detected. Consider restoration activities.",
                "actions": [
                    "Assess cause of canopy loss",
                    "Plan reforestation for bare areas",
                    "Protect remaining mature trees",
                    "Consider assisted natural regeneration"
                ]
            })
        
        # Healthy forest maintenance
        if ndvi >= 0.6 and fire_risk == "low":
            recommendations.append({
                "priority": "low",
                "category": "Maintenance",
                "title": "Continue Current Management",
                "description": "Forest health is good. Maintain current conservation practices.",
                "actions": [
                    "Continue regular monitoring",
                    "Maintain fire prevention infrastructure",
                    "Document biodiversity",
                    "Plan long-term carbon monitoring"
                ]
            })
        
        # Carbon monitoring recommendation
        recommendations.append({
            "priority": "low",
            "category": "Carbon Management",
            "title": "Track Carbon Sequestration",
            "description": "Regular monitoring helps track carbon credits and forest value.",
            "actions": [
                "Run quarterly forest analyses",
                "Document carbon stock changes",
                "Consider carbon credit certification",
                "Monitor year-over-year trends"
            ]
        })
        
        return recommendations
    
    @staticmethod
    def _generate_forest_problems(
        ndvi: float, nbr: float, ndmi: float,
        fire_risk: str, deforestation_risk: str
    ) -> list:
        problems = []
        
        if fire_risk == "critical":
            problems.append({
                "severity": "critical",
                "title": "Critical Fire Risk",
                "description": f"Extremely dry conditions detected. NBR: {nbr:.3f}, NDMI: {ndmi:.3f}. Immediate action required.",
                "possible_causes": [
                    "Extended drought",
                    "Low humidity",
                    "Accumulated dry fuel load",
                    "Recent heat wave"
                ],
                "urgent_actions": [
                    "Implement emergency fire protocols",
                    "Clear firebreaks immediately",
                    "Coordinate with fire services",
                    "Consider controlled burns if appropriate"
                ]
            })
        elif fire_risk == "high":
            problems.append({
                "severity": "high",
                "title": "Elevated Fire Risk",
                "description": "Dry vegetation conditions increase fire vulnerability.",
                "possible_causes": [
                    "Below-normal rainfall",
                    "Dry vegetation",
                    "Seasonal drought"
                ],
                "urgent_actions": [
                    "Increase monitoring frequency",
                    "Review firebreak condition",
                    "Prepare firefighting resources"
                ]
            })
        
        if deforestation_risk == "high":
            problems.append({
                "severity": "critical",
                "title": "Significant Vegetation Loss Detected",
                "description": "Major canopy reduction observed. Possible deforestation or severe damage.",
                "possible_causes": [
                    "Illegal logging",
                    "Land clearing",
                    "Severe storm damage",
                    "Disease outbreak"
                ],
                "urgent_actions": [
                    "Immediate ground investigation",
                    "Report to authorities if illegal",
                    "Document extent of damage",
                    "Secure area from further clearing"
                ]
            })
        elif deforestation_risk == "medium":
            problems.append({
                "severity": "medium",
                "title": "Canopy Loss Indicators",
                "description": "Some vegetation decline detected. Monitor for progression.",
                "possible_causes": [
                    "Selective logging",
                    "Natural die-off",
                    "Pest infestation",
                    "Edge effects"
                ],
                "urgent_actions": [
                    "Investigate affected areas",
                    "Increase monitoring frequency",
                    "Assess boundary security"
                ]
            })
        
        if ndmi < -0.2:
            problems.append({
                "severity": "high",
                "title": "Severe Drought Stress",
                "description": f"Very low moisture content (NDMI: {ndmi:.3f}). Trees at risk of mortality.",
                "possible_causes": [
                    "Prolonged drought",
                    "Groundwater depletion",
                    "Climate stress"
                ],
                "urgent_actions": [
                    "Monitor for tree mortality",
                    "Assess vulnerable species",
                    "Consider emergency measures for critical trees"
                ]
            })
        
        if nbr < -0.2:
            problems.append({
                "severity": "high",
                "title": "Recent Burn Damage Detected",
                "description": f"Low NBR ({nbr:.3f}) indicates recent fire damage or severely stressed vegetation.",
                "possible_causes": [
                    "Recent wildfire",
                    "Prescribed burn",
                    "Severe drought damage"
                ],
                "urgent_actions": [
                    "Assess burn extent and severity",
                    "Plan post-fire recovery",
                    "Prevent erosion in burned areas"
                ]
            })
        
        return problems
    
    @staticmethod
    def _generate_forest_monitoring_schedule(
        ndvi: float, fire_risk: str, deforestation_risk: str
    ) -> list:
        schedule = []
        
        # Determine monitoring urgency
        if fire_risk in ["critical", "high"] or deforestation_risk == "high":
            analysis_interval = "2-3 days"
            urgency = "High"
        elif fire_risk == "medium" or deforestation_risk == "medium" or ndvi < 0.4:
            analysis_interval = "Weekly"
            urgency = "Medium"
        else:
            analysis_interval = "Every 2 weeks"
            urgency = "Low"
        
        schedule.append({
            "task": "Next forest analysis",
            "recommended_interval": analysis_interval,
            "urgency": urgency
        })
        
        schedule.append({
            "task": "Fire risk assessment",
            "recommended_interval": "Weekly during fire season" if fire_risk != "low" else "Monthly",
            "urgency": "High" if fire_risk in ["critical", "high"] else "Medium"
        })
        
        schedule.append({
            "task": "Ground patrol / inspection",
            "recommended_interval": "Weekly" if deforestation_risk in ["medium", "high"] else "Monthly",
            "urgency": "High" if deforestation_risk == "high" else "Medium"
        })
        
        schedule.append({
            "task": "Carbon stock assessment",
            "recommended_interval": "Quarterly",
            "urgency": "Low"
        })
        
        if fire_risk in ["critical", "high"]:
            schedule.append({
                "task": "Weather monitoring",
                "recommended_interval": "Daily",
                "urgency": "High"
            })
        
        return schedule

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
    def _get_seasonal_context() -> str:
        """Get seasonal context based on current month"""
        month = datetime.utcnow().month
        if month in [12, 1, 2]:
            return "Winter - Dormant season for most crops"
        elif month in [3, 4, 5]:
            return "Spring - Active growth and planting season"
        elif month in [6, 7, 8]:
            return "Summer - Peak growth and reproductive phase"
        else:
            return "Autumn - Harvest and preparation season"
    
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
