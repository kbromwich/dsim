import React, { Fragment, useMemo } from 'react';

import { styled } from '@mui/material/styles';
import LinearProgress from '@mui/material/LinearProgress';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';

import SimRun, { SimProgress } from './SimRun';
import { combineStats, Stats } from 'sim/Stats';
import SimResult from 'sim/SimResult';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  padding: theme.spacing(0.5),
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
  // hide last border
  '&:last-child td, &:last-child th': {
    borderBottom: 0,
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
  sims: SimRun[];
  acValues: number[];
  showExpressions?: boolean;
  showAverage?: boolean;
}
const SimResultRow: React.FC<Props> = ({ sims, acValues, showAverage, showExpressions }) => {
  const allStatsReady = sims.every((s) => 'stats' in s);
  return (
    <StyledTableRow key={sims[0].simulation.id()}>
      <StyledTableCell className="name">
        {sims[0].simulation.name}
      </StyledTableCell>
      <StyledTableCell align="center" className="level">
        {sims[0].simulation.level}
      </StyledTableCell>
      {acValues.map((ac) => {
        const sim = sims.find((s) => s.simConfig.ac === ac);
        if (sim) {
          if ('stats' in sim) {
            return <StatsCell key={`${ac}-stats`} stats={sim.stats} />
          } else if ('error' in sim && sim.error) {
            return (
              <StyledTableCell align="center" key={`${ac}-error`} colSpan={2} title={sim.error}>
                Error
              </StyledTableCell>
            );
          } else if ('maxProgress' in sim && sim.maxProgress) {
            return (
              <StyledTableCell key={`${ac}-progress`} colSpan={2}>
                <NoTransitionProgress
                  value={sim.minProgress * 100}
                  valueBuffer={sim.maxProgress * 100}
                  variant="buffer"
                />
              </StyledTableCell>
            );
          }
        }
        return <StyledTableCell colSpan={2} key={`${ac}-empty`} />;
      })}
      {showAverage && allStatsReady ? (
        <StatsCell stats={combineStats((sims as SimResult[]).map((s) => s.stats))} />
      ) : (
        <StyledTableCell colSpan={2} />
      )}
      {showExpressions && (
        <StyledTableCell className="expression">{sims[0].simulation.rawExpression}</StyledTableCell>
      )}
    </StyledTableRow>
  );
};

const MemoSimResultRow: React.FC<Props> = (props) => {
  const countsRef = React.useRef(props.acValues.map(() => 0));
  const countRef = React.useRef(0);

  let rerender = false;
  for (let i = 0; i < props.acValues.length; i += 1) {
    const prevCount = countsRef.current[i] || 0;
    const nextCount = (props.sims[i] as Partial<SimProgress>)?.updateCount || 0;
    if (prevCount !== nextCount) {
      countsRef.current[i] = nextCount;
      rerender = true;
    }
  }
  if (rerender) {
    countRef.current += 1;
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => <SimResultRow {...props} />, [countRef.current]);
};

export default MemoSimResultRow;
