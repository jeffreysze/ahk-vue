import { createI18n } from 'vue-i18n'

import en from '@/locales/en.json'
import zh from '@/locales/zh-cn.json'

/**
 * Load locale messages
 *
 * The loaded `JSON` locale messages is pre-compiled by `@intlify/vue-i18n-loader`, which is integrated into `vue-cli-plugin-i18n`.
 * See: https://github.com/intlify/vue-i18n-loader#rocket-i18n-resource-pre-compilation
 */
function loadLocaleMessages() {
  const locales = [{ en: en }, { zh: zh }]
  const messages = {}
  locales.forEach(lang => {
    const key = Object.keys(lang)
    messages[key] = lang[key] 
  })
  return messages
}

export default createI18n({
  locale: import.meta.env.VITE_APP_I18N_LOCALE || 'zh',
  fallbackLocale: import.meta.env.VITE_APP_I18N_FALLBACK_LOCALE || 'zh',
  messages: loadLocaleMessages()
})