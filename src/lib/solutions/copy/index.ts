import type { AppLocale } from "@/i18n/routing";
import type { SolutionSlug } from "@/lib/solutions/catalog";
import type { SolutionCopy } from "@/lib/solutions/copySchema";

import aplicativoAndroidPtBR from "./aplicativo-android.pt-BR.json";
import aplicativoAndroidEnUS from "./aplicativo-android.en-US.json";
import aplicativoAndroidEsES from "./aplicativo-android.es-ES.json";
import aplicativoAndroidItIT from "./aplicativo-android.it-IT.json";

import aplicativoIosPtBR from "./aplicativo-ios.pt-BR.json";
import aplicativoIosEnUS from "./aplicativo-ios.en-US.json";
import aplicativoIosEsES from "./aplicativo-ios.es-ES.json";
import aplicativoIosItIT from "./aplicativo-ios.it-IT.json";

import ecommercePtBR from "./ecommerce.pt-BR.json";
import ecommerceEnUS from "./ecommerce.en-US.json";
import ecommerceEsES from "./ecommerce.es-ES.json";
import ecommerceItIT from "./ecommerce.it-IT.json";

import saasPtBR from "./saas.pt-BR.json";
import saasEnUS from "./saas.en-US.json";
import saasEsES from "./saas.es-ES.json";
import saasItIT from "./saas.it-IT.json";

import siteInstitucionalPtBR from "./site-institucional.pt-BR.json";
import siteInstitucionalEnUS from "./site-institucional.en-US.json";
import siteInstitucionalEsES from "./site-institucional.es-ES.json";
import siteInstitucionalItIT from "./site-institucional.it-IT.json";

import landingPagePtBR from "./landing-page.pt-BR.json";
import landingPageEnUS from "./landing-page.en-US.json";
import landingPageEsES from "./landing-page.es-ES.json";
import landingPageItIT from "./landing-page.it-IT.json";

import marketplacePtBR from "./marketplace.pt-BR.json";
import marketplaceEnUS from "./marketplace.en-US.json";
import marketplaceEsES from "./marketplace.es-ES.json";
import marketplaceItIT from "./marketplace.it-IT.json";

import automacaoPtBR from "./automacao.pt-BR.json";
import automacaoEnUS from "./automacao.en-US.json";
import automacaoEsES from "./automacao.es-ES.json";
import automacaoItIT from "./automacao.it-IT.json";

import iaPtBR from "./inteligencia-artificial.pt-BR.json";
import iaEnUS from "./inteligencia-artificial.en-US.json";
import iaEsES from "./inteligencia-artificial.es-ES.json";
import iaItIT from "./inteligencia-artificial.it-IT.json";

import criptoPtBR from "./cripto.pt-BR.json";
import criptoEnUS from "./cripto.en-US.json";
import criptoEsES from "./cripto.es-ES.json";
import criptoItIT from "./cripto.it-IT.json";

import extensaoPtBR from "./extensao-chrome.pt-BR.json";
import extensaoEnUS from "./extensao-chrome.en-US.json";
import extensaoEsES from "./extensao-chrome.es-ES.json";
import extensaoItIT from "./extensao-chrome.it-IT.json";

type CopyMap = Record<AppLocale, Record<SolutionSlug, SolutionCopy>>;

export const SOLUTION_COPY: CopyMap = {
  "pt-BR": {
    "aplicativo-android": aplicativoAndroidPtBR as SolutionCopy,
    "aplicativo-ios": aplicativoIosPtBR as SolutionCopy,
    ecommerce: ecommercePtBR as SolutionCopy,
    saas: saasPtBR as SolutionCopy,
    "site-institucional": siteInstitucionalPtBR as SolutionCopy,
    "landing-page": landingPagePtBR as SolutionCopy,
    marketplace: marketplacePtBR as SolutionCopy,
    automacao: automacaoPtBR as SolutionCopy,
    "inteligencia-artificial": iaPtBR as SolutionCopy,
    cripto: criptoPtBR as SolutionCopy,
    "extensao-chrome": extensaoPtBR as SolutionCopy,
  },
  "en-US": {
    "aplicativo-android": aplicativoAndroidEnUS as SolutionCopy,
    "aplicativo-ios": aplicativoIosEnUS as SolutionCopy,
    ecommerce: ecommerceEnUS as SolutionCopy,
    saas: saasEnUS as SolutionCopy,
    "site-institucional": siteInstitucionalEnUS as SolutionCopy,
    "landing-page": landingPageEnUS as SolutionCopy,
    marketplace: marketplaceEnUS as SolutionCopy,
    automacao: automacaoEnUS as SolutionCopy,
    "inteligencia-artificial": iaEnUS as SolutionCopy,
    cripto: criptoEnUS as SolutionCopy,
    "extensao-chrome": extensaoEnUS as SolutionCopy,
  },
  "es-ES": {
    "aplicativo-android": aplicativoAndroidEsES as SolutionCopy,
    "aplicativo-ios": aplicativoIosEsES as SolutionCopy,
    ecommerce: ecommerceEsES as SolutionCopy,
    saas: saasEsES as SolutionCopy,
    "site-institucional": siteInstitucionalEsES as SolutionCopy,
    "landing-page": landingPageEsES as SolutionCopy,
    marketplace: marketplaceEsES as SolutionCopy,
    automacao: automacaoEsES as SolutionCopy,
    "inteligencia-artificial": iaEsES as SolutionCopy,
    cripto: criptoEsES as SolutionCopy,
    "extensao-chrome": extensaoEsES as SolutionCopy,
  },
  "it-IT": {
    "aplicativo-android": aplicativoAndroidItIT as SolutionCopy,
    "aplicativo-ios": aplicativoIosItIT as SolutionCopy,
    ecommerce: ecommerceItIT as SolutionCopy,
    saas: saasItIT as SolutionCopy,
    "site-institucional": siteInstitucionalItIT as SolutionCopy,
    "landing-page": landingPageItIT as SolutionCopy,
    marketplace: marketplaceItIT as SolutionCopy,
    automacao: automacaoItIT as SolutionCopy,
    "inteligencia-artificial": iaItIT as SolutionCopy,
    cripto: criptoItIT as SolutionCopy,
    "extensao-chrome": extensaoItIT as SolutionCopy,
  },
};

export function getSolutionCopy(
  locale: AppLocale,
  slug: SolutionSlug,
): SolutionCopy {
  return SOLUTION_COPY[locale][slug];
}
