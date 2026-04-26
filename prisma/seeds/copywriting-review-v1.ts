import type { PrismaClient } from '@prisma/client'
import { createSeedPrismaClient } from './_createPrismaClient'

type LocaleKey = 'pt_BR' | 'en_US' | 'es_ES' | 'it_IT'
type LocaleStringMap = Record<LocaleKey, string>
type QuestionRewrite = {
  title: LocaleStringMap
  description?: Partial<Record<LocaleKey, string | null>>
}
type OptionRewrite = {
  label: LocaleStringMap
}

const LOCALES: LocaleKey[] = ['pt_BR', 'en_US', 'es_ES', 'it_IT']

const l = (
  pt_BR: string,
  en_US: string,
  es_ES: string,
  it_IT: string
): LocaleStringMap => ({ pt_BR, en_US, es_ES, it_IT })

export const QUESTION_REWRITES: Record<string, QuestionRewrite> = {
  Q001: {
    title: l(
      'Que tipo de projeto você quer criar?',
      'What type of project do you want to build?',
      '¿Qué tipo de proyecto quieres crear?',
      'Che tipo di progetto vuoi creare?'
    ),
    description: {
      pt_BR: 'Você pode marcar mais de uma opção. Vamos combinar os escopos na estimativa.',
      en_US: 'You can pick more than one option. We will combine the scopes in the estimate.',
      es_ES: 'Puedes marcar más de una opción. Combinaremos los alcances en la estimación.',
      it_IT: 'Puoi scegliere più di un’opzione. Uniremo gli scope nella stima.',
    },
  },
  Q005: {
    title: l(
      'Em que momento está o seu negócio?',
      'What stage is your business in?',
      '¿En qué etapa está tu negocio?',
      'In che fase si trova il tuo business?'
    ),
    description: {
      pt_BR: 'Essa pergunta ajuda na parte comercial. Ela não muda a complexidade técnica.',
      en_US: 'This question helps on the commercial side. It does not change technical complexity.',
      es_ES: 'Esta pregunta ayuda en la parte comercial. No cambia la complejidad técnica.',
      it_IT: 'Questa domanda aiuta sul lato commerciale. Non cambia la complessità tecnica.',
    },
  },
  Q010: { title: l('Quantas páginas o seu site vai ter?', 'How many pages will your site have?', '¿Cuántas páginas tendrá tu sitio?', 'Quante pagine avrà il tuo sito?') },
  Q011: { title: l('Como você quer atualizar o conteúdo do site?', 'How do you want to update the site content?', '¿Cómo quieres actualizar el contenido del sitio?', 'Come vuoi aggiornare i contenuti del sito?') },
  Q012: { title: l('Como você quer receber contatos pelo site?', 'How do you want to collect contacts on the site?', '¿Cómo quieres recibir contactos por el sitio?', 'Come vuoi ricevere contatti dal sito?') },
  Q013: { title: l('O site precisa ter mais de um idioma?', 'Does the site need more than one language?', '¿El sitio necesita más de un idioma?', 'Il sito deve avere più di una lingua?') },
  Q014: { title: l('Quanto destaque visual você quer no site?', 'How much visual polish do you want on the site?', '¿Cuánto destaque visual quieres en el sitio?', 'Quanto impatto visivo vuoi nel sito?') },
  Q015: { title: l('Quanto o site precisa ajudar no Google?', 'How much should the site help with Google search?', '¿Cuánto debe ayudar el sitio en Google?', 'Quanto il sito deve aiutare su Google?') },
  Q016: { title: l('Como você quer medir acessos e conversões?', 'How do you want to track visits and conversions?', '¿Cómo quieres medir visitas y conversiones?', 'Come vuoi misurare visite e conversioni?') },
  Q017: { title: l('Qual nível de velocidade o site precisa ter?', 'How fast does the site need to be?', '¿Qué nivel de velocidad debe tener el sitio?', 'Che livello di velocità deve avere il sito?') },
  Q020: { title: l('Quantos produtos sua loja vai ter no começo?', 'How many products will your store have at launch?', '¿Cuántos productos tendrá tu tienda al inicio?', 'Quanti prodotti avrà il tuo negozio all’inizio?') },
  Q021: { title: l('Como você quer receber pagamentos na loja?', 'How do you want to accept payments in the store?', '¿Cómo quieres cobrar en la tienda?', 'Come vuoi ricevere i pagamenti nello store?') },
  Q022: { title: l('A loja precisa conversar com estoque ou gestão?', 'Does the store need to connect with inventory or management tools?', '¿La tienda necesita conectarse con stock o gestión?', 'Lo store deve collegarsi a estoque o gestione?') },
  Q023: { title: l('Você quer uma área do cliente na loja?', 'Do you want a customer area in the store?', '¿Quieres un área de cliente en la tienda?', 'Vuoi un’area cliente nello store?') },
  Q024: { title: l('A loja vai usar cupons ou fidelidade?', 'Will the store use coupons or loyalty features?', '¿La tienda va a usar cupones o fidelización?', 'Lo store userà coupon o fidelizzazione?') },
  Q025: { title: l('Como o frete deve funcionar na loja?', 'How should shipping work in the store?', '¿Cómo debe funcionar el envío en la tienda?', 'Come deve funzionare la spedizione nello store?') },
  Q026: { title: l('Quanto da parte fiscal a loja precisa cobrir?', 'How much tax handling should the store cover?', '¿Cuánto de la parte fiscal debe cubrir la tienda?', 'Quanto della parte fiscale deve coprire lo store?') },
  Q027: { title: l('A loja também vai vender em marketplaces?', 'Will the store also sell on marketplaces?', '¿La tienda también venderá en marketplaces?', 'Lo store venderà anche nei marketplace?') },
  Q030: { title: l('Como o acesso ao sistema deve funcionar?', 'How should access to the system work?', '¿Cómo debe funcionar el acceso al sistema?', 'Come deve funzionare l’accesso al sistema?') },
  Q031: { title: l('O sistema precisa de painéis e relatórios?', 'Does the system need dashboards and reports?', '¿El sistema necesita paneles e informes?', 'Il sistema ha bisogno di dashboard e report?') },
  Q032: { title: l('Com quantas integrações externas o sistema vai contar?', 'How many external integrations will the system need?', '¿Con cuántas integraciones externas contará el sistema?', 'Con quante integrazioni esterne dovrà lavorare il sistema?') },
  Q033: { title: l('Como o sistema vai lidar com arquivos?', 'How will the system handle files?', '¿Cómo manejará archivos el sistema?', 'Come gestirà i file il sistema?') },
  Q034: { title: l('Como o sistema vai avisar as pessoas?', 'How will the system notify people?', '¿Cómo avisará el sistema a las personas?', 'Come avviserà le persone il sistema?') },
  Q035: { title: l('O sistema precisa cobrar ou faturar?', 'Does the system need billing or invoicing?', '¿El sistema necesita cobrar o facturar?', 'Il sistema deve gestire incassi o fatturazione?') },
  Q036: { title: l('O sistema precisa funcionar sem internet?', 'Does the system need to work offline?', '¿El sistema necesita funcionar sin internet?', 'Il sistema deve funzionare senza internet?') },
  Q037: { title: l('Você precisa de atualizações em tempo real?', 'Do you need real-time updates?', '¿Necesitas actualizaciones en tiempo real?', 'Ti servono aggiornamenti in tempo reale?') },
  Q038: { title: l('Que tipo de busca o sistema precisa ter?', 'What kind of search should the system have?', '¿Qué tipo de búsqueda necesita el sistema?', 'Che tipo di ricerca deve avere il sistema?') },
  Q039: { title: l('Para quem esse sistema vai ser usado?', 'Who will this system be for?', '¿Para quién será este sistema?', 'Per chi sarà usato questo sistema?') },
  Q040: { title: l('O sistema precisa registrar ações e mudanças?', 'Does the system need to record actions and changes?', '¿El sistema necesita registrar acciones y cambios?', 'Il sistema deve registrare azioni e cambiamenti?') },
  Q041: { title: l('Como você quer exportar os dados?', 'How do you want to export the data?', '¿Cómo quieres exportar los datos?', 'Come vuoi esportare i dati?') },
  Q042: { title: l('Quantas pessoas podem usar o sistema ao mesmo tempo?', 'How many people may use the system at the same time?', '¿Cuántas personas pueden usar el sistema al mismo tiempo?', 'Quante persone possono usare il sistema nello stesso momento?') },
  Q043: { title: l('Há exigências formais de segurança ou privacidade?', 'Are there formal security or privacy requirements?', '¿Hay requisitos formales de seguridad o privacidad?', 'Ci sono requisiti formali di sicurezza o privacy?') },
  Q044: { title: l('Qual proteção contra perda de dados você espera?', 'What level of protection against data loss do you expect?', '¿Qué protección contra pérdida de datos esperas?', 'Che protezione dalla perdita di dati ti aspetti?') },
  Q045: { title: l('Em quais celulares o app vai rodar?', 'Which phones will the app run on?', '¿En qué celulares va a funcionar la app?', 'Su quali telefoni girerà l’app?') },
  Q046: { title: l('Como você quer construir o app?', 'How do you want to build the app?', '¿Cómo quieres construir la app?', 'Come vuoi costruire l’app?') },
  Q047: { title: l('O app precisa mandar notificações?', 'Does the app need to send notifications?', '¿La app necesita enviar notificaciones?', 'L’app deve inviare notifiche?') },
  Q048: { title: l('O app precisa funcionar sem internet?', 'Does the app need to work offline?', '¿La app necesita funcionar sin internet?', 'L’app deve funzionare senza internet?') },
  Q049: { title: l('O app vai usar recursos do celular?', 'Will the app use phone hardware features?', '¿La app va a usar recursos del celular?', 'L’app userà risorse del telefono?') },
  Q050: { title: l('Como a automação ou IA vai ajudar você?', 'How will automation or AI help you?', '¿Cómo te ayudará la automatización o la IA?', 'Come ti aiuteranno automazione o IA?') },
  Q051: { title: l('De onde vão vir os dados da solução?', 'Where will the solution data come from?', '¿De dónde vendrán los datos de la solución?', 'Da dove arriveranno i dati della soluzione?') },
  Q052: { title: l('Onde essa inteligência vai aparecer?', 'Where will that intelligence show up?', '¿Dónde aparecerá esa inteligencia?', 'Dove apparirà questa intelligenza?') },
  Q053: { title: l('Você quer ajuda para publicar o app nas lojas?', 'Do you want help publishing the app to the stores?', '¿Quieres ayuda para publicar la app en las tiendas?', 'Vuoi aiuto per pubblicare l’app negli store?') },
  Q054: { title: l('O app precisa abrir links direto em telas?', 'Does the app need links that open specific screens?', '¿La app necesita enlaces que abran pantallas específicas?', 'L’app deve aprire link direttamente in schermate specifiche?') },
  Q055: { title: l('Como você quer acompanhar uso e falhas do app?', 'How do you want to track app usage and failures?', '¿Cómo quieres seguir el uso y las fallas de la app?', 'Come vuoi monitorare uso e problemi dell’app?') },
  Q060: { title: l('Quanto dado a solução vai processar?', 'How much data will the solution process?', '¿Cuántos datos va a procesar la solución?', 'Quanti dati elaborerà la soluzione?') },
  Q061: { title: l('Com que frequência a solução vai rodar?', 'How often will the solution run?', '¿Con qué frecuencia se ejecutará la solución?', 'Con quale frequenza girerà la soluzione?') },
  Q062: { title: l('Como você quer usar modelos de IA?', 'How do you want to use AI models?', '¿Cómo quieres usar modelos de IA?', 'Come vuoi usare modelli di IA?') },
  Q063: { title: l('Quanto controle de custo você quer ter na IA?', 'How much cost control do you want for AI usage?', '¿Cuánto control de costo quieres tener en la IA?', 'Quanto controllo dei costi vuoi avere sull’IA?') },
  Q070: { title: l('Como o marketplace vai ganhar dinheiro?', 'How will the marketplace make money?', '¿Cómo va a ganar dinero el marketplace?', 'Come guadagnerà il marketplace?') },
  Q071: { title: l('Como a reputação vai funcionar no marketplace?', 'How should reputation work in the marketplace?', '¿Cómo funcionará la reputación en el marketplace?', 'Come funzionerà la reputazione nel marketplace?') },
  Q072: { title: l('As pessoas vão conversar dentro da plataforma?', 'Will people chat inside the platform?', '¿Las personas van a conversar dentro de la plataforma?', 'Le persone parleranno dentro la piattaforma?') },
  Q073: { title: l('Vai existir saldo ou crédito interno?', 'Will there be internal balance or credits?', '¿Habrá saldo o créditos internos?', 'Ci saranno saldo o crediti interni?') },
  Q074: { title: l('Vai existir plano premium?', 'Will there be a premium plan?', '¿Habrá un plan premium?', 'Ci sarà un piano premium?') },
  Q075: { title: l('Que tipo de ativo digital entra no projeto?', 'What kind of digital asset is part of the project?', '¿Qué tipo de activo digital entra en el proyecto?', 'Che tipo di asset digitale entra nel progetto?') },
  Q076: { title: l('Em qual rede esse projeto vai rodar?', 'Which network will this project run on?', '¿En qué red va a funcionar este proyecto?', 'Su quale rete girerà questo progetto?') },
  Q077: { title: l('Vai ter recompensas ou rendimento?', 'Will there be rewards or yield?', '¿Habrá recompensas o rendimiento?', 'Ci saranno ricompense o rendimento?') },
  Q078: { title: l('Quais carteiras o projeto precisa aceitar?', 'Which wallets should the project support?', '¿Qué billeteras debe aceptar el proyecto?', 'Quali wallet deve supportare il progetto?') },
  Q079: { title: l('Que nível de validação e conformidade você precisa?', 'What level of validation and compliance do you need?', '¿Qué nivel de validación y cumplimiento necesitas?', 'Che livello di verifica e conformità ti serve?') },
  Q080: { title: l('Em quais navegadores a extensão vai funcionar?', 'Which browsers should the extension support?', '¿En qué navegadores funcionará la extensión?', 'Su quali browser deve funzionare l’estensione?') },
  Q081: { title: l('Quanto a extensão vai interagir com sites?', 'How deeply will the extension interact with websites?', '¿Cuánto va a interactuar la extensión con sitios web?', 'Quanto l’estensione interagirà con i siti?') },
  Q082: { title: l('Você quer publicar nas lojas de extensões?', 'Do you want to publish it to extension stores?', '¿Quieres publicarla en las tiendas de extensiones?', 'Vuoi pubblicarla negli store delle estensioni?') },
  Q083: { title: l('A extensão precisa sincronizar com sua conta?', 'Does the extension need to sync with your account?', '¿La extensión necesita sincronizar con tu cuenta?', 'L’estensione deve sincronizzarsi con il tuo account?') },
  Q090: {
    title: l(
      'Qual faixa de investimento faz sentido hoje?',
      'What budget range makes sense today?',
      '¿Qué rango de inversión tiene sentido hoy?',
      'Quale fascia di investimento ha senso oggi?'
    ),
    description: {
      pt_BR: 'Isso ajuda no alinhamento comercial. Não muda a base técnica da estimativa.',
      en_US: 'This helps with commercial alignment. It does not change the technical estimate base.',
      es_ES: 'Esto ayuda en el alineamiento comercial. No cambia la base técnica de la estimación.',
      it_IT: 'Questo aiuta nell’allineamento commerciale. Non cambia la base tecnica della stima.',
    },
  },
  Q091: { title: l('Quando você quer colocar isso no ar?', 'When do you want this to go live?', '¿Cuándo quieres poner esto en marcha?', 'Quando vuoi mettere tutto online?') },
  Q092: { title: l('Como está a parte visual do projeto?', 'What is the visual side of the project like right now?', '¿Cómo está la parte visual del proyecto?', 'Com’è la parte visiva del progetto oggi?') },
  Q093: { title: l('Como você quer receber a entrega do projeto?', 'How do you want the project handoff to happen?', '¿Cómo quieres recibir la entrega del proyecto?', 'Come vuoi ricevere la consegna del progetto?') },
  Q094: { title: l('Quanto teste automatizado você espera?', 'How much automated testing do you expect?', '¿Cuánto testing automatizado esperas?', 'Quanto testing automatizzato ti aspetti?') },
  Q095: { title: l('Como a entrega técnica precisa acontecer?', 'How should the technical delivery happen?', '¿Cómo debe ocurrir la entrega técnica?', 'Come deve avvenire la consegna tecnica?') },
  Q100: { title: l('Como podemos chamar você?', 'What should we call you?', '¿Cómo podemos llamarte?', 'Come possiamo chiamarti?') },
  Q101: { title: l('Qual é o seu melhor e-mail?', 'What is your best email?', '¿Cuál es tu mejor correo?', 'Qual è la tua email migliore?') },
  Q102: { title: l('Qual é o seu telefone? (opcional)', 'What is your phone number? (optional)', '¿Cuál es tu teléfono? (opcional)', 'Qual è il tuo telefono? (opzionale)') },
  Q103: { title: l('Qual é o nome da sua empresa? (opcional)', 'What is your company name? (optional)', '¿Cuál es el nombre de tu empresa? (opcional)', 'Qual è il nome della tua azienda? (opzionale)') },
  Q104: { title: l('Como você nos conheceu?', 'How did you hear about us?', '¿Cómo supiste de nosotros?', 'Come ci hai conosciuti?') },
  Q105: { title: l('Quer deixar mais algum detalhe?', 'Do you want to leave any extra detail?', '¿Quieres dejar algún detalle más?', 'Vuoi lasciare qualche dettaglio in più?') },
}

export const OPTION_REWRITES: Record<string, OptionRewrite> = {
  'Q005:1': { label: l('Empresa em operação', 'Operating company', 'Empresa en operación', 'Azienda já operativa') },
  'Q005:2': { label: l('Startup ou ideia em validação', 'Startup or idea being validated', 'Startup o idea en validación', 'Startup o idea in validazione') },
  'Q005:3': { label: l('Profissional autônomo', 'Independent professional', 'Profesional independiente', 'Professionista autonomo') },
  'Q005:4': { label: l('Empresa grande ou grupo', 'Large company or group', 'Empresa grande o grupo', 'Azienda grande o gruppo') },
  'Q011:1': { label: l('Páginas fixas', 'Fixed pages', 'Páginas fijas', 'Pagine fisse') },
  'Q011:2': { label: l('Blog simples', 'Simple blog', 'Blog simple', 'Blog semplice') },
  'Q011:3': { label: l('Área de conteúdo com painel', 'Content area with admin panel', 'Área de contenido con panel', 'Area contenuti con pannello') },
  'Q012:2': { label: l('Um formulário simples', 'One simple form', 'Un formulario simple', 'Un modulo semplice') },
  'Q012:3': { label: l('Vários formulários com ferramenta comercial', 'Multiple forms with sales tool integration', 'Varios formularios con herramienta comercial', 'Più moduli con strumento commerciale') },
  'Q014:1': { label: l('Visual mais simples', 'Simpler visual style', 'Visual más simple', 'Look più semplice') },
  'Q014:2': { label: l('Animações leves', 'Light animations', 'Animaciones leves', 'Animazioni leggere') },
  'Q014:3': { label: l('Interações visuais marcantes', 'Striking visual interactions', 'Interacciones visuales llamativas', 'Interazioni visive d’impatto') },
  'Q015:1': { label: l('Só o essencial', 'Just the essentials', 'Solo lo esencial', 'Solo l’essenziale') },
  'Q015:2': { label: l('Boa base para aparecer no Google', 'A solid base to show up on Google', 'Una buena base para aparecer en Google', 'Una buona base per apparire su Google') },
  'Q015:3': { label: l('Estrutura completa para busca orgânica', 'Full setup for organic search', 'Estructura completa para búsqueda orgánica', 'Struttura completa per la ricerca organica') },
  'Q016:1': { label: l('Só o básico', 'Only the basics', 'Solo lo básico', 'Solo il básico') },
  'Q016:2': { label: l('Medição simples de acessos', 'Simple traffic tracking', 'Medición simple de visitas', 'Misurazione semplice delle visite') },
  'Q016:3': { label: l('Medição completa de campanhas e conversões', 'Full campaign and conversion tracking', 'Medición completa de campañas y conversiones', 'Misurazione completa di campagne e conversioni') },
  'Q017:1': { label: l('Boa experiência, sem meta rígida', 'Good experience, no strict target', 'Buena experiencia, sin meta rígida', 'Buona esperienza, senza obiettivo rigido') },
  'Q017:2': { label: l('Site rápido em celular e computador', 'Fast on mobile and desktop', 'Sitio rápido en celular y ordenador', 'Sito veloce su mobile e desktop') },
  'Q017:3': { label: l('Meta alta de performance', 'High performance target', 'Meta alta de rendimiento', 'Obiettivo alto di performance') },
  'Q021:1': { label: l('Catálogo ou venda por atendimento', 'Catalog or assisted sales', 'Catálogo o venta asistida', 'Catalogo o vendita assistita') },
  'Q021:2': { label: l('PIX e cartão com um provedor', 'PIX and cards with one provider', 'PIX y tarjeta con un proveedor', 'PIX e carte con un provider') },
  'Q021:3': { label: l('Vários meios de pagamento', 'Multiple payment methods', 'Varios medios de pago', 'Più metodi di pagamento') },
  'Q022:1': { label: l('Sem integração', 'No integration', 'Sin integración', 'Nessuna integrazione') },
  'Q022:2': { label: l('Integração simples com estoque ou gestão', 'Simple inventory or management integration', 'Integración simple con stock o gestión', 'Integrazione semplice con magazzino o gestione') },
  'Q022:3': { label: l('Integração completa com operação interna', 'Full integration with internal operations', 'Integración completa con la operación interna', 'Integrazione completa con l’operazione interna') },
  'Q023:2': { label: l('Área básica com pedidos', 'Basic customer area with orders', 'Área básica con pedidos', 'Area cliente base con ordini') },
  'Q023:3': { label: l('Área completa com benefícios', 'Full customer area with perks', 'Área completa con beneficios', 'Area cliente completa con vantaggi') },
  'Q024:2': { label: l('Só cupons', 'Coupons only', 'Solo cupones', 'Solo coupon') },
  'Q024:3': { label: l('Cupons e fidelidade', 'Coupons and loyalty', 'Cupones y fidelización', 'Coupon e fidelizzazione') },
  'Q025:1': { label: l('Regra fixa ou retirada', 'Fixed rule or pickup', 'Regla fija o retiro', 'Regola fissa o ritiro') },
  'Q025:2': { label: l('Uma transportadora principal', 'One main shipping carrier', 'Una transportista principal', 'Un corriere principale') },
  'Q025:3': { label: l('Várias transportadoras e regras', 'Multiple carriers and rules', 'Varias transportistas y reglas', 'Più corrieri e regole') },
  'Q026:1': { label: l('Sem fiscal integrado por agora', 'No tax automation for now', 'Sin fiscal integrado por ahora', 'Senza fiscale integrato per ora') },
  'Q026:2': { label: l('Fiscal básico', 'Basic tax handling', 'Fiscal básico', 'Fiscale básico') },
  'Q026:3': { label: l('Fiscal completo', 'Full tax handling', 'Fiscal completo', 'Fiscale completo') },
  'Q027:2': { label: l('Sim, em um marketplace', 'Yes, on one marketplace', 'Sí, en un marketplace', 'Sì, in un marketplace') },
  'Q027:3': { label: l('Sim, em vários marketplaces', 'Yes, on multiple marketplaces', 'Sí, en varios marketplaces', 'Sì, in più marketplace') },
  'Q030:1': { label: l('Sem login', 'No login', 'Sin login', 'Senza login') },
  'Q030:2': { label: l('Login simples', 'Simple login', 'Login simple', 'Login semplice') },
  'Q030:3': { label: l('Perfis e permissões avançadas', 'Advanced roles and permissions', 'Perfiles y permisos avanzados', 'Ruoli e permessi avanzati') },
  'Q031:1': { label: l('Não precisa', 'Not needed', 'No hace falta', 'Non serve') },
  'Q031:2': { label: l('Painéis básicos', 'Basic dashboards', 'Paneles básicos', 'Dashboard di base') },
  'Q031:3': { label: l('Painéis completos e relatórios', 'Full dashboards and reports', 'Paneles completos e informes', 'Dashboard completi e report') },
  'Q032:1': { label: l('Nenhuma integração', 'No integrations', 'Ninguna integración', 'Nessuna integrazione') },
  'Q032:2': { label: l('Poucas integrações', 'A few integrations', 'Pocas integraciones', 'Poche integrazioni') },
  'Q032:3': { label: l('Muitas integrações', 'Many integrations', 'Muchas integraciones', 'Molte integrazioni') },
  'Q033:1': { label: l('Sem envio de arquivos', 'No file uploads', 'Sin carga de archivos', 'Senza caricamento file') },
  'Q033:2': { label: l('Envio simples de arquivos', 'Simple file uploads', 'Carga simple de archivos', 'Upload semplice di file') },
  'Q033:3': { label: l('Envio com tratamento automático', 'Uploads with automatic processing', 'Carga con procesamiento automático', 'Upload con elaborazione automatica') },
  'Q034:1': { label: l('Sem avisos automáticos', 'No automatic notifications', 'Sin avisos automáticos', 'Senza notifiche automatiche') },
  'Q034:2': { label: l('Avisos por e-mail', 'Email notifications', 'Avisos por correo', 'Avvisi via email') },
  'Q034:3': { label: l('Avisos por vários canais', 'Notifications across several channels', 'Avisos por varios canales', 'Notifiche su più canali') },
  'Q035:1': { label: l('Não precisa', 'Not needed', 'No hace falta', 'Non serve') },
  'Q035:2': { label: l('Cobrança básica', 'Basic billing', 'Cobro básico', 'Fatturazione base') },
  'Q035:3': { label: l('Cobrança e faturamento completos', 'Full billing and invoicing', 'Cobro y facturación completos', 'Incassi e fatturazione completi') },
  'Q036:1': { label: l('Só com internet', 'Online only', 'Solo con internet', 'Solo con internet') },
  'Q036:2': { label: l('Funciona um pouco sem internet', 'Partly works offline', 'Funciona un poco sin internet', 'Funziona in parte offline') },
  'Q036:3': { label: l('Funciona bem sem internet', 'Works well offline', 'Funciona bien sin internet', 'Funziona bene offline') },
  'Q037:1': { label: l('Não precisa', 'Not needed', 'No hace falta', 'Non serve') },
  'Q037:2': { label: l('Avisos rápidos ou chat', 'Fast updates or chat', 'Avisos rápidos o chat', 'Avvisi rapidi o chat') },
  'Q037:3': { label: l('Colaboração em tempo real', 'Real-time collaboration', 'Colaboración en tiempo real', 'Collaborazione in tempo reale') },
  'Q038:2': { label: l('Busca com filtros', 'Search with filters', 'Búsqueda con filtros', 'Ricerca con filtri') },
  'Q038:3': { label: l('Busca avançada em muito conteúdo', 'Advanced search across lots of content', 'Búsqueda avanzada en mucho contenido', 'Ricerca avanzata su molti contenuti') },
  'Q039:1': { label: l('Para uma empresa só', 'For one company only', 'Para una sola empresa', 'Per una sola azienda') },
  'Q039:2': { label: l('Para vários clientes', 'For multiple clients', 'Para varios clientes', 'Per più clienti') },
  'Q039:3': { label: l('Para vários clientes com marca própria', 'For multiple clients with custom branding', 'Para varios clientes con marca propia', 'Per più clienti con marchio personalizzato') },
  'Q040:1': { label: l('Sem histórico detalhado', 'No detailed history', 'Sin historial detallado', 'Senza storico dettagliato') },
  'Q040:2': { label: l('Histórico básico', 'Basic history', 'Historial básico', 'Storico di base') },
  'Q040:3': { label: l('Histórico completo', 'Full audit history', 'Historial completo', 'Storico completo') },
  'Q041:2': { label: l('Planilha simples', 'Simple spreadsheet export', 'Planilla simple', 'Esportazione semplice') },
  'Q041:3': { label: l('Vários formatos', 'Several export formats', 'Varios formatos', 'Più formati') },
  'Q042:1': { label: l('Pouca gente ao mesmo tempo', 'Low simultaneous usage', 'Poca gente al mismo tiempo', 'Poche persone insieme') },
  'Q042:2': { label: l('Uso médio ao mesmo tempo', 'Medium simultaneous usage', 'Uso medio al mismo tiempo', 'Uso medio nello stesso momento') },
  'Q042:3': { label: l('Uso alto ou picos fortes', 'High usage or big spikes', 'Uso alto o picos fuertes', 'Uso alto o picchi forti') },
  'Q043:1': { label: l('Só o básico', 'Only the basics', 'Solo lo básico', 'Solo il básico') },
  'Q043:2': { label: l('Privacidade e segurança básicas', 'Basic privacy and security controls', 'Privacidad y seguridad básicas', 'Privacy e sicurezza di base') },
  'Q043:3': { label: l('Regras formais mais rígidas', 'Stricter formal requirements', 'Reglas formales más exigentes', 'Requisiti formali più rigidi') },
  'Q044:1': { label: l('Proteção padrão', 'Standard protection', 'Protección estándar', 'Protezione standard') },
  'Q044:2': { label: l('Backup com teste de restauração', 'Backups with restore testing', 'Backup con prueba de restauración', 'Backup con test di ripristino') },
  'Q044:3': { label: l('Plano forte de recuperação', 'Strong recovery plan', 'Plan fuerte de recuperación', 'Piano forte di recupero') },
  'Q046:1': { label: l('Uma base para lançar mais rápido', 'One codebase to launch faster', 'Una base para lanzar más rápido', 'Una base per lanciare più in fretta') },
  'Q046:2': { label: l('Um app para cada plataforma', 'A separate app for each platform', 'Una app para cada plataforma', 'Un’app per ogni piattaforma') },
  'Q047:1': { label: l('Não precisa', 'Not needed', 'No hace falta', 'Non serve') },
  'Q047:2': { label: l('Avisos básicos', 'Basic notifications', 'Avisos básicos', 'Notifiche di base') },
  'Q047:3': { label: l('Avisos segmentados', 'Segmented notifications', 'Avisos segmentados', 'Notifiche segmentate') },
  'Q048:1': { label: l('Só com internet', 'Online only', 'Solo con internet', 'Solo con internet') },
  'Q048:2': { label: l('Funciona um pouco sem internet', 'Partly works offline', 'Funciona un poco sin internet', 'Funziona in parte offline') },
  'Q048:3': { label: l('Funciona bem sem internet', 'Works well offline', 'Funciona bien sin internet', 'Funziona bene offline') },
  'Q049:1': { label: l('Não usa recursos do celular', 'Does not use phone hardware', 'No usa recursos del celular', 'Non usa risorse del telefono') },
  'Q049:2': { label: l('Usa câmera ou localização', 'Uses camera or location', 'Usa cámara o ubicación', 'Usa fotocamera o posizione') },
  'Q049:3': { label: l('Usa recursos avançados do aparelho', 'Uses advanced device features', 'Usa recursos avanzados del dispositivo', 'Usa funzioni avanzate del dispositivo') },
  'Q050:1': { label: l('Automatizar tarefas', 'Automate tasks', 'Automatizar tareas', 'Automatizzare attività') },
  'Q050:2': { label: l('Conversar, resumir ou gerar conteúdo', 'Chat, summarize, or generate content', 'Conversar, resumir o generar contenido', 'Conversare, riassumere o generare contenuti') },
  'Q050:3': { label: l('Analisar dados e encontrar padrões', 'Analyze data and find patterns', 'Analizar datos y encontrar patrones', 'Analizzare dati e trovare pattern') },
  'Q051:1': { label: l('Dados do próprio sistema', 'Data from your own system', 'Datos del propio sistema', 'Dati del sistema stesso') },
  'Q051:2': { label: l('Dados vindos de fora', 'Data coming from external tools', 'Datos que vienen de fuera', 'Dati che arrivano dall’esterno') },
  'Q051:3': { label: l('Várias fontes ao mesmo tempo', 'Several sources at once', 'Varias fuentes al mismo tiempo', 'Più fonti insieme') },
  'Q052:1': { label: l('Como um serviço separado', 'As a separate service', 'Como un servicio separado', 'Come servizio separato') },
  'Q052:2': { label: l('Dentro do produto', 'Inside the product', 'Dentro del producto', 'Dentro il prodotto') },
  'Q052:3': { label: l('Em um fluxo completo de dados', 'In a full data workflow', 'En un flujo completo de datos', 'In un flusso completo di dati') },
  'Q053:1': { label: l('Não, meu time publica', 'No, my team will publish it', 'No, mi equipo la publica', 'No, il mio team la pubblica') },
  'Q053:2': { label: l('Sim, em uma loja', 'Yes, in one store', 'Sí, en una tienda', 'Sì, in uno store') },
  'Q053:3': { label: l('Sim, nas duas lojas', 'Yes, in both stores', 'Sí, en las dos tiendas', 'Sì, in entrambi gli store') },
  'Q054:1': { label: l('Não precisa', 'Not needed', 'No hace falta', 'Non serve') },
  'Q054:2': { label: l('Links simples para telas específicas', 'Simple links to specific screens', 'Enlaces simples a pantallas específicas', 'Link semplici verso schermate specifiche') },
  'Q054:3': { label: l('Links com regras de acesso e jornada', 'Links with access and journey rules', 'Enlaces con reglas de acceso y recorrido', 'Link con regole di accesso e percorso') },
  'Q055:1': { label: l('Sem medição dedicada por agora', 'No dedicated tracking for now', 'Sin medición dedicada por ahora', 'Senza misurazione dedicata per ora') },
  'Q055:2': { label: l('Medição básica do app', 'Basic app tracking', 'Medición básica de la app', 'Misurazione básica dell’app') },
  'Q055:3': { label: l('Medição completa e alertas de falha', 'Full tracking and crash alerts', 'Medición completa y alertas de fallas', 'Misurazione completa e avvisi di errore') },
  'Q060:1': { label: l('Pouco dado', 'Low data volume', 'Pocos datos', 'Pochi dati') },
  'Q060:2': { label: l('Volume médio', 'Medium data volume', 'Volumen medio', 'Volume medio') },
  'Q060:3': { label: l('Muito dado ou arquivos grandes', 'Large data volume or big files', 'Muchos datos o archivos grandes', 'Molti dati o file grandi') },
  'Q061:1': { label: l('De vez em quando', 'Occasionally', 'De vez en cuando', 'Ogni tanto') },
  'Q061:2': { label: l('Todo dia ou em lotes', 'Daily or in batches', 'A diario o por lotes', 'Ogni giorno o a lotti') },
  'Q061:3': { label: l('Quase em tempo real', 'Near real time', 'Casi en tiempo real', 'Quasi in tempo reale') },
  'Q062:1': { label: l('Sem IA generativa', 'No generative AI', 'Sin IA generativa', 'Senza IA generativa') },
  'Q062:2': { label: l('Um provedor principal de IA', 'One main AI provider', 'Un proveedor principal de IA', 'Un provider principale di IA') },
  'Q062:3': { label: l('Mais de um provedor ou modelo próprio', 'More than one provider or a self-hosted model', 'Más de un proveedor o modelo propio', 'Più di un provider o modello gestito internamente') },
  'Q063:1': { label: l('Uso baixo, com controle manual', 'Low usage with manual control', 'Uso bajo con control manual', 'Uso basso con controllo manuale') },
  'Q063:2': { label: l('Uso moderado com alertas', 'Moderate usage with alerts', 'Uso moderado con alertas', 'Uso moderato con alert') },
  'Q063:3': { label: l('Uso alto com otimização contínua', 'High usage with ongoing optimization', 'Uso alto con optimización continua', 'Uso alto con ottimizzazione continua') },
  'Q070:1': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q070:2': { label: l('Comissão por venda', 'Commission per sale', 'Comisión por venta', 'Commissione per vendita') },
  'Q070:3': { label: l('Comissão com regras extras', 'Commission with extra payout rules', 'Comisión con reglas extra', 'Commissione con regole extra') },
  'Q071:1': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q071:2': { label: l('Avaliação simples', 'Simple rating', 'Valoración simple', 'Valutazione semplice') },
  'Q071:3': { label: l('Reputação completa com moderação', 'Full reputation with moderation', 'Reputación completa con moderación', 'Reputazione completa con moderazione') },
  'Q072:1': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q072:2': { label: l('Conversa simples após pedido', 'Simple chat after order or match', 'Conversación simple tras pedido', 'Chat semplice dopo ordine o match') },
  'Q072:3': { label: l('Chat completo em tempo real', 'Full real-time chat', 'Chat completo en tiempo real', 'Chat completo in tempo reale') },
  'Q073:1': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q073:2': { label: l('Créditos simples', 'Simple credits', 'Créditos simples', 'Crediti semplici') },
  'Q073:3': { label: l('Saldo interno com regras', 'Internal balance with rules', 'Saldo interno con reglas', 'Saldo interno con regole') },
  'Q074:1': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q074:2': { label: l('Um plano premium simples', 'One simple premium plan', 'Un plan premium simple', 'Un piano premium semplice') },
  'Q074:3': { label: l('Planos com níveis e benefícios', 'Tiered plans with benefits', 'Planes con niveles y beneficios', 'Piani con livelli e vantaggi') },
  'Q075:1': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q075:2': { label: l('Um token simples ou NFT', 'A simple token or NFT', 'Un token simple o NFT', 'Un token semplice o NFT') },
  'Q075:3': { label: l('Mais de um ativo ou regras avançadas', 'Multiple assets or advanced rules', 'Varios activos o reglas avanzadas', 'Più asset o regole avanzate') },
  'Q076:1': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q076:2': { label: l('Uma rede principal', 'One main network', 'Una red principal', 'Una rete principale') },
  'Q076:3': { label: l('Várias redes ou rede especializada', 'Several networks or a specialized one', 'Varias redes o una red especializada', 'Più reti o una rete specializzata') },
  'Q077:1': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q077:2': { label: l('Recompensas simples', 'Simple rewards', 'Recompensas simples', 'Ricompense semplici') },
  'Q077:3': { label: l('Rendimento com regras on-chain', 'On-chain yield with rules', 'Rendimiento con reglas on-chain', 'Rendimento con regole on-chain') },
  'Q078:1': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q078:2': { label: l('Uma carteira principal', 'One main wallet', 'Una billetera principal', 'Un wallet principale') },
  'Q078:3': { label: l('Várias carteiras', 'Multiple wallets', 'Varias billeteras', 'Più wallet') },
  'Q079:1': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q079:2': { label: l('Termos e alertas básicos', 'Basic terms and alerts', 'Términos y alertas básicos', 'Termini e avvisi di base') },
  'Q079:3': { label: l('Validação de identidade completa', 'Full identity verification', 'Validación completa de identidad', 'Verifica completa dell’identità') },
  'Q080:1': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q080:3': { label: l('Chrome e outros navegadores', 'Chrome plus other browsers', 'Chrome y otros navegadores', 'Chrome e altri browser') },
  'Q081:1': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q081:2': { label: l('Interação simples com um site', 'Simple interaction with one site', 'Interacción simple con un sitio', 'Interazione semplice con un sito') },
  'Q081:3': { label: l('Interação avançada com vários sites', 'Advanced interaction across multiple sites', 'Interacción avanzada con varios sitios', 'Interazione avanzata con più siti') },
  'Q082:1': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q082:2': { label: l('Publicar em uma loja', 'Publish to one store', 'Publicar en una tienda', 'Pubblicare in uno store') },
  'Q082:3': { label: l('Publicar e manter em várias lojas', 'Publish and maintain across multiple stores', 'Publicar y mantener en varias tiendas', 'Pubblicare e mantenere in più store') },
  'Q083:1': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q083:2': { label: l('Sincronizar preferências', 'Sync preferences', 'Sincronizar preferencias', 'Sincronizzare preferenze') },
  'Q083:3': { label: l('Conta completa com histórico', 'Full account with history', 'Cuenta completa con historial', 'Account completo con storico') },
  'Q090:1': { label: l('Até R$ 10 mil', 'Up to US$ 10k', 'Hasta US$ 10 mil', 'Fino a US$ 10 mila') },
  'Q090:2': { label: l('De R$ 10 mil a R$ 25 mil', 'US$ 10k to US$ 25k', 'De US$ 10 mil a US$ 25 mil', 'Da US$ 10 mila a US$ 25 mila') },
  'Q090:3': { label: l('De R$ 25 mil a R$ 60 mil', 'US$ 25k to US$ 60k', 'De US$ 25 mil a US$ 60 mil', 'Da US$ 25 mila a US$ 60 mila') },
  'Q090:4': { label: l('Acima de R$ 60 mil', 'More than US$ 60k', 'Más de US$ 60 mil', 'Oltre US$ 60 mila') },
  'Q091:1': { label: l('Até 30 dias', 'Up to 30 days', 'Hasta 30 días', 'Fino a 30 giorni') },
  'Q091:2': { label: l('De 1 a 3 meses', '1 to 3 months', 'De 1 a 3 meses', 'Da 1 a 3 mesi') },
  'Q091:3': { label: l('Mais de 3 meses', 'More than 3 months', 'Más de 3 meses', 'Più di 3 mesi') },
  'Q092:1': { label: l('Já tenho o visual pronto', 'I already have the design ready', 'Ya tengo el diseño listo', 'Ho già il design pronto') },
  'Q092:2': { label: l('Preciso de uma direção visual', 'I need a basic design direction', 'Necesito una dirección visual', 'Ho bisogno di una direzione visiva') },
  'Q092:3': { label: l('Preciso de visual e marca completos', 'I need full design and branding', 'Necesito diseño y marca completos', 'Ho bisogno di design e brand completi') },
  'Q093:1': { label: l('Entrega simples', 'Simple handoff', 'Entrega simple', 'Consegna semplice') },
  'Q093:2': { label: l('Documentação básica e repasse', 'Basic documentation and handoff session', 'Documentación básica y traspaso', 'Documentazione base e handoff') },
  'Q093:3': { label: l('Documentação completa e treinamento', 'Full documentation and training', 'Documentación completa y entrenamiento', 'Documentazione completa e training') },
  'Q094:1': { label: l('Só validação manual', 'Manual checks only', 'Solo validación manual', 'Solo verifica manuale') },
  'Q094:2': { label: l('Testes nos fluxos principais', 'Tests for the main flows', 'Pruebas en los flujos principales', 'Test sui flussi principali') },
  'Q094:3': { label: l('Cobertura ampla', 'Broad automated coverage', 'Cobertura amplia', 'Copertura ampia') },
  'Q095:1': { label: l('Entrega manual e revisão simples', 'Manual delivery and lightweight review', 'Entrega manual y revisión simple', 'Consegna manuale e revisione semplice') },
  'Q095:2': { label: l('Revisão e automação básicas', 'Basic review and automation', 'Revisión y automatización básicas', 'Revisione e automazione di base') },
  'Q095:3': { label: l('Automação completa de entrega', 'Full delivery automation', 'Automatización completa de entrega', 'Automazione completa della consegna') },
  'Q104:1': { label: l('Google ou busca', 'Google or search', 'Google o búsqueda', 'Google o ricerca') },
  'Q104:3': { label: l('Indicação', 'Referral', 'Recomendación', 'Passaparola') },
  'Q104:4': { label: l('Rede social', 'Social media', 'Red social', 'Social media') },

  'Q015:4': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q016:4': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q017:4': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q025:4': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q026:4': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q027:4': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q030:4': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q031:4': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q032:4': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q033:4': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q034:4': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q035:4': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q036:4': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q037:4': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q038:4': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q039:4': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q040:4': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q041:4': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q042:4': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q043:4': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q044:4': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q046:3': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q047:4': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q048:4': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q049:4': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q050:4': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q051:4': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q052:4': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q053:4': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q054:4': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q055:4': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q060:4': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q061:4': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q062:4': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q063:4': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q092:4': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q094:4': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
  'Q095:4': { label: l('Ainda não sei', 'I am not sure yet', 'Todavía no lo sé', 'Non lo so ancora') },
}

type Counters = {
  questionsCreated: number
  questionsUpdated: number
  questionsUnchanged: number
  questionsMissing: number
  optionsCreated: number
  optionsUpdated: number
  optionsUnchanged: number
  optionsMissing: number
}

async function upsertQuestionTranslationIfNeeded(
  prisma: PrismaClient,
  questionId: string,
  locale: LocaleKey,
  rewrite: QuestionRewrite,
  counters: Counters
) {
  const existing = await prisma.questionTranslation.findUnique({
    where: { question_id_locale: { question_id: questionId, locale } },
  })

  const nextTitle = rewrite.title[locale]
  const nextDescription =
    rewrite.description && Object.prototype.hasOwnProperty.call(rewrite.description, locale)
      ? rewrite.description[locale] ?? null
      : undefined

  if (!existing) {
    await prisma.questionTranslation.create({
      data: {
        question_id: questionId,
        locale,
        title: nextTitle,
        description: nextDescription ?? null,
      },
    })
    counters.questionsCreated += 1
    return
  }

  const data: { title?: string; description?: string | null } = {}

  if (existing.title !== nextTitle) {
    data.title = nextTitle
  }

  if (nextDescription !== undefined && existing.description !== nextDescription) {
    data.description = nextDescription
  }

  if (Object.keys(data).length === 0) {
    counters.questionsUnchanged += 1
    return
  }

  await prisma.questionTranslation.update({
    where: { question_id_locale: { question_id: questionId, locale } },
    data,
  })
  counters.questionsUpdated += 1
}

async function upsertOptionTranslationIfNeeded(
  prisma: PrismaClient,
  optionId: string,
  locale: LocaleKey,
  rewrite: OptionRewrite,
  counters: Counters
) {
  const existing = await prisma.optionTranslation.findUnique({
    where: { option_id_locale: { option_id: optionId, locale } },
  })

  const nextLabel = rewrite.label[locale]

  if (!existing) {
    await prisma.optionTranslation.create({
      data: {
        option_id: optionId,
        locale,
        label: nextLabel,
      },
    })
    counters.optionsCreated += 1
    return
  }

  if (existing.label === nextLabel) {
    counters.optionsUnchanged += 1
    return
  }

  await prisma.optionTranslation.update({
    where: { option_id_locale: { option_id: optionId, locale } },
    data: { label: nextLabel },
  })
  counters.optionsUpdated += 1
}

export async function applyCopywritingReviewV1(prisma: PrismaClient) {
  const counters: Counters = {
    questionsCreated: 0,
    questionsUpdated: 0,
    questionsUnchanged: 0,
    questionsMissing: 0,
    optionsCreated: 0,
    optionsUpdated: 0,
    optionsUnchanged: 0,
    optionsMissing: 0,
  }

  console.log(
    `[copywriting:v1] iniciando revisão perguntas=${Object.keys(QUESTION_REWRITES).length} opções=${Object.keys(OPTION_REWRITES).length}`
  )

  for (const [questionCode, rewrite] of Object.entries(QUESTION_REWRITES)) {
    const question = await prisma.question.findUnique({ where: { code: questionCode } })

    if (!question) {
      counters.questionsMissing += 1
      continue
    }

    for (const locale of LOCALES) {
      await upsertQuestionTranslationIfNeeded(prisma, question.id, locale, rewrite, counters)
    }
  }

  for (const [slug, rewrite] of Object.entries(OPTION_REWRITES)) {
    const [questionCode, orderRaw] = slug.split(':')
    const order = Number(orderRaw)

    const question = await prisma.question.findUnique({ where: { code: questionCode } })
    if (!question) {
      counters.optionsMissing += 1
      continue
    }

    const option = await prisma.option.findFirst({
      where: { question_id: question.id, order },
    })

    if (!option) {
      counters.optionsMissing += 1
      continue
    }

    for (const locale of LOCALES) {
      await upsertOptionTranslationIfNeeded(prisma, option.id, locale, rewrite, counters)
    }
  }

  console.log(
    `[copywriting:v1] concluído perguntas_criadas=${counters.questionsCreated} perguntas_atualizadas=${counters.questionsUpdated} perguntas_sem_mudança=${counters.questionsUnchanged} perguntas_ausentes=${counters.questionsMissing} opções_criadas=${counters.optionsCreated} opções_atualizadas=${counters.optionsUpdated} opções_sem_mudança=${counters.optionsUnchanged} opções_ausentes=${counters.optionsMissing}`
  )

  return counters
}

async function main() {
  const prisma = createSeedPrismaClient()

  try {
    await applyCopywritingReviewV1(prisma)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('[copywriting:v1] erro', error)
    process.exit(1)
  })
}
