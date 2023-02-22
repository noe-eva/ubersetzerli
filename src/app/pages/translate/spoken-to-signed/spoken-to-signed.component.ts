import {Component, OnInit} from '@angular/core';
import {FormControl} from '@angular/forms';
import {BaseComponent} from '../../../components/base/base.component';
import {debounce, distinctUntilChanged, map, skipWhile, takeUntil, tap} from 'rxjs/operators';
import {interval, Observable} from 'rxjs';
import {Select, Store} from '@ngxs/store';
import {SetInputLanguageText} from '../../../modules/translate/translate.actions';
import {SafeUrl} from '@angular/platform-browser';
import {TranslateStateModel} from '../../../modules/translate/translate.state';
import {isIOS, isMacLike} from 'src/app/core/constants';

@Component({
  selector: 'app-spoken-to-signed',
  templateUrl: './spoken-to-signed.component.html',
  styleUrls: ['./spoken-to-signed.component.scss'],
})
export class SpokenToSignedComponent extends BaseComponent implements OnInit {
  translate$ = this.store.select<TranslateStateModel>(state => state.translate);
  inputMode$ = this.store.select<string>(state => state.translate.inputMode);
  inputText$ = this.store.select<string>(state => state.translate.inputLanguageText);
  outputText$ = this.store.select<string>(state => state.translate.outputLanguageText);
  spokenLanguage$ = this.store.select<string>(state => state.translate.spokenLanguage);

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
        debounce(() => interval(300)),
        skipWhile(text => !text), // Don't run on empty text, on app launch
        distinctUntilChanged((a, b) => a.trim() === b.trim()),
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
}
