import { type Equals, assert } from 'tsafe';

import type { MagicGeneric } from './spreadObjectMerger.ts';

// Merge Candidates                     => Merge Results
// [{              }, {              }] => {              }
// [{ a: string    }, {              }] => { a: string    }
// [{              }, { a: number    }] => { a: number    }
// [{ a: string    }, { a: number    }] => { a: number    }
type Testcase1Result = MagicGeneric<
  { a?: string             },
  { a?: number             }
>
assert<Equals<Testcase1Result, { a?: string | number             }>>
//            ^?



// Merge Candidates                     => Merge Results
// [{              }, { a: number    }] => { a: number    }
// [{ a: string    }, { a: number    }] => { a: number    }
type Testcase2Result = MagicGeneric<
  { a?: string             },
  { a : number             }
>
assert<Equals<Testcase2Result, { a : number                      }>>
//            ^?



// Merge Candidates                     => Merge Results
// [{ a: string    }, {              }] => { a: string    }
// [{ a: string    }, { a: number    }] => { a: number    }
type Testcase3Result = MagicGeneric<
  { a : string             },
  { a?: number             }
>
assert<Equals<Testcase3Result, { a : string | number             }>>
//            ^?



// Merge Candidates                     => Merge Results
// [{ a: string    }, { a: number    }] => { a: number    }
type Testcase4Result = MagicGeneric<
  { a : string             },
  { a : number             }
>
assert<Equals<Testcase4Result, { a : number                      }>>
//            ^?



// Merge Candidates                     => Merge Results
// [{              }, {              }] => {              }
// [{ a: string    }, {              }] => { a: string    }
// [{ a: undefined }, {              }] => { a: undefined }
// [{              }, { a: number    }] => { a: number    }
// [{ a: string    }, { a: number    }] => { a: number    }
// [{ a: undefined }, { a: number    }] => { a: number    }
type Testcase5Result = MagicGeneric<
  { a?: string | undefined },
  { a?: number             }
>
assert<Equals<Testcase5Result, { a?: string | number | undefined }>>
//            ^?



// Merge Candidates                     => Merge Results
// [{              }, { a: number    }] => { a: number    }
// [{ a: string    }, { a: number    }] => { a: number    }
// [{ a: undefined }, { a: number    }] => { a: number    }
type Testcase6Result = MagicGeneric<
  { a?: string | undefined },
  { a : number             }
>
assert<Equals<Testcase6Result, { a : number                      }>>
//            ^?



// Merge Candidates                     => Merge Results
// [{ a: string    }, {              }] => { a: string    }
// [{ a: undefined }, {              }] => { a: undefined }
// [{ a: string    }, { a: number    }] => { a: number    }
// [{ a: undefined }, { a: number    }] => { a: number    }
type Testcase7Result = MagicGeneric<
  { a : string | undefined },
  { a?: number             }
>
assert<Equals<Testcase7Result, { a : string | number | undefined }>>
//            ^?



// Merge Candidates                     => Merge Results
// [{ a: string    }, { a: number    }] => { a: number    }
// [{ a: undefined }, { a: number    }] => { a: number    }
type Testcase8Result = MagicGeneric<
  { a : string | undefined },
  { a : number             }
>
assert<Equals<Testcase8Result, { a : number                      }>>
//            ^?



// Merge Candidates                     => Merge Results
// [{              }, {              }] => {              }
// [{ a: string    }, {              }] => { a: string    }
// [{              }, { a: number    }] => { a: number    }
// [{              }, { a: undefined }] => { a: undefined }
// [{ a: string    }, { a: number    }] => { a: number    }
// [{ a: string    }, { a: undefined }] => { a: undefined }
type Testcase9Result = MagicGeneric<
  { a?: string             },
  { a?: number | undefined }
>
assert<Equals<Testcase9Result, { a?: string | number | undefined }>>
//            ^?



// Merge Candidates                     => Merge Results
// [{              }, { a: number    }] => { a: number    }
// [{              }, { a: undefined }] => { a: undefined }
// [{ a: string    }, { a: number    }] => { a: number    }
// [{ a: string    }, { a: undefined }] => { a: undefined }
type Testcase10Result = MagicGeneric<
  { a?: string             },
  { a : number | undefined }
>
assert<Equals<Testcase10Result, { a : number | undefined          }>>
//            ^?



// Merge Candidates                     => Merge Results
// [{ a: string    }, {              }] => { a: string    }
// [{ a: string    }, { a: number    }] => { a: number    }
// [{ a: string    }, { a: undefined }] => { a: undefined }
type Testcase11Result = MagicGeneric<
  { a : string             },
  { a?: number | undefined }
>
assert<Equals<Testcase11Result, { a : string | number | undefined }>>
//            ^?



// Merge Candidates                     => Merge Results
// [{ a: string    }, { a: number    }] => { a: number    }
// [{ a: string    }, { a: undefined }] => { a: undefined }
type Testcase12Result = MagicGeneric<
  { a : string             },
  { a : number | undefined }
>
assert<Equals<Testcase12Result, { a : number | undefined          }>>
//            ^?



// Merge Candidates                     => Merge Results
// [{              }, {              }] => {              }
// [{ a: string    }, {              }] => { a: string    }
// [{ a: undefined }, {              }] => { a: undefined }
// [{              }, { a: number    }] => { a: number    }
// [{ a: string    }, { a: number    }] => { a: number    }
// [{ a: undefined }, { a: number    }] => { a: number    }
// [{              }, { a: undefined }] => { a: undefined }
// [{ a: string    }, { a: undefined }] => { a: undefined }
// [{ a: undefined }, { a: undefined }] => { a: undefined }
type Testcase13Result = MagicGeneric<
  { a?: string | undefined },
  { a?: number | undefined }
>
assert<Equals<Testcase13Result, { a?: string | number | undefined }>>
//            ^?



// Merge Candidates                     => Merge Results
// [{              }, { a: number    }] => { a: number    }
// [{ a: string    }, { a: number    }] => { a: number    }
// [{ a: undefined }, { a: number    }] => { a: number    }
// [{              }, { a: undefined }] => { a: undefined }
// [{ a: string    }, { a: undefined }] => { a: undefined }
// [{ a: undefined }, { a: undefined }] => { a: undefined }
type Testcase14Result = MagicGeneric<
  { a?: string | undefined },
  { a : number | undefined }
>
assert<Equals<Testcase14Result, { a : number | undefined          }>>
//            ^?



// Merge Candidates                     => Merge Results
// [{ a: string    }, {              }] => { a: string    }
// [{ a: undefined }, {              }] => { a: undefined }
// [{ a: string    }, { a: number    }] => { a: number    }
// [{ a: undefined }, { a: number    }] => { a: number    }
// [{ a: string    }, { a: undefined }] => { a: undefined }
// [{ a: undefined }, { a: undefined }] => { a: undefined }
type Testcase15Result = MagicGeneric<
  { a : string | undefined },
  { a?: number | undefined }
>
assert<Equals<Testcase15Result, { a : string | number | undefined }>>
//            ^?



// Merge Candidates                     => Merge Results
// [{ a: string    }, { a: number    }] => { a: number    }
// [{ a: undefined }, { a: number    }] => { a: number    }
// [{ a: string    }, { a: undefined }] => { a: undefined }
// [{ a: undefined }, { a: undefined }] => { a: undefined }
type Testcase16Result = MagicGeneric<
  { a : string | undefined },
  { a : number | undefined }
>
assert<Equals<Testcase16Result, { a : number | undefined          }>>
//            ^?
