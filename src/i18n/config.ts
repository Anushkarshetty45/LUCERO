import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './translations/en.json'
import es from './translations/es.json'
import fr from './translations/fr.json'
import de from './translations/de.json'
import pt from './translations/pt.json'
import zh from './translations/zh.json'
import ja from './translations/ja.json'
import ko from './translations/ko.json'
import ar from './translations/ar.json'
import hi from './translations/hi.json'
import kn from './translations/kn.json'
import te from './translations/te.json'
import ta from './translations/ta.json'
import ru from './translations/ru.json'
import it from './translations/it.json'
import nl from './translations/nl.json'
import pl from './translations/pl.json'
import tr from './translations/tr.json'
import vi from './translations/vi.json'
import th from './translations/th.json'
import id from './translations/id.json'
import ms from './translations/ms.json'
import sv from './translations/sv.json'
import no from './translations/no.json'
import da from './translations/da.json'
import fi from './translations/fi.json'
import cs from './translations/cs.json'
import el from './translations/el.json'
import he from './translations/he.json'
import uk from './translations/uk.json'
import ro from './translations/ro.json'
import hu from './translations/hu.json'
import bg from './translations/bg.json'

const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  de: { translation: de },
  pt: { translation: pt },
  zh: { translation: zh },
  ja: { translation: ja },
  ko: { translation: ko },
  ar: { translation: ar },
  hi: { translation: hi },
  kn: { translation: kn },
  te: { translation: te },
  ta: { translation: ta },
  ru: { translation: ru },
  it: { translation: it },
  nl: { translation: nl },
  pl: { translation: pl },
  tr: { translation: tr },
  vi: { translation: vi },
  th: { translation: th },
  id: { translation: id },
  ms: { translation: ms },
  sv: { translation: sv },
  no: { translation: no },
  da: { translation: da },
  fi: { translation: fi },
  cs: { translation: cs },
  el: { translation: el },
  he: { translation: he },
  uk: { translation: uk },
  ro: { translation: ro },
  hu: { translation: hu },
  bg: { translation: bg }
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  })

export default i18n
