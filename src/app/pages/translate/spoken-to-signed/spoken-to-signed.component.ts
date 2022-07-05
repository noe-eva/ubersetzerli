import {Component, OnInit} from '@angular/core';
import {FormControl} from '@angular/forms';
import {BaseComponent} from '../../../components/base/base.component';
import {debounce, distinctUntilChanged, map, skipWhile, takeUntil, tap} from 'rxjs/operators';
import {interval, Observable} from 'rxjs';
import {Select, Store} from '@ngxs/store';
import {SetInputLanguageText} from '../../../modules/translate/translate.actions';
import {SafeUrl} from '@angular/platform-browser';
import {TranslateStateModel} from '../../../modules/translate/translate.state';

@Component({
  selector: 'app-spoken-to-signed',
  templateUrl: './spoken-to-signed.component.html',
  styleUrls: ['./spoken-to-signed.component.scss'],
})
export class SpokenToSignedComponent extends BaseComponent implements OnInit {
  @Select(state => state.translate) translate$: Observable<TranslateStateModel>;
  @Select(state => state.translate.inputMode) inputMode$: Observable<string>;
  @Select(state => state.translate.inputLanguageText) inputText$: Observable<string>;
  @Select(state => state.translate.outputLanguageText) outputText$: Observable<string>;
  @Select(state => state.translate.spokenLanguage) spokenLanguage$: Observable<string>;

  inputLanguage: string;
  outputLanguage: string;

  inputText = new FormControl();
  maxTextLength = 5000;

  constructor(private store: Store) {
    super();
  }

  ngOnInit(): void {
    this.translate$
      .pipe(
        tap(({spokenToSigned, spokenLanguage, signedLanguage, detectedLanguage}) => {
          this.inputLanguage = (spokenToSigned ? spokenLanguage : 'de') || detectedLanguage;
          this.outputLanguage = !spokenToSigned ? spokenLanguage : 'de';
        }),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe();

    // Local text changes
    this.inputText.valueChanges
      .pipe(
        debounce(() => interval(500)),
        skipWhile(text => !text), // Don't run on empty text, on app launch
        map(text => text.trim()),
        distinctUntilChanged(),
        tap(text => this.store.dispatch(new SetInputLanguageText(text))),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe();

    // Changes from the store
    this.inputText$
      .pipe(
        tap(text => this.inputText.setValue(text)),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe();
  }

  playVideoIfPaused(event: MouseEvent): void {
    const video = event.target as HTMLPoseViewerElement;
    if (video.paused) {
      video.play().then().catch();
    }
  }
}
