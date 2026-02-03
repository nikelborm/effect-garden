import * as tsdoc from '@microsoft/tsdoc'

import { createTSDocConfiguration } from './tsdocDefinition.ts'

const configuration = createTSDocConfiguration()

const moduleBlockTag = new tsdoc.DocBlockTag({
  configuration,
  tagName: '@module',
})

// @ts-expect-error hack to render module declaration as a single line
moduleBlockTag._tagNameWithUpperCase =
  tsdoc.StandardTags.defaultValue.tagNameWithUpperCase

const fileBlockTag = new tsdoc.DocBlockTag({ configuration, tagName: '@file' })
const generatedBlock = new tsdoc.DocBlock({
  configuration,
  blockTag: new tsdoc.DocBlockTag({ configuration, tagName: '@generated' }),
})

export const renderMainFileDocComment = (
  main: string[],
  moduleName: string,
) => {
  const docComment = renderMainModuleDocComment(main, moduleName)
  const fileBlock = new tsdoc.DocBlock({
    configuration,
    blockTag: fileBlockTag,
  })
  docComment.appendCustomBlock(fileBlock)

  return docComment
}

export const renderMainFileTsDocString = (
  main: string[],
  moduleName: string,
) => {
  const docComment = renderMainFileDocComment(main, moduleName)

  return docComment.emitAsTsdoc()
}

export const renderMainModuleDocComment = (
  main: string[],
  moduleName: string,
) => {
  const moduleBlock = new tsdoc.DocBlock({
    configuration,
    blockTag: moduleBlockTag,
  })
  moduleBlock.content.appendNode(
    new tsdoc.DocParagraph({ configuration }, [
      new tsdoc.DocPlainText({ configuration, text: moduleName }),
    ]),
  )

  const docComment = new tsdoc.DocComment({ configuration })
  docComment.summarySection = new tsdoc.DocSection(
    { configuration },
    main
      .flatMap(e => e.split('\n'))
      .filter(Boolean)
      .map(
        text =>
          new tsdoc.DocParagraph({ configuration }, [
            new tsdoc.DocPlainText({ configuration, text }),
          ]),
      ),
  )
  docComment.appendCustomBlock(generatedBlock)
  docComment.appendCustomBlock(moduleBlock)

  return docComment
}

export const renderMainModuleTsDocString = (
  main: string[],
  moduleName: string,
) => {
  const docComment = renderMainModuleDocComment(main, moduleName)

  return docComment.emitAsTsdoc()
}
