import * as express from 'express';
import * as functions from 'firebase-functions';
import * as httpErrors from 'http-errors';
import * as crypto from 'crypto';
import {errorMiddleware} from '../middlewares/error.middleware';
import {TextToTextTranslationModel} from './model/model';
import {Bucket, Storage} from '@google-cloud/storage';
import {FirebaseDatabase, Reference} from '@firebase/database-types';

export class TextToTextTranslationEndpoint {
  models = new Map<string, TextToTextTranslationModel>();

  constructor(private database: FirebaseDatabase, private bucket: Bucket) {}

  async modelFiles(from: string, to: string): Promise<string[] | null> {
    const query = {prefix: `models/browsermt/${from}-${to}`};
    const [files] = await this.bucket.getFiles(query);
    const paths = files.map(f => f.metadata.name).filter(p => !p.endsWith('/'));
    return paths.length > 0 ? paths : null;
  }

  private async getModel(from: string, to: string): Promise<TextToTextTranslationModel> {
    const modelName = `${from}-${to}`;
    if (!this.models.has(modelName)) {
      const files = await this.modelFiles(from, to);
      let model: TextToTextTranslationModel;
      if (files) {
        console.log('Initializing Model', {from, to});
        model = new TextToTextTranslationModel(this.bucket, from, to);
        await model.init(files);
      } else {
        throw new Error('No model or fallback model files found');
      }

      this.models.set(modelName, model);
    }
    return this.models.get(modelName)!;
  }

  private parseParameters(req: express.Request) {
    const from = req.query.from as string;
    const to = req.query.to as string;
    if (!from || !to) {
      throw new httpErrors.BadRequest('Missing "from" or "to" query parameters');
    }

    const text = req.query.text as string;
    if (!text) {
      throw new httpErrors.BadRequest('Missing "text" query parameter');
    }

    return {from, to, text};
  }

  async getCachedTranslation(from: string, to: string, text: string): Promise<string | Reference> {
    const hash = crypto.createHash('md5').update(text).digest('hex');
    const ref = this.database.ref('translations').child(`${from}-${to}`).child(hash);

    return new Promise(async resolve => {
      let result = ref;
      await ref.transaction(cache => {
        if (!cache) {
          return null;
        }

        console.log('Cache hit', cache);
        result = cache.translation;
        return {
          ...cache,
          counter: cache.counter + 1,
          timestamp: Date.now(),
        };
      });
      resolve(result);
    });
  }

  async request(req: express.Request, res: express.Response) {
    // Only in-browser cache, not CDN cache, to have a more accurate cache hits counter
    res.set('Cache-Control', 'public, max-age=86400, s-maxage=0');

    const {from, to, text} = this.parseParameters(req);
    console.log('Requesting', {from, to, text});

    const cache = await this.getCachedTranslation(from, to, text);
    let translation: string;
    if (typeof cache === 'string') {
      translation = cache;
    } else {
      const model = await this.getModel(from, to);
      translation = await model.translate(text, from, to);
      await cache.set({
        text,
        translation,
        counter: 1,
        timestamp: Date.now(),
      });
    }

    const response = {
      from,
      to,
      text: translation,
    };
    res.json(response);
    console.log('Response', response);
  }
}

export const textToTextFunctions = (database: FirebaseDatabase, storage: Storage) => {
  const endpoint = new TextToTextTranslationEndpoint(database, storage.bucket('ubersetzerli-assets'));

  const app = express();
  app.get('/api/text-to-text', endpoint.request.bind(endpoint));
  app.use(errorMiddleware);
  return functions.https.onRequest(app);
};
