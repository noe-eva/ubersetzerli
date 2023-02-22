import {Injectable} from '@angular/core';
import {LanguageIdentifier} from 'cld3-asm';
import {GoogleAnalyticsService} from '../../core/modules/google-analytics/google-analytics.service';
import {Observable, of, switchMap} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {map} from 'rxjs/operators';
import {PivotTranslationService} from './pivot-translation.service';
import {IANASignedLanguages} from '../../core/helpers/iana/languages';

const OBSOLETE_LANGUAGE_CODES = {
  iw: 'he',
};
const DEFAULT_SPOKEN_LANGUAGE = 'en';

// https://en.wikipedia.org/wiki/ISO_3166-2:CH
// [...$0.querySelectorAll('tr')].slice(1, -1).map(tr => {
//   const [codeTd, nameTd] = Array.from(tr.querySelectorAll('td'));
//   return [codeTd.innerText, nameTd.innerText, nameTd.querySelector('img').src];
// });

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  private cld: LanguageIdentifier;

  dialects = [
    'CH-ZH',
    'CH-BE',
    'CH-GR',
    'CH-AG',
    'CH-AR',
    'CH-AI',
    'CH-BL',
    'CH-BS',
    'CH-FR',
    'CH-GE',
    'CH-GL',
    'CH-JU',
    'CH-LU',
    'CH-NE',
    'CH-NW',
    'CH-OW',
    'CH-SG',
    'CH-SH',
    'CH-SZ',
    'CH-SO',
    'CH-TG',
    'CH-TI',
    'CH-UR',
    'CH-VS',
    'CH-VD',
    'CH-ZG',
  ];

  spokenLanguages = [
    'de',
    'en',
    'fr',
    'it',
    'af',
    'sq',
    'am',
    'ar',
    'hy',
    'az',
    'eu',
    'be',
    'bn',
    'bs',
    'bg',
    'ca',
    'ceb',
    'ny',
    'zh',
    'co',
    'hr',
    'cs',
    'da',
    'nl',
    'eo',
    'et',
    'tl',
    'fi',
    'fy',
    'gl',
    'ka',
    'es',
    'el',
    'gu',
    'ht',
    'ha',
    'haw',
    'he',
    'hi',
    'hmn',
    'hu',
    'is',
    'ig',
    'id',
    'ga',
    'ja',
    'jv',
    'kn',
    'kk',
    'km',
    'rw',
    'ko',
    'ku',
    'ky',
    'lo',
    'la',
    'lv',
    'lt',
    'lb',
    'mk',
    'mg',
    'ms',
    'ml',
    'mt',
    'mi',
    'mr',
    'mn',
    'my',
    'ne',
    'no',
    'or',
    'ps',
    'fa',
    'pl',
    'pt',
    'pa',
    'ro',
    'ru',
    'sm',
    'gd',
    'sr',
    'st',
    'sn',
    'sd',
    'si',
    'sk',
    'sl',
    'so',
    'su',
    'sw',
    'sv',
    'tg',
    'ta',
    'tt',
    'te',
    'th',
    'tr',
    'tk',
    'uk',
    'ur',
    'ug',
    'uz',
    'vi',
    'cy',
    'xh',
    'yi',
    'yo',
    'zu',
  ];

  constructor(
    private ga: GoogleAnalyticsService,
    private http: HttpClient,
    private pivotTranslation: PivotTranslationService
  ) {}

  async initCld(): Promise<void> {
    if (this.cld) {
      return;
    }
    const cld3 = await this.ga.trace('cld', 'import', () => import(/* webpackChunkName: "cld3-asm" */ 'cld3-asm'));
    const cldFactory = await this.ga.trace('cld', 'load', () => cld3.loadModule());
    this.cld = await this.ga.trace('cld', 'create', () => cldFactory.create(1, 5000));
  }

  async detectSpokenLanguage(text: string): Promise<string> {
    if (!this.cld) {
      return DEFAULT_SPOKEN_LANGUAGE;
    }

    const language = await this.ga.trace('cld', 'find', () => this.cld.findLanguage(text));
    const languageCode = language.is_reliable ? language.language : DEFAULT_SPOKEN_LANGUAGE;
    const correctedCode = OBSOLETE_LANGUAGE_CODES[languageCode] ?? languageCode;
    return this.spokenLanguages.includes(correctedCode) ? correctedCode : DEFAULT_SPOKEN_LANGUAGE;
  }

  translateSignedToSpoken(text: string, dialect: string, dstLang: string): Observable<string> {
    return of(dialect).pipe(
      switchMap(dialect => {
        if (dialect === 'CH-TI') {
          return of({srcLang: 'it', pivot: text});
        }
        if (['CH-VD', 'CH-NE', 'CH-GE', 'CH-JU'].includes(dialect)) {
          return of({srcLang: 'fr', pivot: text});
        } else {
          return this.pivotTranslation
            .translate(text, dialect, 'de')
            .pipe(map(({text}) => ({srcLang: 'de', pivot: text})));
        }
      }),
      switchMap(({srcLang, pivot}) => {
        if (srcLang === dstLang) {
          return of(pivot);
        }

        const params = `client=gtx&sl=${srcLang}&tl=${dstLang}&dt=t&q=${encodeURIComponent(pivot)}`;
        return this.http
          .get(`https://translate.googleapis.com/translate_a/single?${params}`)
          .pipe(map(res => res[0][0][0] as string));
      })
    );
  }
}
