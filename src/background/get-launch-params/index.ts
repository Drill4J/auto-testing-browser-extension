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
const PARAMS_TAB_HOST = 'drill.autotesting.params';

export async function getLaunchParams(): Promise<LaunchParams> {
  console.log('getLaunchParams');
  const paramsUrl = await getLaunchParamsUrl();
  if (!paramsUrl) throw new Error('Launch params url not found');

  const launchParams = extractLaunchParamsFromUrl(paramsUrl);
  console.log(JSON.stringify(launchParams));
  const { adminUrl, dispatcherUrl, agentId, groupId, agentUrl, clientId } = launchParams;
  if (!adminUrl || !dispatcherUrl || (!agentId && !groupId) || !agentUrl || !clientId ) {
    throw new Error(`All launch params must be specified`);
  }
  return { adminUrl, dispatcherUrl, groupId, agentId, agentUrl, clientId };
}

async function getLaunchParamsUrl(): Promise<string|undefined> {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line no-undef
    chrome.tabs.query({
      active: true,
      currentWindow: true
    }, (tabs) => {
      if (tabs.length === 0) reject();

      // see https://github.com/microsoft/TypeScript/issues/17960
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const paramTabs = tabs.filter(isParamsTab);
      if (paramTabs.length > 0) {
        if (paramTabs.length > 1) {
          // eslint-disable-next-line no-console
          console.warn();
        }
        resolve(paramTabs[0].pendingUrl || paramTabs[0].url);
        chrome.tabs.remove(paramTabs[0].id as any, () => {}) // TODO error handling
        return;
      }

      reject();
    });
  });
}

function extractLaunchParamsFromUrl(url: string) {
  console.log('extractLaunchParamsFromUrl', url);
  const queryString = url.substring(url.indexOf('?'), url.length);
  const urlParams = new URLSearchParams(queryString);
  const adminUrl = urlParams.get('adminurl');
  const dispatcherUrl = urlParams.get('dispatcherurl');
  const agentId = urlParams.get('agentid');
  const groupId = urlParams.get('groupid');
  const agentUrl = urlParams.get('agenturl');
  const clientId = urlParams.get('clientid');
  
  return {
    adminUrl,
    dispatcherUrl,
    agentId,
    groupId,
    agentUrl,
    clientId,
  };
}

function isParamsTab(tab: chrome.tabs.Tab) {
  // see https://github.com/microsoft/TypeScript/issues/17960
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return tab.pendingUrl!?.indexOf(PARAMS_TAB_HOST) > -1 || tab.url!?.indexOf(PARAMS_TAB_HOST) > -1;
}
