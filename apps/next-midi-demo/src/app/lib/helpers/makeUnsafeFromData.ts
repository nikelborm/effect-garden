import type { TaggedReadonlyObject } from './TaggedReadonlyObject.ts'

/**
 * Intended to be used to declare static fields
 */
export const makeUnsafeFromData =
  <TParentDataClass extends new (child: any) => TaggedReadonlyObject>() =>
  <
    TChildDataInstance extends Omit<
      InstanceType<TParentDataClass>,
      '_tag'
    >[keyof Omit<InstanceType<TParentDataClass>, '_tag'>],
    TChildDataClass extends {
      new (...args: any[]): TChildDataInstance
      models(arg: unknown): arg is TChildDataInstance
    },
  >(
    DataClass: TChildDataClass,
  ) =>
    function (this: TParentDataClass, idData: TaggedReadonlyObject) {
      if (DataClass.models(idData))
        return new this(idData) as InstanceType<TParentDataClass>

      throw new Error(
        `Cannot create ${this.name}. argument is not ${DataClass.name}`,
      )
    }
