import React from 'react';
import BaseTable, { AutoResizer, ColumnShape } from 'react-base-table';
import 'react-base-table/styles.css';

import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';

import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import WarningIcon from '@mui/icons-material/Warning';

import { arrayBinned, arrayUnique } from 'util/arrays';
import parseIntStrict from 'util/parseIntStrict';
import DynamicAC, { DynamicACData, parseRawDynamicACs } from 'sim/DynamicAC';

import SimRun, { AverageDummyAc } from './SimRun';
import { useHeldSharedState, useSetSharedState } from 'util/sharedState';
import { ResultHoverTarget } from './ResultHoverTarget';
import SimResultHover from './SimResultHover';
import SimResultCell from './SimResultCell';


const nameWidth = 300;
const valueWidth = 60;
const expressionWidth = 600;
const sepBorder = '1px solid rgba(224, 224, 224, 1)';

interface RowData {
  runs: SimRun[];
}

const StyledTable = styled(BaseTable)(() => ({
  '& .BaseTable__header-row:first-of-type': {
    borderBottom: 0,
  },
  '& .borderedCell:not(:last-child), .cellStdev': {
    borderRight: sepBorder,
  },
  '& .cellStdev': {
    color: 'rgba(0, 0, 0, 0.65)',
  },
  '& .levelBreak': {
    borderBottom: '2px solid rgba(224, 224, 224, 1)',
  },
  '& .cellText span': {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  '& .expression': {
    // Need this because the table ignores flexGrow for whatever reason;
    // maybe because it's a "fixed" table?
    flex: '1 0 auto !important',
  },
})) as unknown as new () => BaseTable<RowData>;

const GroupCell = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',

  '&:not(:last-child)': {
    borderRight: sepBorder,
  },
}));

type Order = Record<string, 'asc' | 'desc'>;

interface CustomColumnShape extends ColumnShape<RowData> {
  runGetter?: (runs: SimRun[]) => SimRun;
}

const DefaultSortOrder: Order = {
  level: 'asc',
  // [`ac.${DynamicAC.SBCTH65}.mean`]: 'asc',
  [`ac.${AverageDummyAc}.mean`]: 'asc',
  name: 'asc',
};

  
const getValueColumns = (
  keyPrefix: string,
  runGetter: (runs: SimRun[]) => SimRun | undefined,
): ColumnShape<RowData>[] => [{
  align: 'right',
  className: 'cellMean',
  headerClassName: 'cellMean',
  key: `${keyPrefix}.mean`,
  dataGetter: ({ rowData }) => runGetter(rowData.runs),
  cellRenderer: ({ cellData }) => <SimResultCell sim={cellData} stat="mean" />,
  runGetter,
  sortable: true,
  style: { paddingRight: 3 },
  title: `Mean`,
  width: valueWidth,
}, {
  align: 'right',
  className: 'cellStdev',
  headerClassName: 'cellStdev',
  key: `${keyPrefix}.stdev`,
  dataGetter: ({ rowData }) => runGetter(rowData.runs),
  cellRenderer: ({ cellData }) => <SimResultCell sim={cellData} stat="stdev" />,
  runGetter,
  sortable: true,
  style: { paddingLeft: 3 },
  title: `Stdev`,
  width: valueWidth,
}];

interface Props {
  acValues: number[];
  dynamicACs: DynamicAC[];
  noSort?: boolean;
  results: SimRun[];
  showExpressions?: boolean;
}

const SimResultsTable: React.FC<Props> = ({ acValues, dynamicACs, noSort, results, showExpressions }) => {
  const [lockLevelSort, setlockLevelSort] = React.useState<boolean>(true);
  const [orderBy, setOrderBy] = React.useState<Order>(DefaultSortOrder);
  const sharedHoverTarget = useHeldSharedState<ResultHoverTarget>();
  const setHoverTarget = useSetSharedState(sharedHoverTarget);

  const showAverage = acValues.length > 1;
  
  const rows = React.useMemo(() => {
    const order = Object.entries(orderBy);
    return Object.values(
      arrayBinned(results, (r) => r.simulation.id())
    ).sort((a, b) => {
      // TODO: Refactor this crem...
      if (noSort) return 0;
      for (let i = 0; i < order.length; i += 1) {
        const [id, ascDesc] = order[i];
        const ascMult = ascDesc === 'desc' ? -1 : 1;
        if (id === 'name') {
          const cmp = a[0].simulation.name.localeCompare(b[0].simulation.name);
          if (cmp !== 0) return cmp * ascMult;
        } else if (id === 'level') {
          const cmp = a[0].simulation.level - b[0].simulation.level;
          if (cmp !== 0) return cmp * ascMult;
        } else if (id.startsWith('ac')) {
          const [, acStr, stat] = id.split('.');
          if (stat === 'mean' || stat === 'stdev') {
            const ac = parseIntStrict(acStr);
            let getAC: (level: number) => number = () => ac;
            if (Number.isNaN(ac)) {
              const dac = parseRawDynamicACs(acStr)[0];
              if (dac) {
                getAC = DynamicACData[dac].calculate;
              }
            }
            const statA = a.find((s) => s.simParams.ac === getAC(s.simParams.level))?.stats?.[stat];
            const statB = b.find((s) => s.simParams.ac === getAC(s.simParams.level))?.stats?.[stat];
            if (statA && statB) {
              const cmp = statA - statB;
              if (cmp !== 0) return cmp * ascMult;
            } else if (statA) {
              return -1;
            }
            return 1
          }
        }
      }
      return 0;
    }).map((runs, i) => ({ id: i, runs }));
  }, [orderBy, results, noSort]);

  const columns = React.useMemo((): CustomColumnShape[] => ([
    {
      key: 'simName',
      dataGetter: ({ rowData }) => rowData.runs[0].simulation.name,
      sortable: true,
      title: 'Simulation',
      width: nameWidth,
      className: 'cellText borderedCell',
      cellRenderer: ({ cellData, rowData }) => {
        const warnings = arrayUnique(rowData.runs.map((r) => r.warnings).flat());
        return (
          <>
            {!!warnings.length &&  (
              <span className="hover" title={[cellData, ...warnings].join('\n')}>
                <WarningIcon fontSize="small" color="warning" />
              </span>
            )}
            <span title={[cellData, ...warnings].join('\n')}>
              {cellData}
            </span>
          </>
        );
      },
    },
    {
      key: 'level',
      dataGetter: ({ rowData }) => rowData.runs[0].simParams.level,
      sortable: true,
      title: 'Level',
      width: valueWidth,
    },
    ...acValues.map((ac) => getValueColumns(
      `ac.${ac}`,
      (row) => row.find((sr) => sr.simParams.ac === ac)),
    ).flat(),
    ...dynamicACs.map((dac) => getValueColumns(
      `ac.${dac}`,
      (row) => row.find((sr) => sr.simParams.ac === DynamicACData[dac].calculate(sr.simParams.level))),
    ).flat(),
    ...(showAverage ? getValueColumns(
      `ac.${AverageDummyAc}`,
      (row) => row.find((sr) => sr.simParams.ac === AverageDummyAc),
    ) : []),
    ...(showExpressions ? [{
      key: 'expression',
      title: 'Simulation Expression',
      dataGetter: ({ rowData }) => rowData.runs[0].simulation.rawExpression,
      width: expressionWidth,
      className: 'cellText expression',
      cellRenderer: ({ cellData }) => <span title={cellData}>{cellData}</span>,
    }] as CustomColumnShape[] : []),
  ] as CustomColumnShape[]).map((c) => ({
    className: 'borderedCell', headerClassName: 'borderedCell', ...c,
  })), [acValues, dynamicACs, showExpressions, showAverage]);

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <AutoResizer>
        {({ width, height }) => (
          <StyledTable
            fixed
            columns={columns}
            data={rows}
            headerHeight={[25, 30]}
            headerRenderer={({ cells, headerIndex }) => {
              if (headerIndex === 1) return cells;
              return [
                <GroupCell key="name" style={{ width: nameWidth }}></GroupCell>,
                <GroupCell key="level" style={{ width: valueWidth }}>
                  <IconButton onClick={() => {
                    setlockLevelSort(!lockLevelSort);
                    if (!lockLevelSort) setOrderBy({ level: 'asc', ...orderBy });
                  }} sx={{ padding: 0 }}>
                    {lockLevelSort ? <LockIcon sx={{ fontSize: '1rem' }} /> : <LockOpenIcon sx={{ fontSize: "1rem" }} />}
                  </IconButton>
                </GroupCell>,
                ...acValues.map((ac) => (
                  <GroupCell
                    key={`ac.${ac}`} style={{ width: valueWidth * 2 }}
                    onMouseEnter={(e) => {
                      const acResults = results.filter((sr) => sr.simParams.ac === ac);
                      setHoverTarget({
                        simResults: acResults,
                        element: e.currentTarget,
                        title: `AC ${ac}`,
                      });
                    }}
                    onMouseLeave={() => setHoverTarget(undefined)}
                  >
                    AC {ac}
                  </GroupCell>
                )),
                ...dynamicACs.map((dac) => (
                  <GroupCell
                    key={`ac.${dac}`} style={{ width: valueWidth * 2 }}
                    onMouseEnter={(e) => {
                      const acResults = results.filter((sr) => {
                        const dacAc = DynamicACData[dac].calculate(sr.simParams.level);
                        return sr.simParams.ac === dacAc;
                      });
                      setHoverTarget({
                        simResults: acResults,
                        element: e.currentTarget,
                        title: DynamicACData[dac].displayName,
                      });
                    }}
                    onMouseLeave={() => setHoverTarget(undefined)}
                    title={DynamicACData[dac].description}
                  >
                    {DynamicACData[dac].displayName}
                  </GroupCell>
                )),
                showAverage && <GroupCell key="average" style={{ width: valueWidth * 2 }}>Average</GroupCell>,
                showExpressions && <GroupCell key="expression" style={{ width: expressionWidth }}></GroupCell>,
              ].filter(Boolean);
            }}
            cellProps={({ columnIndex, rowData }) => ({
              onMouseEnter: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
                const simResult = columns[columnIndex].runGetter?.(rowData.runs);
                if (simResult) {
                  setHoverTarget({ simResult, element: e.currentTarget });
                }
              },
              onMouseLeave: () => setHoverTarget(undefined),
            })}
            rowClassName={({ rowIndex }) => {
              if (lockLevelSort) {
                const thisLevel = rows[rowIndex]?.runs[0].simParams.level;
                const nextLevel = rows[rowIndex + 1]?.runs[0].simParams.level;
                if (thisLevel !== nextLevel) {
                  return 'levelBreak';
                }
              }
              return '';
            }}
            onColumnSort={(sortBy) => {
              if (lockLevelSort && sortBy.key === 'level') {
                const { level, ...others } = orderBy;
                setOrderBy({ level: sortBy.order, ...others });
              } else if (lockLevelSort) {
                setOrderBy({ level: orderBy.level, [sortBy.key]: sortBy.order });
              } else {
                setOrderBy({ [sortBy.key]: sortBy.order });
              }
            }}
            sortState={orderBy}
            components={{
              SortIndicator: ({ sortOrder, className }) => (
                <span className={className}>{sortOrder === 'asc' ? '\u2193' : '\u2191'}</span>
              ),
            }}
            rowHeight={30}
            width={width}
            height={height}
          />
        )}
      </AutoResizer>
      <SimResultHover target={sharedHoverTarget} />
    </Box>
  );
};

export default SimResultsTable;
