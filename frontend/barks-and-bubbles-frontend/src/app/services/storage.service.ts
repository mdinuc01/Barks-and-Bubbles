import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';

const TOKEN_KEY = 'aj';
const USER_KEY = 'un';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private isBrowser: boolean;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  private setCookie(name: string, value: string, days: number): void {
    if (this.isBrowser) {
      let expires = '';
      if (days) {
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        expires = '; expires=' + date.toUTCString();
      }
      this.document.cookie = name + '=' + (value || '') + expires + '; path=/';
    }
  }

  public getCookie(name: string): string | null {
    if (this.isBrowser) {
      const nameEQ = name + '=';
      const ca = this.document.cookie.split(';');
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0)
          return c.substring(nameEQ.length, c.length);
      }
    }
    return null;
  }

  private eraseCookie(name: string): void {
    this.setCookie(name, '', -1);
  }

  clean(): void {
    this.eraseCookie(TOKEN_KEY);
    this.eraseCookie(USER_KEY);
  }

  public saveUser(user: any): void {
    let token = user.token.replaceAll('"', '');
    this.eraseCookie(TOKEN_KEY);
    this.eraseCookie(USER_KEY);
    this.setCookie(TOKEN_KEY, token, 2);
    this.setCookie(USER_KEY, user.username, 2);
  }

  public getUser(): any {
    const user = this.getCookie(USER_KEY);
    if (user) return user;
  }

  public isLoggedIn(): boolean {
    const user = this.getCookie(TOKEN_KEY);
    return !!user;
  }
}
