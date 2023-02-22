import {ComponentFixture, TestBed} from '@angular/core/testing';
import {axe, toHaveNoViolations} from 'jasmine-axe';

import {languageCodeNormalizer, AppLanguageSelectorComponent, SITE_LANGUAGES} from './language-selector.component';
import {AppTranslocoTestingModule} from '../../core/modules/transloco/transloco-testing.module';
import {RouterModule} from '@angular/router';

describe('AppLanguageSelectorComponent', () => {
  let component: AppLanguageSelectorComponent;
  let fixture: ComponentFixture<AppLanguageSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AppLanguageSelectorComponent],
      imports: [AppTranslocoTestingModule, RouterModule.forRoot([])],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppLanguageSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should pass accessibility test', async () => {
    jasmine.addMatchers(toHaveNoViolations);
    const a11y = await axe(fixture.nativeElement);
    expect(a11y).toHaveNoViolations();
  });

  for (const lang of SITE_LANGUAGES) {
    it(`should support language ${lang.value} (code '${lang.key}')`, async () => {
      const key = languageCodeNormalizer(lang.key).toLowerCase();
      const files = [
        `assets/i18n/${key}.json`,
        `assets/i18n/countries/${key}.json`,
        `assets/i18n/languages/${key}.json`,
      ];

      const requests = await Promise.all(files.map(f => fetch(f)));
      for (const req of requests) {
        expect(req.ok).toBeTruthy();
      }

      const jsons = await Promise.all(requests.map(r => r.json()));
      for (const json of jsons) {
        const text = JSON.stringify(json);
        expect(text).not.toContain('&#'); // No URL Encoded characters
      }
    });
  }
});
