import { parseSimDefsScript } from 'sim/parse';

onmessage = function(event: MessageEvent<{ script: string }>) {
  const script = event.data.script;
  const parsedSims = parseSimDefsScript(script);
  this.postMessage({ errors: parsedSims.errors });
}

export {}
