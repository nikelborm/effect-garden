type Merge<T> = { [P in keyof T]: T[P] } & {};

type RemapEnumArrToObject<T extends Array<string> | Array<number>> =
  T extends [
    infer U extends T[number],
    ...infer Rest extends Array<string> | Array<number>
  ]
    ? { [k in U] : U } & RemapEnumArrToObject<Rest>
    : {};

const secureObject = (o: Record<string|number|symbol, any>) => {
  Object.seal(o);
  Object.freeze(o);
  Object.preventExtensions(o);
}

const ENUM = <
  const T extends Array<string> | Array<number>
>(arr: T):Merge<Readonly<RemapEnumArrToObject<T>>> => {
  const map = Object.fromEntries(arr.map( e => [e, e] ));
  secureObject(map);
  return map;
};






const MONARCHS = {
  'NIKOLAY_1': 'Николай 1',
  'ALEXEI_MICHAILOVICH': 'Алексей Михайлович',
  'EKATERINA_VELIKAYA': 'Екатерина Великая',
  'PETR_1': 'Пётр 1',
  'MICHAI_FEDOROVICH': 'Михаил Фёдорович',
} as const;

type IMonarchs = keyof typeof MONARCHS;

console.log(MONARCHS)

const baseRules = new Set([
  'there is token type [T]',
  'there is token [T]', // meaning that it must be placed somewhere
  'token [T] is of type [U]',
  'token [T] is in slot with index [N]',

  'there are exactly [N] spatial slots',
  'OR [Rest]', // ???
  'AND [Rest]', // ???
  'NOT [T]', // ???
  '[T] XOR [U]', // ???
]);

const possibleRules = new Set([
  'token of type [T] to the left of token of type [U]', // requires minimum 2 spatial slots
  'token [T] to the left of token of type [U]', // T ..(0,∞).. U
  'token of type [T] to the left of token [U]',
  'token [T] to the left of token [U]',

  'token of type [T] to the right of token of type [U]', // U ..(0,∞).. T
  'token [T] to the right of token of type [U]',
  'token of type [T] to the right of token [U]',
  'token [T] to the right of token [U]',

  'token of type [T] must have a neighbour token of type [U]', // U ..(0).. T, T ..(0).. U
  'token [T] must have a neighbour token of type [U]',
  'token of type [T] must have a neighbour token [U]',
  'token [T] must have a neighbour token [U]',

  'there are at most [N] spatial slots',
  'there are at least [N] spatial slots',

  'there are at most [N] tokens of [M] type in any single spatial slot',
  'there are at least [N] tokens of [M] type in any single spatial slot',
  'there are exactly [N] tokens of [M] type in any single spatial slot', // for example every single slot must have 1 and only one monarch

  'if slot has token [T], it has token [U]',

  'there are at most [N] tokens in any single spatial slot',
  'there are at least [N] tokens in any single spatial slot',
  'there are exactly [N] tokens in any single spatial slot',
] as const);

const remapTokens = {
  'token [T] to the left of token [U]': {
    searchesFor: [
      'there is token [T]',
      'there are exactly [N] spatial slots',
    ],
    results(T: string, U: string, N: number) {
      const condition = {
        type: 'OR [Rest]',
        args: { Rest: [] as any[] }
      };
      for (let i = 0; i < N - 1; i++) {
        for (let j = i + 1; j < N; j++) {
          condition.args.Rest.push({
            type: 'AND [Rest]',
            args: {
              Rest: [{
                type: 'token [T] is in slot with index [N]',
                args: { T: T, N: i,}
              }, {
                type: 'token [T] is in slot with index [N]',
                args: { T: U, N: j,}
              }]
            }
          })

        }
      }
      return condition;
    },
  },
  'token of type [T] to the left of token [U]': {
    searchesFor: [
      'there is token type [T]',
      'there is token [U]',
      'token [T] is of type [U]',
      'there are exactly [N] spatial slots',
    ],
    results(tokensOptionsOfTypeT: string[], U: string) {
      return {
        type: 'OR [Rest]',
        args: {
          Rest: tokensOptionsOfTypeT.map(T => ({
            type: 'token [T] to the left of token [U]',
            args: { T, U }
          }))
        }
      };
    }
  },
  'token [T] to the left of token of type [U]': {
    searchesFor: [
      'there is token type [T]',
      'there is token [U]',
      'token [T] is of type [U]',
      'there are exactly [N] spatial slots',
    ],
    results(T: string, tokensOptionsOfTypeU: string[]) {
      return {
        type: 'OR [Rest]',
        args: {
          Rest: tokensOptionsOfTypeU.map(U => ({
            type: 'token [T] to the left of token [U]',
            args: { T, U }
          }))
        }
      };
    }
  },
  'token of type [T] to the left of token of type [U]': {
    searchesFor: [
      'there is token type [T]',
      'there is token [U]',
      'token [T] is of type [U]',
      'there are exactly [N] spatial slots',
    ],
    results(tokensOptionsOfTypeT: string[], tokensOptionsOfTypeU: string[]) {
      return {
        type: 'OR [Rest]',
        args: {
          Rest: tokensOptionsOfTypeT
            .flatMap(T => tokensOptionsOfTypeU.map(U => ({ T, U })))
            .map(args => ({
              type: 'token [T] to the left of token [U]',
              args
            }))
        }
      };
    }
  },

  'token [T] to the right of token [U]': {
    results(T: string, U: string) {
      return {
        type: 'token [T] to the left of token [U]',
        args: { T: U, U: T }
      }
    },
  },
  'token of type [T] to the right of token [U]': {
    results(T: string, U: string) {
      return {
        type: 'token [T] to the left of token of type [U]',
        args: { T: U, U: T }
      }
    },
  },
  'token [T] to the right of token of type [U]': {
    results(T: string, U: string) {
      return {
        type: 'token of type [T] to the left of token [U]',
        args: { T: U, U: T }
      }
    },
  },
  'token of type [T] to the right of token of type [U]': {
    results(T: string, U: string) {
      return {
        type: 'token of type [T] to the left of token of type [U]',
        args: { T: U, U: T }
      }
    },
  },

  'token of type [T] must have a neighbour token of type [U]': {
    results(T: string, U: string) {
      return {
        type: 'OR [Rest]',
        args: {
          Rest: [
            'token of type [T] to the left of token of type [U]',
            'token of type [T] to the right of token of type [U]',
          ].map(type => ({ type, args: { T, U } })),
        }
      };
    }
  },
  'token [T] must have a neighbour token of type [U]': {
    results(T: string, U: string) {
      return {
        type: 'OR [Rest]',
        args: {
          Rest: [
            'token [T] to the left of token of type [U]',
            'token [T] to the right of token of type [U]',
          ].map(type => ({ type, args: { T, U } })),
        }
      };
    }
  },
  'token of type [T] must have a neighbour token [U]': {
    results(T: string, U: string) {
      return {
        type: 'OR [Rest]',
        args: {
          Rest: [
            'token of type [T] to the left of token [U]',
            'token of type [T] to the right of token [U]',
          ].map(type => ({ type, args: { T, U } })),
        }
      };
    }
  },
  'token [T] must have a neighbour token [U]': {
    results(T: string, U: string) {
      return {
        type: 'OR [Rest]',
        args: {
          Rest: [
            'token [T] to the left of token [U]',
            'token [T] to the right of token [U]',
          ].map(type => ({ type, args: { T, U } })),
        }
      };
    }
  },
}

// (A && B && C) || D => (A && B && C) || D

// есть infinite time-spatial slot sequence.
// на неё можно накладывать правила.
// spatial token slots have indices.
// она может быть детерминированной (иметь ограниченное количество состояний удовлетворяющих вопросу)
// или недетерминированной (например иметь бесконечное количество состояний (например когда не имеет ограниченной длины и сказано, что что-то стоит правее чего-то))

// есть системы, которым соответствует исключительно одно решение
// есть системы, которым соответствует 0 решений
// есть системы, которым соответсвует несколько решений

// решение -- нечто странное, что можно назвать и набором правил и инстансом в котором всё уже расставлено.

// системы решений можно складывать, что приводит к либо расширению пространства решений, либо к его сужению

// rules can be expanded or collapsed. completely expanded ruleset looks like a set of rulesets that have only 1 solution and represents the solution space

// some rulesets are AND combination of few rulesets. some rulesets are OR combination of few rulesets.
// AND rulesets are more restrictive than each of the individual rules. OR rulesets are more allowing than each of the individual rules


// MONARCHS_ENGLISH.MICHAI_FEDOROVICH



// 'Nibiru': 'Нибиру',
// 'Kottedzh': 'Коттедж',
// 'Kolomenskij': 'Коломенский',
// 'Putevoj': 'Путевой',


// для начала чтобы не делать комбинаторный взрыв, нужно занимать как можно меньше места, если возможно
// как этого добиться? сначала применять операции, чья комбинаторная сложность не супер велика -- добавления соседа
// нет смысла скейлить это дело и сразу примерять последовательность из 3х максимально значений на 3 потенциальных
// позиции в 5 слотах
