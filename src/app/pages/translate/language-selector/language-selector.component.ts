import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {Select} from '@ngxs/store';
import {Observable, switchMap} from 'rxjs';
import {TranslocoService} from '@ngneat/transloco';
import {filter, takeUntil, tap} from 'rxjs/operators';
import {BaseComponent} from '../../../components/base/base.component';
import {MatDialog} from '@angular/material/dialog';
import {ComponentType} from '@angular/cdk/overlay';

@Component({
  selector: 'app-language-selector',
  templateUrl: './language-selector.component.html',
  styleUrls: ['./language-selector.component.scss'],
})
export class LanguageSelectorComponent extends BaseComponent implements OnInit, OnChanges {
  @Select(state => state.translate.detectedLanguage) detectedLanguage$: Observable<string>;

  @Input() flags = false;
  @Input() map = false;
  @Input() hasLanguageDetection = false;
  @Input() languages: string[];
  @Input() translationKey: string;
  @Input() translationScope: string = null;
  @Input() urlParameter: string;

  @Input() language: string;

  @Output() languageChange = new EventEmitter<string>();

  topLanguages: string[];
  selectedIndex = 0;

  displayNames: Intl.DisplayNames;
  langNames: {[lang: string]: string} = {};

  constructor(private dialog: MatDialog, private transloco: TranslocoService) {
    super();
  }

  ngOnInit(): void {
    this.topLanguages = this.languages.slice(0, 3);

    const searchParams = 'window' in globalThis ? window.location.search : '';
    const urlParams = new URLSearchParams(searchParams);
    const initial = urlParams.get(this.urlParameter) || this.languages[0];
    this.selectLanguage(initial);

    // Initialize langNames, relevant for SSR
    this.setLangNames(this.transloco.getActiveLang());
    this.transloco.langChanges$
      .pipe(
        // wait until relevant language file has been loaded
        switchMap(() => this.transloco.events$),
        filter(e => e.type === 'translationLoadSuccess' && e.payload.scope === this.translationScope),
        tap(() => this.setLangNames(this.transloco.getActiveLang())),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe();
  }

  langName(lang: string): string {
    if (this.displayNames && lang.length === 2) {
      const result = this.displayNames.of(lang.toUpperCase());
      if (result && result !== lang) {
        return result;
      }
    }

    // Fallback to predefined list
    return this.transloco.translate(`${this.translationKey}.${lang}`);
  }

  setLangNames(locale: string) {
    const type = this.translationKey === 'languages' ? 'language' : 'region';
    this.displayNames = new Intl.DisplayNames([locale], {type});
    if (this.displayNames.resolvedOptions().locale !== locale) {
      console.error('Failed to set language display names for locale', locale);
      delete this.displayNames;
    }

    for (const lang of this.languages) {
      this.langNames[lang] = this.langName(lang);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    const language = changes['language'];
    if (language && !language.firstChange) {
      this.selectLanguage(language.currentValue, true);
    }
  }

  selectLanguage(lang: string, isExternalChange: boolean = false): void {
    if (lang === this.language && !isExternalChange) {
      return;
    }

    if (lang && !this.topLanguages.includes(lang)) {
      this.topLanguages.unshift(lang);
      this.topLanguages.pop();
    }

    // Update selected language
    if (!isExternalChange) {
      this.language = lang;
      this.languageChange.emit(this.language);
    }

    const index = this.topLanguages.indexOf(this.language);
    this.selectedIndex = index + Number(this.hasLanguageDetection);
  }

  selectLanguageIndex(index: number): void {
    if (index === 0 && this.hasLanguageDetection) {
      this.selectLanguage(null);
    } else {
      this.selectLanguage(this.topLanguages[index - Number(this.hasLanguageDetection)]);
    }
  }

  mapComponent: ComponentType<unknown> = null;

  async openMap() {
    // Load leaflet dynamically
    if (!this.mapComponent) {
      const chunk = await import('../map/map.component');
      this.mapComponent = Object.values(chunk)[0] as ComponentType<unknown>;
    }

    this.dialog.open(this.mapComponent, {
      height: '720px',
      width: '1280px',
    });
  }
}
