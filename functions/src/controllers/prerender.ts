import * as express from 'express';
import * as functions from 'firebase-functions';
import {errorMiddleware} from '../middlewares/error.middleware';

const app = express();

app.get('/opensearch.xml', (req, res) => {
  // TODO support language selection - opensearch.xml?lang=he

  const body = `
<OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/">
  <ShortName>übersetzerli</ShortName>
  <Description>Get translations from übersetzerli.</Description>
  <Url type="text/html" method="get" template="https://übersetzer.li/?text={searchTerms}"/>
  <Image width="32" height="32" alt="">https://übersetzer.li/assets/icons/favicon.svg</Image>
</OpenSearchDescription>`;

  res.set('Content-Type', 'text/xml');
  res.set('Cache-Control', 'public, max-age=86400'); // one day
  res.send(body);
});

app.use(errorMiddleware);

export const prerenderFunctions = functions.https.onRequest(app);
