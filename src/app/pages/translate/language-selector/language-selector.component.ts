import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {Select} from '@ngxs/store';
import {Observable} from 'rxjs';
import {MatDialog} from '@angular/material/dialog';
import {ComponentType} from '@angular/cdk/overlay';

@Component({
  selector: 'app-language-selector',
  templateUrl: './language-selector.component.html',
  styleUrls: ['./language-selector.component.scss'],
})
export class LanguageSelectorComponent implements OnInit, OnChanges {
  @Select(state => state.translate.detectedLanguage) detectedLanguage$: Observable<string>;

  @Input() flags = false;
  @Input() map = false;
  @Input() hasLanguageDetection = false;
  @Input() languages: string[];
  @Input() translationKey: string;
  @Input() urlParameter: string;

  @Input() language: string;

  @Output() languageChange = new EventEmitter<string>();

  topLanguages: string[];

  selectedIndex = 0;

  constructor(private dialog: MatDialog) {}

  ngOnInit(): void {
    this.topLanguages = this.languages.slice(0, 3);

    const searchParams = 'window' in globalThis ? window.location.search : '';
    const urlParams = new URLSearchParams(searchParams);
    const initial = urlParams.get(this.urlParameter) || this.languages[0];
    this.selectLanguage(initial);
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
