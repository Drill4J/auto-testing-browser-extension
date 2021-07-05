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
import { Subscription } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

export interface DrillResponse {
  message: string;
  destination: string;
  type: string;
}

export class DrillSocket {
  public connection$: WebSocketSubject<DrillResponse>;

  public subscription: Subscription;

  constructor(url: string) {
    this.connection$ = webSocket<DrillResponse>(url);

    this.subscription = this.connection$.subscribe();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public subscribe(topic: string, callback: (arg: any) => void, message?: object) {
    const subscription = this.connection$.subscribe(
      ({ destination, message: responseMessage }: DrillResponse) => destination === topic && callback(responseMessage || null),
    );
    this.send(topic, 'SUBSCRIBE', message);

    return () => {
      subscription.unsubscribe();
      this.send(topic, 'UNSUBSCRIBE');
    };
  }

  public reconnect(url: string) {
    this.connection$ = webSocket<DrillResponse>(url);

    this.subscription = this.connection$.subscribe();
  }

  public send(destination: string, type: string, message?: object) {
    this.connection$.next({
      destination,
      type,
      message: JSON.stringify(message),
    });
  }
}
