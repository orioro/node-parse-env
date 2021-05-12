# env-options

Little DSL for reading environment variables

```
var options = envOptions({
  secret: 'fs:SECRET_PATH',
  someOption: 'env:SOME_OPTION',
  someOtherOption: 'env?:SOME_OTHER_OPTION',
});

console.log(options);
// {
//   secret: 'secret-1',
//   someOption: 'someValue',
//   someOtherOption: undefined,
// }
```
