// Type declarations for @webref/idl
// https://github.com/microsoft/TypeScript-DOM-lib-generator/blob/main/src/build/webref/webref-idl.d.ts
import type { IDLRootType } from 'webidl2'

declare module '@webref/idl' {
  interface IDLFile {
    text(): Promise<string>
    parse(): Promise<IDLRootType[]>
  }

  function listAll(): Promise<Record<string, IDLFile>>
  function parseAll(): Promise<Record<string, IDLRootType[]>>
}
