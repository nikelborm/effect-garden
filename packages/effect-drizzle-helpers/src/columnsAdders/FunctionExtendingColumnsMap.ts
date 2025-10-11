import type { TableFuncArgs } from '../TableFuncArgs.ts'
import type {
  AllowOnlyValidColumnMaps,
  ErrMsg,
  GeneralColumnMap,
} from './AllowOnlyValidColumnMaps.ts'

export type FunctionExtendingColumnsMap<TAdditionalColumnsMap> =
  SwitchEitherToNeverOrToValueOnError<
    AllowOnlyValidColumnMaps<TAdditionalColumnsMap>,
    <
      const TTableName extends string,
      TColumnsMap extends GeneralColumnMap = GeneralColumnMap,
    >([snakeCaseTableName, options, extraConfig]: TableFuncArgs<
      TTableName,
      TColumnsMap
    >) => TableFuncArgs<TTableName, TAdditionalColumnsMap & TColumnsMap>
  >

type SwitchEitherToNeverOrToValueOnError<ValueToValidate, SuccessValue> = [
  ValueToValidate,
] extends [ErrMsg<string>]
  ? never
  : SuccessValue
