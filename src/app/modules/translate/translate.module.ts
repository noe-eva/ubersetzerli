import {NgModule} from '@angular/core';
import {NgxsModule} from '@ngxs/store';
import {TranslateState} from './translate.state';
import {TranslationService} from './translate.service';
import {PivotTranslationService} from './pivot-translation.service';

@NgModule({
  providers: [TranslationService, PivotTranslationService],
  imports: [NgxsModule.forFeature([TranslateState])],
})
export class TranslateModule {}
