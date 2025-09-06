import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  TrendingUp,
  Download,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  Info
} from 'lucide-react';
import {
  RecommendationService,
  PreservationPriority,
  RecommendationStats
} from '@/services/recommendation.service';

interface RecommendationPanelProps {
  className?: string;
}

const RecommendationPanel: React.FC<RecommendationPanelProps> = ({ className }) => {
  const [priorities, setPriorities] = useState<PreservationPriority[]>([]);
  const [stats, setStats] = useState<RecommendationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('critical');

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      setIsLoading(true);
      const [allPriorities, recommendationStats] = await Promise.all([
        RecommendationService.calculateAllPriorities(),
        RecommendationService.getRecommendationStats()
      ]);

      setPriorities(allPriorities);
      setStats(recommendationStats);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityIcon = (level: string) => {
    switch (level) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'high': return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'medium': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'low': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (level: string) => {
    switch (level) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getPriorityBadgeColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filterPrioritiesByLevel = (level: string) => {
    return priorities
      .filter(p => p.priorityLevel === level)
      .sort((a, b) => b.priorityScore - a.priorityScore);
  };

  const exportRecommendations = () => {
    const csv = RecommendationService.exportRecommendationsAsCSV(priorities);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `preservation-recommendations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-2"></div>
            <span>Memuat rekomendasi pelestarian...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Rekomendasi Pelestarian
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Prioritas tindakan pelestarian berdasarkan kondisi situs
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportRecommendations}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadRecommendations}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Statistics Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">Kritis</span>
              </div>
              <div className="text-2xl font-bold text-red-900 mt-1">{stats.criticalPriority}</div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">Tinggi</span>
              </div>
              <div className="text-2xl font-bold text-orange-900 mt-1">{stats.highPriority}</div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">Sedang</span>
              </div>
              <div className="text-2xl font-bold text-yellow-900 mt-1">{stats.mediumPriority}</div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Rendah</span>
              </div>
              <div className="text-2xl font-bold text-green-900 mt-1">{stats.lowPriority}</div>
            </div>
          </div>
        )}

        {/* Priority Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="critical" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Kritis ({filterPrioritiesByLevel('critical').length})
            </TabsTrigger>
            <TabsTrigger value="high" className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Tinggi ({filterPrioritiesByLevel('high').length})
            </TabsTrigger>
            <TabsTrigger value="medium" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Sedang ({filterPrioritiesByLevel('medium').length})
            </TabsTrigger>
            <TabsTrigger value="low" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Rendah ({filterPrioritiesByLevel('low').length})
            </TabsTrigger>
          </TabsList>

          {['critical', 'high', 'medium', 'low'].map((level) => (
            <TabsContent key={level} value={level} className="mt-4">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filterPrioritiesByLevel(level).map((priority, index) => (
                  <div
                    key={priority.siteId}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getPriorityIcon(priority.priorityLevel)}
                        <h3 className="font-semibold">{priority.siteName}</h3>
                        <Badge
                          variant="outline"
                          className={getPriorityBadgeColor(priority.priorityLevel)}
                        >
                          {priority.priorityLevel.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Score: {priority.priorityScore.toFixed(1)}
                      </div>
                    </div>

                    {/* Reasons */}
                    <div className="mb-3">
                      <h4 className="text-sm font-medium mb-1">Alasan:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {priority.reasons.map((reason, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Recommended Actions */}
                    <div>
                      <h4 className="text-sm font-medium mb-1">Tindakan yang Direkomendasikan:</h4>
                      <ul className="text-sm space-y-1">
                        {priority.recommendedActions.map((action, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle className="w-3 h-3 text-green-600 mt-1 flex-shrink-0" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}

                {filterPrioritiesByLevel(level).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Tidak ada situs dengan prioritas {level}</p>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default RecommendationPanel;