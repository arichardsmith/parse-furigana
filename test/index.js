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
    name: 'single kanji',
    test: '虹（にじ）',
    expect: [['虹', 'にじ']]
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
  },
  {
    name: 'text with other chars',
    test: '空に美しい>虹（にじ）<がかかった',
    expect: ['空に美しい>', ['虹', 'にじ'], '<がかかった']
  },
  {
    name: 'two words with に',
    test: '空に虹（にじ）がかかった',
    expect: ['空に', ['虹', 'にじ'], 'がかかった']
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
