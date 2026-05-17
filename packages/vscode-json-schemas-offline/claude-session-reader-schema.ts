import {
  Array as Array$,
  annotations,
  Boolean as Boolean$,
  DateFromString,
  decodeUnknownEither,
  extend,
  Literal,
  NonEmptyArray,
  NonEmptyString,
  NonEmptyTrimmedString,
  NonNegativeInt,
  Null,
  NullOr,
  optionalWith,
  type Schema,
  String as String$,
  StringFromBase64,
  Struct,
  Tuple,
  Union,
  UUID,
} from 'effect/Schema'

export const CommonShitStructFields = {
  uuid: UUID,
  timestamp: DateFromString,
  userType: Literal('external'),
  entrypoint: Literal('cli'),
  cwd: NonEmptyTrimmedString,
  sessionId: UUID,
  version: NonEmptyTrimmedString,
  gitBranch: NonEmptyTrimmedString,
  parentUuid: NullOr(UUID),
  isSidechain: Boolean$,
  isMeta: optionalWith(Boolean$, { exact: true }),
  slug: optionalWith(NonEmptyTrimmedString, { exact: true }),
}

export const usageCommon = {
  input_tokens: NonNegativeInt,
  output_tokens: NonNegativeInt,
  cache_read_input_tokens: NonNegativeInt,
  cache_creation_input_tokens: NonNegativeInt,
  cache_creation: Struct({
    ephemeral_1h_input_tokens: NonNegativeInt,
    ephemeral_5m_input_tokens: NonNegativeInt,
  }),
}

export const DumbAssistantMessage = Struct({
  id: UUID,
  container: Null,
  model: Literal('<synthetic>'),
  role: Literal('assistant'),
  stop_reason: Literal('stop_sequence'),
  stop_sequence: Literal(''),
  type: Literal('message'),
  usage: Struct({
    input_tokens: Literal(0),
    output_tokens: Literal(0),
    cache_creation_input_tokens: Literal(0),
    cache_read_input_tokens: Literal(0),
    server_tool_use: Struct({
      web_search_requests: Literal(0),
      web_fetch_requests: Literal(0),
    }),
    service_tier: Null,
    cache_creation: Struct({
      ephemeral_1h_input_tokens: Literal(0),
      ephemeral_5m_input_tokens: Literal(0),
    }),
    inference_geo: Null,
    iterations: Null,
    speed: Null,
  }),
  content: Tuple(
    Struct({ type: Literal('text'), text: Literal('No response requested.') }),
  ),
  context_management: Null,
}).annotations({ title: 'DumbAssistantMessage' })

export const MessageIteration = Struct({
  type: Literal('message'),
  ...usageCommon,
}).annotations({ title: 'MessageIteration' })

export const Usage = Struct({
  server_tool_use: Struct({
    web_search_requests: NonNegativeInt,
    web_fetch_requests: NonNegativeInt,
  }),
  inference_geo: String$,
  iterations: Array$(MessageIteration),
  service_tier: Literal('standard'),
  speed: Literal('standard'),
  ...usageCommon,
}).annotations({ title: 'Usage' })

export const TextContent = Struct({
  type: Literal('text'),
  text: NonEmptyTrimmedString,
}).annotations({ title: 'TextContent' })

export const ToolReference = Struct({
  type: Literal('tool_reference'),
  tool_name: Literal('ExitPlanMode'),
}).annotations({ title: 'ToolReference' })

export const ToolResultContent = Struct({
  type: Literal('tool_result'),
  tool_use_id: NonEmptyTrimmedString,
}).pipe(
  extend(
    Union(
      Struct({
        content: NonEmptyString,
        is_error: optionalWith(Boolean$, { exact: true }),
      }),
      Struct({ content: Array$(Union(TextContent, ToolReference)) }),
    ),
  ),
  annotations({ title: 'ToolResultContent' }),
)

export const AiTitleMessage = Struct({
  type: Literal('ai-title'),
  aiTitle: NonEmptyTrimmedString,
  sessionId: UUID,
}).annotations({ title: 'AiTitleMessage' })

export const ThinkingContent = Struct({
  type: Literal('thinking'),
  thinking: String$,
  signature: StringFromBase64,
}).annotations({ title: 'ThinkingContent' })

export const DirectCaller = Struct({ type: Literal('direct') }).annotations({
  title: 'DirectCaller',
})

export const AgentToolUseContent = Struct({
  type: Literal('tool_use'),
  id: NonEmptyTrimmedString,
  name: Literal('Agent'),
  input: Struct({
    description: NonEmptyTrimmedString,
    subagent_type: Literal('Explore'),
    prompt: NonEmptyTrimmedString,
  }),
  caller: DirectCaller,
}).annotations({ title: 'AgentToolUseContent' })

export const WriteToolUseContent = Struct({
  type: Literal('tool_use'),
  id: NonEmptyTrimmedString,
  name: Literal('Write'),
  input: Struct({ file_path: NonEmptyTrimmedString, content: NonEmptyString }),
  caller: DirectCaller,
}).annotations({ title: 'WriteToolUseContent' })

export const ReadToolUseContent = Struct({
  type: Literal('tool_use'),
  id: NonEmptyTrimmedString,
  name: Literal('Read'),
  input: Struct({
    file_path: NonEmptyTrimmedString,
    limit: optionalWith(NonNegativeInt, { exact: true }),
    offset: optionalWith(NonNegativeInt, { exact: true }),
  }),
  caller: DirectCaller,
}).annotations({ title: 'ReadToolUseContent' })

export const StructuredPatch = Struct({
  oldStart: NonNegativeInt,
  oldLines: NonNegativeInt,
  newStart: NonNegativeInt,
  newLines: NonNegativeInt,
  lines: NonEmptyArray(NonEmptyString),
}).annotations({ title: 'StructuredPatch' })

export const EditToolUseResult = Struct({
  type: optionalWith(Literal('create', 'update'), { exact: true }),
  filePath: NonEmptyTrimmedString,
  content: optionalWith(NonEmptyString, { exact: true }),
  oldString: optionalWith(NonEmptyString, { exact: true }),
  newString: optionalWith(NonEmptyString, { exact: true }),
  originalFile: NullOr(NonEmptyString),
  structuredPatch: Array$(StructuredPatch),
  userModified: Boolean$,
  replaceAll: optionalWith(Boolean$, { exact: true }),
}).annotations({ title: 'EditToolUseResult' })

export const ReadToolUseResult = Struct({
  type: Literal('text'),
  file: Struct({
    filePath: NonEmptyTrimmedString,
    content: NonEmptyString,
    numLines: NonNegativeInt,
    startLine: NonNegativeInt,
    totalLines: NonNegativeInt,
  }),
}).annotations({ title: 'ReadToolUseResult' })

export const EditToolUseContent = Struct({
  type: Literal('tool_use'),
  id: NonEmptyTrimmedString,
  name: Literal('Edit'),
  input: Struct({
    replace_all: Boolean$,
    file_path: NonEmptyTrimmedString,
    old_string: NonEmptyString,
    new_string: NonEmptyString,
  }),
  caller: DirectCaller,
}).annotations({ title: 'EditToolUseContent' })

export const BashToolUseContent = Struct({
  type: Literal('tool_use'),
  id: NonEmptyTrimmedString,
  name: Literal('Bash'),
  input: Struct({
    command: NonEmptyTrimmedString,
    description: NonEmptyTrimmedString,
    timeout: optionalWith(NonNegativeInt, { exact: true }),
  }),
  caller: DirectCaller,
}).annotations({ title: 'BashToolUseContent' })

export const BashToolUseResult = Struct({
  stdout: String$,
  stderr: String$,
  interrupted: Boolean$,
  isImage: Boolean$,
  returnCodeInterpretation: optionalWith(NonEmptyTrimmedString, {
    exact: true,
  }),
  noOutputExpected: Boolean$,
}).annotations({ title: 'BashToolUseResult' })

export const ToolSearchToolUseContent = Struct({
  type: Literal('tool_use'),
  id: NonEmptyTrimmedString,
  name: Literal('ToolSearch'),
  input: Struct({ query: NonEmptyTrimmedString, max_results: NonNegativeInt }),
  caller: DirectCaller,
}).annotations({ title: 'ToolSearchToolUseContent' })

export const ExitPlanModeToolUseContent = Struct({
  type: Literal('tool_use'),
  id: NonEmptyTrimmedString,
  name: Literal('ExitPlanMode'),
  input: Struct({
    plan: NonEmptyString,
    allowedPrompts: Array$(
      Struct({ tool: Literal('Bash'), prompt: NonEmptyTrimmedString }),
    ),
    planFilePath: NonEmptyTrimmedString,
  }),
  caller: DirectCaller,
}).annotations({ title: 'ExitPlanModeToolUseContent' })

export const AssistantMessageContent = Union(
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

export const AssistantMessage = Struct({
  type: Literal('assistant'),
  requestId: optionalWith(NonEmptyTrimmedString, { exact: true }),
  isApiErrorMessage: optionalWith(Boolean$, { exact: true }),
  message: Union(
    DumbAssistantMessage,
    Struct({
      type: Literal('message'),
      id: NonEmptyTrimmedString,
      model: NonEmptyTrimmedString,
      role: Literal('assistant'),
      stop_reason: Literal('tool_use', 'end_turn'),
      stop_sequence: Null,
      stop_details: Null,
      usage: Usage,
      content: Array$(AssistantMessageContent),
    }).annotations({ title: 'UsualAssistantMessage' }),
  ),
  ...CommonShitStructFields,
}).annotations({ title: 'AssistantMessage' })

export const PermissionModeMessage = Struct({
  type: Literal('permission-mode'),
  permissionMode: Literal('plan', 'acceptEdits', 'default'),
  sessionId: UUID,
}).annotations({ title: 'PermissionModeMessage' })

export const FileHistorySnapshotMessage = Struct({
  type: Literal('file-history-snapshot'),
  messageId: UUID,
  snapshot: Struct({
    messageId: UUID,
    trackedFileBackups: Struct({}),
    timestamp: DateFromString,
  }),
  isSnapshotUpdate: Boolean$,
}).annotations({ title: 'FileHistorySnapshotMessage' })

export const ToolSearchToolUseResult = Struct({
  matches: Tuple(Literal('ExitPlanMode')),
  query: NonEmptyTrimmedString,
  total_deferred_tools: NonNegativeInt,
}).annotations({ title: 'ToolSearchToolUseResult' })

export const AgentToolUseResult = Struct({
  status: Literal('completed'),
  prompt: NonEmptyString,
  agentId: NonEmptyTrimmedString,
  totalDurationMs: NonNegativeInt,
  totalTokens: NonNegativeInt,
  totalToolUseCount: NonNegativeInt,
  agentType: Literal('Explore'),
  content: Array$(TextContent),
  usage: Usage,
  toolStats: Struct({
    readCount: NonNegativeInt,
    searchCount: NonNegativeInt,
    bashCount: NonNegativeInt,
    editFileCount: NonNegativeInt,
    linesAdded: NonNegativeInt,
    linesRemoved: NonNegativeInt,
    otherToolCount: NonNegativeInt,
  }),
}).annotations({ title: 'AgentToolUseResult' })

export const PlanToolUseResult = Struct({
  isAgent: Boolean$,
  filePath: NonEmptyTrimmedString,
  plan: NonEmptyString,
}).annotations({ title: 'PlanToolUseResult' })

export const ToolUseResult = Union(
  AgentToolUseResult,
  ToolSearchToolUseResult,
  BashToolUseResult,
  EditToolUseResult,
  ReadToolUseResult,
  PlanToolUseResult,
).annotations({ title: 'ToolUseResult' })

export const UserMessage = Struct({
  type: Literal('user'),
  promptId: UUID,
  message: Struct({
    role: Literal('user'),
    content: Union(NonEmptyTrimmedString, Array$(ToolResultContent)),
  }),
  sourceToolAssistantUUID: optionalWith(UUID, { exact: true }),
  toolUseResult: optionalWith(Union(ToolUseResult, NonEmptyTrimmedString), {
    exact: true,
  }),
  permissionMode: optionalWith(Literal('plan', 'acceptEdits'), { exact: true }),
  ...CommonShitStructFields,
}).annotations({ title: 'UserMessage' })

export const DefferedToolUseDeltaAttachment = Struct({
  type: Literal('deferred_tools_delta'),
  addedNames: Array$(NonEmptyTrimmedString),
  addedLines: Array$(NonEmptyTrimmedString),
  removedNames: Array$(NonEmptyTrimmedString),
  readdedNames: Array$(NonEmptyTrimmedString),
}).annotations({ title: 'DefferedToolUseDeltaAttachment' })

export const SkillListingAttachment = Struct({
  type: Literal('skill_listing'),
  content: NonEmptyTrimmedString,
  skillCount: NonNegativeInt,
  isInitial: Boolean$,
}).annotations({ title: 'SkillListingAttachment' })

export const McpInstructionsDeltaAttachment = Struct({
  type: Literal('mcp_instructions_delta'),
  addedNames: Array$(NonEmptyTrimmedString),
  addedBlocks: Array$(NonEmptyTrimmedString),
  removedNames: Array$(NonEmptyTrimmedString),
}).annotations({ title: 'McpInstructionsDeltaAttachment' })

export const PlanModeAttachment = Struct({
  type: Literal('plan_mode'),
  reminderType: Literal('full'),
  isSubAgent: Boolean$,
  planFilePath: NonEmptyTrimmedString,
  planExists: Boolean$,
}).annotations({ title: 'PlanModeAttachment' })

export const PlanModeExitAttachment = Struct({
  type: Literal('plan_mode_exit'),
  planFilePath: NonEmptyTrimmedString,
  planExists: Boolean$,
}).annotations({ title: 'PlanModeExitAttachment' })

export const TaskReminderAttachment = Struct({
  type: Literal('task_reminder'),
  content: Array$(Struct({})),
  itemCount: NonNegativeInt,
}).annotations({ title: 'TaskReminderAttachment' })

export const EditedTextFileAttachment = Struct({
  type: Literal('edited_text_file'),
  filename: NonEmptyTrimmedString,
  snippet: NonEmptyTrimmedString,
}).annotations({ title: 'EditedTextFileAttachment' })

export const Attachment = Union(
  DefferedToolUseDeltaAttachment,
  TaskReminderAttachment,
  SkillListingAttachment,
  EditedTextFileAttachment,
  PlanModeExitAttachment,
  McpInstructionsDeltaAttachment,
  PlanModeAttachment,
).annotations({ title: 'Attachment' })

export const AttachmentMessage = Struct({
  type: Literal('attachment'),
  attachment: Attachment,
  ...CommonShitStructFields,
}).annotations({ title: 'AttachmentMessage' })

export const LastPromptMessage = Struct({
  type: Literal('last-prompt'),
  lastPrompt: optionalWith(NonEmptyTrimmedString, { exact: true }),
  leafUuid: UUID,
  sessionId: UUID,
}).annotations({ title: 'LastPromptMessage' })

export const AgentNameMessage = Struct({
  type: Literal('agent-name'),
  agentName: NonEmptyTrimmedString,
  sessionId: UUID,
}).annotations({ title: 'AgentNameMessage' })

export const SystemMessage = Struct({
  type: Literal('system'),
  ...CommonShitStructFields,
}).pipe(
  extend(
    Union(
      Struct({
        subtype: Literal('turn_duration'),
        durationMs: NonNegativeInt,
        messageCount: NonNegativeInt,
      }),
      Struct({
        subtype: Literal('away_summary'),
        content: NonEmptyTrimmedString,
      }),
      Struct({
        subtype: Literal('local_command'),
        content: NonEmptyTrimmedString,
        level: Literal('info'),
      }),
    ),
  ),
  annotations({ title: 'SystemMessage' }),
)

export const ClaudeSessionMessage = Union(
  PermissionModeMessage,
  FileHistorySnapshotMessage,
  UserMessage,
  SystemMessage,
  AgentNameMessage,
  AttachmentMessage,
  AiTitleMessage,
  AssistantMessage,
  LastPromptMessage,
).annotations({ title: 'ClaudeSessionMessage' })

export const ClaudeSessionSchema = Array$(ClaudeSessionMessage)

export const decodeClaudeSessionLine = decodeUnknownEither(
  ClaudeSessionMessage,
  { onExcessProperty: 'error' },
)

export type ClaudeSession = Schema.Type<typeof ClaudeSessionSchema>

export const decodeClaudeSession = decodeUnknownEither(ClaudeSessionSchema, {
  onExcessProperty: 'error',
})
