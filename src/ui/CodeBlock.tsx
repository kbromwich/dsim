import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

const CodeBlock = styled(Typography)(({ theme }) => ({
  padding: theme.spacing(1),
  whiteSpace: 'pre',
  backgroundColor: theme.palette.divider,
}));

export default CodeBlock;
