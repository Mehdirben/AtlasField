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
            return "Végétation très faible ou sol nu - attention requise"
        elif value < 0.4:
            return "Végétation en stress - surveillance et action recommandées"
        elif value < 0.6:
            return "Végétation modérée - développement normal"
        elif value < 0.8:
            return "Végétation saine - bonne croissance"
        else:
            return "Végétation très dense et vigoureuse"
