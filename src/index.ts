type FuriganaTuple = [string, string]

/**
 * Parses furigana wrapped in brackets, outputing all furigana as a tuple
 *
 * @param input String containing furigana wrapped in brackets
 * @param brackets (optional) Brackets that wrap furigana
 */
export default function parseFurigana(
  input: string,
  brackets: [string, string] = ['（', '）']
): Array<string | FuriganaTuple> {
  const regExp = buildRegExp(brackets)

  let m: RegExpExecArray | null

  let lastEnd = 0
  let out: Array<string | FuriganaTuple> = []

  while ((m = regExp.exec(input)) !== null) {
    if (m.index > lastEnd) {
      // Push intermediate text
      out.push(input.substring(lastEnd, m.index))
    }

    const res = findBestMatch(m[1], m[2])
    out = [...out, ...res]

    lastEnd = m.index + m[0].length
  }

  out.push(input.substring(lastEnd))

  return out
    .map(flattenPartialChunks(brackets))
    .filter(chunk => Array.isArray(chunk) || chunk.trim() !== '')
    .reduce(joinNeighbouringStrings, [] as Array<string | FuriganaTuple>)
}

/**
 * Compares the kana and hiragana input finding the minimum amount
 * of furigana needed
 * @param kana
 * @param hiragana
 */
function findBestMatch(kana: string, hiragana: string) {
  let remainingKana = kana.split('')
  let remainingHiragana = hiragana.split('')

  let hiraBuffer: Array<string> = []
  let furiBuffer: Array<string> = []
  let kanjiBuffer: Array<string> = []
  let outBuffer: Array<string | FuriganaTuple> = []

  const flushHira = () => {
    outBuffer.push(hiraBuffer.reverse().join(''))
    hiraBuffer = []
  }

  const flushFuri = () => {
    const furi = furiBuffer.reverse().join('')
    const kanji = kanjiBuffer.reverse().join('')

    outBuffer.push([kanji, furi])

    furiBuffer = []
    kanjiBuffer = []
  }

  while (remainingHiragana.length > 0) {
    const nextHira = remainingHiragana.pop() || ''
    const nextKana = remainingKana.pop() || ''

    if (nextHira === nextKana) {
      hiraBuffer.push(nextHira)
    } else if (isKanji(nextKana)) {
      flushHira()

      furiBuffer.push(nextHira)
      kanjiBuffer.push(nextKana)

      // Peak ahead and see if the next char is a kanji
      const nextChar = last(remainingKana)
      if (!isKanji(nextChar)) {
        // If not, could it be a compound verb
        if (
          !I_SOUNDS.includes(nextChar) ||
          !remainingHiragana.includes(nextChar)
        ) {
          // Must be end of squence
          break
        } else {
          // Collect all hiragana up to remaining char
          const flipedHiragana = remainingHiragana.reverse()
          const nextIndex = flipedHiragana.indexOf(nextChar)

          flipedHiragana
            .slice(0, nextIndex)
            .reverse()
            .forEach(char => furiBuffer.push(char))

          remainingHiragana = flipedHiragana.slice(nextIndex).reverse()

          // Push what we have but keep going
          flushFuri()
        }
      }
    } else if (isHiragana(nextKana)) {
      // Keep going until we hit a kanji
      // To support partial furigana at the end of verbs

      hiraBuffer.push(nextKana)
      remainingHiragana.push(nextHira)
    } else {
      // End of sequence
      break
    }
  }

  // Collect the remaining hiragana if we finished early
  if (remainingHiragana.length > 0) {
    remainingHiragana.reverse().forEach(char => furiBuffer.push(char))
  }

  flushFuri()

  // Collect the remaining kana
  if (remainingKana.length > 0) {
    outBuffer.push(remainingKana.join(''))
  }

  return outBuffer.reverse()
}

const I_SOUNDS = 'いきぎしじちぢみひびぴにり'.split('')

const KANJI_START = 0x4e00
const KANJI_END = 0x9faf
const KANJI_RANGE = createRange(KANJI_START, KANJI_END)
const isKanji = matchRange(KANJI_START, KANJI_END)

const HIRAGANA_START = 0x3041
const HIRAGANA_END = 0x3096
const HIRAGANA_RANGE = createRange(HIRAGANA_START, HIRAGANA_END)
const isHiragana = matchRange(HIRAGANA_START, HIRAGANA_END)

/**
 * Creates a regexp range from two charcodes
 * @param start
 * @param end
 */
function createRange(start: number, end: number) {
  return `${String.fromCharCode(start)}-${String.fromCharCode(end)}`
}

/**
 * Creates a function that tests if a char is in a range of charcodes
 * @param start
 * @param end
 */
function matchRange(start: number, end: number) {
  return (char: string | undefined) => {
    if (char === undefined) {
      return false
    }

    const code = char.charCodeAt(0)
    return start <= code && code <= end
  }
}

/**
 * Creates the parsing regexp using user defined brackets
 * @param brackets
 */
function buildRegExp(brackets: [string, string]) {
  const exp = `([${KANJI_RANGE}]+[${KANJI_RANGE}${HIRAGANA_RANGE}]+)${escapeBracket(
    brackets[0]
  )}([${HIRAGANA_RANGE}]+)${escapeBracket(brackets[1])}`

  return new RegExp(exp, 'gi')
}

/**
 * Gets the last element in an array
 * @param arr
 */
function last<T>(arr: Array<T>): T {
  return arr[arr.length - 1]
}

/**
 * Reduces string chunks into one long string
 * @param acc
 * @param chunk
 */
function joinNeighbouringStrings(
  acc: Array<string | FuriganaTuple>,
  chunk: string | FuriganaTuple
): Array<string | FuriganaTuple> {
  // Stitch neighbouring string chunks together
  if (typeof chunk === 'string' && typeof acc[acc.length - 1] === 'string') {
    return [...acc.slice(0, acc.length - 1), `${acc[acc.length - 1]}${chunk}`]
  } else {
    return [...acc, chunk]
  }
}

/**
 * Removes corrupt FuriganaTuples left from parsing glitches
 * @param brackets
 */
function flattenPartialChunks(brackets: [string, string]) {
  return (chunk: string | FuriganaTuple) => {
    if (Array.isArray(chunk) && (chunk[0] === '' || chunk[1] === '')) {
      if (chunk[0] === '' && chunk[1] === '') {
        return ''
      }

      if (chunk[0] === '') {
        // Add the brackets back in as parsing failed
        return `${brackets[0]}${chunk[1]}${brackets[1]}`
      }

      return chunk[0]
    }

    return chunk
  }
}

const RESERVED_CHARS = '()[]\\/+{}*.'
/**
 * Makes user defined brackets regex safe
 * @param char
 */
function escapeBracket(char: string) {
  if (RESERVED_CHARS.includes(char)) {
    return `\\${char}`
  }

  return char
}
