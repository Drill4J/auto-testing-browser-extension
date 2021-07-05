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

export function asPromised(block: any) {
  return new Promise((resolve, reject) => {
    block((result: any) => {
      if (browser.runtime.lastError) {
        reject(browser.extension.lastError);
      } else {
        resolve(result);
      }
    });
  });
}

// ref https://github.com/microsoft/TypeScript/issues/1336#issuecomment-670229622
// function promisifyChromeApiCall<T extends unknown[], R>(chromeApiCall: (...params: [...T, () => R]) => void) {
//   return async (...args: [...T, () => R]): Promise<R> => new Promise((resolve, reject) => {
//     chromeApiCall(...args, (data: R) => {
//       if (browser.runtime.lastError) {
//         reject(browser.runtime.lastError);
//         return;
//       }
//       resolve(data);
//     });
//   });
// }

export function promisifyBrowserApiCall<T>(apiFunction: any, ...params: unknown[]): Promise<T> {
  return new Promise((resolve, reject) => {
    apiFunction(...params, (result: any) => {
      if (browser.runtime.lastError) {
        reject(browser.runtime.lastError);
      } else {
        resolve(result);
      }
    });
  });
}

export function ensureProtocol(url: string) {
  const hasProtocol = url.indexOf('http') > -1 || url.indexOf('https') > -1;
  if (!hasProtocol) {
    return `http://${url}`;
  }
  return url;
}
