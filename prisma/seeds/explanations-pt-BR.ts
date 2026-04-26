import { Prisma, PrismaClient } from '@prisma/client'
import {
  OPTION_DESCRIPTIONS_V2_PATCH,
  QUESTION_HELP_TEXT_V2_PATCH,
} from './refactor-questions-v2'

const QUESTION_CODES = [
  'Q001', 'Q005',
  'Q010', 'Q011', 'Q012', 'Q013', 'Q014',
  'Q020', 'Q021', 'Q022', 'Q023', 'Q024',
  'Q030', 'Q031', 'Q032', 'Q033', 'Q034', 'Q035', 'Q036', 'Q037', 'Q038', 'Q039', 'Q040', 'Q041',
  'Q045', 'Q046', 'Q047', 'Q048', 'Q049',
  'Q050', 'Q051', 'Q052', 'Q053', 'Q054', 'Q055',
  'Q060', 'Q061', 'Q062', 'Q063',
  'Q070', 'Q071', 'Q072', 'Q073', 'Q074',
  'Q075', 'Q076', 'Q077', 'Q078', 'Q079',
  'Q080', 'Q081', 'Q082', 'Q083',
  'Q090', 'Q091', 'Q092', 'Q093', 'Q094', 'Q095',
  'Q100', 'Q101', 'Q102', 'Q103', 'Q104', 'Q105',
] as const

type QuestionCode = (typeof QUESTION_CODES)[number]

const OPTION_SLUGS = [
  'Q001:1', 'Q001:2', 'Q001:3', 'Q001:4', 'Q001:5', 'Q001:6', 'Q001:7', 'Q001:8', 'Q001:9',
  'Q005:1', 'Q005:2', 'Q005:3', 'Q005:4',
  'Q010:1', 'Q010:2', 'Q010:3',
  'Q011:1', 'Q011:2', 'Q011:3',
  'Q012:1', 'Q012:2', 'Q012:3',
  'Q013:1', 'Q013:2', 'Q013:3',
  'Q014:1', 'Q014:2', 'Q014:3',
  'Q020:1', 'Q020:2', 'Q020:3',
  'Q021:1', 'Q021:2', 'Q021:3',
  'Q022:1', 'Q022:2', 'Q022:3',
  'Q023:1', 'Q023:2', 'Q023:3',
  'Q024:1', 'Q024:2', 'Q024:3',
  'Q030:1', 'Q030:2', 'Q030:3',
  'Q031:1', 'Q031:2', 'Q031:3',
  'Q032:1', 'Q032:2', 'Q032:3',
  'Q033:1', 'Q033:2', 'Q033:3',
  'Q034:1', 'Q034:2', 'Q034:3',
  'Q035:1', 'Q035:2', 'Q035:3',
  'Q036:1', 'Q036:2', 'Q036:3',
  'Q037:1', 'Q037:2', 'Q037:3',
  'Q038:1', 'Q038:2', 'Q038:3',
  'Q039:1', 'Q039:2', 'Q039:3',
  'Q040:1', 'Q040:2', 'Q040:3',
  'Q041:1', 'Q041:2', 'Q041:3',
  'Q045:1', 'Q045:2', 'Q045:3',
  'Q046:1', 'Q046:2',
  'Q047:1', 'Q047:2', 'Q047:3',
  'Q048:1', 'Q048:2', 'Q048:3',
  'Q049:1', 'Q049:2', 'Q049:3',
  'Q050:1', 'Q050:2', 'Q050:3',
  'Q051:1', 'Q051:2', 'Q051:3',
  'Q052:1', 'Q052:2', 'Q052:3',
  'Q053:1', 'Q053:2', 'Q053:3',
  'Q054:1', 'Q054:2', 'Q054:3',
  'Q055:1', 'Q055:2', 'Q055:3',
  'Q060:1', 'Q060:2', 'Q060:3',
  'Q061:1', 'Q061:2', 'Q061:3',
  'Q062:1', 'Q062:2', 'Q062:3',
  'Q063:1', 'Q063:2', 'Q063:3',
  'Q070:1', 'Q070:2', 'Q070:3',
  'Q071:1', 'Q071:2', 'Q071:3',
  'Q072:1', 'Q072:2', 'Q072:3',
  'Q073:1', 'Q073:2', 'Q073:3',
  'Q074:1', 'Q074:2', 'Q074:3',
  'Q075:1', 'Q075:2', 'Q075:3',
  'Q076:1', 'Q076:2', 'Q076:3',
  'Q077:1', 'Q077:2', 'Q077:3',
  'Q078:1', 'Q078:2', 'Q078:3',
  'Q079:1', 'Q079:2', 'Q079:3',
  'Q080:1', 'Q080:2', 'Q080:3',
  'Q081:1', 'Q081:2', 'Q081:3',
  'Q082:1', 'Q082:2', 'Q082:3',
  'Q083:1', 'Q083:2', 'Q083:3',
  'Q090:1', 'Q090:2', 'Q090:3', 'Q090:4',
  'Q091:1', 'Q091:2', 'Q091:3',
  'Q092:1', 'Q092:2', 'Q092:3',
  'Q093:1', 'Q093:2', 'Q093:3',
  'Q094:1', 'Q094:2', 'Q094:3',
  'Q095:1', 'Q095:2', 'Q095:3',
  'Q104:1', 'Q104:2', 'Q104:3', 'Q104:4', 'Q104:5',
] as const

type OptionSlug = (typeof OPTION_SLUGS)[number]

export const QUESTION_HELP_TEXT: Record<string, string> = {
  Q001: 'Selecione um ou mais tipos de projeto. O fluxo combinará os blocos necessários e vai somar a estimativa final.',
  Q005: 'O perfil do cliente ajuda a calibrar processo, governança e velocidade esperados. Escolha o cenário mais próximo da realidade atual.',
  Q010: 'A quantidade de páginas afeta estrutura, conteúdo e tempo de montagem. Pense nas páginas principais que precisam existir já na primeira versão.',
  Q011: 'Blog ou área de conteúdo exige uma estrutura pensada para publicar e organizar textos com frequência. Se você só quer páginas fixas, a opção mais simples costuma bastar.',
  Q012: 'Formulários podem servir só para contato ou virar parte do processo comercial. Quanto mais campos, integrações e variações, maior o trabalho de implementação.',
  Q013: 'Ter mais de um idioma muda conteúdo, navegação e manutenção do site. Considere não só a tradução, mas também quem vai atualizar esses textos depois.',
  Q014: 'Efeitos visuais podem deixar a experiência mais marcante, mas também aumentam esforço de design e front-end. Escolha conforme a importância disso para sua marca.',
  Q020: 'O volume de produtos influencia cadastro, busca, filtros e desempenho da loja. Se você pretende crescer rápido, vale considerar o cenário dos próximos meses.',
  Q021: 'Pagamento é uma parte crítica do e-commerce porque afeta checkout, conciliação e experiência do cliente. Escolha conforme o nível de flexibilidade comercial que você precisa.',
  Q022: 'Integrar estoque ou ERP evita retrabalho e reduz erros operacionais. Quanto mais robusta a integração, maior tende a ser o esforço técnico.',
  Q023: 'A área do cliente pode ser algo básico para acompanhar pedidos ou um espaço mais completo de relacionamento. Pense no quanto o pós-venda faz parte da sua estratégia.',
  Q024: 'Cupons e fidelidade ajudam a vender mais, mas exigem regras e acompanhamento. Escolha de acordo com o nível de promoção que você quer operar no dia a dia.',
  Q030: 'Controle de acesso define quem entra no sistema e o que cada pessoa pode fazer. Isso impacta segurança, complexidade e gestão de usuários.',
  Q031: 'Dashboards e relatórios transformam dados em visão de negócio. Quanto mais detalhamento, filtros e formatos de saída, maior o trabalho necessário.',
  Q032: 'Integrações com APIs conectam seu sistema a ferramentas externas. Cada conexão adiciona regras, testes e manutenção.',
  Q033: 'Upload de arquivos parece simples, mas pode envolver validação, armazenamento e processamento automático. Escolha o nível que mais se aproxima do uso real.',
  Q034: 'Notificações podem ser apenas informativas ou parte importante do fluxo do produto. Canais extras aumentam alcance, mas também aumentam a complexidade.',
  Q035: 'Módulos financeiros exigem mais cuidado porque lidam com cobrança, documentos e regras de negócio. Quanto mais completo, maior a responsabilidade técnica.',
  Q036: 'Funcionar offline é útil quando o usuário pode ficar sem internet. Isso exige uma arquitetura diferente da de um sistema totalmente online.',
  Q037: 'Recursos em tempo real mudam a experiência do usuário e a infraestrutura do sistema. Use esta pergunta para indicar se a atualização imediata é essencial ou não.',
  Q038: 'Busca pode ser só uma caixa simples ou uma ferramenta poderosa de navegação. Se o usuário precisa encontrar muita informação rapidamente, vale investir mais aqui.',
  Q039: 'Multi-tenant significa atender mais de uma empresa ou cliente dentro da mesma plataforma. Isso afeta permissões, dados e arquitetura desde o começo.',
  Q040: 'Auditoria registra ações importantes dentro do sistema. Isso é especialmente útil quando há processos sensíveis, equipes maiores ou exigências de conformidade.',
  Q041: 'Exportação permite levar dados para análise, compartilhamento ou documentação. Quanto mais formatos e personalização, maior o esforço da funcionalidade.',
  Q045: 'A plataforma define alcance, custo e estratégia do app. Escolha pensando em onde seu público realmente está e no que faz sentido para o lançamento inicial.',
  Q046: 'Essa escolha equilibra velocidade de lançamento, desempenho e refinamento da experiência. Marque o que mais combina com sua prioridade.',
  Q047: 'Push pode ser opcional ou parte central do engajamento do app. Quanto mais segmentação e inteligência, mais trabalho de configuração e operação.',
  Q048: 'Uso offline melhora a experiência em cenários com internet instável. Em troca, exige sincronização e cuidado extra com os dados.',
  Q049: 'Acessar hardware do dispositivo muda permissões, testes e implementação. Escolha com base no que o app realmente precisa fazer no celular.',
  Q050: 'Automação e inteligência artificial podem atender objetivos bem diferentes. Escolha pelo resultado de negócio esperado.',
  Q051: 'A origem dos dados define a viabilidade e o esforço da solução. Mais fontes significam mais integração e preparo.',
  Q052: 'A forma de conectar a inteligência ao produto muda bastante o escopo. Pode ser algo separado, embutido ou parte de um fluxo maior.',
  Q070: 'O modelo de monetização muda regras de pagamento, repasse e conciliação. Em marketplace, essa decisão impacta o núcleo do produto.',
  Q071: 'Avaliações e reputação ajudam a gerar confiança entre os lados da plataforma. Quanto mais robusto o sistema, mais regras e moderação entram no escopo.',
  Q072: 'Chat entre usuários pode ser só uma troca simples ou virar recurso central da jornada. Isso afeta tempo real, notificações e segurança.',
  Q073: 'Moeda virtual ou créditos internos aumentam retenção, mas trazem regras de saldo, compra e uso. Vale escolher pelo nível de gamificação e controle desejado.',
  Q074: 'Assinaturas premium criam recorrência e benefícios exclusivos. Também adicionam cobrança, permissões e gestão de planos.',
  Q075: 'Projetos crypto variam muito conforme o tipo de ativo e as regras do ecossistema. Esta escolha define boa parte da complexidade técnica e regulatória.',
  Q076: 'A rede blockchain afeta custos, integrações, ferramentas e experiência do usuário. Escolha pensando em público, taxas e maturidade da stack.',
  Q077: 'Staking e rewards aumentam engajamento, mas exigem regras econômicas e operacionais mais sensíveis. É uma camada que precisa ser tratada com cuidado.',
  Q078: 'Integração com carteiras define onboarding, assinatura de transações e compatibilidade com o ecossistema. Mais wallets significam mais testes e suporte.',
  Q079: 'Compliance e KYC podem ser leves ou bastante estruturados. Isso muda fluxo de cadastro, validação de identidade e responsabilidades do projeto.',
  Q080: 'Quanto mais navegadores suportados, maior o esforço com compatibilidade e testes. Extensões costumam exigir ajustes específicos por store e engine.',
  Q081: 'Extensões podem só consumir uma API ou interferir diretamente em páginas. Integrações profundas exigem mais cuidado técnico e de manutenção.',
  Q082: 'Publicar nas stores oficiais envolve embalagem, revisão, políticas e manutenção contínua. Esse trabalho costuma ser subestimado em extensões.',
  Q083: 'Sincronizar com conta do usuário permite continuidade entre dispositivos e personalização. Em troca, entra backend, autenticação e persistência de dados.',
  Q090: 'Orçamento ajuda a calibrar a proposta para algo realista. Não precisa ser um número fechado: use a faixa que melhor representa seu limite atual.',
  Q091: 'Prazo influencia prioridades, equipe e nível de acabamento viável. Se a data for rígida, isso normalmente aumenta custo e decisões de escopo.',
  Q092: 'O estado do design impacta diretamente o tempo de descoberta e interface. Se ainda não existe nada definido, essa etapa precisará entrar no projeto.',
  Q093: 'Suporte após a entrega pode incluir correções, pequenos ajustes e acompanhamento contínuo. Isso ajuda a manter o projeto saudável depois do lançamento.',
  Q100: 'Informe o nome que prefere. Pode ser só o primeiro nome se preferir.',
  Q101: 'O email é o principal canal para enviar estimativa, próximos passos e materiais do projeto. Use um endereço que você acompanhe com frequência.',
  Q102: 'Telefone é opcional, mas pode agilizar o contato se você quiser falar mais rápido. Se preferir tratar tudo por email, pode deixar em branco.',
  Q103: 'O nome da empresa ajuda a contextualizar melhor o projeto e a proposta. Se ainda estiver validando a ideia, não tem problema deixar em branco.',
  Q104: 'Saber como você chegou até aqui ajuda a entender quais canais estão funcionando melhor. É uma informação simples, mas útil para nosso acompanhamento.',
  Q105: 'Este campo serve para complementar o que não coube nas respostas anteriores. Vale mencionar contexto, restrições, integrações ou qualquer detalhe importante.',
  ...QUESTION_HELP_TEXT_V2_PATCH,
}

export const OPTION_DESCRIPTIONS: Record<string, string> = {
  'Q001:1': 'Site com várias páginas para apresentar empresa, serviços e contato. Ideal para presença digital mais completa e profissional.',
  'Q001:2': 'Página única focada em conversão, como captar leads ou vender uma oferta específica. Costuma ser mais rápida e enxuta que um site completo.',
  'Q001:3': 'Loja virtual para vender produtos online com catálogo, carrinho e checkout. Exige mais regras operacionais do que um site institucional.',
  'Q001:4': 'Plataforma web com áreas logadas, fluxos e regras de negócio. Indicado quando o projeto vai além de páginas públicas.',
  'Q001:5': 'Aplicativo para celular, com experiência pensada para iOS, Android ou ambos. Faz sentido quando o uso principal acontece no mobile.',
  'Q001:6': 'Projeto voltado a automação de tarefas, assistentes inteligentes ou análise com IA. Bom para reduzir trabalho manual ou ganhar escala operacional.',
  'Q001:7': 'Marketplace conecta oferta e demanda em uma mesma plataforma. Costuma envolver pagamentos, reputação, moderação e regras entre usuários.',
  'Q001:8': 'Projeto crypto ou Web3 com ativos, wallets e fluxos on-chain. Exige atenção extra em segurança, integração e compliance.',
  'Q001:9': 'Extensão de navegador para automatizar ações, enriquecer páginas ou criar novas interfaces no browser. Tem desafios próprios de compatibilidade e publicação.',
  'Q005:1': 'Empresa com operação mais estruturada e processos já estabelecidos. Costuma envolver mais alinhamento com times e aprovações.',
  'Q005:2': 'Negócio em fase inicial buscando velocidade e validação. Normalmente prioriza solução enxuta e evolução rápida.',
  'Q005:3': 'Projeto tocado por uma pessoa ou profissional independente. A decisão tende a ser mais direta e objetiva.',
  'Q005:4': 'Organização com maior porte, mais áreas envolvidas e exigências corporativas. Pode demandar segurança e governança mais fortes.',
  'Q010:1': 'Estrutura enxuta, cobrindo o essencial para apresentar o negócio. Boa escolha para começar simples.',
  'Q010:2': 'Quantidade intermediária de páginas, permitindo detalhar melhor serviços, cases e conteúdos. Equilibra profundidade e custo.',
  'Q010:3': 'Site mais robusto, com arquitetura de informação maior. Exige mais planejamento de conteúdo e navegação.',
  'Q011:1': 'Sem área de publicações recorrentes. Indicado quando o conteúdo do site será mais estático.',
  'Q011:2': 'Blog com estrutura básica para publicar artigos e notícias. Atende bem a uma estratégia simples de conteúdo.',
  'Q011:3': 'Área editorial mais completa, com gestão de conteúdo e flexibilidade maior. Faz sentido para operação frequente e mais complexa.',
  'Q012:1': 'Sem captura ativa de contatos dentro do site. O projeto fica mais simples nessa parte.',
  'Q012:2': 'Formulário direto para contato ou pedido de orçamento. Resolve bem necessidades mais básicas.',
  'Q012:3': 'Vários formulários conectados a CRM ou automação comercial. Útil quando o site participa ativamente do processo de vendas.',
  'Q013:1': 'Conteúdo em um único idioma. Mais simples de publicar e manter.',
  'Q013:2': 'Versão bilíngue, comum para negócios que atendem dois públicos principais. Já exige controle de tradução e revisão.',
  'Q013:3': 'Projeto com presença internacional ou operação em vários mercados. Traz mais trabalho de conteúdo e manutenção.',
  'Q014:1': 'Visual mais direto, com foco em clareza e velocidade. Bom quando efeito visual não é prioridade.',
  'Q014:2': 'Movimentos e transições leves que enriquecem a navegação. Traz um acabamento melhor sem entrar em alta complexidade.',
  'Q014:3': 'Experiência visual mais sofisticada, com interações avançadas. Indicado quando impacto visual é parte importante do projeto.',
  'Q020:1': 'Catálogo menor e mais fácil de organizar. Bom para começar uma operação sem muita complexidade.',
  'Q020:2': 'Volume intermediário de produtos, já exigindo busca e filtros mais bem pensados. Costuma ser o cenário de muitas lojas em crescimento.',
  'Q020:3': 'Catálogo grande, com maior exigência de performance e organização. Pede uma estrutura mais robusta desde o início.',
  'Q021:1': 'Sem pagamento online dentro da loja. Pode servir para catálogo, orçamento ou vendas por atendimento.',
  'Q021:2': 'Um único meio principal de pagamento, suficiente para muitas operações. Simplifica implantação e manutenção.',
  'Q021:3': 'Mais flexibilidade comercial no checkout, com múltiplas opções e regras. Traz mais trabalho de integração e testes.',
  'Q022:1': 'Sem sincronização com sistemas externos de estoque ou gestão. A operação fica mais manual.',
  'Q022:2': 'Integração simples para reduzir retrabalho no dia a dia. Boa opção quando a operação já usa planilhas ou sistemas básicos.',
  'Q022:3': 'Integração profunda com sistemas corporativos. Indicada para operação mais madura e com maior volume.',
  'Q023:1': 'Sem espaço logado para o cliente acompanhar pedidos. O fluxo fica mais simples.',
  'Q023:2': 'Área básica para login e consulta de compras. Já melhora a experiência pós-venda.',
  'Q023:3': 'Espaço mais completo de relacionamento, retenção e recorrência. Útil para estratégias mais avançadas de e-commerce.',
  'Q024:1': 'Sem campanhas ou mecânicas de retenção nessa primeira fase. Mantém a loja mais enxuta.',
  'Q024:2': 'Promoções com cupons para estimular compra e campanhas sazonais. É uma funcionalidade comum e prática.',
  'Q024:3': 'Combina desconto com estratégia contínua de fidelização. Exige mais regras e acompanhamento.',
  'Q030:1': 'Sistema aberto, sem necessidade de login. Só faz sentido quando não há dados sensíveis nem área restrita.',
  'Q030:2': 'Acesso básico por usuário e senha. Resolve bem produtos com uma área logada simples.',
  'Q030:3': 'Perfis, permissões e login corporativo mais avançado. Indicado quando há equipes, papéis diferentes ou requisitos de segurança maiores.',
  'Q031:1': 'Sem painéis analíticos dentro do sistema. Os dados podem ser consultados de outra forma.',
  'Q031:2': 'Visão básica com indicadores e gráficos principais. Ajuda na leitura do negócio sem grande complexidade.',
  'Q031:3': 'Painéis mais ricos e relatórios formais para compartilhar ou auditar. Bom para gestão mais orientada por dados.',
  'Q032:1': 'Sistema isolado, sem depender de serviços externos. Mais simples de construir e manter.',
  'Q032:2': 'Poucas integrações, normalmente com ferramentas essenciais do processo. É um cenário comum em produtos em crescimento.',
  'Q032:3': 'Muitas conexões externas, com maior coordenação técnica. Exige mais cuidado com falhas, contratos e suporte.',
  'Q033:1': 'Sem envio de arquivos pelos usuários. O fluxo do sistema fica mais leve.',
  'Q033:2': 'Upload comum de imagens ou documentos, sem transformação complexa. Atende a maioria dos cenários operacionais.',
  'Q033:3': 'Arquivos passam por tratamento automático depois do envio. Isso aumenta valor, mas também o esforço técnico.',
  'Q034:1': 'Sem alertas automáticos para o usuário. Comunicação pode acontecer por outros canais.',
  'Q034:2': 'Avisos por email para eventos importantes. É a opção mais comum e simples de manter.',
  'Q034:3': 'Comunicação em vários canais para aumentar alcance e rapidez. Útil quando a mensagem precisa chegar de formas diferentes.',
  'Q035:1': 'Sem recursos financeiros internos. O sistema pode depender de processos externos nessa parte.',
  'Q035:2': 'Cobrança e faturamento em nível básico. Atende bem operações mais simples.',
  'Q035:3': 'Gestão financeira mais completa, com processos e documentos mais sensíveis. Pede atenção especial em regras e validações.',
  'Q036:1': 'Funciona apenas com internet disponível. É o caminho mais simples.',
  'Q036:2': 'Mantém parte da experiência mesmo sem conexão, usando cache local. Já traz ganho prático para o usuário.',
  'Q036:3': 'Permite trabalhar offline e sincronizar depois. Ideal para operações em campo ou ambientes instáveis.',
  'Q037:1': 'As atualizações podem acontecer de forma normal, sem imediatismo. Menor complexidade técnica.',
  'Q037:2': 'Há necessidade de avisos ou conversas rápidas em tempo quase real. É um meio-termo útil para vários produtos.',
  'Q037:3': 'Pessoas interagem juntas ao mesmo tempo dentro do sistema. É um cenário bem mais sofisticado.',
  'Q038:1': 'Busca direta, para bases menores ou navegação simples. Resolve quando há pouco volume de informação.',
  'Q038:2': 'Busca com refinamentos para facilitar encontrar o que importa. Boa opção quando a base já está crescendo.',
  'Q038:3': 'Pesquisa mais poderosa e precisa, pensada para muito conteúdo ou uso intenso. Exige arquitetura específica.',
  'Q039:1': 'Uma única empresa ou operação usando a plataforma. Modelo mais simples de dados e permissões.',
  'Q039:2': 'Atende mais de um cliente com separação mais básica. Já demanda atenção na organização do ambiente.',
  'Q039:3': 'Plataforma preparada para vários clientes com isolamento mais forte. Recomendado para produtos SaaS mais maduros.',
  'Q040:1': 'Sem histórico detalhado das ações realizadas. Menor controle, porém menos esforço.',
  'Q040:2': 'Registra eventos principais para consulta futura. Já ajuda bastante em suporte e acompanhamento.',
  'Q040:3': 'Mantém rastreabilidade mais completa do que mudou, por quem e quando. Importante em operações mais sensíveis.',
  'Q041:1': 'Os dados permanecem apenas dentro do sistema. Menos funcionalidade, porém menos trabalho.',
  'Q041:2': 'Exportação simples para análise em planilhas. Resolve muitos casos do dia a dia.',
  'Q041:3': 'Saída em vários formatos para diferentes públicos e usos. Traz mais flexibilidade para operação e gestão.',
  'Q045:1': 'Foco exclusivo em iPhone e iPad. Faz sentido quando esse é claramente o público principal.',
  'Q045:2': 'Foco exclusivo em aparelhos Android. Útil quando essa é a base dominante dos usuários.',
  'Q045:3': 'Lançamento para os dois ecossistemas desde o início. Amplia alcance, mas aumenta o escopo.',
  'Q046:1': 'Uma base de código atende mais de uma plataforma. Geralmente acelera entrega e reduz custo inicial.',
  'Q046:2': 'Cada plataforma recebe um desenvolvimento próprio. Costuma dar mais controle, mas também exige mais investimento.',
  'Q047:1': 'Sem notificações automáticas no app. O produto depende menos de engajamento recorrente.',
  'Q047:2': 'Envios básicos para informar eventos importantes. É um bom ponto de partida.',
  'Q047:3': 'Mensagens mais personalizadas conforme perfil ou comportamento. Requer mais estratégia e configuração.',
  'Q048:1': 'Uso depende totalmente de internet. É a implementação mais simples.',
  'Q048:2': 'Parte do conteúdo continua disponível sem conexão. Ajuda bastante em uso eventual offline.',
  'Q048:3': 'O app segue funcionando de forma mais completa e sincroniza depois. Indicado para uso operacional intenso.',
  'Q049:1': 'Sem dependência de câmera, localização ou sensores especiais. Escopo mais direto.',
  'Q049:2': 'Usa recursos comuns do celular, como fotos e localização. Bastante frequente em apps de campo e serviço.',
  'Q049:3': 'Envolve recursos mais específicos e sensíveis do aparelho. Exige mais testes e integrações nativas.',
  'Q050:1': 'Automatiza tarefas repetitivas e processos operacionais. Boa opção para ganhar eficiência rapidamente.',
  'Q050:2': 'Usa modelos generativos para conversar, resumir, criar texto ou responder perguntas. Indicado quando a experiência precisa parecer mais inteligente.',
  'Q050:3': 'Foco em prever, classificar ou analisar dados com mais profundidade. Faz sentido quando a decisão depende de padrões e histórico.',
  'Q051:1': 'A IA trabalha com dados já existentes no seu próprio ambiente. Costuma ser um caminho mais controlado.',
  'Q051:2': 'A solução depende de dados vindos de fora do sistema. Isso amplia possibilidades, mas adiciona dependências.',
  'Q051:3': 'Combina várias origens e tratamento contínuo dos dados. É o cenário mais robusto e também o mais trabalhoso.',
  'Q052:1': 'A IA fica como um serviço separado, consumido quando necessário. Bom para começar de forma mais modular.',
  'Q052:2': 'A inteligência aparece diretamente na experiência do produto. Dá mais fluidez para o usuário final.',
  'Q052:3': 'A IA faz parte de um fluxo maior, do dado bruto até a entrega do resultado. Indicado para operações mais estruturadas.',
  'Q070:1': 'Quando o modelo ainda não está fechado, vale manter impacto zero e discutir possibilidades. Evita travar a estimativa por uma decisão prematura.',
  'Q070:2': 'Marketplace cobra uma taxa simples por transação concluída. É o modelo mais direto de implementar.',
  'Q070:3': 'Há divisão de valores, regras por categoria ou fluxos financeiros mais sofisticados. Isso adiciona bastante lógica ao núcleo da plataforma.',
  'Q071:1': 'Sistema de reputação ainda não definido. Pode ser discutido depois sem pressionar o escopo agora.',
  'Q071:2': 'Usuários deixam uma nota básica após a experiência. Resolve o essencial de confiança social.',
  'Q071:3': 'Inclui histórico, moderação e critérios mais completos de reputação. Ideal para operação mais sensível ou escalável.',
  'Q072:1': 'Ainda sem clareza sobre necessidade de conversa entre usuários. Mantém a estimativa neutra por enquanto.',
  'Q072:2': 'Mensagens diretas em um fluxo simples, normalmente ligadas a pedido ou contratação. É o ponto de partida mais comum.',
  'Q072:3': 'Chat mais completo, com tempo real e recursos extras. Traz mais infraestrutura e UX dedicada.',
  'Q073:1': 'Moeda interna ainda indefinida. Evita adicionar complexidade sem necessidade confirmada.',
  'Q073:2': 'Créditos para ações específicas dentro da plataforma. Funciona bem em modelos de consumo previsíveis.',
  'Q073:3': 'Carteira interna com saldo, recarga e regras de uso. Exige governança e rastreabilidade maiores.',
  'Q074:1': 'Assinatura ainda não decidida. Mantém a estimativa sem impacto adicional.',
  'Q074:2': 'Plano premium único com poucos benefícios claros. Resolve cenários mais simples de recorrência.',
  'Q074:3': 'Estrutura de planos mais sofisticada, com benefícios e regras variáveis. Aumenta bastante o escopo comercial.',
  'Q075:1': 'O formato do ativo ainda não está definido. Melhor manter neutro até clarear a estratégia do ecossistema.',
  'Q075:2': 'Escopo mais simples, focado em um ativo utilitário ou coleção básica. Caminho mais viável para começar.',
  'Q075:3': 'Regras mais densas, múltiplos ativos ou comportamentos avançados. Isso amplia risco e complexidade.',
  'Q076:1': 'Rede ainda indefinida. Mantém impacto zero até a decisão técnica amadurecer.',
  'Q076:2': 'Uso de uma rede consolidada, com ecossistema mais maduro e documentação ampla. É o cenário mais previsível.',
  'Q076:3': 'Projeto precisa atender múltiplas redes ou uma stack mais específica. Exige desenho técnico mais cuidadoso.',
  'Q077:1': 'Mecânicas de reward ainda em aberto. Não adiciona esforço extra até haver definição.',
  'Q077:2': 'Campanhas e recompensas mais leves para retenção. Boa escolha para validar engajamento.',
  'Q077:3': 'Staking com regras e distribuição mais sofisticadas. Envolve tokenomics e operação mais sensível.',
  'Q078:1': 'Wallets ainda não definidas. Evita estimar integrações desnecessárias.',
  'Q078:2': 'Uma carteira principal cobre a jornada básica do usuário. Menos fricção de implementação.',
  'Q078:3': 'Compatibilidade com várias carteiras e conectores. Aumenta bastante o trabalho de integração e teste.',
  'Q079:1': 'Compliance ainda sem definição. Útil quando o modelo regulatório está sendo desenhado.',
  'Q079:2': 'Camada básica de termos, consentimentos e alertas. Atende operações menos reguladas.',
  'Q079:3': 'Validação formal de identidade e rotinas AML/KYC. Exige fluxo e responsabilidade mais robustos.',
  'Q080:1': 'Ainda sem decisão sobre browsers-alvo. Mantém a estimativa neutra.',
  'Q080:2': 'Foco inicial em Chrome, o caminho mais simples para lançamento. Menor esforço de compatibilidade.',
  'Q080:3': 'A extensão precisa atender mais engines e stores. Isso multiplica testes e ajustes.',
  'Q081:1': 'Integrações ainda indefinidas. Melhor não carregar o escopo sem confirmação.',
  'Q081:2': 'Conecta a extensão a uma página ou API específica, com comportamento controlado. Cenário mais enxuto.',
  'Q081:3': 'A extensão interage com múltiplos contextos, páginas ou serviços. Traz mais pontos de falha e manutenção.',
  'Q082:1': 'Publicação ainda em avaliação. Não adiciona impacto até a decisão ser tomada.',
  'Q082:2': 'Publicação inicial em um store principal. Inclui o básico de empacotamento e revisão.',
  'Q082:3': 'Distribuição em várias stores com manutenção contínua. Exige mais operação e acompanhamento.',
  'Q083:1': 'Sync com conta ainda não definido. Mantém o escopo sem aumento prematuro.',
  'Q083:2': 'Sincroniza preferências e poucos dados essenciais. Resolve continuidade básica entre dispositivos.',
  'Q083:3': 'Conta mais completa, com histórico e estado sincronizado. Isso adiciona backend e regras mais amplas.',
  'Q090:1': 'Faixa mais enxuta, normalmente pedindo foco em MVP e prioridades essenciais. Ajuda a manter o projeto dentro do possível.',
  'Q090:2': 'Permite um escopo inicial mais equilibrado, com algumas escolhas bem definidas. É uma faixa comum para projetos de entrada.',
  'Q090:3': 'Abre espaço para solução mais robusta, com mais acabamento e recursos. Ainda pede priorização, mas com mais margem.',
  'Q090:4': 'Orçamento mais amplo para lidar com escopo maior, integrações e refinamentos. Tende a permitir decisões mais ambiciosas.',
  'Q091:1': 'Prazo curto e mais pressionado, geralmente exigindo foco e recortes de escopo. Pode pedir mais esforço da equipe.',
  'Q091:2': 'Janela de entrega mais comum para a maioria dos projetos. Dá um equilíbrio melhor entre velocidade e qualidade.',
  'Q091:3': 'Prazo mais tranquilo, útil para amadurecer melhor as decisões. Pode reduzir pressão e permitir mais refinamento.',
  'Q092:1': 'A parte visual já está definida, o que reduz incerteza nessa etapa. O time pode focar mais na implementação.',
  'Q092:2': 'Será necessário criar uma interface funcional e objetiva. Bom quando ainda não há direção visual detalhada.',
  'Q092:3': 'Além das telas, o projeto precisa construir identidade mais completa. Isso envolve mais estratégia e trabalho criativo.',
  'Q093:1': 'Entrega encerra o ciclo principal do projeto. Ideal para quem prefere operar sem contrato contínuo.',
  'Q093:2': 'Inclui apoio recorrente para ajustes menores e acompanhamento básico. Dá mais segurança no pós-lançamento.',
  'Q093:3': 'Prevê uma relação contínua e mais próxima depois da entrega. Indicado quando o produto precisa evoluir com frequência.',
  'Q104:1': 'Você encontrou o projeto por busca online, pesquisando uma necessidade. Mostra interesse ativo em resolver um problema.',
  'Q104:2': 'O contato veio por uma rede profissional. Geralmente indica contexto mais ligado a trabalho e negócios.',
  'Q104:3': 'Chegou por recomendação de alguém que já conhece nosso trabalho. Costuma vir com mais confiança inicial.',
  'Q104:4': 'Conheceu por conteúdo ou presença em redes sociais. Indica descoberta mais espontânea.',
  'Q104:5': 'Veio por outro caminho não listado aqui. Você pode detalhar melhor depois, se quiser.',
  ...OPTION_DESCRIPTIONS_V2_PATCH,
}

function createPrismaClient() {
  const url = process.env.DATABASE_URL
  const isNeon = !!url && /neon\.tech|supabase\.co/.test(url)
  const adapter = isNeon
    ? new (require('@prisma/adapter-neon').PrismaNeon)({ connectionString: url })
    : new (require('@prisma/adapter-pg').PrismaPg)({ connectionString: url })

  return new PrismaClient({ adapter })
}

function buildQuestionValues() {
  return Prisma.join(
    Object.entries(QUESTION_HELP_TEXT).map(([code, helpText]) => Prisma.sql`(${code}, ${helpText})`)
  )
}

function buildOptionValues() {
  return Prisma.join(
    Object.entries(OPTION_DESCRIPTIONS).map(([slug, description]) => {
      const [questionCode, optionOrder] = slug.split(':')
      return Prisma.sql`(${questionCode}, ${Number(optionOrder)}, ${description})`
    })
  )
}

async function main() {
  const prisma = createPrismaClient()

  try {
    const questionUpdates = await prisma.$executeRaw`
      UPDATE question_translations AS qt
      SET help_text = data.help_text
      FROM (VALUES ${buildQuestionValues()}) AS data(code, help_text)
      JOIN questions AS q ON q.code = data.code
      WHERE qt.question_id = q.id
        AND qt.locale = 'pt-BR'
        AND (qt.help_text IS NULL OR qt.help_text = '')
    `

    const optionUpdates = await prisma.$executeRaw`
      UPDATE option_translations AS ot
      SET description = data.description
      FROM (VALUES ${buildOptionValues()}) AS data(question_code, option_order, description)
      JOIN questions AS q ON q.code = data.question_code
      JOIN options AS o ON o.question_id = q.id AND o."order" = data.option_order::int
      WHERE ot.option_id = o.id
        AND ot.locale = 'pt-BR'
        AND (ot.description IS NULL OR ot.description = '')
    `

    const [remainingQuestionBlanks, remainingOptionBlanks] = await Promise.all([
      prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::bigint AS count
        FROM question_translations qt
        JOIN questions q ON q.id = qt.question_id
        WHERE qt.locale = 'pt-BR'
          AND q.code IN (${Prisma.join(QUESTION_CODES)})
          AND (qt.help_text IS NULL OR qt.help_text = '')
      `,
      prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::bigint AS count
        FROM option_translations ot
        JOIN options o ON o.id = ot.option_id
        JOIN questions q ON q.id = o.question_id
        WHERE ot.locale = 'pt-BR'
          AND q.code IN (${Prisma.join(QUESTION_CODES)})
          AND (ot.description IS NULL OR ot.description = '')
      `,
    ])

    console.log(
      JSON.stringify(
        {
          locale: 'pt-BR',
          questionUpdates,
          optionUpdates,
          remainingQuestionBlanks: Number(remainingQuestionBlanks[0]?.count ?? 0),
          remainingOptionBlanks: Number(remainingOptionBlanks[0]?.count ?? 0),
        },
        null,
        2
      )
    )
  } finally {
    await prisma.$disconnect()
  }
}

void main().catch((error) => {
  console.error(error)
  process.exit(1)
})
