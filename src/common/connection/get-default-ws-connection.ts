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
import { DrillSocket } from './drill-socket';

// TODO: temprorary solution should be removed
export const getDefaultAdminSocket = (
  token?: string,
) => {
  const url = new URL(axios.defaults.baseURL || '');
  return new DrillSocket(`${url.protocol === 'https:' ? 'wss' : 'ws'}://${url.host}/ws/drill-admin-socket?token=${token}`);
};

// TODO: temprorary solution should be removed
export const getDefaultTest2CodeSocket = (
  token?: string,
) => {
  const url = new URL(axios.defaults.baseURL || '');

  return new DrillSocket(`${url.protocol === 'https:' ? 'wss' : 'ws'}://${url.host}/ws/plugins/test2code?token=${token}`);
};
