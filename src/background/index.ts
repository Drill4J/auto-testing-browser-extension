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
import { browser } from 'webextension-polyfill-ts';
import { setupAdminConnection } from './admin';
import { getLaunchParams } from './get-launch-params';
import { asPromised, ensureProtocol } from './util';
import * as coverageRecorder from './coverage-recorder';

let targetTab: any;

start();
async function start() {
  try {
    const launchParams = await getLaunchParams();
    console.log('launch params', JSON.stringify(launchParams));
    const adminConnection = await setupAdminConnection(launchParams.adminUrl, launchParams.agentId, launchParams.groupId);

    await new Promise((resolve) => setTimeout(resolve, 10000)); // HACK allow java autotest agent to setup READY listener
    await setupDrillStarterRouter(adminConnection, launchParams);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log('Start failed. Error:', '\n\t', 'message', e?.message, '\n\t', 'stack', e?.stack, '\n\t', 'stringified', JSON.stringify(e));
  }
}

// chrome.webNavigation.onCompleted.addListener(function(data) {
// if (new URL(data.url).host)
// frameId: 0
// parentFrameId: -1
// processId: 5
// tabId: 2
// timeStamp: 1603193925371.047
// transitionQualifiers: ["client_redirect"]
// transitionType: "link"
// url: "http://localhost/#/"
// });

// // eslint-disable-next-line no-undef
// chrome.tabs.onCreated.addListener((tab) => {
//   console.log('tab created', tab.pendingUrl, tab);
//   const isParamsTab = tab.pendingUrl?.indexOf('drill.autotesting.params') > -1 || tab.url?.indexOf('drill.autotesting.params') > -1;
//   const isExtensionTab = tab.pendingUrl !== 'chrome://extensions/';
//   console.log('isParamsTab', isParamsTab);
//   console.log('isExtensionTab', isExtensionTab);
//   if (tab.id && !isParamsTab && !isExtensionTab) {
//     targetTab = tab;
//     return;
//   }
//   if (isParamsTab) {
//     console.log('params tab detected', tab.id);
//     updateParamsFromParamsTabUrl(tab.pendingUrl as string, 'from listener')
//     // eslint-disable-next-line no-undef
//     chrome.tabs.remove(tab.id as number, () => {
//       console.log('params tab closed');
//     });
//   }
// });

async function getTargetTab(agentUrl: string): Promise<any> {
  return asPromised((callback: any) => {
    // eslint-disable-next-line no-undef
    chrome.tabs.query({
      // active: false,
      // currentWindow: true
    }, (tabs) => {
      const res = tabs.filter(x => x.url && x.url?.indexOf(agentUrl) > -1 || x.pendingUrl && x.pendingUrl?.indexOf(agentUrl) === 0);
      if (!res[0]) throw new Error('Target application tab not found! Check the "agentUrl" field in "allprojects/drill/additionalParams" of Drill4J Auto Test Agent config');
      callback(res[0]);
    });
  });
}

async function setupDrillStarterRouter(adminConnection: AdminConnection, launchParams: LaunchParams ): Promise<void> {
  const { dispatcherUrl, agentUrl, clientId  } = launchParams;
  const socket = await connect(dispatcherUrl);
  let prevTestName = 'prev-test-name-is-not-set-yet';

  console.log('socket.addEventListener');
  socket.addEventListener('message', async (messageObject: any) => {
    const { type, payload } = JSON.parse(messageObject.data);

    if (!payload?.sessionId) {
      console.log('no sessionId in payload');
      return;
    }
    const { sessionId } = payload;
 
    switch (type) {
      case 'START_TEST': {
        targetTab = await getTargetTab(agentUrl);

        const data = await coverageRecorder.takeCoverage(targetTab);
        await adminConnection.sendCoverageData(sessionId, { ...data, testName: `${prevTestName}-AFTER` });
        await coverageRecorder.startRecording(
          targetTab,
          async (coverage: any, suffix = '') => {
            await adminConnection.sendCoverageData(sessionId, { ...coverage, testName: `${payload.testName}${suffix}` });
          }
        );

        prevTestName = payload.testName;
        break;
      }

      case 'FINISH_TEST': {
        coverageRecorder.stopCoverageFlushing(targetTab);
        const coverage = await coverageRecorder.takeCoverage(targetTab);
        await adminConnection.sendCoverageData(sessionId, { ...coverage, testName: payload.testName });
        await coverageRecorder.stopRecording(targetTab);
        break;
      }

      default:
        // eslint-disable-next-line no-console
        console.log('unknown action');
        break;
    }
    socket.send(JSON.stringify({
      type,
      from: {
        id: clientId,
        type: 'extension'
      }
    }));
  });

  socket.send(JSON.stringify({
    type: 'READY',
    from: {
      id: clientId,
      type: 'extension'
    }
  }));
}

async function connect(dispatcherUrl: string) {
  const url = new URL(ensureProtocol(dispatcherUrl));
  const protocol = url.protocol === 'https:' ? 'wss' : 'ws';
  const connection = new WebSocket(`${protocol}://${url.host}`);
  await socketEvent(connection, 'open');
  return connection;
}

async function socketEvent(connection: WebSocket, event: string, timeout = 10000) {
  return new Promise((resolve, reject) => {
    connection.addEventListener(event, (...args: any) => {
      // eslint-disable-next-line no-console
      // console.log(event, Date.now());
      resolve(args);
    });
    setTimeout(() => reject(new Error(`await socket event ${event}: timeout of ${timeout}ms exceeded`)), timeout);
  });
}
