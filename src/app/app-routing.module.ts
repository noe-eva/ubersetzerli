import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {InitialNavigation, RouterModule, Routes} from '@angular/router';
import {TranslateComponent} from './pages/translate/translate.component';
import {environment} from '../environments/environment';

const routes: Routes = [
  {path: '', component: TranslateComponent},
  {path: 'about', loadChildren: () => import('./pages/landing/landing.module').then(m => m.LandingModule)},
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      initialNavigation: environment.initialNavigation,
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
