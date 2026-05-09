import * as FileSystem from '@effect/platform/FileSystem'
import * as NodeContext from '@effect/platform-node/NodeContext'
import * as Console from 'effect/Console'
import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as Logger from 'effect/Logger'
import * as Schema from 'effect/Schema'

const sessionPath =
  '/home/nikel/.claude/projects/-home-nikel-projects-extension-json-schema-offline/87a06be2-4efb-4342-85d9-dd06f80a52e7.jsonl'

declare const Bun: any

const CommonShitStructFields = {
  uuid: Schema.UUID,
  timestamp: Schema.DateFromString,
  userType: Schema.Literal('external'),
  entrypoint: Schema.Literal('cli'),
  cwd: Schema.NonEmptyTrimmedString,
  sessionId: Schema.UUID,
  version: Schema.NonEmptyTrimmedString,
  gitBranch: Schema.NonEmptyTrimmedString,
}

const usageCommon = {
  input_tokens: Schema.NonNegativeInt,
  output_tokens: Schema.NonNegativeInt,
  cache_read_input_tokens: Schema.NonNegativeInt,
  cache_creation_input_tokens: Schema.NonNegativeInt,
  cache_creation: Schema.Struct({
    ephemeral_1h_input_tokens: Schema.NonNegativeInt,
    ephemeral_5m_input_tokens: Schema.NonNegativeInt,
  }),
}

const MessageIteration = Schema.Struct({
  type: Schema.Literal('message'),
  ...usageCommon,
}).annotations({ title: 'MessageIteration' })

const Usage = Schema.Struct({
  server_tool_use: Schema.Struct({
    web_search_requests: Schema.NonNegativeInt,
    web_fetch_requests: Schema.NonNegativeInt,
  }),
  inference_geo: Schema.String,
  iterations: Schema.Array(MessageIteration),
  service_tier: Schema.Literal('standard'),
  speed: Schema.Literal('standard'),
  ...usageCommon,
}).annotations({ title: 'Usage' })

const TextContent = Schema.Struct({
  type: Schema.Literal('text'),
  text: Schema.NonEmptyTrimmedString,
}).annotations({ title: 'TextContent' })

const ToolReference = Schema.Struct({
  type: Schema.Literal('tool_reference'),
  tool_name: Schema.Literal('ExitPlanMode'),
}).annotations({ title: 'ToolReference' })

const ToolResultContent = Schema.Struct({
  type: Schema.Literal('tool_result'),
  tool_use_id: Schema.NonEmptyTrimmedString,
}).pipe(
  Schema.extend(
    Schema.Union(
      Schema.Struct({
        content: Schema.NonEmptyString,
        is_error: Schema.optionalWith(Schema.Boolean, { exact: true }),
      }),
      Schema.Struct({
        content: Schema.Array(Schema.Union(TextContent, ToolReference)),
      }),
    ),
  ),
  Schema.annotations({ title: 'ToolResultContent' }),
)

const AiTitleMessage = Schema.Struct({
  type: Schema.Literal('ai-title'),
  aiTitle: Schema.NonEmptyTrimmedString,
  sessionId: Schema.UUID,
}).annotations({ title: 'AiTitleMessage' })

const ThinkingContent = Schema.Struct({
  type: Schema.Literal('thinking'),
  thinking: Schema.String,
  signature: Schema.NonEmptyTrimmedString,
}).annotations({ title: 'ThinkingContent' })

const DirectCaller = Schema.Struct({
  type: Schema.Literal('direct'),
}).annotations({ title: 'DirectCaller' })

const AgentToolUseContent = Schema.Struct({
  type: Schema.Literal('tool_use'),
  id: Schema.NonEmptyTrimmedString,
  name: Schema.Literal('Agent'),
  input: Schema.Struct({
    description: Schema.NonEmptyTrimmedString,
    subagent_type: Schema.Literal('Explore'),
    prompt: Schema.NonEmptyTrimmedString,
  }),
  caller: DirectCaller,
}).annotations({ title: 'AgentToolUseContent' })

const WriteToolUseContent = Schema.Struct({
  type: Schema.Literal('tool_use'),
  id: Schema.NonEmptyTrimmedString,
  name: Schema.Literal('Write'),
  input: Schema.Struct({
    file_path: Schema.NonEmptyTrimmedString,
    content: Schema.NonEmptyString,
  }),
  caller: DirectCaller,
}).annotations({ title: 'WriteToolUseContent' })

const ReadToolUseContent = Schema.Struct({
  type: Schema.Literal('tool_use'),
  id: Schema.NonEmptyTrimmedString,
  name: Schema.Literal('Read'),
  input: Schema.Struct({
    file_path: Schema.NonEmptyTrimmedString,
    limit: Schema.NonNegativeInt,
    offset: Schema.optionalWith(Schema.NonNegativeInt, { exact: true }),
  }),
  caller: DirectCaller,
}).annotations({ title: 'ReadToolUseContent' })

const StructuredPatch = Schema.Struct({
  oldStart: Schema.NonNegativeInt,
  oldLines: Schema.NonNegativeInt,
  newStart: Schema.NonNegativeInt,
  newLines: Schema.NonNegativeInt,
  lines: Schema.NonEmptyArray(Schema.NonEmptyString),
}).annotations({ title: 'StructuredPatch' })

const EditToolUseResult = Schema.Struct({
  filePath: Schema.NonEmptyTrimmedString,
  oldString: Schema.NonEmptyString,
  newString: Schema.NonEmptyString,
  originalFile: Schema.NullOr(Schema.NonEmptyString),
  structuredPatch: Schema.Array(StructuredPatch),
  userModified: Schema.Boolean,
  replaceAll: Schema.Boolean,
}).annotations({ title: 'EditToolUseResult' })

const ReadToolUseResult = Schema.Struct({
  type: Schema.Literal('text'),
  file: Schema.Struct({
    filePath: Schema.NonEmptyTrimmedString,
    content: Schema.NonEmptyString,
    numLines: Schema.NonNegativeInt,
    startLine: Schema.NonNegativeInt,
    totalLines: Schema.NonNegativeInt,
  }),
}).annotations({ title: 'ReadToolUseResult' })

const EditToolUseContent = Schema.Struct({
  type: Schema.Literal('tool_use'),
  id: Schema.NonEmptyTrimmedString,
  name: Schema.Literal('Edit'),
  input: Schema.Struct({
    replace_all: Schema.Boolean,
    file_path: Schema.NonEmptyTrimmedString,
    old_string: Schema.NonEmptyString,
    new_string: Schema.NonEmptyString,
  }),
  caller: DirectCaller,
}).annotations({ title: 'EditToolUseContent' })

const BashToolUseContent = Schema.Struct({
  type: Schema.Literal('tool_use'),
  id: Schema.NonEmptyTrimmedString,
  name: Schema.Literal('Bash'),
  input: Schema.Struct({
    command: Schema.NonEmptyTrimmedString,
    description: Schema.NonEmptyTrimmedString,
    timeout: Schema.optionalWith(Schema.NonNegativeInt, { exact: true }),
  }),
  caller: DirectCaller,
}).annotations({ title: 'BashToolUseContent' })

const BashToolUseResult = Schema.Struct({
  stdout: Schema.String,
  stderr: Schema.String,
  interrupted: Schema.Boolean,
  isImage: Schema.Boolean,
  noOutputExpected: Schema.Boolean,
}).annotations({ title: 'BashToolUseResult' })

const ToolSearchToolUseContent = Schema.Struct({
  type: Schema.Literal('tool_use'),
  id: Schema.NonEmptyTrimmedString,
  name: Schema.Literal('ToolSearch'),
  input: Schema.Struct({
    query: Schema.NonEmptyTrimmedString,
    max_results: Schema.NonNegativeInt,
  }),
  caller: DirectCaller,
}).annotations({ title: 'ToolSearchToolUseContent' })

const ExitPlanModeToolUseContent = Schema.Struct({
  type: Schema.Literal('tool_use'),
  id: Schema.NonEmptyTrimmedString,
  name: Schema.Literal('ExitPlanMode'),
  input: Schema.Struct({
    plan: Schema.NonEmptyString,
    allowedPrompts: Schema.Array(
      Schema.Struct({
        tool: Schema.Literal('Bash'),
        prompt: Schema.NonEmptyTrimmedString,
      }),
    ),
    planFilePath: Schema.NonEmptyTrimmedString,
  }),
  caller: DirectCaller,
}).annotations({ title: 'ExitPlanModeToolUseContent' })

const AssistantMessageContent = Schema.Union(
  ThinkingContent,
  TextContent,
  AgentToolUseContent,
  WriteToolUseContent,
  ReadToolUseContent,
  EditToolUseContent,
  BashToolUseContent,
  ExitPlanModeToolUseContent,
  ToolSearchToolUseContent,
).annotations({ title: 'AssistantMessageContent' })

const AssistantMessage = Schema.Struct({
  type: Schema.Literal('assistant'),
  requestId: Schema.NonEmptyTrimmedString,
  parentUuid: Schema.UUID,
  isSidechain: Schema.Boolean,
  message: Schema.Struct({
    type: Schema.Literal('message'),
    id: Schema.NonEmptyTrimmedString,
    model: Schema.NonEmptyTrimmedString,
    role: Schema.Literal('assistant'),
    stop_reason: Schema.Literal('tool_use', 'end_turn'),
    stop_sequence: Schema.Null,
    stop_details: Schema.Null,
    usage: Usage,
    content: Schema.Array(AssistantMessageContent),
  }),

  slug: Schema.optionalWith(Schema.NonEmptyTrimmedString, { exact: true }),
  ...CommonShitStructFields,
}).annotations({ title: 'AssistantMessage' })

const PermissionModeMessage = Schema.Struct({
  type: Schema.Literal('permission-mode'),
  permissionMode: Schema.Literal('plan', 'acceptEdits'),
  sessionId: Schema.UUID,
}).annotations({ title: 'PermissionModeMessage' })

const FileHistorySnapshotMessage = Schema.Struct({
  type: Schema.Literal('file-history-snapshot'),
  messageId: Schema.UUID,
  snapshot: Schema.Struct({
    messageId: Schema.UUID,
    trackedFileBackups: Schema.Struct({}),
    timestamp: Schema.DateFromString,
  }),
  isSnapshotUpdate: Schema.Boolean,
}).annotations({ title: 'FileHistorySnapshotMessage' })

const ToolSearchToolUseResult = Schema.Struct({
  matches: Schema.Tuple(Schema.Literal('ExitPlanMode')),
  query: Schema.NonEmptyTrimmedString,
  total_deferred_tools: Schema.NonNegativeInt,
}).annotations({ title: 'ToolSearchToolUseResult' })

const AgentToolUseResult = Schema.Struct({
  status: Schema.Literal('completed'),
  prompt: Schema.NonEmptyString,
  agentId: Schema.NonEmptyTrimmedString,
  totalDurationMs: Schema.NonNegativeInt,
  totalTokens: Schema.NonNegativeInt,
  totalToolUseCount: Schema.NonNegativeInt,
  agentType: Schema.Literal('Explore'),
  content: Schema.Array(TextContent),
  usage: Usage,
  toolStats: Schema.Struct({
    readCount: Schema.NonNegativeInt,
    searchCount: Schema.NonNegativeInt,
    bashCount: Schema.NonNegativeInt,
    editFileCount: Schema.NonNegativeInt,
    linesAdded: Schema.NonNegativeInt,
    linesRemoved: Schema.NonNegativeInt,
    otherToolCount: Schema.NonNegativeInt,
  }),
}).annotations({ title: 'AgentToolUseResult' })

const CreateToolUseResult = Schema.Struct({
  type: Schema.Literal('create'),
  filePath: Schema.NonEmptyTrimmedString,
  content: Schema.NonEmptyString,
  originalFile: Schema.Null,
  userModified: Schema.Boolean,
  structuredPatch: Schema.Array(Schema.Struct({})),
}).annotations({ title: 'CreateToolUseResult' })

const PlanToolUseResult = Schema.Struct({
  isAgent: Schema.Boolean,
  filePath: Schema.NonEmptyTrimmedString,
  plan: Schema.NonEmptyString,
}).annotations({ title: 'PlanToolUseResult' })

const ToolUseResult = Schema.Union(
  AgentToolUseResult,
  CreateToolUseResult,
  ToolSearchToolUseResult,
  BashToolUseResult,
  EditToolUseResult,
  ReadToolUseResult,
  PlanToolUseResult,
).annotations({ title: 'ToolUseResult' })

const UserMessage = Schema.Struct({
  type: Schema.Literal('user'),
  parentUuid: Schema.NullOr(Schema.UUID),
  isSidechain: Schema.Boolean,
  promptId: Schema.UUID,
  message: Schema.Struct({
    role: Schema.Literal('user'),
    content: Schema.Union(
      Schema.NonEmptyTrimmedString,
      Schema.Array(ToolResultContent),
    ),
  }),
  sourceToolAssistantUUID: Schema.optionalWith(Schema.UUID, { exact: true }),
  toolUseResult: Schema.optionalWith(
    Schema.Union(ToolUseResult, Schema.NonEmptyTrimmedString),
    { exact: true },
  ),
  permissionMode: Schema.optionalWith(Schema.Literal('plan'), {
    exact: true,
  }),
  slug: Schema.optionalWith(Schema.NonEmptyTrimmedString, { exact: true }),
  isMeta: Schema.optionalWith(Schema.Boolean, { exact: true }),
  ...CommonShitStructFields,
}).annotations({ title: 'UserMessage' })

const DefferedToolUseDeltaAttachment = Schema.Struct({
  type: Schema.Literal('deferred_tools_delta'),
  addedNames: Schema.Array(Schema.NonEmptyTrimmedString),
  addedLines: Schema.Array(Schema.NonEmptyTrimmedString),
  removedNames: Schema.Array(Schema.NonEmptyTrimmedString),
  readdedNames: Schema.Array(Schema.NonEmptyTrimmedString),
}).annotations({ title: 'DefferedToolUseDeltaAttachment' })

const SkillListingAttachment = Schema.Struct({
  type: Schema.Literal('skill_listing'),
  content: Schema.NonEmptyTrimmedString,
  skillCount: Schema.NonNegativeInt,
  isInitial: Schema.Boolean,
}).annotations({ title: 'SkillListingAttachment' })

const McpInstructionsDeltaAttachment = Schema.Struct({
  type: Schema.Literal('mcp_instructions_delta'),
  addedNames: Schema.Array(Schema.NonEmptyTrimmedString),
  addedBlocks: Schema.Array(Schema.NonEmptyTrimmedString),
  removedNames: Schema.Array(Schema.NonEmptyTrimmedString),
}).annotations({ title: 'McpInstructionsDeltaAttachment' })

const PlanModeAttachment = Schema.Struct({
  type: Schema.Literal('plan_mode'),
  reminderType: Schema.Literal('full'),
  isSubAgent: Schema.Boolean,
  planFilePath: Schema.NonEmptyTrimmedString,
  planExists: Schema.Boolean,
}).annotations({ title: 'PlanModeAttachment' })

const PlanModeExitAttachment = Schema.Struct({
  type: Schema.Literal('plan_mode_exit'),
  planFilePath: Schema.NonEmptyTrimmedString,
  planExists: Schema.Boolean,
}).annotations({ title: 'PlanModeExitAttachment' })

const TaskReminderAttachment = Schema.Struct({
  type: Schema.Literal('task_reminder'),
  content: Schema.Array(Schema.Struct({})),
  itemCount: Schema.NonNegativeInt,
}).annotations({ title: 'TaskReminderAttachment' })

const EditedTextFileAttachment = Schema.Struct({
  type: Schema.Literal('edited_text_file'),
  filename: Schema.NonEmptyTrimmedString,
  snippet: Schema.NonEmptyTrimmedString,
}).annotations({ title: 'EditedTextFileAttachment' })

const Attachment = Schema.Union(
  DefferedToolUseDeltaAttachment,
  TaskReminderAttachment,
  SkillListingAttachment,
  EditedTextFileAttachment,
  PlanModeExitAttachment,
  McpInstructionsDeltaAttachment,
  PlanModeAttachment,
).annotations({ title: 'Attachment' })

const AttachmentMessage = Schema.Struct({
  type: Schema.Literal('attachment'),
  parentUuid: Schema.UUID,
  isSidechain: Schema.Boolean,
  slug: Schema.optionalWith(Schema.NonEmptyTrimmedString, { exact: true }),
  attachment: Attachment,
  ...CommonShitStructFields,
}).annotations({ title: 'AttachmentMessage' })

const LastPromptMessage = Schema.Struct({
  type: Schema.Literal('last-prompt'),
  lastPrompt: Schema.NonEmptyTrimmedString,
  leafUuid: Schema.UUID,
  sessionId: Schema.UUID,
}).annotations({ title: 'LastPromptMessage' })

const AgentNameMessage = Schema.Struct({
  type: Schema.Literal('agent-name'),
  agentName: Schema.NonEmptyTrimmedString,
  sessionId: Schema.UUID,
}).annotations({ title: 'AgentNameMessage' })

const ClaudeSessionMessage = Schema.Union(
  PermissionModeMessage,
  FileHistorySnapshotMessage,
  UserMessage,
  AgentNameMessage,
  AttachmentMessage,
  AiTitleMessage,
  AssistantMessage,
  LastPromptMessage,
).annotations({ title: 'ClaudeSessionMessage' })

const ClaudeSessionSchema = Schema.Array(ClaudeSessionMessage)

const decodeClaudeSessionLine = Schema.decodeUnknownEither(
  ClaudeSessionMessage,
  { onExcessProperty: 'error' },
)

const decodeClaudeSession = Schema.decodeUnknownEither(ClaudeSessionSchema, {
  onExcessProperty: 'error',
})

const walk = (asd: any): any => {}

await Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem
  const file = yield* fs.readFileString(sessionPath)
  const parsed = Bun.JSONL.parse(file) as any[]

  yield* EFunction.pipe(
    parsed,
    Effect.forEach((element, index) =>
      Effect.tapError(decodeClaudeSessionLine(element), error =>
        Effect.all([
          Console.log(`Failed at ${index}/${parsed.length}`),
          // Console.log(element.message.content[0]),
          Console.dir(element, { colors: true, compact: false, depth: null }),
          // Console.log(element),
          Console.log(error.message),
          // Console.log(ParseResult.ArrayFormatter.formatErrorSync(error)),
        ]),
      ),
    ),
    Effect.andThen(Effect.log('Success 🎉')),
    Effect.ignore,
  )
}).pipe(
  Effect.provide(NodeContext.layer),
  Effect.provide(
    Logger.replace(
      Logger.defaultLogger,
      Logger.prettyLogger({ colors: true, mode: 'browser' }),
    ),
  ),

  Effect.runPromise,
)
