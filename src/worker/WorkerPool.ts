import SimParams from 'sim/SimParams';
import { Stats } from 'sim/Stats';
import { range } from 'util/range';
import { CompleteMessage, ToWorkerMessages } from './Messages';

const postMessage = (worker: Worker, message: ToWorkerMessages) => {
  worker.postMessage(message);
};

interface WorkerConfig {
  expression: string;
  config: SimParams;
}

class WorkerPool {

  private readonly workers: Worker[];
  private terminated: boolean;
  private working: Set<Worker>;
  private reject?: (reason?: any) => void;

  constructor(numWorkers: number) {
    this.workers = range(numWorkers).map(() => new Worker(new URL("./worker.ts", import.meta.url)));
    this.terminated = false;
    this.working = new Set();
    this.reject = undefined;
  }

  run(config: WorkerConfig, iterations: number, onProgress?: (maxPercDone: number, minPercDone: number) => void): Promise<Stats[]> {
    if (this.working.size) { 
      throw new Error('A previous run has not yet finished!');
    }
    return new Promise((res, rej) => {
      this.reject = rej;
      const itersPerJob = Math.min(100000, Math.max(1000, iterations / (3 * this.workers.length)));
      let itersLeft = iterations;
      const results: Stats[] = [];

      const sendProgressUpdate = () => {
        const maxDone = iterations - itersLeft; 
        const minDone = maxDone - (this.working.size * itersPerJob); 
        onProgress?.(maxDone / iterations, minDone / iterations);
      }

      const assignJobToWorker = (worker: Worker) => {
        const jobIters = itersPerJob < itersLeft ? itersPerJob : itersLeft;
        if (jobIters > 0) {
          postMessage(worker, { command: 'run', iterations: jobIters });
          itersLeft = Math.max(0, itersLeft - itersPerJob);
          sendProgressUpdate();
        } else {
          this.working.delete(worker);
          if (this.working.size === 0) {
            res(results);
          } else {
            sendProgressUpdate();
          }
        }
      };

      const onResult = (worker: Worker, message: MessageEvent<CompleteMessage>) => {
        results.push(message.data.stats);
        assignJobToWorker(worker);
      };

      this.workers.forEach((worker) => {
        this.working.add(worker);
        postMessage(worker, {
          command: 'configure',
          expression: config.expression,
          config: config.config,
        });
        worker.onmessage = (message) => onResult(worker, message);
        assignJobToWorker(worker);
      });
    });
  }

  terminate() {
    this.terminated = true;
    this.workers.forEach((worker) => worker.terminate());
    this.working.clear();
    this.reject?.('Terminated');
  }

  isTerminated() {
    return this.terminated;
  }
}

export default WorkerPool;
