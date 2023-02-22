import {Injectable} from '@angular/core';
import {GoogleAnalyticsService} from '../../core/modules/google-analytics/google-analytics.service';
import {catchError, from, Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {AssetsService} from '../../core/services/assets/assets.service';
import {filter} from 'rxjs/operators';
import {ComlinkWorkerInterface, ModelRegistry, TranslationResponse} from '@sign-mt/browsermt';

@Injectable({
  providedIn: 'root',
})
export class PivotTranslationService {
  worker: ComlinkWorkerInterface;

  loadedModel: string;

  constructor(private ga: GoogleAnalyticsService, private http: HttpClient, private assets: AssetsService) {}

  async initWorker() {
    if (this.worker) {
      return;
    }
    const {createBergamotWorker} = await import(/* webpackChunkName: "@sign-mt/browsermt" */ '@sign-mt/browsermt');
    this.worker = createBergamotWorker('/browsermt/worker.js');

    await this.worker.importBergamotWorker('bergamot-translator-worker.js', 'bergamot-translator-worker.wasm');
  }

  async createModelRegistry(modelPath: string) {
    const modelRegistry = {};
    const modelFiles = await this.assets.getDirectory(modelPath);
    for (const [name, path] of modelFiles.entries()) {
      const fileType = name.split('.').shift();
      modelRegistry[fileType] = {name: path, size: 0, estimatedCompressedSize: 0, modelType: 'prod'};
    }
    return modelRegistry;
  }

  async loadOfflineModel(from: string, to: string) {
    const modelName = `${from}${to}`;
    if (this.loadedModel === modelName) {
      return;
    }

    const modelPath = `models/browsermt/${from}-${to}/`;
    // await this.assets.download(modelPath);

    const state = this.assets.stat(modelPath);
    if (!state.exists) {
      throw new Error(`Model '${modelPath}' not found locally`);
    }

    const modelRegistry = {[modelName]: await this.createModelRegistry(modelPath)} as ModelRegistry;

    await this.initWorker();
    await this.worker.loadModel(from, to, modelRegistry);
    this.loadedModel = modelName;
  }

  async translateOffline(text: string, from: string, to: string): Promise<TranslationResponse> {
    await this.loadOfflineModel(from, to);
    let translations = await this.worker.translate(from, to, [text], [{isHtml: false}]);
    if (typeof translations[0] === 'string') {
      translations = translations.map((t: any) => ({text: t}));
    }
    return translations[0];
  }

  translateOnline(text: string, from: string, to: string): Observable<TranslationResponse> {
    const query = new URLSearchParams({from, to, text});
    return this.http.get<TranslationResponse>(`https://ubersetzer.li/api/text-to-text?${query}`);
  }

  translate(text: string, srcLang: string, dstLang: string): Observable<TranslationResponse> {
    const tags = srcLang
      .split('-')
      .map(t => `$${t.toLowerCase()}$`)
      .join(' ');
    const newText = `${tags} ${text}`;
    const srcFrom = srcLang.split('-')[0].toLowerCase();

    const offline = () => from(this.translateOffline(newText, srcFrom, dstLang));
    const online = () => this.translateOnline(newText, srcFrom, dstLang);

    return offline().pipe(
      filter(() => !('navigator' in globalThis) || navigator.onLine),
      catchError(online)
    );
  }
}
