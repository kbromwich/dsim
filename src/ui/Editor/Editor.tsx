import React from 'react';
import MonacoEditor, { DiffEditor, Monaco } from "@monaco-editor/react";
import { editor } from 'monaco-editor/esm/vs/editor/editor.api';

import { EditorState, EditorStateSet } from './EditorState';

const langName = 'simDefLang';
const themeName = 'simDefTheme';

const onMount = (monaco: Monaco) => {
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
        // Not sure why brackets (match highlighting) doesn't work!
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
};

const createEditorHandler = (
  editor: editor.IStandaloneCodeEditor,
  stateSetRef: React.MutableRefObject<{
    originalSims: string;
    state: EditorState;
    setState: (newState: Partial<EditorState>) => void;
  }>
) => () => {
  const { originalSims, state, setState } = stateSetRef.current;
  const newValue = editor.getValue();
  if (newValue !== state.editSims) {
    if (originalSims === newValue) {
      setState({ editSims: undefined });
    } else {
      setState({ editSims: newValue });
    }
  }
};

interface Props {
  sims: string;
  editStateSet: EditorStateSet;
}

const Editor: React.FC<Props> = ({ sims, editStateSet }) => {
  const [{ editSims, showEditDiff}] = editStateSet;
  const stateSetRefValue = {
    originalSims: sims,
    state: editStateSet[0],
    setState: editStateSet[1],
  };
  const stateSetRef = React.useRef(stateSetRefValue);
  stateSetRef.current = stateSetRefValue;
  if (showEditDiff && editSims !== undefined) {
    return (
      <DiffEditor
        width="100%"
        height="75vh"
        original={sims}
        modified={editSims}
        language={langName}
        onMount={(editor, monaco) => {
          onMount(monaco);
          const modEditor = editor.getModifiedEditor()
          const onChange = createEditorHandler(modEditor, stateSetRef);
          modEditor.onDidChangeModelContent(onChange);
        }}
      />
    );
  }
  return (
    <MonacoEditor
      width="100%"
      height="75vh"
      value={editSims ?? sims}
      language={langName}
      onMount={(editor, monaco) => {
        onMount(monaco);
        const onChange = createEditorHandler(editor, stateSetRef);
        editor.onDidChangeModelContent(onChange);
      }}
    />
  );
};

export default Editor;
