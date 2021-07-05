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
import axios from 'axios';
import { ensureProtocol } from '../util';

const AUTH_TOKEN_HEADER_NAME = 'Authorization';

export async function setupAdminConnection(adminUrl: string, agentId: string | null, groupId: string | null): Promise<AdminConnection> {
  axios.defaults.headers.post['Content-Type'] = 'application/json;charset=UTF-8';
  const response = await axios.post(`${ensureProtocol(adminUrl)}/api/login`);
  const token = response.headers[AUTH_TOKEN_HEADER_NAME.toLowerCase()];
  if (!token) throw new Error('Failed to obtain admin auth token');
  axios.defaults.headers.common[AUTH_TOKEN_HEADER_NAME] = `Bearer ${token}`;

  if (agentId) {
    axios.defaults.baseURL = `${ensureProtocol(adminUrl)}/api/agents/${agentId}/plugins/test2code/dispatch-action`;
  } else {
    axios.defaults.baseURL = `${ensureProtocol(adminUrl)}/api/groups/${groupId}/plugins/test2code/dispatch-action`;
  }

  return {
    startSession,
    finishSession,
    sendCoverageData,
  };
}

async function startSession(testName: string): Promise<string> {
  const { data } = await axios.post('', {
    type: 'START',
    payload: { testType: 'AUTOMATED', testName, isRealtime: true },
  });
  const { data: { payload: { sessionId } } } = data;
  return sessionId;
}

async function finishSession(sessionId: string) {
  await axios.post('', {
    type: 'STOP',
    payload: { sessionId },
  });
}

async function sendCoverageData(sessionId: string, dataObject: Record<string, unknown>): Promise<void> {
  const data = JSON.stringify(dataObject);
  await axios.post('', {
    type: 'ADD_SESSION_DATA',
    payload: {
      sessionId,
      data,
    },
  });
}
