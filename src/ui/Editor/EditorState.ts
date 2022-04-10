import React from 'react';

export interface EditorState {
  editSims?: string;
  showEditDiff: boolean;
  cancel: boolean;
}

export type EditorStateSet = [EditorState, (newState: Partial<EditorState>) => void];

export const useEditorState = (sandboxMode: boolean): EditorStateSet => {
  const lastEditing = (sandboxMode && localStorage.getItem('editingSims')) || undefined;
  const [state, setState] = React.useState<EditorState>({
    editSims: lastEditing,
    showEditDiff: false,
    cancel: false,
  });
  return [state, (newState: Partial<EditorState>) => {
    setState((curState) => ({ ...curState, ...newState }));
    if ('editSims' in newState && !sandboxMode) {
      if (newState.editSims === undefined) {
        localStorage.removeItem('editingSims');
      } else {
        localStorage.setItem('editingSims', newState.editSims);
      }
    }
  }];
};