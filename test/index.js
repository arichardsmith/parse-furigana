const assert = require('assert')
const parse = require('../dist/index').default

/**
 * interface Test {
 *  name: string
 *  test: string
 *  expect: Array<string | FuriganaTuple>
 *  skip?: boolean
 *  brackets: [string, string]
 * }
 */

const TESTS = [
  {
    name: 'a simple word',
    test: '食べる（たべる）',
    expect: [['食', 'た'], 'べる']
  },
  {
    name: 'a double verb',
    test: '繰り返す（くりかえす）',
    expect: [['繰', 'く'], 'り', ['返', 'かえ'], 'す']
  },
  {
    name: 'a sentence',
    test: '食べる（たべる）。例えば（たとえば）、テスト',
    expect: [['食', 'た'], 'べる。', ['例', 'たと'], 'えば、テスト']
  },
  {
    name: 'partial furigana',
    test: '食べる（た）',
    expect: [['食', 'た'], 'べる']
  },
  {
    name: 'while ignoring other bracketing',
    test: '例えば（たとえば）、テスト（てすと）',
    expect: [['例', 'たと'], 'えば、テスト（てすと）']
  },
  {
    name: 'with userdefined brackets',
    test: '食べる[たべる]',
    expect: [['食', 'た'], 'べる'],
    brackets: ['[', ']']
  }
]

describe('parse-furigana', function() {
  TESTS.forEach(test => {
    it(`Parses ${test.name} (${test.test})`, function() {
      if (test.skip) {
        this.skip()
      } else {
        const res = parse(test.test, test.brackets)
        assert.deepEqual(res, test.expect)
      }
    })
  })
})
