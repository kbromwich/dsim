import { Monaco } from '@monaco-editor/react';
import { editor, MarkerSeverity } from 'monaco-editor/esm/vs/editor/editor.api';
import React from 'react';
import { LineError } from 'sim/ParsedSims';

export const useParseErrorMarkers = (
  simDefsScript: string,
  monacoRef?: React.MutableRefObject<Monaco | undefined>,
  editorRef?: React.MutableRefObject<editor.IStandaloneCodeEditor | undefined>,
) => {
  const workerRef = React.useRef<Worker>();
  const runningRef = React.useRef(false);
  const latestScriptRef = React.useRef<string>(simDefsScript);
  const currentScriptRef = React.useRef<string>();
  latestScriptRef.current = simDefsScript;

  React.useEffect(() => {
    workerRef.current = new Worker(new URL("worker/parse/worker.ts", import.meta.url));
  }, []);

  React.useEffect(() => {
    if (!workerRef.current) {
      return;
    }
    workerRef.current.onmessage = (event) => {
      // Update the error markers
      const model = editorRef?.current?.getModel();
      if (model && monacoRef?.current) {
        const markers = event.data.errors.map((error: LineError) => {
          const lineEnd = error.lineStart + (error.lineCount ?? 1);
          return {
            message: error.message,
            severity: MarkerSeverity.Error,
            startLineNumber: error.lineStart + 1,
            startColumn: 1,
            endLineNumber: lineEnd,
            endColumn: model.getLineLength(lineEnd) + 1,
          };
        });
        monacoRef.current.editor.setModelMarkers(model, "owner", markers);
      }

      // If the script has changed since the worker started, restart the worker
      if (latestScriptRef.current !== currentScriptRef.current) {
        currentScriptRef.current = latestScriptRef.current;
        workerRef.current?.postMessage({ script: latestScriptRef.current });
      }

      // We're done here!
      runningRef.current = false;
    };
    workerRef.current.onerror = (event) => {
      console.error(event.message);
      runningRef.current = false;
    };
    return () => workerRef.current?.terminate();
  }, [editorRef, monacoRef]);

  const monaco = monacoRef?.current;
  const editor = editorRef?.current;
  React.useEffect(() => {
    if (!monaco || !editor || runningRef.current) {
      return;
    }
    runningRef.current = true;
    if (workerRef.current) {
      currentScriptRef.current = latestScriptRef.current;
      workerRef.current.postMessage({ script: simDefsScript });
    }
  }, [simDefsScript, monaco, editor]);
};
