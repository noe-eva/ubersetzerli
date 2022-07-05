import {BrowserModule} from '@angular/platform-browser';
import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {LeafletModule} from '@asymmetrik/ngx-leaflet';

import {AppComponent} from './app.component';
import {AppSharedModule} from './core/modules/shared.module';
import {SettingsModule} from './modules/settings/settings.module';
import {AppRoutingModule} from './app-routing.module';
import {TranslateComponent} from './pages/translate/translate.component';
import {SpokenToSignedComponent} from './pages/translate/spoken-to-signed/spoken-to-signed.component';
import {LanguageSelectorComponent} from './pages/translate/language-selector/language-selector.component';
import {ReactiveFormsModule} from '@angular/forms';
import {TextToSpeechComponent} from './components/text-to-speech/text-to-speech.component';
import {ServiceWorkerModule} from '@angular/service-worker';
import {environment} from '../environments/environment';
import {TranslateModule} from './modules/translate/translate.module';
import {SpeechToTextComponent} from './components/speech-to-text/speech-to-text.component';
import {AppGoogleAnalyticsModule} from './core/modules/google-analytics/google-analytics.module';
import {TranslateInputButtonComponent} from './pages/translate/input/button/button.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {FlagIconComponent} from './components/flag-icon/flag-icon.component';
import {MapComponent} from './pages/translate/map/map.component';
import {UploadComponent} from './pages/translate/spoken-to-signed/upload/upload.component';
import {TRANSLOCO_LOADER} from '@ngneat/transloco';
import {HttpLoader} from './core/modules/transloco/transloco.loader';

@NgModule({
  declarations: [
    AppComponent,
    TranslateComponent,
    UploadComponent,
    SpokenToSignedComponent,
    LanguageSelectorComponent,
    FlagIconComponent,
    TextToSpeechComponent,
    SpeechToTextComponent,
    TranslateInputButtonComponent,
    MapComponent,
  ],
  imports: [
    BrowserModule.withServerTransition({appId: 'serverApp'}),
    BrowserAnimationsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    AppSharedModule,
    SettingsModule,
    TranslateModule,
    AppGoogleAnalyticsModule,
    LeafletModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the app is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
  providers: [{provide: TRANSLOCO_LOADER, useClass: HttpLoader}],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}
