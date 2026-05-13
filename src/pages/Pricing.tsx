import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const LOGO_URL = "https://storage.googleapis.com/gpt-engineer-file-uploads/SwWQdnEgbuMrnR9f8RUe0qM0pTi1/uploads/1768527913536-WhatsApp Image 2026-01-15 at 11.30.09 AM.jpeg";


export default function Pricing() {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const translations = {
    en: {
      title: "Choose Your Plan",
      subtitle: "Unlock the full power of ScreenerPilot",
      monthly: "month",
      free: {
        name: "Free",
        price: "$0",
        description: "Perfect for getting started",
        features: [
          "10 AI chat messages/day",
          "Basic market data",
          "20 news requests/hour",
          "30 data requests/hour",
          "Community support"
        ],
        cta: "Current Plan"
      },
      pro: {
        name: "Pro",
        price: "$29",
        description: "For serious traders",
        features: [
          "Unlimited AI chat",
          "Real-time market snapshots",
          "200 news requests/hour",
          "300 data requests/hour",
          "Advanced indicators",
          "Priority support",
          "Early access to features"
        ],
        cta: "Upgrade to Pro"
      },
      premium: {
        name: "Premium",
        price: "$99",
        description: "For professional teams",
        features: [
          "Everything in Pro",
          "Custom indicator presets",
          "1000+ news requests/hour",
          "1500+ data requests/hour",
          "Dedicated support",
          "API access",
          "White-label options"
        ],
        cta: "Contact Sales"
      }
    },
    es: {
      title: "Elige Tu Plan",
      subtitle: "Desbloquea todo el poder de ScreenerPilot",
      monthly: "mes",
      free: {
        name: "Gratis",
        price: "$0",
        description: "Perfecto para comenzar",
        features: [
          "10 mensajes IA/día",
          "Datos básicos de mercado",
          "20 consultas de noticias/hora",
          "30 consultas de datos/hora",
          "Soporte comunitario"
        ],
        cta: "Plan Actual"
      },
      pro: {
        name: "Pro",
        price: "$29",
        description: "Para traders serios",
        features: [
          "Chat IA ilimitado",
          "Snapshots en tiempo real",
          "200 consultas de noticias/hora",
          "300 consultas de datos/hora",
          "Indicadores avanzados",
          "Soporte prioritario",
          "Acceso anticipado"
        ],
        cta: "Actualizar a Pro"
      },
      premium: {
        name: "Premium",
        price: "$99",
        description: "Para equipos profesionales",
        features: [
          "Todo lo de Pro",
          "Presets personalizados",
          "1000+ consultas noticias/hora",
          "1500+ consultas datos/hora",
          "Soporte dedicado",
          "Acceso API",
          "Opciones white-label"
        ],
        cta: "Contactar Ventas"
      }
    }
  };

  const t = translations[language];

  const plans = [
    {
      ...t.free,
      highlighted: false,
      onClick: () => navigate('/')
    },
    {
      ...t.pro,
      highlighted: true,
      onClick: () => {
        // TODO: Integrar Stripe aquí
        alert('Stripe integration coming soon!');
      }
    },
    {
      ...t.premium,
      highlighted: false,
      onClick: () => {
        window.location.href = 'mailto:sales@screenerpilot.com';
      }
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95 py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            {t.title}
          </h1>
          <p className="text-xl text-muted-foreground">
            {t.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative p-8 transition-all duration-300 hover:scale-105 ${
                plan.highlighted
                  ? 'border-primary shadow-elegant bg-gradient-to-br from-card via-card to-primary/5'
                  : 'border-border/50 bg-card/50 backdrop-blur'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-sm font-semibold rounded-full">
                  Popular
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-muted-foreground mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/{t.monthly}</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-bullish flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground/90">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={plan.onClick}
                variant={plan.highlighted ? "default" : "outline"}
                className="w-full"
                size="lg"
              >
                {plan.cta}
              </Button>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-4">
            {language === 'en' 
              ? 'All plans include 14-day money-back guarantee' 
              : 'Todos los planes incluyen garantía de 14 días'}
          </p>
          <p className="text-sm text-muted-foreground">
            {language === 'en'
              ? 'Need a custom plan? Contact us at sales@screenerpilot.com'
              : '¿Necesitas un plan personalizado? Escríbenos a sales@screenerpilot.com'}
          </p>
        </div>
      </div>
    </div>
  );
}
