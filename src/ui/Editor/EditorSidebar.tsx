import React from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

import { EditorStateSet } from './EditorState';

interface Props {
  onSimsChange: (sims: string) => void;
  editStateSet: EditorStateSet;
  sandboxMode?: boolean;
}

const EditorSidebar: React.FC<Props> = ({ editStateSet, onSimsChange, sandboxMode }) => {
  const [state, setState] = editStateSet;
  return (
    <Box sx={{
      bgcolor: 'background.default',
      display: 'flex',
      flexDirection: 'column',
      gap: 1,
      p: 1,
    }}>
      <Button
        disabled={state.editSims === undefined}
        onClick={() => {
          if (state.editSims !== undefined) {
            onSimsChange(state.editSims);
            setState({ editSims: undefined });
          }
        }}
      >
        {sandboxMode && 'Apply Changes'}
        {!sandboxMode && 'Save Changes'}
      </Button>
      <Button
        disabled={state.editSims === undefined && !state.showEditDiff}
        onClick={() => setState({ showEditDiff: !state.showEditDiff })}
      >
        {state.showEditDiff ? 'Hide Diff' : 'Show Diff'}
      </Button>
      <Button
        disabled={state.editSims === undefined}
        onClick={() => setState({ cancel: true })}
      >
        Cancel Changes
      </Button>
      <Dialog
        open={state.cancel}
        onClose={() => setState({ cancel: false })}
      >
        <DialogTitle>
          Cancel Changes?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Any changes you've made will be lost/reverted!
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setState({ cancel: false })} autoFocus>
            No, keep changes!
          </Button>
          <Button onClick={() => setState({
            editSims: undefined,
            cancel: false,
          })}>
            Yes, revert changes!
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EditorSidebar;
