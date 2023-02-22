import {Component, HostBinding, OnInit} from '@angular/core';
import {Store} from '@ngxs/store';
import {BaseComponent} from '../../components/base/base.component';
import {takeUntil, tap} from 'rxjs/operators';
import {
  FlipTranslationDirection,
  SetSignedLanguage,
  SetSpokenLanguage,
} from '../../modules/translate/translate.actions';
import {TranslocoService} from '@ngneat/transloco';
import {TranslationService} from '../../modules/translate/translate.service';
import {Capacitor} from '@capacitor/core';
import {Meta, Title} from '@angular/platform-browser';

@Component({
  selector: 'app-translate',
  templateUrl: './translate.component.html',
  styleUrls: ['./translate.component.scss'],
})
export class TranslateComponent extends BaseComponent implements OnInit {
  spokenToSigned$ = this.store.select<boolean>(state => state.translate.spokenToSigned);
  signedLanguage$ = this.store.select<string>(state => state.translate.signedLanguage);

  @HostBinding('class.spoken-to-signed') spokenToSigned: boolean;
  @HostBinding('class.keyboard-open') keyboardOpen: boolean;

  constructor(
    private store: Store,
    private transloco: TranslocoService,
    public translation: TranslationService,
    private meta: Meta,
    private title: Title
  ) {
    super();
  }

  ngOnInit(): void {
    this.transloco.events$
      .pipe(
        tap(() => {
          this.title.setTitle(this.transloco.translate('translate.title'));
          this.meta.updateTag(
            {
              name: 'description',
              content: this.transloco.translate('translate.description'),
            },
            'name=description'
          );
        }),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe();

    this.spokenToSigned$
      .pipe(
        tap(spokenToSigned => (this.spokenToSigned = spokenToSigned)),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe();

    this.initKeyboardListeners();
  }

  async initKeyboardListeners() {
    if (Capacitor.isNativePlatform()) {
      const {Keyboard} = await import(/* webpackChunkName: "@capacitor/keyboard" */ '@capacitor/keyboard');
      Keyboard.addListener('keyboardWillShow', () => (this.keyboardOpen = true));
      Keyboard.addListener('keyboardWillHide', () => (this.keyboardOpen = false));
    }
  }

  setSignedLanguage(lang: string): void {
    this.store.dispatch(new SetSignedLanguage(lang));
  }

  setSpokenLanguage(lang: string): void {
    this.store.dispatch(new SetSpokenLanguage(lang));
  }

  swapLanguages(): void {
    this.store.dispatch(FlipTranslationDirection);
  }
}
