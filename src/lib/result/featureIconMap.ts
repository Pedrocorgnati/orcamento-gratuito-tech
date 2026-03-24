import type { LucideIcon } from 'lucide-react'
import {
  BarChart2,
  Bell,
  Calendar,
  Camera,
  CreditCard,
  Database,
  FileText,
  Globe,
  LayoutDashboard,
  Lock,
  Mail,
  Map,
  MessageSquare,
  Package,
  Search,
  Settings,
  Shield,
  ShoppingCart,
  Smartphone,
  Star,
  Truck,
  Users,
  Zap,
} from 'lucide-react'

// Mapeamento de palavras-chave no nome da feature → ícone + cor
// Matching case-insensitive via includes()
const FEATURE_KEYWORD_MAP: Array<{
  keywords: string[]
  icon: LucideIcon
  color: string
}> = [
  {
    keywords: ['database', 'banco', 'db', 'storage', 'dados', 'armazenamento'],
    icon: Database,
    color: '#6366f1',
  },
  {
    keywords: ['auth', 'login', 'senha', 'acesso', 'autenticação', 'segurança', 'authentication'],
    icon: Lock,
    color: '#059669',
  },
  {
    keywords: ['payment', 'pagamento', 'checkout', 'billing', 'stripe', 'pix', 'fatura'],
    icon: CreditCard,
    color: '#d97706',
  },
  {
    keywords: ['mobile', 'app', 'ios', 'android', 'push notification'],
    icon: Smartphone,
    color: '#7c3aed',
  },
  {
    keywords: ['dashboard', 'painel', 'admin', 'analytics', 'relatório', 'report'],
    icon: LayoutDashboard,
    color: '#2563eb',
  },
  {
    keywords: ['email', 'mail', 'notificação', 'notification', 'smtp', 'mensagem eletrônica'],
    icon: Mail,
    color: '#16a34a',
  },
  {
    keywords: ['api', 'webhook', 'integration', 'integração', 'zap', 'automação', 'automation'],
    icon: Zap,
    color: '#f59e0b',
  },
  {
    keywords: ['document', 'documento', 'pdf', 'relatório', 'report', 'arquivo'],
    icon: FileText,
    color: '#64748b',
  },
  {
    keywords: ['search', 'busca', 'pesquisa', 'filtro', 'filter'],
    icon: Search,
    color: '#0891b2',
  },
  {
    keywords: ['chart', 'graph', 'gráfico', 'metrics', 'métricas', 'estatística'],
    icon: BarChart2,
    color: '#7c3aed',
  },
  {
    keywords: ['i18n', 'internacional', 'tradução', 'language', 'locale', 'idioma', 'multilingual'],
    icon: Globe,
    color: '#0284c7',
  },
  {
    keywords: ['ecommerce', 'loja', 'produto', 'cart', 'carrinho', 'shop', 'marketplace'],
    icon: ShoppingCart,
    color: '#dc2626',
  },
  {
    keywords: ['users', 'usuários', 'team', 'equipe', 'people', 'perfil', 'profile'],
    icon: Users,
    color: '#4f46e5',
  },
  {
    keywords: ['alert', 'alerta', 'bell', 'aviso', 'push'],
    icon: Bell,
    color: '#f59e0b',
  },
  {
    keywords: ['config', 'configuração', 'settings', 'preference', 'preferência'],
    icon: Settings,
    color: '#6b7280',
  },
  {
    keywords: ['permission', 'permissão', 'role', 'access control', 'controle de acesso', 'autorização'],
    icon: Shield,
    color: '#059669',
  },
  {
    keywords: ['map', 'mapa', 'location', 'localização', 'gps', 'geolocation'],
    icon: Map,
    color: '#10b981',
  },
  {
    keywords: ['image', 'imagem', 'upload', 'foto', 'media', 'mídia', 'galeria'],
    icon: Camera,
    color: '#8b5cf6',
  },
  {
    keywords: ['schedule', 'agenda', 'calendar', 'booking', 'reserva', 'agendamento'],
    icon: Calendar,
    color: '#0ea5e9',
  },
  {
    keywords: ['chat', 'message', 'mensagem', 'comment', 'comentário', 'conversa'],
    icon: MessageSquare,
    color: '#6366f1',
  },
  {
    keywords: ['product', 'produto', 'inventory', 'estoque', 'catalogo'],
    icon: Package,
    color: '#f97316',
  },
  {
    keywords: ['delivery', 'entrega', 'shipping', 'logistics', 'logística', 'frete'],
    icon: Truck,
    color: '#84cc16',
  },
]

export interface FeatureIconConfig {
  icon: LucideIcon
  color: string
}

/**
 * Retorna ícone e cor para uma feature baseado em palavras-chave no nome.
 * Matching case-insensitive, parcial (includes).
 * Fallback: Star (#f59e0b) — nunca retorna undefined.
 */
export function getFeatureIcon(featureName: string): FeatureIconConfig {
  const normalized = (featureName ?? '').toLowerCase()

  for (const entry of FEATURE_KEYWORD_MAP) {
    if (entry.keywords.some((kw) => normalized.includes(kw))) {
      return { icon: entry.icon, color: entry.color }
    }
  }

  // Fallback garantido
  return { icon: Star, color: '#f59e0b' }
}
