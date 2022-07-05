import {AfterViewInit, Component} from '@angular/core';
import {getBrowserLang, TranslocoService} from '@ngneat/transloco';
import {filter, tap} from 'rxjs/operators';
import {Store} from '@ngxs/store';
import {SetInputLanguageText} from './modules/translate/translate.actions';
import {MatIconRegistry} from '@angular/material/icon';
import {DomSanitizer} from '@angular/platform-browser';
import {SetSpokenLanguageText} from './modules/translate/translate.actions';
import {Platform} from '@angular/cdk/platform';
import {firstValueFrom} from 'rxjs';
import {NavigationEnd, Router} from '@angular/router';
import {GoogleAnalyticsService} from './core/modules/google-analytics/google-analytics.service';
import {Capacitor} from '@capacitor/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewInit {
  urlParams = this.getUrlParams();

  constructor(
    private transloco: TranslocoService,
    private store: Store,
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
    private platform: Platform,
    private ga: GoogleAnalyticsService,
    private transloco: TranslocoService,
    private router: Router,
    private store: Store
  ) {
    this.listenLanguageChange();
    this.logRouterNavigation();
    this.checkURLEmbedding();
    this.checkURLText();
    this.registerIcons();
  }

  registerIcons() {
    this.matIconRegistry.addSvgIcon(
      `switzerland`,
      this.domSanitizer.bypassSecurityTrustResourceUrl(`assets/icons/favicon.svg`)
    );
  }

  async ngAfterViewInit() {
    if (Capacitor.isNativePlatform()) {
      const {SplashScreen} = await import('@capacitor/splash-screen');
      await SplashScreen.hide();
    }
  }

  logRouterNavigation() {
    const isLanguageLoaded = firstValueFrom(
      this.transloco.events$.pipe(filter(e => e.type === 'translationLoadSuccess'))
    );

    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        tap(async (event: NavigationEnd) => {
          await isLanguageLoaded; // Before triggering page view, wait for language to be loaded
          await this.ga.setCurrentScreen(event.urlAfterRedirects);
        })
      )
      .subscribe();
  }

  getUrlParams() {
    if (!('window' in globalThis)) {
      return new URLSearchParams();
    }
    return new URLSearchParams(window.location.search);
  }

  listenLanguageChange() {
    if (!('navigator' in globalThis) || !('document' in globalThis)) {
      return;
    }

    this.transloco.langChanges$
      .pipe(
        tap(lang => {
          document.documentElement.lang = lang;
          document.dir = ['he', 'ar'].includes(lang) ? 'rtl' : 'ltr';

          // Set pre-rendered cloud function path with lang attribute
          const openSearch = Array.from(document.head.children).find(t => t.getAttribute('rel') === 'search');
          if (openSearch) {
            // not available in the test environment sometimes
            openSearch.setAttribute('href', `/opensearch.xml?lang=${lang}`);
          }
        })
      )
      .subscribe();

    const urlParam = this.urlParams.get('lang');
    let [navigatorParam] = navigator.language.split('-');
    if (navigatorParam === 'zh') {
      // Handle simplified (china) vs traditional (hong kong, taiwan) chinese
      navigatorParam = navigator.language === 'zh-CN' ? 'zh-CN' : 'zh-HK';
    }
    if (navigatorParam === 'pt') {
      // Handle brazilian vs european portuguese
      navigatorParam = navigator.language;
    }
    if (navigatorParam === 'iw') {
      // Handle Hebrew
      navigatorParam = 'he';
    }
    this.transloco.setActiveLang(urlParam || navigatorParam);
  }

  checkURLEmbedding(): void {
    const urlParam = this.urlParams.get('embed');
    if (urlParam !== null) {
      document.body.classList.add('embed');
    }
  }

  checkURLText(): void {
    const urlParam = this.urlParams.get('text');
    if (urlParam !== null) {
      this.store.dispatch(new SetInputLanguageText(urlParam));
    }
  }
}
