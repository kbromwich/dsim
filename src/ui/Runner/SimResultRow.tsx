import React, { Fragment, useMemo } from 'react';

import { styled } from '@mui/material/styles';
import LinearProgress from '@mui/material/LinearProgress';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';

import SimRun, { SimProgress } from './SimRun';
import { Stats } from 'sim/Stats';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  padding: theme.spacing(0.5),
  border: 0,
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
  '&[colSpan="2"]': {
    borderLeft: '1px solid rgba(224, 224, 224, 1)',
    borderRight: '1px solid rgba(224, 224, 224, 1)',
  },
  '&.mean, &.level': {
    borderLeft: '1px solid rgba(224, 224, 224, 1)',
    width: 1,
  },
  '&.stdev': {
    borderRight: '1px solid rgba(224, 224, 224, 1)',
    width: 1,
  },
  '&.expression': {
    whiteSpace: 'nowrap',
  },
  '&.name': {
    whiteSpace: 'nowrap',
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  border: 0,
  borderBottom: 0,
  '&.topDivider': {
    borderTop: '2px solid rgba(224, 224, 224, 1)',
  },
}));

const NoTransitionProgress = styled(LinearProgress)(({ theme }) => ({
  '& .MuiLinearProgress-bar': {
    transition: 'none',
  },
}));

const StatsCell = ({ stats }: { stats: Stats }) => (
  <Fragment>
    <StyledTableCell className="mean" align="right">
      {stats.mean.toFixed(2)}
    </StyledTableCell>
    <StyledTableCell className="stdev" align="right">
      {stats.stdev.toFixed(2)}
    </StyledTableCell>
  </Fragment>
);

interface Props {
  acValues: number[];
  sims: SimRun[];
  showExpressions?: boolean;
  topDivider?: boolean;
}
const SimResultRow: React.FC<Props> = ({ acValues, sims, showExpressions, topDivider }) => (
  <StyledTableRow className={topDivider ? 'topDivider' : undefined}  key={sims[0].simulation.id()}>
    <StyledTableCell className="name">
      {sims[0].simulation.name}
    </StyledTableCell>
    <StyledTableCell align="center" className="level">
      {sims[0].simulation.level}
    </StyledTableCell>
    {acValues.map((ac, i) => {
      const sim = sims.find((s) => s.simParams.ac === ac);
      if (sim) {
        if ('stats' in sim) {
          return <StatsCell key={`${i}-${ac}-stats`} stats={sim.stats} />
        } else if ('error' in sim && sim.error) {
          return (
            <StyledTableCell align="center" key={`${i}-${ac}-error`} colSpan={2} title={sim.error}>
              Error
            </StyledTableCell>
          );
        } else if ('maxProgress' in sim && sim.maxProgress) {
          return (
            <StyledTableCell key={`${i}-${ac}-progress`} colSpan={2}>
              <NoTransitionProgress
                value={sim.minProgress * 100}
                valueBuffer={sim.maxProgress * 100}
                variant="buffer"
              />
            </StyledTableCell>
          );
        }
      }
      return <StyledTableCell colSpan={2} key={`${i}-${ac}-empty`} />;
    })}
    {showExpressions && (
      <StyledTableCell className="expression">{sims[0].simulation.rawExpression}</StyledTableCell>
    )}
  </StyledTableRow>
);

interface MemoProps extends Props {
  fastRender?: boolean;
}

const MemoSimResultRow: React.FC<MemoProps> = (props) => {
  const { acValues, fastRender, sims } = props;
  const timesRef = React.useRef(acValues.map(() => 0));
  const timeRef = React.useRef(0);

  let rerender = false;
  for (let i = 0; i < acValues.length; i += 1) {
    const prevTime = timesRef.current[i] || 0;
    const nextTime = (sims[i] as Partial<SimProgress>)?.updateTime || 0;
    if (prevTime !== nextTime) {
      timesRef.current[i] = nextTime;
      rerender = true;
    }
  }
  if (rerender) {
    timeRef.current += 1;
  }

  const reRender = fastRender ? timeRef.current : +new Date();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => <SimResultRow {...props} />, [reRender]);
};

export default MemoSimResultRow;
