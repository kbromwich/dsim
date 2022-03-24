import React, { Fragment } from 'react';

import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import SimRun from './SimRun';
import { arrayBinned } from 'util/arrays';
import SimResultRow from './SimResultRow';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  padding: theme.spacing(0.5),
  [`&.${tableCellClasses.head}`]: {
    // backgroundColor: theme.palette.common.black,
    // color: theme.palette.common.white,
  },
  [`&:first-of-type th`]: {
    borderBottom: '0',
    // backgroundColor: theme.palette.common.black,
    // color: theme.palette.common.white,
  },
  [`&.${tableCellClasses.body}`]: {
    // fontSize: 14,
  },
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
  '&:first-of-type th': {
    borderBottom: 0,
    paddingBottom: 0,
  },
  '&:nth-of-type(2) th': {
    paddingTop: 0,
  },
}));

interface Props {
  results: SimRun[];
  acValues: number[];
  showExpressions?: boolean;
}

const SimResultsTable: React.FC<Props> = ({ results, acValues, showExpressions = true }) => {
  const simsById = Object.values(arrayBinned(results, (r) => r.simulation.id()));
  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 700 }} aria-label="customized table">
        <TableHead>
          <StyledTableRow>
            <StyledTableCell>Simulation</StyledTableCell>
            <StyledTableCell align="center" className="level">Level</StyledTableCell>
            {acValues.map((ac) => (
              <StyledTableCell key={ac} colSpan={2} align="center">AC {ac}</StyledTableCell>
            ))}
            {acValues.length > 1 && (
              <StyledTableCell colSpan={2} align="center">Average</StyledTableCell>
            )}
            {showExpressions && (
              <StyledTableCell>Simulation Expression</StyledTableCell>
            )}
          </StyledTableRow>
          <StyledTableRow>
            <StyledTableCell></StyledTableCell>
            <StyledTableCell className="level"></StyledTableCell>
            {acValues.map((ac) => (
              <Fragment key={ac}>
                <StyledTableCell className="mean" align="right">mean</StyledTableCell>
                <StyledTableCell className="stdev" align="right">stdev</StyledTableCell>
              </Fragment>
            ))}
            {acValues.length > 1 && (
              <Fragment>
                <StyledTableCell className="mean" align="right">mean</StyledTableCell>
                <StyledTableCell className="stdev" align="right">stdev</StyledTableCell>
              </Fragment>
            )}
            {showExpressions && (
              <StyledTableCell></StyledTableCell>
            )}
          </StyledTableRow>
        </TableHead>
        <TableBody>
          {simsById.map((sims) => (
            <SimResultRow
              acValues={acValues}
              key={sims[0].simulation.id()}
              showAverage={acValues.length > 1}
              showExpressions
              sims={sims}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default SimResultsTable;
