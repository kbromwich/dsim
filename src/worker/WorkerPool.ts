import SimConfig from 'sim/SimConfig';
import { Stats } from 'util/calculateStats';
import { range } from 'util/range';
import { CompleteMessage } from './Messages';
import WorkerCommand from './WorkerCommand';

interface WorkerConfig {
  expression: string;
  config: SimConfig;
}

class WorkerPool {

  workers: Worker[];

  constructor(numWorkers: number) {
    this.workers = range(numWorkers).map(() => new Worker(new URL("./worker.ts", import.meta.url)));
  }

  run(config: WorkerConfig, iterations: number): Promise<Stats[]> {
    return new Promise((res, rej) => {
      const itersPerJob = Math.min(100000, Math.max(1000, iterations / (3 * this.workers.length)));
      let itersLeft = iterations;
      const results: Stats[] = [];
      const working = new Set();

      const assignJobToWorker = (worker: Worker) => {
        const jobIters = itersPerJob < itersLeft ? itersPerJob : itersLeft;
        if (jobIters > 0) {
          worker.postMessage({ command: WorkerCommand.Run, iterations: jobIters });
          itersLeft = Math.max(0, itersLeft - itersPerJob);
        } else {
          working.delete(worker);
          if (working.size === 0) {
            console.log(results);
            res(results);
          }
        }
      }

      const onResult = (worker: Worker, message: MessageEvent<CompleteMessage>) => {
        results.push(message.data.stats);
        assignJobToWorker(worker);
      }

      this.workers.forEach((worker) => {
        working.add(worker);
        worker.postMessage({
          command: WorkerCommand.Configure,
          expression: config.expression,
          config: config.config,
        });
        worker.onmessage = (message) => onResult(worker, message);
        assignJobToWorker(worker);
      });
    });
  }
}

export default WorkerPool;
