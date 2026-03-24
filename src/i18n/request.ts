import { getRequestConfig } from "next-intl/server";
import { routing, type AppLocale } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  // Aguarda o locale da requisicao
  let locale = await requestLocale;

  // Valida e aplica fallback para defaultLocale
  if (
    !locale ||
    !routing.locales.includes(locale as AppLocale)
  ) {
    locale = routing.defaultLocale;
  }

  const messages = (
    await import(`../../messages/${locale}.json`)
  ).default;

  return {
    locale,
    messages,
    // Fallback: reporta chaves ausentes em desenvolvimento
    onError(error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[next-intl]", error.message);
      }
    },
    getMessageFallback({ namespace, key }) {
      return `${namespace}.${key}`;
    },
  };
});
