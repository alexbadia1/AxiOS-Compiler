import { Injectable } from '@angular/core';
import { Observable, Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OperatingSystemService {
  private keyboardSubscription: Subscription | null = null;
  public keys: Array<string> = [];

  constructor() { } // constructor

  public setKeyboardSubscription(obs: Observable<KeyboardEvent>) {
    console.log(obs);
    if (this.keyboardSubscription == null) {
      this.keyboardSubscription = obs.subscribe(
        key => {
          console.log(`Key: ${key.key}`);
          this.keys.push(key.key);
        }
      );
    } // if
  } // setMouseMovementSubscription

  public cancelSubscriptions() {
    this.keyboardSubscription?.unsubscribe();
  } // cancelSubscriptions
} // OperatingSystemService
