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
import { promisifyBrowserApiCall } from '../util';

const DEBUGGER_VERSION = '1.3';

export default {
  attach(target: chrome.debugger.Debuggee) {
    return promisifyBrowserApiCall(chrome.debugger.attach, target, DEBUGGER_VERSION);
  },

  sendCommand(target: chrome.debugger.Debuggee, method: string, params: any) {
    return promisifyBrowserApiCall(chrome.debugger.sendCommand, target, method, params);
  },

  detach(target: chrome.debugger.Debuggee) {
    return promisifyBrowserApiCall(chrome.debugger.detach, target);
  },

};
