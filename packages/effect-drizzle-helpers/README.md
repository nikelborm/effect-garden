# Drizzle effect helpers

## TODO

- try to use `.$type<T>()` at the stage of Drizzle ORM table definition, so that
  I won't need to constantly care about manually branding returned id
- add special ensure operator, that will work purely on type-level to ensure
  presence of some fields or properties. maybe make it accepts the effect
  schema, or just some generic type
