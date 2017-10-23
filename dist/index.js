'use strict';

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _objectWithoutProperties2 = require('babel-runtime/helpers/objectWithoutProperties');

var _objectWithoutProperties3 = _interopRequireDefault(_objectWithoutProperties2);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _server = require('react-dom/server');

var _server2 = _interopRequireDefault(_server);

var _fs = require('fs');

var _epubGen = require('epub-gen');

var _epubGen2 = _interopRequireDefault(_epubGen);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Custom mentions and link elements that match 
 * epub weird habits
 */

var MentionComponent = function MentionComponent(_ref) {
  var href = _ref.href,
      target = _ref.target,
      children = _ref.children,
      _ref$sectionId = _ref.sectionId,
      sectionId = _ref$sectionId === undefined ? '' : _ref$sectionId,
      props = (0, _objectWithoutProperties3.default)(_ref, ['href', 'target', 'children', 'sectionId']);

  var finalHref = sectionId + '.xhtml' + href;
  return _react2.default.createElement(
    'a',
    (0, _extends3.default)({ href: finalHref, target: target }, props),
    '*'
  );
};

var LinkComponent = function LinkComponent(_ref2) {
  var href = _ref2.href,
      target = _ref2.target,
      children = _ref2.children,
      _ref2$sectionId = _ref2.sectionId,
      sectionId = _ref2$sectionId === undefined ? '' : _ref2$sectionId,
      props = (0, _objectWithoutProperties3.default)(_ref2, ['href', 'target', 'children', 'sectionId']);

  var finalHref = sectionId + '.xhtml' + href;
  return _react2.default.createElement(
    'a',
    (0, _extends3.default)({ href: finalHref, target: target }, props),
    children
  );
};

var ReferenceLink = function ReferenceLink(_ref3) {
  var href = _ref3.href,
      target = _ref3.target,
      children = _ref3.children,
      props = (0, _objectWithoutProperties3.default)(_ref3, ['href', 'target', 'children']);

  var finalHref = 'references.xhtml' + href;
  return _react2.default.createElement(
    'a',
    (0, _extends3.default)({ href: finalHref, target: target }, props),
    children
  );
};

var GlossaryLink = function GlossaryLink(_ref4) {
  var href = _ref4.href,
      target = _ref4.target,
      children = _ref4.children,
      props = (0, _objectWithoutProperties3.default)(_ref4, ['href', 'target', 'children']);

  var finalHref = 'glossary.xhtml' + href;
  return _react2.default.createElement(
    'a',
    (0, _extends3.default)({ href: finalHref, target: target }, props),
    children
  );
};

var NoteLink = function NoteLink(_ref5) {
  var href = _ref5.href,
      target = _ref5.target,
      children = _ref5.children,
      props = (0, _objectWithoutProperties3.default)(_ref5, ['href', 'target', 'children']);

  var finalHref = 'notes.xhtml' + href;
  return _react2.default.createElement(
    'a',
    (0, _extends3.default)({ href: finalHref, target: target }, props),
    children
  );
};

function generateEpub(_ref6, callback) {
  var story = _ref6.story,
      template = _ref6.template,
      _ref6$contextualizers = _ref6.contextualizers,
      contextualizers = _ref6$contextualizers === undefined ? {} : _ref6$contextualizers,
      locale = _ref6.locale,
      _ref6$outputDirPath = _ref6.outputDirPath,
      outputDirPath = _ref6$outputDirPath === undefined ? './output' : _ref6$outputDirPath,
      _ref6$tempDirPath = _ref6.tempDirPath,
      tempDirPath = _ref6$tempDirPath === undefined ? './temp' : _ref6$tempDirPath,
      _ref6$additionalStyle = _ref6.additionalStylesheets,
      additionalStylesheets = _ref6$additionalStyle === undefined ? [] : _ref6$additionalStyle;

  console.log('generating epub for story', story.id);
  var id = story.id;
  var DecoratedSection = template.DecoratedSection,
      References = template.References,
      Glossary = template.Glossary,
      AuthorsIndex = template.AuthorsIndex,
      DecoratedEndNotes = template.DecoratedEndNotes,
      _template$stylesheet = template.stylesheet,
      stylesheet = _template$stylesheet === undefined ? '' : _template$stylesheet;

  // overriding notes positions

  story.settings.options.staticNotesPosition = 'end';

  var css = (0, _keys2.default)(contextualizers).reduce(function (result, type) {
    return result + '\n' + (contextualizers[type] ? contextualizers[type].defaultCss : '');
  }, stylesheet) + '\n' + additionalStylesheets.join('\n') + (story.settings.css.codex || '');

  var coverImagePath = void 0;
  var coverImageCodex = story.metadata.covers && story.metadata.covers.codex;
  if (coverImageCodex) {
    var base64Data = coverImageCodex.replace(/^data:image\/(png|jpe?g);base64,/, "");
    var ext = coverImageCodex.match(/^data:image\/(png|jpe?g);base64,/)[1];
    coverImagePath = tempDirPath + '/' + id + '-cover.' + ext;
    console.log('writing cover image at', coverImagePath);
    (0, _fs.writeFileSync)(coverImagePath, base64Data, 'base64');
  }

  var content = [].concat((0, _toConsumableArray3.default)(story.sectionsOrder.map(function (sectionId) {
    var section = story.sections[sectionId];
    return {
      title: section.metadata.title,
      filename: section.id,
      author: section.metadata.authors && section.metadata.authors.map(function (author) {
        return author.given + ' ' + author.family;
      }).join(', '),
      data: _server2.default.renderToStaticMarkup(_react2.default.createElement(DecoratedSection, {
        locale: locale,
        contextualizers: contextualizers,
        story: story,
        sectionId: sectionId,
        MentionComponent: MentionComponent,
        ReferenceLinkComponent: ReferenceLink,
        GlossaryLinkComponent: GlossaryLink,
        NoteLinkComponent: NoteLink
      }))
    };
  })), [
  // references
  (0, _keys2.default)(story.resources).length ? {
    title: locale.references,
    filename: 'references',
    data: _server2.default.renderToStaticMarkup(_react2.default.createElement(References, {
      locale: locale,
      story: story,
      LinkComponent: LinkComponent,
      MentionComponent: MentionComponent
    }))
  } : undefined,
  // glossary
  (0, _keys2.default)(story.contextualizers).find(function (id) {
    return story.contextualizers[id].type === 'glossary';
  }) ? {
    title: locale.glossary,
    filename: 'glossary',
    data: _server2.default.renderToStaticMarkup(_react2.default.createElement(Glossary, {
      locale: locale,
      story: story,
      LinkComponent: GlossaryLink,
      MentionComponent: MentionComponent
    }))
  } : undefined,
  // index authors
  (0, _keys2.default)(story.resources).length ? {
    title: locale.authorsIndex,
    filename: 'authors',
    data: _server2.default.renderToStaticMarkup(_react2.default.createElement(AuthorsIndex, {
      locale: locale,
      story: story,
      MentionComponent: MentionComponent,
      LinkComponent: LinkComponent
    }))
  } : undefined,
  // notes
  {
    title: locale.notes,
    filename: 'notes',
    data: _server2.default.renderToStaticMarkup(_react2.default.createElement(DecoratedEndNotes, {
      locale: locale,
      contextualizers: contextualizers,
      story: story,
      MentionComponent: MentionComponent,
      LinkComponent: LinkComponent
    }))
  }]).filter(function (part) {
    return part !== undefined;
  });

  var epub = {
    title: story.metadata.title,
    author: story.metadata.authors.map(function (author) {
      return author.given + ' ' + author.family;
    }).join(', '),
    css: css,
    cover: coverImagePath,
    content: content,
    appendChapterTitles: false
  };
  console.log('ready to generate the epub', outputDirPath + '/' + id + '.epub');
  return new _epubGen2.default(epub, outputDirPath + '/' + id + '.epub').promise.then(function () {
    console.log("Ebook Generated Successfully!");
    callback(null, outputDirPath + '/' + id + '.epub');
  }, function (err) {
    console.error("Failed to generate Ebook because of ", err);
    callback(err);
  });
}

module.exports = generateEpub;
