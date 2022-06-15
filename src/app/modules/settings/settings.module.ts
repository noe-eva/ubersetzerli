import {NgModule} from '@angular/core';
import {NgxsModule} from '@ngxs/store';
import {SettingsState} from './settings.state';
import {AppSharedModule} from '../../core/modules/shared.module';

@NgModule({
  declarations: [],
  providers: [],
  imports: [NgxsModule.forFeature([SettingsState]), AppSharedModule],
  exports: [],
})
export class SettingsModule {}
