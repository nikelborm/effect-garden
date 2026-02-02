// Copied from https://github.com/castlabs/prettier-tsdoc-plugin/blob/89fba745209e7af8dc51bfccb0b7fc22c8506e34/src/parser-config.ts

import {
  type ITSDocTagDefinitionParameters,
  TSDocConfiguration,
  TSDocTagDefinition,
  TSDocTagSyntaxKind,
} from '@microsoft/tsdoc'

/**
 * Creates a TSDoc configuration with core tags plus extended TypeDoc/AEDoc tags
 * as specified in the context.md specification.
 */
export function createTSDocConfiguration(
  extraTags: string[] = [],
): TSDocConfiguration {
  const configuration = new TSDocConfiguration()

  // Define extended tags that we want to add (only if not already defined)
  const extendedTags = [
    // Block tags from TypeDoc/AEDoc
    {
      tagName: '@category',
      syntaxKind: TSDocTagSyntaxKind.BlockTag,
      allowMultiple: false,
    },
    {
      tagName: '@categoryDescription',
      syntaxKind: TSDocTagSyntaxKind.BlockTag,
      allowMultiple: false,
    },
    {
      tagName: '@group',
      syntaxKind: TSDocTagSyntaxKind.BlockTag,
      allowMultiple: false,
    },
    {
      tagName: '@groupDescription',
      syntaxKind: TSDocTagSyntaxKind.BlockTag,
      allowMultiple: false,
    },
    {
      tagName: '@default',
      syntaxKind: TSDocTagSyntaxKind.BlockTag,
      allowMultiple: false,
    },
    {
      tagName: '@document',
      syntaxKind: TSDocTagSyntaxKind.BlockTag,
      allowMultiple: false,
    },
    {
      tagName: '@enum',
      syntaxKind: TSDocTagSyntaxKind.BlockTag,
      allowMultiple: false,
    },
    {
      tagName: '@expandType',
      syntaxKind: TSDocTagSyntaxKind.BlockTag,
      allowMultiple: false,
    },
    {
      tagName: '@import',
      syntaxKind: TSDocTagSyntaxKind.BlockTag,
      allowMultiple: true,
    },
    {
      tagName: '@inlineType',
      syntaxKind: TSDocTagSyntaxKind.BlockTag,
      allowMultiple: false,
    },
    {
      tagName: '@license',
      syntaxKind: TSDocTagSyntaxKind.BlockTag,
      allowMultiple: false,
    },
    {
      tagName: '@module',
      syntaxKind: TSDocTagSyntaxKind.BlockTag,
      allowMultiple: false,
    },
    {
      tagName: '@preventExpand',
      syntaxKind: TSDocTagSyntaxKind.ModifierTag,
      allowMultiple: false,
    },
    {
      tagName: '@preventInline',
      syntaxKind: TSDocTagSyntaxKind.ModifierTag,
      allowMultiple: false,
    },
    {
      tagName: '@property',
      syntaxKind: TSDocTagSyntaxKind.BlockTag,
      allowMultiple: true,
    },
    {
      tagName: '@prop',
      syntaxKind: TSDocTagSyntaxKind.BlockTag,
      allowMultiple: true,
    },
    {
      tagName: '@return',
      syntaxKind: TSDocTagSyntaxKind.BlockTag,
      allowMultiple: false,
    },
    {
      tagName: '@see',
      syntaxKind: TSDocTagSyntaxKind.BlockTag,
      allowMultiple: true,
    },
    {
      tagName: '@since',
      syntaxKind: TSDocTagSyntaxKind.BlockTag,
      allowMultiple: false,
    },
    {
      tagName: '@sortStrategy',
      syntaxKind: TSDocTagSyntaxKind.BlockTag,
      allowMultiple: false,
    },
    {
      tagName: '@summary',
      syntaxKind: TSDocTagSyntaxKind.BlockTag,
      allowMultiple: false,
    },
    {
      tagName: '@template',
      syntaxKind: TSDocTagSyntaxKind.BlockTag,
      allowMultiple: true,
    },
    {
      tagName: '@type',
      syntaxKind: TSDocTagSyntaxKind.BlockTag,
      allowMultiple: false,
    },
    {
      tagName: '@fileoverview',
      syntaxKind: TSDocTagSyntaxKind.BlockTag,
      allowMultiple: false,
    },

    // Modifier tags from TypeDoc/AEDoc
    {
      tagName: '@abstract',
      syntaxKind: TSDocTagSyntaxKind.ModifierTag,
      allowMultiple: false,
    },
    {
      tagName: '@alpha',
      syntaxKind: TSDocTagSyntaxKind.ModifierTag,
      allowMultiple: false,
    },
    {
      tagName: '@beta',
      syntaxKind: TSDocTagSyntaxKind.ModifierTag,
      allowMultiple: false,
    },
    {
      tagName: '@public',
      syntaxKind: TSDocTagSyntaxKind.ModifierTag,
      allowMultiple: false,
    },
    {
      tagName: '@internal',
      syntaxKind: TSDocTagSyntaxKind.ModifierTag,
      allowMultiple: false,
    },
    {
      tagName: '@experimental',
      syntaxKind: TSDocTagSyntaxKind.ModifierTag,
      allowMultiple: false,
    },
    {
      tagName: '@event',
      syntaxKind: TSDocTagSyntaxKind.ModifierTag,
      allowMultiple: false,
    },
    {
      tagName: '@eventProperty',
      syntaxKind: TSDocTagSyntaxKind.ModifierTag,
      allowMultiple: false,
    },
    {
      tagName: '@hidden',
      syntaxKind: TSDocTagSyntaxKind.ModifierTag,
      allowMultiple: false,
    },
    {
      tagName: '@inline',
      syntaxKind: TSDocTagSyntaxKind.ModifierTag,
      allowMultiple: false,
    },
    {
      tagName: '@override',
      syntaxKind: TSDocTagSyntaxKind.ModifierTag,
      allowMultiple: false,
    },
    {
      tagName: '@readonly',
      syntaxKind: TSDocTagSyntaxKind.ModifierTag,
      allowMultiple: false,
    },
    {
      tagName: '@sealed',
      syntaxKind: TSDocTagSyntaxKind.ModifierTag,
      allowMultiple: false,
    },
    {
      tagName: '@virtual',
      syntaxKind: TSDocTagSyntaxKind.ModifierTag,
      allowMultiple: false,
    },

    // Inline tags (some may already be in core)
    {
      tagName: '@code',
      syntaxKind: TSDocTagSyntaxKind.InlineTag,
      allowMultiple: true,
    },
    {
      tagName: '@linkcode',
      syntaxKind: TSDocTagSyntaxKind.InlineTag,
      allowMultiple: true,
    },
    {
      tagName: '@linkplain',
      syntaxKind: TSDocTagSyntaxKind.InlineTag,
      allowMultiple: true,
    },
    {
      tagName: '@label',
      syntaxKind: TSDocTagSyntaxKind.InlineTag,
      allowMultiple: true,
    },
    {
      tagName: '@include',
      syntaxKind: TSDocTagSyntaxKind.InlineTag,
      allowMultiple: true,
    },
    {
      tagName: '@includeCode',
      syntaxKind: TSDocTagSyntaxKind.InlineTag,
      allowMultiple: true,
    },
  ] satisfies ITSDocTagDefinitionParameters[]

  // Add tags only if they don't already exist
  const tagsToAdd: TSDocTagDefinition[] = []
  for (const tagSpec of extendedTags) {
    if (!configuration.tryGetTagDefinition(tagSpec.tagName)) {
      tagsToAdd.push(new TSDocTagDefinition(tagSpec))
    }
  }

  if (tagsToAdd.length > 0) {
    configuration.addTagDefinitions(tagsToAdd)
  }

  // Add any extra tags provided by the user
  const extraTagsToAdd: TSDocTagDefinition[] = []
  for (const tagName of extraTags) {
    if (!configuration.tryGetTagDefinition(tagName)) {
      extraTagsToAdd.push(
        new TSDocTagDefinition({
          tagName,
          syntaxKind: TSDocTagSyntaxKind.BlockTag,
          allowMultiple: false,
        }),
      )
    }
  }

  if (extraTagsToAdd.length > 0) {
    configuration.addTagDefinitions(extraTagsToAdd)
  }

  return configuration
}
