import React from 'react';
import ReactDOMServer from 'react-dom/server';
import {writeFileSync} from 'fs';
import Epub from 'epub-gen';

/**
 * Custom mentions and link elements that match 
 * epub weird habits
 */

const MentionComponent = ({
  href,
  target,
  children,
  sectionId = '',
  ...props,
}) => {
  const finalHref = sectionId + '.xhtml' + href;
  return (
    <a href={finalHref} target={target} {...props}>
      *
    </a>
  );
}

const SectionLinkComponent = ({
  target,
  children,
  sectionId = '',
  ...props,
}) => {
  const finalHref = sectionId + '.xhtml';
  return (
    <a href={finalHref}>
      {children}*
    </a>
  );
};

const LinkComponent = ({
  href,
  target,
  children,
  sectionId = '',
  ...props,
}) => {
  const finalHref = sectionId + '.xhtml' + href;
  return (
    <a href={finalHref} target={target} {...props}>
      {children}
    </a>
  );
};


const ReferenceLink = ({
  href,
  target,
  children,
  ...props,
}) => {
  const finalHref = 'references.xhtml' + href;
  return (
    <a href={finalHref} target={target} {...props}>
      {children}
    </a>
  );
};

const GlossaryLink = ({
  href,
  target,
  children,
  ...props,
}) => {
  const finalHref = 'glossary.xhtml' + href;
  return (
    <a href={finalHref} target={target} {...props}>
      {children}
    </a>
  );
};

const NoteLink = ({
  href,
  target,
  children,
  ...props,
}) => {
  const finalHref = 'notes.xhtml' + href;
  return (
    <a href={finalHref} target={target} {...props}>
      {children}
    </a>
  );
};



function generateEpub ({
  story,
  template,
  contextualizers = {},
  locale,
  outputDirPath = './output',
  tempDirPath = './temp',
  additionalStylesheets = [],
}, callback) {
  const id = story.id;
  const {
    DecoratedSection,
    References,
    Glossary,
    AuthorsIndex,
    DecoratedEndNotes,
    stylesheet = ''
  } = template;

  // overriding notes positions
  story.settings.options.staticNotesPosition = 'end';

  let css = Object.keys(contextualizers).reduce((result, type) => {
    return result + '\n' + (contextualizers[type] ? contextualizers[type].defaultCss : '');
  }, stylesheet) + '\n' 
  + additionalStylesheets.join('\n') ;

  const cssUser = story.settings.css.codex.css || '';
  const cssMode = story.settings.css.codex.mode;
  if (cssMode === 'replace') {
    css = cssUser;
  } else if (cssMode === 'merge') {
    css = css + '\n\n' + cssUser;
  }

  let coverImagePath;
  let coverImageCodex = story.metadata.covers && story.metadata.covers.codex;
  if (coverImageCodex) {
    const base64Data = coverImageCodex.replace(/^data:image\/(png|jpe?g);base64,/, "");
    const ext = coverImageCodex.match(/^data:image\/(png|jpe?g);base64,/)[1];
    coverImagePath = `${tempDirPath}/${id}-cover.${ext}`;
    console.log('writing cover image at', coverImagePath);
    writeFileSync(coverImagePath, base64Data, 'base64');
  }

  const content = [
      ...story.sectionsOrder.map(sectionId => {
        const section = story.sections[sectionId];
        return {
          title: section.metadata.title,
          filename: section.id,
          author: section.metadata.authors && 
            section.metadata.authors
            .map(author => author.given + ' ' + author.family)
            .join(', '),
          data: ReactDOMServer.renderToStaticMarkup(
                <DecoratedSection 
                  locale={locale} 
                  contextualizers={contextualizers} 
                  story={story} 
                  sectionId={sectionId}
                  MentionComponent={MentionComponent}
                  ReferenceLinkComponent={ReferenceLink}
                  GlossaryLinkComponent={GlossaryLink}
                  NoteLinkComponent={NoteLink}
                  SectionLinkComponent={SectionLinkComponent}
                />
                )
        }
      }),
      // references
      Object.keys(story.resources).length ? {
        title: locale.references,
        filename: 'references',
        data: ReactDOMServer.renderToStaticMarkup(
          <References 
            locale={locale} 
            story={story} 
            LinkComponent={LinkComponent}
            MentionComponent={MentionComponent}
          />
        )
      } : undefined,
      // glossary
      Object.keys(story.contextualizers)
      .find(id => story.contextualizers[id].type === 'glossary')
      ?
      {
        title: locale.glossary,
        filename: 'glossary',
        data: ReactDOMServer.renderToStaticMarkup(
          <Glossary 
            locale={locale} 
            story={story} 
            LinkComponent={GlossaryLink}
            MentionComponent={MentionComponent}
          />
        )
      } : undefined,
      // index authors
      Object.keys(story.resources).length ? 
      {
        title: locale.authorsIndex,
        filename: 'authors',
        data: ReactDOMServer.renderToStaticMarkup(
          <AuthorsIndex 
            locale={locale} 
            story={story} 
            MentionComponent={MentionComponent}
            LinkComponent={LinkComponent}
          />
        )
      } : undefined,
      // notes
      {
        title: locale.notes,
        filename:'notes',
        data: ReactDOMServer.renderToStaticMarkup(
          <DecoratedEndNotes 
            locale={locale} 
            contextualizers={contextualizers} 
            story={story} 
            MentionComponent={MentionComponent}
            LinkComponent={LinkComponent}
            SectionLinkComponent={SectionLinkComponent}
          />
        )
      }
    ].filter(part => part !== undefined);
  const epub = {
    title: story.metadata.title,
    author: story.metadata.authors
      .map(author => author.given + ' ' + author.family)
      .join(', '),
    css,
    cover: coverImagePath,
    content,
    appendChapterTitles: false,
  }
  console.log('ready to generate the epub', `${outputDirPath}/${id}.epub`);
  return new Epub(epub, `${outputDirPath}/${id}.epub`).promise
    .then(() => {
      console.log("Ebook Generated Successfully!");
      callback(null, `${outputDirPath}/${id}.epub`);
    }, (err) => {
      console.error("Failed to generate Ebook because of ", err);
      callback(err);
    })
}

module.exports = generateEpub;