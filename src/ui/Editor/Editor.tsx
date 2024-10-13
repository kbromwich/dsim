import React from 'react';
import MonacoEditor, { DiffEditor, Monaco } from "@monaco-editor/react";
import { editor, languages } from 'monaco-editor/esm/vs/editor/editor.api';

import { EditorState, EditorStateSet } from './EditorState';
import { useParseErrorMarkers } from './useParseErrorMarkers';

const LANG_NAME = 'simDefLang';
const THEME_NAME = 'simDefTheme';

const simRootBaseTokenRules: languages.IMonarchLanguageRule[] = [
  // The first rule here is for when we're missing closing parens and have hit
  // the next sim definition; so we just abort!
  [/^(?=[^@:]+@\s*\d+\s*:)/, { token: 'nextDefinition', next: '@popall' }],
  [/[ \t]+/, 'whitespace'],
  [/\(/, { token: 'delimiter.parens', bracket: '@open', next: 'simInner' }],
  [/\)/, { token: 'delimiter.parens', bracket: '@close', next: '@pop' }],
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
];

const onMount = (monaco: Monaco) => {
  monaco.languages.register({ id: LANG_NAME });
  // See https://microsoft.github.io/monaco-editor/monarch.html
  monaco.languages.setMonarchTokensProvider(LANG_NAME, {
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
        [/^([^@:]+)/, 'sim.name'],
        [/@/, 'delimiter.nameLevel'],
        [/\d+/, 'sim.level'],
        [/:/, { token: 'delimiter.simExpression', next: 'simRoot' }],
      ],
      simRoot: [
        ...simRootBaseTokenRules,
        [/\n/, { token: 'delimiter.endOfSim', next: '@popall' }], // We're done here!
      ],
      simInner: [
        ...simRootBaseTokenRules,
        [/\n/, { token: 'delimiter.newLine' }],
      ],
    }
  });
  monaco.languages.setLanguageConfiguration(LANG_NAME, {
    surroundingPairs: [{ "open": "(", "close": ")" }],
    autoClosingPairs: [{ "open": "(", "close": ")" }],
    brackets: [["(", ")"]],
  });
  monaco.editor.defineTheme(THEME_NAME, {
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
  monaco.editor.setTheme(THEME_NAME);
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
  const monacoRef = React.useRef<Monaco>();
  const editorRef = React.useRef<editor.IStandaloneCodeEditor>();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Just used to trigger a rerender!
  const [mounted, setMounted] = React.useState(false);
  const [{ editSims, showEditDiff}] = editStateSet;
  const stateSetRefValue = {
    originalSims: sims,
    state: editStateSet[0],
    setState: editStateSet[1],
  };
  const stateSetRef = React.useRef(stateSetRefValue);
  stateSetRef.current = stateSetRefValue;
  useParseErrorMarkers(editSims ?? sims, monacoRef, editorRef);
  if (showEditDiff) {
    return (
      <DiffEditor
        width="100%"
        height="100%"
        original={sims}
        modified={editSims ?? sims}
        language={LANG_NAME}
        onMount={(editorInstance, monaco) => {
          const modEditor = editorInstance.getModifiedEditor();
          monacoRef.current = monaco;
          editorRef.current = modEditor;
          onMount(monaco);
          const onChange = createEditorHandler(modEditor, stateSetRef);
          modEditor.onDidChangeModelContent(onChange);
          setMounted(true);
        }}
      />
    );
  }
  return (
    <MonacoEditor
      width="100%"
      height="100%"
      value={editSims ?? sims}
      language={LANG_NAME}
      onMount={(editorInstance, monaco) => {
        monacoRef.current = monaco;
        editorRef.current = editorInstance;
        onMount(monaco);
        const onChange = createEditorHandler(editorInstance, stateSetRef);
        editorInstance.onDidChangeModelContent(onChange);
        setMounted(true);
      }}
    />
  );
};

export default Editor;
