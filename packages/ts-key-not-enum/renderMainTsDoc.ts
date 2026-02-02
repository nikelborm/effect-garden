import * as tsdoc from '@microsoft/tsdoc'

const configuration = new tsdoc.TSDocConfiguration()
const generatedBlockTag = new tsdoc.DocBlockTag({
  configuration,
  tagName: '@generated',
})
const fileBlockTag = new tsdoc.DocBlockTag({ configuration, tagName: '@file' })

const generatedBlock = new tsdoc.DocBlock({
  configuration,
  blockTag: generatedBlockTag,
})

export const renderMainTsDoc = (main: string[]) => {
  const fileBlock = new tsdoc.DocBlock({
    configuration,
    blockTag: fileBlockTag,
  })

  for (const text of main.flatMap(e => e.split('\n')).filter(Boolean)) {
    fileBlock.content.appendNode(
      new tsdoc.DocParagraph({ configuration }, [
        new tsdoc.DocPlainText({ configuration, text }),
      ]),
    )
  }

  const docComment = new tsdoc.DocComment({ configuration })
  docComment.appendCustomBlock(generatedBlock)
  docComment.appendCustomBlock(fileBlock)

  return docComment.emitAsTsdoc()
}
