import {Injectable} from '@angular/core';
import {Action, NgxsOnInit, Select, State, StateContext} from '@ngxs/store';
import {
  ChangeTranslation,
  FlipTranslationDirection,
  SetInputMode,
  SetSignedLanguage,
  SetSpokenLanguage,
  SetInputLanguageText,
  UploadPoseFile,
} from './translate.actions';
import {TranslationService} from './translate.service';
import {Observable, of} from 'rxjs';
import {tap} from 'rxjs/operators';
import {Capacitor} from '@capacitor/core';

export type InputMode = 'upload' | 'text';

export interface TranslateStateModel {
  spokenToSigned: boolean;
  inputMode: InputMode;

  spokenLanguage: string;
  signedLanguage: string;
  detectedLanguage: string;

  inputLanguageText: string;
  outputLanguageText: string;
}

const initialState: TranslateStateModel = {
  spokenToSigned: false,
  inputMode: 'text',

  spokenLanguage: 'en',
  signedLanguage: 'CH-ZH',
  detectedLanguage: null,

  inputLanguageText: '',
  outputLanguageText: null,
};

@Injectable()
@State<TranslateStateModel>({
  name: 'translate',
  defaults: initialState,
})
export class TranslateState implements NgxsOnInit {
  constructor(private service: TranslationService) {}

  ngxsOnInit({dispatch}: StateContext<TranslateStateModel>): any {
    dispatch(ChangeTranslation);
  }

  @Action(FlipTranslationDirection)
  async flipTranslationMode({getState, patchState}: StateContext<TranslateStateModel>): Promise<void> {
    const {spokenToSigned, spokenLanguage, signedLanguage, detectedLanguage} = getState();
    patchState({
      spokenToSigned: !spokenToSigned,
      // Collapse detected language if used
      spokenLanguage: spokenLanguage ?? detectedLanguage,
      signedLanguage: signedLanguage ?? detectedLanguage,
      detectedLanguage: null,
    });
  }

  @Action(SetInputMode)
  async setInputMode(
    {patchState, getState, dispatch}: StateContext<TranslateStateModel>,
    {mode}: SetInputMode
  ): Promise<void> {
    const {inputMode} = getState();
    if (inputMode === mode) {
      return;
    }

    patchState({inputMode: mode});

    dispatch([ChangeTranslation]);
  }

  @Action(SetSpokenLanguage)
  async setSpokenLanguage(
    {patchState, getState, dispatch}: StateContext<TranslateStateModel>,
    {language}: SetSpokenLanguage
  ): Promise<void> {
    patchState({spokenLanguage: language, detectedLanguage: null});

    // Load and apply language detection if selected
    if (!language) {
      await this.service.initCld();
      const {inputLanguageText} = getState();
      if (inputLanguageText) {
        const detectedLanguage = await this.service.detectSpokenLanguage(inputLanguageText);
        patchState({detectedLanguage});
      }
    }

    dispatch(ChangeTranslation);
  }

  @Action(SetSignedLanguage)
  async setSignedLanguage(
    {patchState, dispatch}: StateContext<TranslateStateModel>,
    {language}: SetSignedLanguage
  ): Promise<void> {
    patchState({signedLanguage: language});
    dispatch(ChangeTranslation);
  }

  @Action(SetInputLanguageText)
  async setInputLanguageText(
    {patchState, getState, dispatch}: StateContext<TranslateStateModel>,
    {text}: SetInputLanguageText
  ): Promise<void> {
    const {spokenLanguage} = getState();
    const trimmedText = text.trim();
    patchState({
      inputLanguageText: text,
      detectedLanguage: !text || spokenLanguage ? null : await this.service.detectSpokenLanguage(text),
    });

    dispatch(ChangeTranslation);
  }

  @Action(ChangeTranslation, {cancelUncompleted: true})
  changeTranslation({getState, patchState, dispatch}: StateContext<TranslateStateModel>): Observable<any> {
    const {spokenToSigned, spokenLanguage, signedLanguage, detectedLanguage, inputLanguageText} = getState();
    patchState({outputLanguageText: null});

    if (!inputLanguageText) {
      return of();
    }

    if (spokenToSigned) {
      const actualSpokenLanguage = spokenLanguage || detectedLanguage;
      return this.service
        .translateSpokenToSigned(inputLanguageText, actualSpokenLanguage, signedLanguage)
        .pipe(tap(outputText => patchState({outputLanguageText: outputText})));
    }

    const actualSignedLanguage = signedLanguage || detectedLanguage;

    return this.service
      .translateSignedToSpoken(inputLanguageText, actualSignedLanguage, spokenLanguage)
      .pipe(tap(outputText => patchState({outputLanguageText: outputText})));
  }

  @Action(UploadPoseFile)
  uploadPoseFile({getState, patchState}: StateContext<TranslateStateModel>, {url}: UploadPoseFile): void {
    const {spokenToSigned} = getState();
    if (spokenToSigned) {
      patchState({outputLanguageText: url});
    }
  }
}
