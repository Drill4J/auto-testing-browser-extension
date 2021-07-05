/*
 * Copyright 2020 EPAM Systems
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import xxHashJs from 'xxhashjs';
import devToolsApi from './dev-tools-api';

const FLUSH_COVERAGE_INTERVAL = 10000;

const scriptSources: any = {};
const flushCoverageTimers: Record<number, any> = {};
const tabsAttachedState: Record<number, boolean> = {};

export async function startRecording(tab: any, coveragePartCb: any) {
  console.log(`startRecording tab with id ${tab.id.toString()}`);

  flushCoverageTimers[tab.id] = setInterval(async () => coveragePartCb(await takeCoverage(tab)), FLUSH_COVERAGE_INTERVAL);

  if (tabsAttachedState[tab.id]) return;

  try {
    const target = {
      tabId: tab.id,
    };

    // eslint-disable-next-line no-console
    console.log(`attach to tab with id ${tab.id.toString()}`);
    await devToolsApi.attach(target);
    tabsAttachedState[tab.id] = true;

    await devToolsApi.sendCommand(target, 'Profiler.enable', {});
    await devToolsApi.sendCommand(target, 'Profiler.startPreciseCoverage', {
      callCount: false,
      detailed: true,
    });

    scriptSources[tab.id] = {
      hashToUrl: {},
      urlToHash: {},
    };

    // TODO: test performance impact
    // commented out in order to avoid additional overhead to the browser performance
    // NOTE: urlToHash/hashToUrl maps need to be added to JS agent beforehand
    // by recording a sample test with browser extension for manual testing
    // all coverage will be filtered otherwise
    // eslint-disable-next-line no-undef
    chrome.debugger.onEvent.addListener(async (source, method, params) => {
      if (method !== 'Debugger.scriptParsed') {
        return;
      }

      const { url, scriptId } = params as { url: string; scriptId: string };

      if (!url || url.startsWith('chrome-extension:') || url.includes('google-analytics.com')) {
        return;
      }
      // TODO will lead to errors in coverage, if script changes, but saves from parsing on each reload
      if (scriptSources[tab.id].urlToHash[url]) return;

      const rawScriptSource: any = await devToolsApi.sendCommand(target, 'Debugger.getScriptSource', { scriptId });
      const hash = getHash(unifyLineEndings(rawScriptSource.scriptSource));
      scriptSources[tab.id].hashToUrl[hash] = url;
      scriptSources[tab.id].urlToHash[url] = hash;
    });

    await devToolsApi.sendCommand(target, 'Debugger.enable', {});
    await devToolsApi.sendCommand(target, 'Debugger.setSkipAllPauses', { skip: true });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('failed to attach', e);
  }
}

export function stopCoverageFlushing(tab: any) {
  clearInterval(flushCoverageTimers[tab.id]);  
}

export async function takeCoverage(tab: any) {
  if (!tabsAttachedState[tab.id]) return []; // TODO Might be misleading

  const target = {
    tabId: tab.id,
  };

  const data: any = await devToolsApi.sendCommand(target, 'Profiler.takePreciseCoverage', {});
  // const data: any = await devToolsApi.sendCommand(target, 'Profiler.getBestEffortCoverage', {});
  return { coverage: data.result, scriptSources: scriptSources[tab.id] };
}

export async function stopRecording(tab: any) {
  const target = {
    tabId: tab.id,
  };

  await devToolsApi.sendCommand(target, 'Profiler.stopPreciseCoverage', {});
  await devToolsApi.sendCommand(target, 'Profiler.disable', {});
  await devToolsApi.sendCommand(target, 'Debugger.disable', {});
  await devToolsApi.detach(target);
  tabsAttachedState[tab.id] = false;
}

function getHash(data: any) {
  const hashFn = xxHashJs.h32(0xABCD);// seed = 0xABCD
  return hashFn.update(data).digest().toString(16);
}

function unifyLineEndings(str: string): string {
  // reference https://www.ecma-international.org/ecma-262/10.0/#sec-line-terminators
  const LF = '\u000A';
  const CRLF = '\u000D\u000A';
  const LS = '\u2028';
  const PS = '\u2029';
  return str.replace(RegExp(`(${CRLF}|${LS}|${PS})`, 'g'), LF);
}
