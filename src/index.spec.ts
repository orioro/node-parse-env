import * as PUBLIC_API from './'

test('public api', () => {
  expect(Object.keys(PUBLIC_API)).toMatchSnapshot()
})
