import { type Equals, assert } from 'tsafe';
import type { PreserveUndefinedOnlyIfWasExplicit } from './PreserveUndefinedOnlyIfWasExplicit.ts';


assert<Equals<PreserveUndefinedOnlyIfWasExplicit<{ a?: string             }, 'a'>, string             >>;
assert<Equals<PreserveUndefinedOnlyIfWasExplicit<{ a?: string | undefined }, 'a'>, string | undefined >>;
assert<Equals<PreserveUndefinedOnlyIfWasExplicit<{ a : string             }, 'a'>, string             >>;
assert<Equals<PreserveUndefinedOnlyIfWasExplicit<{ a : string | undefined }, 'a'>, string | undefined >>;
