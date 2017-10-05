const path = require('path');
const readFileSync = require('fs').readFileSync;
const generateEpub = require('./dist/index');
const template = require('peritext-template-codex-garlic');
const templateCss = readFileSync('node_modules/peritext-template-codex-garlic/dist/main.css')
const story = require('./examples/story');
const exampleLocale = require('./example-locale');

const contextualizers = {
  bib: require('peritext-contextualizer-bib'),
  codefiles: require('peritext-contextualizer-codefiles'),
  vegalite: require('peritext-contextualizer-vegalite'),
  p5: require('peritext-contextualizer-p5'),
  glossary: require('peritext-contextualizer-glossary'),
  video: require('peritext-contextualizer-video'),
  embed: require('peritext-contextualizer-embed'),
  image: require('peritext-contextualizer-image'),
  table: require('peritext-contextualizer-table'),
  dicto: require('peritext-contextualizer-dicto'),
  webpage: require('peritext-contextualizer-webpage'),
  'data-presentation': require('peritext-contextualizer-data-presentation'),
};

generateEpub({
  story: story,
  contextualizers,
  template: template,
  locale: exampleLocale,
  additionalStylesheets: [
    templateCss
  ],
  tempDirPath: path.resolve(__dirname + '/temp'),
  outputDirPath: path.resolve(__dirname + '/examples')
});