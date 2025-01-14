const {simpleSitemapAndIndex} = require('sitemap');
const path = require('path');
const fs = require('fs');

// Get list of supported languages
const baseDir = __dirname + `${path.sep}..${path.sep}`;
const langsDir = `${baseDir}src${path.sep}assets${path.sep}i18n`;
const languages = [];
for (const file of fs.readdirSync(langsDir)) {
  const [lang] = file.split('.');
  languages.push(lang);
}

const lastmod = new Date();
const baseUrls = ['/'];

const sourceData = [];

for (const url of baseUrls) {
  sourceData.push({
    url,
    lastmod,
    links: languages.map(lang => ({lang, url: `${url}?lang=${lang}`})),
  });
}

// writes sitemaps and index out to the destination you provide.
simpleSitemapAndIndex({
  hostname: 'https://ubersetzer.li',
  destinationDir: `${baseDir}dist/ubersetzerli/browser/`,
  sourceData,
  gzip: false,
})
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
