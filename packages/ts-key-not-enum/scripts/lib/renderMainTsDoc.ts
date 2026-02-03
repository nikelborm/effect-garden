import {
  DocBlock,
  DocBlockTag,
  DocComment,
  DocParagraph,
  DocPlainText,
  StandardTags,
  TSDocConfiguration,
} from '@microsoft/tsdoc'

const configuration = new TSDocConfiguration()

const moduleBlockTag = new DocBlockTag({
  configuration,
  tagName: '@module',
})

// @ts-expect-error hack to render module declaration as a single line
moduleBlockTag._tagNameWithUpperCase =
  StandardTags.defaultValue.tagNameWithUpperCase

const fileBlockTag = new DocBlockTag({ configuration, tagName: '@file' })
const generatedBlock = new DocBlock({
  configuration,
  blockTag: new DocBlockTag({ configuration, tagName: '@generated' }),
})

const makeModuleBlock = (moduleName: string) => {
  const moduleBlock = new DocBlock({
    configuration,
    blockTag: moduleBlockTag,
  })
  moduleBlock.content.appendNodeInParagraph(
    new DocPlainText({ configuration, text: moduleName }),
  )
  return moduleBlock
}

const makeFileBlock = () =>
  new DocBlock({ configuration, blockTag: fileBlockTag })

const makeParagraphsFromMainLines = (main: string[]) =>
  main
    .flatMap(e => e.split('\n'))
    .filter(Boolean)
    .map(
      text =>
        new DocParagraph({ configuration }, [
          new DocPlainText({ configuration, text }),
        ]),
    )

export const renderReexportModuleDocComment = (main: string[]) => {
  const docComment = new DocComment({ configuration })

  docComment.summarySection.appendNodes(makeParagraphsFromMainLines(main))

  docComment.appendCustomBlock(generatedBlock)

  return docComment
}

export const renderFileHeaderTsDocString = (
  main: string[],
  moduleName: string,
) => {
  const docComment = new DocComment({ configuration })

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
