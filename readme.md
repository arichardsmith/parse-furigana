# Parse Furigana

Parses bracket wrapped furigana from strings, scanning matches and removing duplicate hirigana.

## Install

```
yarn add @arichardsmith/parse-furigana
```

## Usage

```ts
import parseFurigana from '@arichardsmith/parse-furigana'

console.log(parseFurigana('食（た）べる。例えば（たとえば）、テスト'))
// Logs: [ [ '食', 'た' ], 'べる。', [ '例', 'たと' ], 'えば、テスト' ]
```
