import * as tsdoc from '@microsoft/tsdoc'

import { createTSDocConfiguration } from '../../tsdocDefinition.ts'

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

const makeModuleBlock = (moduleName: string) => {
  const moduleBlock = new tsdoc.DocBlock({
    configuration,
    blockTag: moduleBlockTag,
  })
  moduleBlock.content.appendNodeInParagraph(
    new tsdoc.DocPlainText({ configuration, text: moduleName }),
  )
  return moduleBlock
}

const makeFileBlock = () =>
  new tsdoc.DocBlock({ configuration, blockTag: fileBlockTag })

const makeParagraphsFromMainLines = (main: string[]) =>
  main
    .flatMap(e => e.split('\n'))
    .filter(Boolean)
    .map(
      text =>
        new tsdoc.DocParagraph({ configuration }, [
          new tsdoc.DocPlainText({ configuration, text }),
        ]),
    )

export const renderReexportModuleDocComment = (main: string[]) => {
  const docComment = new tsdoc.DocComment({ configuration })

  docComment.summarySection.appendNodes(makeParagraphsFromMainLines(main))

  docComment.appendCustomBlock(generatedBlock)

  return docComment
}

export const renderFileHeaderTsDocString = (
  main: string[],
  moduleName: string,
) => {
  const docComment = new tsdoc.DocComment({ configuration })

  const moduleBlock = makeModuleBlock(moduleName)

  const fileBlock = makeFileBlock()
  fileBlock.content.appendNodes(makeParagraphsFromMainLines(main))

  docComment.appendCustomBlock(fileBlock)
  docComment.appendCustomBlock(moduleBlock)
  docComment.appendCustomBlock(generatedBlock)

  return docComment.emitAsTsdoc()
}

export const renderMainModuleTsDocString = (main: string[]) => {
  const docComment = renderReexportModuleDocComment(main)

  return docComment.emitAsTsdoc()
}
