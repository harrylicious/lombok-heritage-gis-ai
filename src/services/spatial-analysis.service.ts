import L from 'leaflet';
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type SiteWithCategory = Database['public']['Views']['sites_with_categories']['Row'];

export interface BufferZone {
  center: [number, number];
  radius: number; // in meters
  siteId: string;
  siteName: string;
  color: string;
}

export interface SpatialOverlay {
  id: string;
  name: string;
  type: 'roads' | 'rivers' | 'villages' | 'custom';
  data: GeoJSON.FeatureCollection;
  visible: boolean;
  opacity: number;
}

interface SpatialCluster {
  id: string;
  sites: SiteWithCategory[];
  center: [number, number];
  siteCount: number;
}

export interface RoutePoint {
  lat: number;
  lng: number;
  name: string;
  description?: string;
}

export class SpatialAnalysisService {
  /**
   * Create buffer zones around cultural sites
   */
  static createBufferZones(
    sites: SiteWithCategory[],
    radiusMeters: number = 500
  ): BufferZone[] {
    return sites
      .filter(site => site.latitude && site.longitude)
      .map(site => ({
        center: [site.latitude!, site.longitude!],
        radius: radiusMeters,
        siteId: site.id,
        siteName: site.name || 'Unknown Site',
        color: site.category_color || '#3b82f6'
      }));
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  static calculateDistance(
    point1: [number, number],
    point2: [number, number]
  ): number {
    const [lat1, lng1] = point1;
    const [lat2, lng2] = point2;

    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  /**
   * Find sites within a buffer zone
   */
  static findSitesInBuffer(
    centerPoint: [number, number],
    sites: SiteWithCategory[],
    radiusMeters: number
  ): SiteWithCategory[] {
    return sites.filter(site => {
      if (!site.latitude || !site.longitude) return false;

      const sitePoint: [number, number] = [site.latitude, site.longitude];
      const distance = this.calculateDistance(centerPoint, sitePoint);

      return distance <= radiusMeters;
    });
  }

  /**
   * Generate route between multiple points using simple algorithm
   */
  static generateRoute(points: RoutePoint[]): [number, number][] {
    if (points.length === 0) return [];
    if (points.length === 1) return [[points[0].lat, points[0].lng]];

    // For now, use simple nearest neighbor algorithm
    // In production, this should use a proper routing service
    const route: [number, number][] = [[points[0].lat, points[0].lng]];
    const remaining = [...points.slice(1)];

    while (remaining.length > 0) {
      const lastPoint = route[route.length - 1];
      let nearestIndex = 0;
      let nearestDistance = this.calculateDistance(
        lastPoint,
        [remaining[0].lat, remaining[0].lng]
      );

      for (let i = 1; i < remaining.length; i++) {
        const distance = this.calculateDistance(
          lastPoint,
          [remaining[i].lat, remaining[i].lng]
        );
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }

      const nextPoint = remaining.splice(nearestIndex, 1)[0];
      route.push([nextPoint.lat, nextPoint.lng]);
    }

    return route;
  }

  /**
   * Create OSM overlay data for roads
   */
  static async getRoadsOverlay(bounds: L.LatLngBounds): Promise<SpatialOverlay> {
    // This would typically fetch from Overpass API or similar
    // For now, return a placeholder structure
    return {
      id: 'roads-overlay',
      name: 'Jalan Raya',
      type: 'roads',
      data: {
        type: 'FeatureCollection',
        features: [] // Would contain actual road geometries
      },
      visible: true,
      opacity: 0.7
    };
  }

  /**
   * Create OSM overlay data for rivers
   */
  static async getRiversOverlay(bounds: L.LatLngBounds): Promise<SpatialOverlay> {
    return {
      id: 'rivers-overlay',
      name: 'Sungai',
      type: 'rivers',
      data: {
        type: 'FeatureCollection',
        features: [] // Would contain actual river geometries
      },
      visible: true,
      opacity: 0.6
    };
  }

  /**
   * Create OSM overlay data for villages
   */
  static async getVillagesOverlay(bounds: L.LatLngBounds): Promise<SpatialOverlay> {
    return {
      id: 'villages-overlay',
      name: 'Desa/Kelurahan',
      type: 'villages',
      data: {
        type: 'FeatureCollection',
        features: [] // Would contain actual village boundaries
      },
      visible: true,
      opacity: 0.5
    };
  }

  /**
   * Calculate spatial statistics for sites
   */
  static calculateSpatialStats(sites: SiteWithCategory[]) {
    if (sites.length === 0) {
      return {
        totalSites: 0,
        averageDistance: 0,
        density: 0,
        clusters: []
      };
    }

    // Calculate centroid
    const centroid = sites.reduce(
      (acc, site) => {
        if (site.latitude && site.longitude) {
          return [
            acc[0] + site.latitude / sites.length,
            acc[1] + site.longitude / sites.length
          ];
        }
        return acc;
      },
      [0, 0]
    );

    // Calculate average distance from centroid
    const distances = sites
      .filter(site => site.latitude && site.longitude)
      .map(site => this.calculateDistance(
        centroid as [number, number],
        [site.latitude!, site.longitude!]
      ));

    const averageDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;

    // Simple density calculation (sites per square km)
    // This is a rough approximation
    const area = Math.PI * Math.pow(averageDistance / 1000, 2);
    const density = sites.length / area;

    return {
      totalSites: sites.length,
      averageDistance,
      density,
      clusters: this.identifyClusters(sites)
    };
  }

  /**
   * Identify spatial clusters of sites
   */
  private static identifyClusters(sites: SiteWithCategory[]): SpatialCluster[] {
    // Simple clustering algorithm - group sites within 2km of each other
    const clusters: SiteWithCategory[][] = [];
    const processed = new Set<string>();

    sites.forEach(site => {
      if (processed.has(site.id) || !site.latitude || !site.longitude) return;

      const cluster: SiteWithCategory[] = [site];
      processed.add(site.id);

      sites.forEach(otherSite => {
        if (
          !processed.has(otherSite.id) &&
          otherSite.latitude &&
          otherSite.longitude &&
          this.calculateDistance(
            [site.latitude, site.longitude],
            [otherSite.latitude, otherSite.longitude]
          ) <= 2000 // 2km
        ) {
          cluster.push(otherSite);
          processed.add(otherSite.id);
        }
      });

      if (cluster.length > 1) {
        clusters.push(cluster);
      }
    });

    return clusters.map((cluster, index) => ({
      id: `cluster-${index}`,
      sites: cluster,
      center: this.calculateClusterCenter(cluster),
      siteCount: cluster.length
    }));
  }

  /**
   * Calculate center point of a cluster
   */
  private static calculateClusterCenter(sites: SiteWithCategory[]): [number, number] {
    const validSites = sites.filter(s => s.latitude && s.longitude);
    if (validSites.length === 0) return [0, 0];

    const sum = validSites.reduce(
      (acc, site) => [acc[0] + site.latitude!, acc[1] + site.longitude!],
      [0, 0]
    );

    return [sum[0] / validSites.length, sum[1] / validSites.length];
  }

  /**
   * Export spatial data as GeoJSON
   */
  static exportAsGeoJSON(sites: SiteWithCategory[]): GeoJSON.FeatureCollection {
    return {
      type: 'FeatureCollection',
      features: sites
        .filter(site => site.latitude && site.longitude)
        .map(site => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [site.longitude, site.latitude]
          },
          properties: {
            id: site.id,
            name: site.name,
            localName: site.local_name,
            category: site.category_name,
            significance: site.cultural_significance_score,
            preservationStatus: site.preservation_status
          }
        }))
    };
  }
}