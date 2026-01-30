"""
Sentinel Hub Service - Integration with Copernicus Data Space
For satellite imagery (Sentinel-1, Sentinel-2) and vegetation indices
"""
from datetime import datetime, timedelta
from typing import Optional
import httpx
import numpy as np

from app.config import settings


class SentinelHubService:
    """
    Service for fetching satellite data from Sentinel Hub API
    Supports both Sentinel-1 (Radar) and Sentinel-2 (Optical)
    """
    
    def __init__(self):
        self.client_id = settings.SENTINEL_HUB_CLIENT_ID
        self.client_secret = settings.SENTINEL_HUB_CLIENT_SECRET
        self.base_url = settings.SENTINEL_HUB_BASE_URL
        self.token_url = settings.SENTINEL_HUB_TOKEN_URL
        self._token: Optional[str] = None
        self._token_expires: Optional[datetime] = None
    
    async def _get_token(self) -> str:
        """Get OAuth2 token for Sentinel Hub API"""
        if self._token and self._token_expires and datetime.utcnow() < self._token_expires:
            return self._token
        
        if not self.client_id or not self.client_secret:
            raise ValueError("Sentinel Hub credentials not configured")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.token_url,
                data={
                    "grant_type": "client_credentials",
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                },
            )
            response.raise_for_status()
            data = response.json()
            
            self._token = data["access_token"]
            self._token_expires = datetime.utcnow() + timedelta(seconds=data.get("expires_in", 3600) - 60)
            
            return self._token
    
    async def get_ndvi(self, bbox: tuple, resolution: int = 10) -> dict:
        """
        Get NDVI (Normalized Difference Vegetation Index) from Sentinel-2
        
        Args:
            bbox: (min_lon, min_lat, max_lon, max_lat)
            resolution: Pixel resolution in meters
            
        Returns:
            dict with mean, min, max, interpretation
        """
        try:
            token = await self._get_token()
            
            # Evalscript for NDVI calculation
            evalscript = """
            //VERSION=3
            function setup() {
                return {
                    input: [{
                        bands: ["B04", "B08", "SCL"],
                        units: "DN"
                    }],
                    output: {
                        bands: 1,
                        sampleType: "FLOAT32"
                    }
                };
            }
            
            function evaluatePixel(sample) {
                // Cloud masking using Scene Classification
                if (sample.SCL == 3 || sample.SCL == 8 || sample.SCL == 9 || sample.SCL == 10) {
                    return [-1];  // Cloud/shadow
                }
                
                // NDVI calculation: (NIR - Red) / (NIR + Red)
                let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
                return [ndvi];
            }
            """
            
            # Calculate dimensions from bbox
            width = int((bbox[2] - bbox[0]) * 111320 / resolution)  # Approximate
            height = int((bbox[3] - bbox[1]) * 110540 / resolution)
            width = min(max(width, 10), 2500)
            height = min(max(height, 10), 2500)
            
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=30)
            
            request_body = {
                "input": {
                    "bounds": {
                        "bbox": list(bbox),
                        "properties": {"crs": "http://www.opengis.net/def/crs/EPSG/0/4326"}
                    },
                    "data": [{
                        "type": "sentinel-2-l2a",
                        "dataFilter": {
                            "timeRange": {
                                "from": start_date.strftime("%Y-%m-%dT00:00:00Z"),
                                "to": end_date.strftime("%Y-%m-%dT23:59:59Z")
                            },
                            "mosaickingOrder": "leastCC"
                        }
                    }]
                },
                "output": {
                    "width": width,
                    "height": height,
                    "responses": [{
                        "identifier": "default",
                        "format": {"type": "image/tiff"}
                    }]
                },
                "evalscript": evalscript
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/api/v1/process",
                    json=request_body,
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Content-Type": "application/json",
                    },
                    timeout=60.0
                )
                response.raise_for_status()
                
                # Parse TIFF data (simplified - in production use rasterio)
                # For MVP, we'll calculate statistics from the raw bytes
                data = response.content
                
                # Parse TIFF and calculate actual statistics
                return self._calculate_stats(data, "ndvi")
        
        except ValueError as e:
            # Re-raise credential errors
            raise
        except Exception as e:
            raise ValueError(f"Failed to fetch NDVI data from Sentinel Hub: {str(e)}")
    
    async def get_rvi(self, bbox: tuple, resolution: int = 10) -> dict:
        """
        Get RVI (Radar Vegetation Index) from Sentinel-1
        RVI = 4 * VH / (VV + VH)
        
        This works through clouds - key differentiator!
        """
        try:
            token = await self._get_token()
            
            evalscript = """
            //VERSION=3
            function setup() {
                return {
                    input: [{
                        bands: ["VV", "VH"]
                    }],
                    output: {
                        bands: 1,
                        sampleType: "FLOAT32"
                    }
                };
            }
            
            function evaluatePixel(sample) {
                // Radar Vegetation Index
                let rvi = (4 * sample.VH) / (sample.VV + sample.VH);
                return [rvi];
            }
            """
            
            width = int((bbox[2] - bbox[0]) * 111320 / resolution)
            height = int((bbox[3] - bbox[1]) * 110540 / resolution)
            width = min(max(width, 10), 2500)
            height = min(max(height, 10), 2500)
            
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=12)
            
            request_body = {
                "input": {
                    "bounds": {
                        "bbox": list(bbox),
                        "properties": {"crs": "http://www.opengis.net/def/crs/EPSG/0/4326"}
                    },
                    "data": [{
                        "type": "sentinel-1-grd",
                        "dataFilter": {
                            "timeRange": {
                                "from": start_date.strftime("%Y-%m-%dT00:00:00Z"),
                                "to": end_date.strftime("%Y-%m-%dT23:59:59Z")
                            }
                        }
                    }]
                },
                "output": {
                    "width": width,
                    "height": height,
                    "responses": [{
                        "identifier": "default",
                        "format": {"type": "image/tiff"}
                    }]
                },
                "evalscript": evalscript
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/api/v1/process",
                    json=request_body,
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Content-Type": "application/json",
                    },
                    timeout=60.0
                )
                response.raise_for_status()
                
                return self._calculate_stats(response.content, "rvi")
        
        except ValueError as e:
            # Re-raise credential errors
            raise
        except Exception as e:
            raise ValueError(f"Failed to fetch RVI data from Sentinel Hub: {str(e)}")
    
    async def get_fused_analysis(self, bbox: tuple) -> dict:
        """
        Fuse NDVI (optical) and RVI (radar) for robust vegetation assessment
        Uses radar data when optical is cloudy
        """
        ndvi_result = await self.get_ndvi(bbox)
        rvi_result = await self.get_rvi(bbox)
        
        # Weighted fusion
        ndvi_mean = ndvi_result.get("mean", 0.5)
        rvi_mean = rvi_result.get("mean", 0.5)
        cloud_coverage = ndvi_result.get("cloud_coverage", 0)
        
        # Use more radar weight when cloudy
        if cloud_coverage > 50:
            fused_mean = rvi_mean
        else:
            weight_optical = (100 - cloud_coverage) / 100
            fused_mean = weight_optical * ndvi_mean + (1 - weight_optical) * rvi_mean
        
        return {
            "mean": round(fused_mean, 3),
            "min": min(ndvi_result.get("min", 0), rvi_result.get("min", 0)),
            "max": max(ndvi_result.get("max", 1), rvi_result.get("max", 1)),
            "cloud_coverage": cloud_coverage,
            "interpretation": self._interpret_vegetation(fused_mean),
            "raw_data": {
                "ndvi": ndvi_result,
                "rvi": rvi_result,
                "fusion_method": "weighted"
            }
        }
    
    def _calculate_stats(self, data: bytes, index_type: str) -> dict:
        """
        Calculate statistics from TIFF image data
        Parses the raw bytes to extract actual vegetation index values
        """
        try:
            # Parse TIFF data - extract float32 values
            # Skip TIFF header (typically first 8 bytes for basic TIFF)
            # The actual pixel data follows the header/IFD structure
            
            # For GeoTIFF from Sentinel Hub, data is FLOAT32
            # Simple approach: read raw float values after header
            import struct
            
            # Find data offset (simplified - assumes uncompressed data)
            # In production, use rasterio or tifffile for proper parsing
            if len(data) < 100:
                raise ValueError("TIFF data too small")
            
            # Extract float32 values (skip first 8 bytes header minimum)
            offset = 8
            float_size = 4
            num_values = (len(data) - offset) // float_size
            
            if num_values < 10:
                raise ValueError("Not enough pixel data")
            
            # Unpack float values
            values = []
            for i in range(min(num_values, 10000)):  # Limit to prevent memory issues
                try:
                    val = struct.unpack('<f', data[offset + i*float_size:offset + (i+1)*float_size])[0]
                    # Filter out nodata values (typically -1 for clouds, NaN, or very large values)
                    if -1 < val < 2 and not np.isnan(val):
                        values.append(val)
                except:
                    continue
            
            if len(values) < 5:
                raise ValueError("Not enough valid pixel values")
            
            values_array = np.array(values)
            mean_val = float(np.mean(values_array))
            min_val = float(np.min(values_array))
            max_val = float(np.max(values_array))
            
            # Estimate cloud coverage from invalid pixels
            total_pixels = num_values
            valid_pixels = len(values)
            cloud_coverage = ((total_pixels - valid_pixels) / total_pixels) * 100
            
            source = "sentinel-2" if index_type == "ndvi" else "sentinel-1"
            
            return {
                "mean": round(mean_val, 3),
                "min": round(min_val, 3),
                "max": round(max_val, 3),
                "cloud_coverage": round(min(cloud_coverage, 100), 1),
                "interpretation": self._interpret_vegetation(mean_val),
                "raw_data": {"source": source, "index": index_type, "pixel_count": valid_pixels}
            }
            
        except Exception as e:
            raise ValueError(f"Failed to parse satellite data: {str(e)}")
    
    @staticmethod
    def _interpret_vegetation(value: float) -> str:
        """Interpret vegetation index value"""
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
    
    async def get_nbr(self, bbox: tuple, resolution: int = 10) -> dict:
        """
        Get NBR (Normalized Burn Ratio) from Sentinel-2
        NBR = (NIR - SWIR2) / (NIR + SWIR2) using B08 and B12
        
        Used for fire damage assessment and fire risk monitoring in forests.
        Low NBR values indicate burned or stressed vegetation.
        """
        try:
            token = await self._get_token()
            
            evalscript = """
            //VERSION=3
            function setup() {
                return {
                    input: [{
                        bands: ["B08", "B12", "SCL"],
                        units: "DN"
                    }],
                    output: {
                        bands: 1,
                        sampleType: "FLOAT32"
                    }
                };
            }
            
            function evaluatePixel(sample) {
                // Cloud masking using Scene Classification
                if (sample.SCL == 3 || sample.SCL == 8 || sample.SCL == 9 || sample.SCL == 10) {
                    return [-1];  // Cloud/shadow
                }
                
                // NBR calculation: (NIR - SWIR2) / (NIR + SWIR2)
                let nbr = (sample.B08 - sample.B12) / (sample.B08 + sample.B12);
                return [nbr];
            }
            """
            
            width = int((bbox[2] - bbox[0]) * 111320 / resolution)
            height = int((bbox[3] - bbox[1]) * 110540 / resolution)
            width = min(max(width, 10), 2500)
            height = min(max(height, 10), 2500)
            
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=30)
            
            request_body = {
                "input": {
                    "bounds": {
                        "bbox": list(bbox),
                        "properties": {"crs": "http://www.opengis.net/def/crs/EPSG/0/4326"}
                    },
                    "data": [{
                        "type": "sentinel-2-l2a",
                        "dataFilter": {
                            "timeRange": {
                                "from": start_date.strftime("%Y-%m-%dT00:00:00Z"),
                                "to": end_date.strftime("%Y-%m-%dT23:59:59Z")
                            },
                            "mosaickingOrder": "leastCC"
                        }
                    }]
                },
                "output": {
                    "width": width,
                    "height": height,
                    "responses": [{
                        "identifier": "default",
                        "format": {"type": "image/tiff"}
                    }]
                },
                "evalscript": evalscript
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/api/v1/process",
                    json=request_body,
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Content-Type": "application/json",
                    },
                    timeout=60.0
                )
                response.raise_for_status()
                
                return self._calculate_stats(response.content, "nbr")
        
        except ValueError as e:
            raise
        except Exception as e:
            raise ValueError(f"Failed to fetch NBR data from Sentinel Hub: {str(e)}")
    
    async def get_ndmi(self, bbox: tuple, resolution: int = 10) -> dict:
        """
        Get NDMI (Normalized Difference Moisture Index) from Sentinel-2
        NDMI = (NIR - SWIR1) / (NIR + SWIR1) using B08 and B11
        
        Used for monitoring vegetation water content and drought stress in forests.
        """
        try:
            token = await self._get_token()
            
            evalscript = """
            //VERSION=3
            function setup() {
                return {
                    input: [{
                        bands: ["B08", "B11", "SCL"],
                        units: "DN"
                    }],
                    output: {
                        bands: 1,
                        sampleType: "FLOAT32"
                    }
                };
            }
            
            function evaluatePixel(sample) {
                // Cloud masking
                if (sample.SCL == 3 || sample.SCL == 8 || sample.SCL == 9 || sample.SCL == 10) {
                    return [-1];
                }
                
                // NDMI calculation: (NIR - SWIR1) / (NIR + SWIR1)
                let ndmi = (sample.B08 - sample.B11) / (sample.B08 + sample.B11);
                return [ndmi];
            }
            """
            
            width = int((bbox[2] - bbox[0]) * 111320 / resolution)
            height = int((bbox[3] - bbox[1]) * 110540 / resolution)
            width = min(max(width, 10), 2500)
            height = min(max(height, 10), 2500)
            
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=30)
            
            request_body = {
                "input": {
                    "bounds": {
                        "bbox": list(bbox),
                        "properties": {"crs": "http://www.opengis.net/def/crs/EPSG/0/4326"}
                    },
                    "data": [{
                        "type": "sentinel-2-l2a",
                        "dataFilter": {
                            "timeRange": {
                                "from": start_date.strftime("%Y-%m-%dT00:00:00Z"),
                                "to": end_date.strftime("%Y-%m-%dT23:59:59Z")
                            },
                            "mosaickingOrder": "leastCC"
                        }
                    }]
                },
                "output": {
                    "width": width,
                    "height": height,
                    "responses": [{
                        "identifier": "default",
                        "format": {"type": "image/tiff"}
                    }]
                },
                "evalscript": evalscript
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/api/v1/process",
                    json=request_body,
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Content-Type": "application/json",
                    },
                    timeout=60.0
                )
                response.raise_for_status()
                
                return self._calculate_stats(response.content, "ndmi")
        
        except ValueError as e:
            raise
        except Exception as e:
            raise ValueError(f"Failed to fetch NDMI data from Sentinel Hub: {str(e)}")
    
    async def get_forest_classification(self, bbox: tuple, resolution: int = 10) -> dict:
        """
        Classify forest type using SWIR and Red Edge bands.
        Distinguishes between coniferous, deciduous, and mixed forests.
        
        Uses spectral signatures:
        - Coniferous: Higher SWIR reflectance, lower NIR
        - Deciduous: Lower SWIR reflectance, higher NIR (when leaves present)
        """
        try:
            token = await self._get_token()
            
            evalscript = """
            //VERSION=3
            function setup() {
                return {
                    input: [{
                        bands: ["B04", "B05", "B08", "B11", "B12", "SCL"],
                        units: "DN"
                    }],
                    output: {
                        bands: 4,
                        sampleType: "FLOAT32"
                    }
                };
            }
            
            function evaluatePixel(sample) {
                // Cloud masking
                if (sample.SCL == 3 || sample.SCL == 8 || sample.SCL == 9 || sample.SCL == 10) {
                    return [-1, -1, -1, -1];
                }
                
                // NDVI for vegetation presence
                let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
                
                // NDFI - Normalized Difference Forest Index (SWIR1 vs NIR)
                let ndfi = (sample.B11 - sample.B08) / (sample.B11 + sample.B08);
                
                // Red Edge NDVI - more sensitive to forest type
                let rendvi = (sample.B08 - sample.B05) / (sample.B08 + sample.B05);
                
                // Moisture Stress Index
                let msi = sample.B11 / sample.B08;
                
                return [ndvi, ndfi, rendvi, msi];
            }
            """
            
            width = int((bbox[2] - bbox[0]) * 111320 / resolution)
            height = int((bbox[3] - bbox[1]) * 110540 / resolution)
            width = min(max(width, 10), 2500)
            height = min(max(height, 10), 2500)
            
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=30)
            
            request_body = {
                "input": {
                    "bounds": {
                        "bbox": list(bbox),
                        "properties": {"crs": "http://www.opengis.net/def/crs/EPSG/0/4326"}
                    },
                    "data": [{
                        "type": "sentinel-2-l2a",
                        "dataFilter": {
                            "timeRange": {
                                "from": start_date.strftime("%Y-%m-%dT00:00:00Z"),
                                "to": end_date.strftime("%Y-%m-%dT23:59:59Z")
                            },
                            "mosaickingOrder": "leastCC"
                        }
                    }]
                },
                "output": {
                    "width": width,
                    "height": height,
                    "responses": [{
                        "identifier": "default",
                        "format": {"type": "image/tiff"}
                    }]
                },
                "evalscript": evalscript
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/api/v1/process",
                    json=request_body,
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Content-Type": "application/json",
                    },
                    timeout=60.0
                )
                response.raise_for_status()
                
                return self._classify_forest_type(response.content)
        
        except ValueError as e:
            raise
        except Exception as e:
            raise ValueError(f"Failed to classify forest: {str(e)}")
    
    def _classify_forest_type(self, data: bytes) -> dict:
        """
        Classify forest type from multi-band spectral data.
        Returns forest type classification with confidence.
        """
        try:
            import struct
            
            if len(data) < 100:
                raise ValueError("TIFF data too small")
            
            offset = 8
            float_size = 4
            num_pixels = (len(data) - offset) // (float_size * 4)  # 4 bands
            
            ndvi_values = []
            ndfi_values = []
            rendvi_values = []
            msi_values = []
            
            for i in range(min(num_pixels, 5000)):
                try:
                    base = offset + i * float_size * 4
                    ndvi = struct.unpack('<f', data[base:base + float_size])[0]
                    ndfi = struct.unpack('<f', data[base + float_size:base + float_size * 2])[0]
                    rendvi = struct.unpack('<f', data[base + float_size * 2:base + float_size * 3])[0]
                    msi = struct.unpack('<f', data[base + float_size * 3:base + float_size * 4])[0]
                    
                    # Filter valid vegetation pixels
                    if ndvi > 0.3 and not np.isnan(ndvi) and ndvi < 2:
                        ndvi_values.append(ndvi)
                        if not np.isnan(ndfi) and abs(ndfi) < 2:
                            ndfi_values.append(ndfi)
                        if not np.isnan(rendvi) and abs(rendvi) < 2:
                            rendvi_values.append(rendvi)
                        if not np.isnan(msi) and 0 < msi < 5:
                            msi_values.append(msi)
                except:
                    continue
            
            if len(ndvi_values) < 10:
                return {
                    "detected_type": "UNKNOWN",
                    "confidence": 0.0,
                    "canopy_cover_percent": 0.0,
                    "message": "Insufficient vegetation data for classification"
                }
            
            mean_ndvi = np.mean(ndvi_values)
            mean_ndfi = np.mean(ndfi_values) if ndfi_values else 0
            mean_msi = np.mean(msi_values) if msi_values else 1
            
            # Classification logic based on spectral signatures
            # Coniferous: Higher MSI (more SWIR absorption), lower NDFI
            # Deciduous: Lower MSI, higher NDFI (during leaf-on season)
            
            confidence = 0.7
            
            if mean_msi > 1.2 and mean_ndfi < -0.1:
                forest_type = "coniferous"
                confidence = min(0.9, 0.6 + abs(mean_ndfi) * 0.5)
            elif mean_msi < 0.9 and mean_ndfi > 0:
                forest_type = "deciduous"
                confidence = min(0.9, 0.6 + mean_ndfi * 0.5)
            else:
                forest_type = "mixed"
                confidence = 0.65
            
            # Estimate canopy cover from NDVI
            canopy_cover = min(100, max(0, (mean_ndvi - 0.2) / 0.6 * 100))
            
            return {
                "detected_type": forest_type,
                "confidence": round(confidence, 2),
                "canopy_cover_percent": round(canopy_cover, 1),
                "spectral_signature": {
                    "mean_ndvi": round(mean_ndvi, 3),
                    "mean_ndfi": round(mean_ndfi, 3),
                    "mean_msi": round(mean_msi, 3)
                },
                "interpretation": self._interpret_forest_type(forest_type, canopy_cover)
            }
            
        except Exception as e:
            raise ValueError(f"Failed to classify forest type: {str(e)}")
    
    @staticmethod
    def _interpret_forest_type(forest_type: str, canopy_cover: float) -> str:
        """Generate interpretation for forest classification"""
        density = "dense" if canopy_cover > 70 else "moderate" if canopy_cover > 40 else "sparse"
        
        interpretations = {
            "coniferous": f"Coniferous forest with {density} canopy ({canopy_cover:.0f}% cover). Typical species: pine, spruce, fir.",
            "deciduous": f"Deciduous forest with {density} canopy ({canopy_cover:.0f}% cover). Typical species: oak, beech, maple.",
            "mixed": f"Mixed forest with {density} canopy ({canopy_cover:.0f}% cover). Contains both coniferous and deciduous species.",
            "UNKNOWN": "Unable to classify forest type. Area may have insufficient vegetation cover."
        }
        return interpretations.get(forest_type, interpretations["UNKNOWN"])
    
    async def get_forest_analysis(self, bbox: tuple) -> dict:
        """
        Complete forest analysis combining NDVI, NBR, NDMI, and classification.
        Returns comprehensive forest health assessment.
        """
        # Fetch all forest indices
        ndvi_result = await self.get_ndvi(bbox)
        nbr_result = await self.get_nbr(bbox)
        ndmi_result = await self.get_ndmi(bbox)
        classification = await self.get_forest_classification(bbox)
        
        ndvi_mean = ndvi_result.get("mean", 0.5)
        nbr_mean = nbr_result.get("mean", 0.5)
        ndmi_mean = ndmi_result.get("mean", 0.3)
        
        # Determine fire risk based on NBR and NDMI
        if nbr_mean < 0.1:
            fire_risk = "CRITICAL"
        elif nbr_mean < 0.2 and ndmi_mean < 0.2:
            fire_risk = "HIGH"
        elif nbr_mean < 0.3 or ndmi_mean < 0.25:
            fire_risk = "MEDIUM"
        else:
            fire_risk = "LOW"
        
        # Determine canopy health
        if ndvi_mean >= 0.6:
            canopy_health = "EXCELLENT"
        elif ndvi_mean >= 0.45:
            canopy_health = "GOOD"
        elif ndvi_mean >= 0.3:
            canopy_health = "MODERATE"
        else:
            canopy_health = "POOR"
        
        # Estimate carbon content (simplified model)
        # Forests typically store 50-200 tonnes C/ha depending on type and age
        biomass_factor = 150 if classification.get("detected_type") == "coniferous" else 120
        carbon_estimate = biomass_factor * ndvi_mean * (classification.get("canopy_cover_percent", 50) / 100)
        
        return {
            "mean": ndvi_mean,
            "min": min(ndvi_result.get("min", 0), nbr_result.get("min", 0)),
            "max": max(ndvi_result.get("max", 1), nbr_result.get("max", 1)),
            "cloud_coverage": ndvi_result.get("cloud_coverage", 0),
            "nbr": nbr_mean,
            "ndmi": ndmi_mean,
            "fire_risk_level": fire_risk,
            "canopy_health": canopy_health,
            "forest_classification": classification,
            "carbon_estimate_tonnes_ha": round(carbon_estimate, 1),
            "deforestation_risk": "LOW" if ndvi_mean > 0.4 else "MEDIUM" if ndvi_mean > 0.25 else "HIGH",
            "interpretation": self._interpret_forest_health(ndvi_mean, nbr_mean, ndmi_mean, fire_risk, classification)
        }
    
    @staticmethod
    def _interpret_forest_health(ndvi: float, nbr: float, ndmi: float, fire_risk: str, classification: dict) -> str:
        """Generate comprehensive forest health interpretation"""
        forest_type = classification.get("detected_type", "UNKNOWN")
        canopy = classification.get("canopy_cover_percent", 0)
        
        parts = []
        
        # Overall health
        if ndvi >= 0.6:
            parts.append(f"This {forest_type} forest shows excellent overall health with {canopy:.0f}% canopy cover.")
        elif ndvi >= 0.4:
            parts.append(f"This {forest_type} forest shows good health with moderate vegetation density.")
        else:
            parts.append(f"This {forest_type} forest shows signs of stress with reduced vegetation vigor.")
        
        # Fire risk
        if fire_risk in ["HIGH", "CRITICAL"]:
            parts.append(f"⚠️ Fire risk is {fire_risk} - immediate monitoring recommended.")
        elif fire_risk == "MEDIUM":
            parts.append("Moderate fire risk - regular monitoring advised.")
        
        # Moisture stress
        if ndmi < 0.2:
            parts.append("Water stress detected - the forest may be experiencing drought conditions.")
        elif ndmi > 0.4:
            parts.append("Good moisture levels indicate healthy water availability.")
        
        return " ".join(parts)

    async def get_crop_classification(self, bbox: tuple, resolution: int = 10) -> dict:
        """
        Classify crop type using spectral indices.
        Uses NDVI temporal patterns, Red Edge, and SWIR bands to distinguish crops.
        
        Spectral signatures:
        - Wheat/Cereals: Moderate NDVI, low Red Edge during grain fill
        - Corn/Maize: High NDVI, strong Red Edge signal
        - Soybeans: Moderate-high NDVI, distinct SWIR response
        - Rice (paddy): High NDVI with water signature
        - Vegetables: Variable, typically lower canopy
        - Pasture/Grassland: Consistent moderate NDVI
        """
        try:
            token = await self._get_token()
            
            evalscript = """
            //VERSION=3
            function setup() {
                return {
                    input: [{
                        bands: ["B04", "B05", "B06", "B08", "B11", "B12", "SCL"],
                        units: "DN"
                    }],
                    output: {
                        bands: 5,
                        sampleType: "FLOAT32"
                    }
                };
            }
            
            function evaluatePixel(sample) {
                // Cloud masking
                if (sample.SCL == 3 || sample.SCL == 8 || sample.SCL == 9 || sample.SCL == 10 || sample.SCL == 6) {
                    return [-1, -1, -1, -1, -1];
                }
                
                // NDVI - vegetation vigor
                let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
                
                // RENDVI - Red Edge NDVI, sensitive to chlorophyll content
                let rendvi = (sample.B08 - sample.B05) / (sample.B08 + sample.B05);
                
                // NDRE - Normalized Difference Red Edge, crop-specific
                let ndre = (sample.B08 - sample.B06) / (sample.B08 + sample.B06);
                
                // NDWI - Water index (for rice detection)
                let ndwi = (sample.B08 - sample.B11) / (sample.B08 + sample.B11);
                
                // SWIR ratio - crop structure indicator
                let swir_ratio = sample.B11 / sample.B12;
                
                return [ndvi, rendvi, ndre, ndwi, swir_ratio];
            }
            """
            
            width = int((bbox[2] - bbox[0]) * 111320 / resolution)
            height = int((bbox[3] - bbox[1]) * 110540 / resolution)
            width = min(max(width, 10), 2500)
            height = min(max(height, 10), 2500)
            
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=30)
            
            request_body = {
                "input": {
                    "bounds": {
                        "bbox": list(bbox),
                        "properties": {"crs": "http://www.opengis.net/def/crs/EPSG/0/4326"}
                    },
                    "data": [{
                        "type": "sentinel-2-l2a",
                        "dataFilter": {
                            "timeRange": {
                                "from": start_date.strftime("%Y-%m-%dT00:00:00Z"),
                                "to": end_date.strftime("%Y-%m-%dT23:59:59Z")
                            },
                            "mosaickingOrder": "leastCC"
                        }
                    }]
                },
                "output": {
                    "width": width,
                    "height": height,
                    "responses": [{
                        "identifier": "default",
                        "format": {"type": "image/tiff"}
                    }]
                },
                "evalscript": evalscript
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/api/v1/process",
                    json=request_body,
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Content-Type": "application/json",
                    },
                    timeout=60.0
                )
                response.raise_for_status()
                
                return self._classify_crop_type(response.content)
        
        except ValueError as e:
            raise
        except Exception as e:
            raise ValueError(f"Failed to classify crop: {str(e)}")

    def _classify_crop_type(self, data: bytes) -> dict:
        """
        Classify crop type from multi-band spectral data.
        Returns crop type classification with confidence.
        """
        try:
            import struct
            
            if len(data) < 100:
                raise ValueError("TIFF data too small")
            
            offset = 8
            float_size = 4
            num_bands = 5
            num_pixels = (len(data) - offset) // (float_size * num_bands)
            
            ndvi_values = []
            rendvi_values = []
            ndre_values = []
            ndwi_values = []
            swir_values = []
            
            for i in range(min(num_pixels, 5000)):
                try:
                    base = offset + i * float_size * num_bands
                    ndvi = struct.unpack('<f', data[base:base + float_size])[0]
                    rendvi = struct.unpack('<f', data[base + float_size:base + float_size * 2])[0]
                    ndre = struct.unpack('<f', data[base + float_size * 2:base + float_size * 3])[0]
                    ndwi = struct.unpack('<f', data[base + float_size * 3:base + float_size * 4])[0]
                    swir = struct.unpack('<f', data[base + float_size * 4:base + float_size * 5])[0]
                    
                    # Filter valid vegetation pixels
                    if ndvi > 0.15 and not np.isnan(ndvi) and ndvi < 1:
                        ndvi_values.append(ndvi)
                        if not np.isnan(rendvi) and abs(rendvi) < 1:
                            rendvi_values.append(rendvi)
                        if not np.isnan(ndre) and abs(ndre) < 1:
                            ndre_values.append(ndre)
                        if not np.isnan(ndwi) and abs(ndwi) < 2:
                            ndwi_values.append(ndwi)
                        if not np.isnan(swir) and 0 < swir < 10:
                            swir_values.append(swir)
                except:
                    continue
            
            if len(ndvi_values) < 10:
                return {
                    "detected_type": "UNKNOWN",
                    "confidence": 0.0,
                    "vegetation_cover_percent": 0.0,
                    "message": "Insufficient vegetation data for classification"
                }
            
            mean_ndvi = np.mean(ndvi_values)
            mean_rendvi = np.mean(rendvi_values) if rendvi_values else 0
            mean_ndre = np.mean(ndre_values) if ndre_values else 0
            mean_ndwi = np.mean(ndwi_values) if ndwi_values else 0
            mean_swir = np.mean(swir_values) if swir_values else 1
            
            # Get current month for seasonal context
            month = datetime.utcnow().month
            
            # Classification logic based on spectral signatures
            confidence = 0.65
            crop_type = "UNKNOWN"
            
            # Rice detection - high NDVI with water signature
            if mean_ndwi > 0.2 and mean_ndvi > 0.4:
                crop_type = "rice"
                confidence = min(0.85, 0.6 + mean_ndwi * 0.5)
            
            # Corn/Maize - high NDVI, strong red edge
            elif mean_ndvi > 0.65 and mean_ndre > 0.4:
                crop_type = "corn"
                confidence = min(0.85, 0.55 + mean_ndvi * 0.3)
            
            # Soybeans - moderate-high NDVI, distinctive SWIR
            elif mean_ndvi > 0.5 and mean_ndvi < 0.75 and mean_swir > 1.1:
                crop_type = "soybeans"
                confidence = 0.7
            
            # Wheat/Cereals - moderate NDVI (varies by growth stage)
            elif 0.3 < mean_ndvi < 0.65 and mean_ndre < 0.35:
                crop_type = "wheat"
                confidence = 0.7
            
            # Pasture/Grassland - consistent moderate NDVI, low SWIR ratio
            elif 0.25 < mean_ndvi < 0.5 and mean_swir < 1.0:
                crop_type = "pasture"
                confidence = 0.65
            
            # Vegetables - variable, typically higher variability
            elif 0.3 < mean_ndvi < 0.6 and np.std(ndvi_values) > 0.1:
                crop_type = "vegetables"
                confidence = 0.55
            
            # Bare soil / fallow
            elif mean_ndvi < 0.2:
                crop_type = "fallow"
                confidence = 0.75
            
            # Default to general crop if no clear match
            else:
                crop_type = "mixed_crop"
                confidence = 0.5
            
            # Estimate vegetation cover
            veg_cover = min(100, max(0, (mean_ndvi - 0.1) / 0.7 * 100))
            
            return {
                "detected_type": crop_type,
                "confidence": round(confidence, 2),
                "vegetation_cover_percent": round(veg_cover, 1),
                "growth_vigor": self._assess_growth_vigor(mean_ndvi, mean_ndre),
                "spectral_signature": {
                    "mean_ndvi": round(mean_ndvi, 3),
                    "mean_rendvi": round(mean_rendvi, 3),
                    "mean_ndre": round(mean_ndre, 3),
                    "mean_ndwi": round(mean_ndwi, 3),
                    "mean_swir_ratio": round(mean_swir, 3)
                },
                "interpretation": self._interpret_crop_type(crop_type, veg_cover, mean_ndvi)
            }
            
        except Exception as e:
            raise ValueError(f"Failed to classify crop type: {str(e)}")

    @staticmethod
    def _assess_growth_vigor(ndvi: float, ndre: float) -> str:
        """Assess crop growth vigor based on indices"""
        if ndvi > 0.7 and ndre > 0.4:
            return "excellent"
        elif ndvi > 0.5 and ndre > 0.3:
            return "good"
        elif ndvi > 0.35:
            return "moderate"
        elif ndvi > 0.2:
            return "poor"
        else:
            return "very_poor"

    @staticmethod
    def _interpret_crop_type(crop_type: str, cover: float, ndvi: float) -> str:
        """Generate interpretation for crop classification"""
        health = "excellent" if ndvi > 0.6 else "good" if ndvi > 0.45 else "moderate" if ndvi > 0.3 else "poor"
        
        crop_names = {
            "wheat": "Wheat/Cereals",
            "corn": "Corn/Maize",
            "soybeans": "Soybeans",
            "rice": "Rice (paddy)",
            "pasture": "Pasture/Grassland",
            "vegetables": "Vegetables/Horticulture",
            "fallow": "Fallow/Bare soil",
            "mixed_crop": "Mixed crops",
            "UNKNOWN": "Unknown crop"
        }
        
        name = crop_names.get(crop_type, crop_type.title())
        return f"Detected {name} with {health} health. Vegetation cover: {cover:.0f}%. NDVI: {ndvi:.2f}"

