import React, { Fragment } from 'react';

import { styled } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';

import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';

import SimRun from './SimRun';
import { arrayBinned } from 'util/arrays';
import SimResultRow from './SimResultRow';
import { combineStats, Stats } from 'sim/Stats';
import SimResult from 'sim/SimResult';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  padding: theme.spacing(0.5),
  border: 0,
  '&[colSpan="2"]': {
    borderLeft: '1px solid rgba(224, 224, 224, 1)',
    borderRight: '1px solid rgba(224, 224, 224, 1)',
  },
  '&.mean, &.level': {
    borderLeft: '1px solid rgba(224, 224, 224, 1)',
  },
  '&.stdev': {
    borderRight: '1px solid rgba(224, 224, 224, 1)',
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(1) th': {
    borderBottom: 0,
    paddingBottom: 0,
  },
  '&:nth-of-type(2) th': {
    paddingTop: 0,
  },
}));

type Order = [string, boolean];

const AverageDummyAc = -1;
const AverageMeanId = `ac.${AverageDummyAc}.mean`;
const DefaultSortOrder: Order[] = [
  ['level', false],
  [AverageMeanId, false],
  ['name', false],
];

interface Props {
  acValues: number[];
  fastRender?: boolean;
  results: SimRun[];
  showExpressions?: boolean;
}

const SimResultsTable: React.FC<Props> = ({ acValues, fastRender, results, showExpressions }) => {
  const [orderBy, setOrderBy] = React.useState<Order>([AverageMeanId, false]);
  const [lockLevelSort, setlockLevelSort] = React.useState<boolean | null>(false);

  const [orderById, orderByAsc] = orderBy;
  const locked: Order[] = lockLevelSort !== null ? [['level', lockLevelSort]] : [];
  const fullSortOrder = [...locked, orderBy, ...DefaultSortOrder];

  const showAverage = acValues.length > 1;
  const simsById = Object.values(
    arrayBinned(results, (r) => r.simulation.id())
  ).map((sims) => {
    // Calculate and add averages into results
    if (showAverage) {
      const firstNotReady = sims.find((s) => !('stats' in s));
      if (!firstNotReady) {
        return [...sims, new SimResult(
          sims[0].simulation,
          { ...sims[0].simParams, ac: AverageDummyAc },
          combineStats((sims as SimResult[]).map((s) => s.stats)),
        )];
      } else {
        return [...sims, firstNotReady];
      }
    }
    return sims;
  }).sort((a, b) => {
    if (fastRender) return 0;
    for (let i = 0; i < fullSortOrder.length; i += 1) {
      const [id, asc] = fullSortOrder[i];
      const ascMult = asc ? -1 : 1;
      if (id === 'name') {
         const cmp = a[0].simulation.name.localeCompare(b[0].simulation.name);
         if (cmp !== 0) return cmp * ascMult;
      } else if (id === 'level') {
        const cmp = a[0].simulation.level - b[0].simulation.level;
        if (cmp !== 0) return cmp * ascMult;
      } else if (id.startsWith('ac')) {
        const [_, acStr, stat] = id.split('.');
        const ac = Number(acStr);
        const statA = (a as SimResult[])
          .find((s) => s.simParams.ac === ac)
          ?.stats?.[stat as keyof Stats];
        const statB = (b as SimResult[])
          .find((s) => s.simParams.ac === ac)
          ?.stats?.[stat as keyof Stats];
        if (statA && statB) {
          const cmp = statA - statB;
          if (cmp !== 0) return cmp * ascMult;
        } else if (statA) {
          return -1;
        }
        return 1
      }
    }
    return 0;
  });

  const sortLabel = (id: string, label: string) => {
    if (fastRender) return label;
    const levelLocked = id === 'level' && lockLevelSort !== null;
    const isAsc = levelLocked ? lockLevelSort : orderByAsc;
    return (
      <TableSortLabel
        active={orderById === id || levelLocked}
        direction={isAsc ? 'asc': 'desc'}
        hideSortIcon
        onClick={() => {
          if (levelLocked) {
            setlockLevelSort(!lockLevelSort);
          } else if (orderById === id) {
            setOrderBy([id, !orderByAsc]);
          } else {
            setOrderBy([id, true]);
          }
        }}
      >
        {label}
      </TableSortLabel>
    );
  };

  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 700, borderCollapse: 'collapse' }}>
        <TableHead>
          <StyledTableRow>
            <StyledTableCell rowSpan={2}>
              {sortLabel('name', 'Simulation')}
            </StyledTableCell>
            <StyledTableCell align="center" className="level" rowSpan={2}>
              <IconButton
                onClick={() => setlockLevelSort(lockLevelSort === null ? true : null)}
                sx={{ padding: 0 }}
              >
                {lockLevelSort !== null ? <LockIcon sx={{ fontSize: '1rem' }} /> : <LockOpenIcon sx={{ fontSize: "1rem" }} />}
              </IconButton>
              {sortLabel('level', 'Level')}
            </StyledTableCell>
            {acValues.map((ac) => (
              <StyledTableCell key={ac} colSpan={2} align="center">
                AC {ac}
              </StyledTableCell>
            ))}
            {showAverage && (
              <StyledTableCell colSpan={2} align="center">Average</StyledTableCell>
            )}
            {showExpressions && (
              <StyledTableCell rowSpan={2}>Simulation Expression</StyledTableCell>
            )}
          </StyledTableRow>
          <StyledTableRow>
            {acValues.map((ac) => (
              <Fragment key={ac}>
                <StyledTableCell className="mean" align="right">
                  {sortLabel(`ac.${ac}.mean`, 'mean')}
                </StyledTableCell>
                <StyledTableCell className="stdev" align="right">
                  {sortLabel(`ac.${ac}.stdev`, 'stdev')}
                </StyledTableCell>
              </Fragment>
            ))}
            {showAverage && (
              <Fragment>
                <StyledTableCell className="mean" align="right">
                  {sortLabel(`ac.${AverageDummyAc}.mean`, 'mean')}
                </StyledTableCell>
                <StyledTableCell className="stdev" align="right">
                  {sortLabel(`ac.${AverageDummyAc}.stdev`, 'stdev')}
                </StyledTableCell>
              </Fragment>
            )}
          </StyledTableRow>
        </TableHead>
        <TableBody>
          {simsById.map((sims, i) => {
            const changingLevel = simsById[i - 1]?.[0]?.simulation.level !== sims[0].simulation.level;
            const separatePrevious = lockLevelSort !== null && changingLevel;
            return (
              <SimResultRow
                acValues={showAverage ? [...acValues, AverageDummyAc] : acValues}
                fastRender={fastRender}
                key={sims[0].simulation.id()}
                showExpressions
                sims={sims}
                topDivider={separatePrevious}
              />
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default SimResultsTable;
