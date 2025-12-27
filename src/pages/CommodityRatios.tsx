import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Scale } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import presets from "@/config/presets.json";

interface RatioData {
  name: string;
  numerator: string;
  denominator: string;
  value?: number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
}

const ratioDescriptions: Record<string, string> = {
  "Copper/Gold": "Indicador económico clave. Ratio alto = optimismo económico, ratio bajo = aversión al riesgo",
  "Gold/Silver": "Ratio histórico ~60-80. >80 = plata subvaluada, <60 = oro subvaluado",
  "Silver/Oil": "Relación entre metales preciosos y energía",
  "Gold/Oil": "Cuántos barriles de petróleo compra una onza de oro",
  "Platinum/Gold": "Históricamente platino > oro. Inversión indica estrés industrial",
  "Palladium/Gold": "Refleja demanda industrial vs refugio seguro"
};

const historicalAverages: Record<string, number> = {
  "Copper/Gold": 0.00018,
  "Gold/Silver": 70,
  "Silver/Oil": 0.35,
  "Gold/Oil": 25,
  "Platinum/Gold": 1.2,
  "Palladium/Gold": 0.8
};

export default function CommodityRatios() {
  const { language } = useLanguage();
  
  const ratios: RatioData[] = presets.commodity_ratios || [];

  const getRatioStatus = (name: string, value: number | undefined) => {
    if (!value) return { status: 'neutral', message: 'Sin datos' };
    
    const avg = historicalAverages[name];
    if (!avg) return { status: 'neutral', message: 'N/A' };
    
    const deviation = ((value - avg) / avg) * 100;
    
    if (deviation > 20) {
      return { status: 'high', message: `+${deviation.toFixed(1)}% vs promedio` };
    } else if (deviation < -20) {
      return { status: 'low', message: `${deviation.toFixed(1)}% vs promedio` };
    }
    return { status: 'neutral', message: `${deviation > 0 ? '+' : ''}${deviation.toFixed(1)}% vs promedio` };
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Scale className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {language === 'es' ? 'Ratios de Commodities' : 'Commodity Ratios'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'es' 
              ? 'Análisis de relaciones entre metales preciosos y commodities' 
              : 'Analysis of precious metals and commodities relationships'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ratios.map((ratio) => {
          const status = getRatioStatus(ratio.name, historicalAverages[ratio.name]);
          
          return (
            <Card key={ratio.name} className="bg-card border-border hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span>{ratio.name}</span>
                  {status.status === 'high' && <TrendingUp className="h-5 w-5 text-green-500" />}
                  {status.status === 'low' && <TrendingDown className="h-5 w-5 text-red-500" />}
                  {status.status === 'neutral' && <Minus className="h-5 w-5 text-muted-foreground" />}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-foreground">
                    {historicalAverages[ratio.name]?.toFixed(4) || '--'}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    (promedio histórico)
                  </span>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  {ratioDescriptions[ratio.name]}
                </p>
                
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-1 rounded bg-muted text-muted-foreground">
                    {ratio.numerator}
                  </span>
                  <span className="text-muted-foreground">/</span>
                  <span className="px-2 py-1 rounded bg-muted text-muted-foreground">
                    {ratio.denominator}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Metals Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4 text-foreground">
          {language === 'es' ? 'Metales Preciosos' : 'Precious Metals'}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {(presets.metals || []).map((metal: string) => (
            <Card key={metal} className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <span className="font-mono font-bold text-foreground">{metal}</span>
                <p className="text-xs text-muted-foreground mt-1">
                  {metal === 'XAUUSD' && 'Oro'}
                  {metal === 'XAGUSD' && 'Plata'}
                  {metal === 'XPTUSD' && 'Platino'}
                  {metal === 'XPDUSD' && 'Paladio'}
                  {metal === 'XCUUSD' && 'Cobre'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Rare Earths Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4 text-foreground">
          {language === 'es' ? 'Tierras Raras y Minería' : 'Rare Earths & Mining'}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(presets.rare_earths || []).map((ticker: string) => (
            <Card key={ticker} className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <span className="font-mono font-bold text-foreground">{ticker}</span>
                <p className="text-xs text-muted-foreground mt-1">
                  {ticker === 'MP' && 'MP Materials'}
                  {ticker === 'LYSCF' && 'Lynas Rare Earths'}
                  {ticker === 'ILHMF' && 'Iluka Resources'}
                  {ticker === 'REMX' && 'Rare Earth ETF'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center mt-8">
        {language === 'es' 
          ? 'Datos de referencia. Los ratios se calculan con precios históricos promedio.'
          : 'Reference data. Ratios are calculated with historical average prices.'}
      </p>
    </div>
  );
}
