import React from 'react';
import Editor from "@monaco-editor/react";

import Box from '@mui/material/Box';

const langName = 'simDefLang';
const themeName = 'simDefTheme';

interface Props {
  sims: string[];
  setSims: (sims: string[]) => void;
  selected: string[];
  setSelected: (sims: string[]) => void;
}

const SimList: React.FC<Props> = ({ sims, selected, setSims }) => {
  return (
    <Box sx={{ flexBasis: '33%', padding: 1 }}>
      <Editor
        // width="800"
        height="80vh"
        value={sims.join('\n')}
        language={langName}
        options={{
          // selectOnLineNumbers: true,
          // folding: true,
          // matchBrackets: 'always',
        }}
        onChange={(newValue) => newValue && setSims(newValue.split('\n'))}
        onMount={(editor, monaco) => {
          monaco.languages.register({ id: langName });
          // See https://microsoft.github.io/monaco-editor/monarch.html
          monaco.languages.setMonarchTokensProvider(langName, {
            includeLF: true,
            brackets: [{ open: '(', close: ')', token: 'delimiter.parens' }],
            keywords: [
              'PB', 'AC', 'LV', 'CM', 'CB',
            ],
            operators: [
              '<=', '>=', '+', '-', '#', '*', '/',
            ],
            symbols:  /[=><!~?:&|+\-*/^%]+/,
            tokenizer: {
              root: [
                [/^\s*#.*/, 'comment'],
                // Not sure why group doesn't work!
                // [/^([^@]+)(@)\s*(\d+)\s*(:)/, {
                //   token: 'id',
                //   group: [
                //     'sim.name',
                //     'delimiter.nameLevel',
                //     'sim.level',
                //     'delimiter.simExpression',
                //   ],
                //   next: '@simRoot',
                // }],
                // Use this lot below, since group not working...
                [/^([^@]+)/, 'sim.name'],
                [/@/, 'delimiter.nameLevel'],
                [/\d+/, 'sim.level'],
                [/:/, 'delimiter.simExpression', 'simRoot'],
              ],
              simRoot: [
                [/[ \t]+/, 'whitespace'],
                // [/[()]/, '@brackets'],
                // [/\(/, { token: 'delimiter.parens', bracket: '@open' }],
                // [/\)/, { token: 'delimiter.parens', bracket: '@close' }],
                [/@[a-zA-Z]+:/, 'sim.function'],
                [/=atk[^>]*>/, 'sim.attack'],
                [/=sav[^>]*>/, 'sim.save'],
                [/@\w+/, 'sim.userFunction'],
                [/\$\w+/, 'sim.userVariable'],
                [/@symbols/, { cases: { '@operators': 'sim.operator' } } ],
                [/[A-Z]+/, { cases: { '@keywords': 'sim.keyword' } }],
                [/\d+d\d+/, { token: 'sim.droll' }],
                [/\d+D\d+/, { token: 'sim.drollCrit' }],
                [/\d+/, { token: 'sim.number' }],
                [/\n/, { token: 'delimiter.endOfSim', next: '@popall' }],
              ],
            }
          });
          monaco.editor.defineTheme(themeName, {
            base: 'vs',
            inherit: true,
            rules: [
              { token: 'comment', foreground: '008800' },
              { token: 'id', foreground: 'DD9500' },
              { token: 'sim.name', foreground: 'CC8500' },
              // { token: 'delimiter.nameLevel', foreground: 'CCCCCC' },
              // { token: 'sim.level', foreground: 'AA6600' },
              { token: 'sim.level', foreground: 'DD9500' },
              // { token: 'delimiter.simExpression', foreground: 'AAAAAA' },

              // { token: 'sim.operator', foreground: 'AA66AA' },
              { token: 'sim.function', foreground: '00AAAA' },
              { token: 'sim.attack', foreground: '880066' },
              { token: 'sim.save', foreground: '880066' },
              { token: 'sim.userFunction', foreground: '00AA00' },
              { token: 'sim.userVariable', foreground: '00AA00' },
              { token: 'sim.keyword', foreground: '0000DD' },
              { token: 'sim.droll', foreground: '884444' },
              { token: 'sim.drollCrit', foreground: '663333' },
              { token: 'sim.number', foreground: '880000' },
              { token: 'sim.unmapped', foreground: '000088' },
            ],
            colors: {},
          });
          monaco.editor.setTheme(themeName);
        }}
      />
    </Box>
  );
};

export default SimList;
