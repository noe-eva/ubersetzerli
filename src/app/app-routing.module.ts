import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {TranslateComponent} from './pages/translate/translate.component';
import {environment} from '../environments/environment';
import {LazyDialogEntryComponent} from './pages/translate/dialog-entry.component';
import {NotFoundComponent} from './pages/not-found/not-found.component';

const routes: Routes = [
  {
    path: '',
    component: TranslateComponent,
    children: [
      {
        path: 'settings',
        outlet: 'dialog',
        component: LazyDialogEntryComponent,
      },
    ],
  },
  {
    path: 's', // to prevent the settings from loading on page load, adding one level of route (i.e. s/offline)
    outlet: 'settings',
    loadChildren: () => import('./pages/settings/settings.module').then(m => m.SettingsPageModule),
  },
  {
    path: '**',
    component: NotFoundComponent,
  },
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
