import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, AlertTriangle, TrendingUp, Landmark, BarChart3 } from 'lucide-react';

interface EconomicEvent {
  date: string;
  time: string;
  event: string;
  impact: 'high' | 'medium' | 'low';
  category: 'fed' | 'earnings' | 'economic' | 'other';
  description?: string;
}

// Static upcoming events (would be replaced by API in production)
const UPCOMING_EVENTS: EconomicEvent[] = [
  { date: '2025-01-15', time: '08:30', event: 'CPI Release', impact: 'high', category: 'economic', description: 'Consumer Price Index' },
  { date: '2025-01-17', time: '10:00', event: 'Consumer Sentiment', impact: 'medium', category: 'economic', description: 'U. Michigan Sentiment' },
  { date: '2025-01-29', time: '14:00', event: 'FOMC Decision', impact: 'high', category: 'fed', description: 'Interest Rate Decision' },
  { date: '2025-01-30', time: '08:30', event: 'GDP Report', impact: 'high', category: 'economic', description: 'Q4 GDP First Estimate' },
  { date: '2025-01-31', time: '08:30', event: 'PCE Inflation', impact: 'high', category: 'economic', description: 'Fed Preferred Inflation Gauge' },
  { date: '2025-02-07', time: '08:30', event: 'Jobs Report', impact: 'high', category: 'economic', description: 'Nonfarm Payrolls' },
  { date: '2025-02-12', time: 'AMC', event: 'NVDA Earnings', impact: 'high', category: 'earnings', description: 'NVIDIA Q4 Results' },
  { date: '2025-02-19', time: '14:00', event: 'FOMC Minutes', impact: 'medium', category: 'fed', description: 'January Meeting Minutes' },
];

const getImpactColor = (impact: string) => {
  switch (impact) {
    case 'high': return 'bg-red-500/10 text-red-600 border-red-500/30';
    case 'medium': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30';
    case 'low': return 'bg-green-500/10 text-green-600 border-green-500/30';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'fed': return <Landmark className="h-4 w-4" />;
    case 'earnings': return <TrendingUp className="h-4 w-4" />;
    case 'economic': return <BarChart3 className="h-4 w-4" />;
    default: return <Calendar className="h-4 w-4" />;
  }
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getDaysUntil = (dateStr: string) => {
  const eventDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);
  const diffTime = eventDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export function EconomicCalendar() {
  // Filter to show only upcoming events (next 30 days)
  const upcomingEvents = UPCOMING_EVENTS.filter(event => {
    const daysUntil = getDaysUntil(event.date);
    return daysUntil >= 0 && daysUntil <= 30;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <Card className="border-2 border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5 text-primary" />
          Economic Calendar
        </CardTitle>
        <p className="text-sm text-muted-foreground">Upcoming market-moving events</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {upcomingEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No upcoming events</p>
          ) : (
            upcomingEvents.map((event, idx) => {
              const daysUntil = getDaysUntil(event.date);
              const isImminent = daysUntil <= 2;
              
              return (
                <div 
                  key={idx} 
                  className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
                    isImminent ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-border'
                  }`}
                >
                  {/* Date Column */}
                  <div className="text-center min-w-[60px]">
                    <p className={`text-sm font-bold ${isImminent ? 'text-primary' : 'text-foreground'}`}>
                      {formatDate(event.date)}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <Clock className="h-3 w-3" />
                      {event.time}
                    </p>
                  </div>
                  
                  {/* Event Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{getCategoryIcon(event.category)}</span>
                      <p className="font-medium text-sm truncate">{event.event}</p>
                    </div>
                    {event.description && (
                      <p className="text-xs text-muted-foreground truncate">{event.description}</p>
                    )}
                  </div>
                  
                  {/* Impact Badge */}
                  <Badge 
                    variant="outline" 
                    className={`text-xs px-2 py-0.5 ${getImpactColor(event.impact)}`}
                  >
                    {event.impact === 'high' && <AlertTriangle className="h-3 w-3 mr-1" />}
                    {event.impact.charAt(0).toUpperCase() + event.impact.slice(1)}
                  </Badge>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
