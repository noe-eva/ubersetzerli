import {Component, HostBinding, OnInit} from '@angular/core';
import {Select, Store} from '@ngxs/store';
import {SetSetting} from '../../modules/settings/settings.actions';
import {fromEvent, Observable} from 'rxjs';
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
import {Keyboard} from '@capacitor/keyboard';
import {Meta, Title} from '@angular/platform-browser';

@Component({
  selector: 'app-translate',
  templateUrl: './translate.component.html',
  styleUrls: ['./translate.component.scss'],
})
export class TranslateComponent extends BaseComponent implements OnInit {
  @Select(state => state.translate.signedLanguage) signedLanguage$: Observable<string>;
  @Select(state => state.translate.spokenToSigned) spokenToSigned$: Observable<boolean>;

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
      const {Keyboard} = await import('@capacitor/keyboard');
      Keyboard.addListener('keyboardWillShow', () => (this.keyboardOpen = true));
      Keyboard.addListener('keyboardWillHide', () => (this.keyboardOpen = false));
    }
  }

  async playVideos(): Promise<void> {
    if (!('window' in globalThis)) {
      return;
    }

    // Autoplay videos don't play before page interaction, or after re-opening PWA without refresh
    fromEvent(window, 'click')
      .pipe(
        tap(async () => {
          const videos = Array.from(document.getElementsByTagName('video'));

          for (const video of videos) {
            if (video.autoplay && video.paused) {
              try {
                await video.play();
              } catch (e) {
                console.error(e);
              }
            }
          }
        }),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe();
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
