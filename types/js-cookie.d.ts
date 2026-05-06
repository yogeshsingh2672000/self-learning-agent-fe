declare module 'js-cookie' {
  interface CookieAttributes {
    expires?: number | Date;
    path?: string;
    domain?: string;
    secure?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None' | boolean;
    [key: string]: unknown;
  }

  interface CookiesStatic {
    get(name: string): string | undefined;
    get(): { [key: string]: string };
    set(name: string, value: string, options?: CookieAttributes): string;
    remove(name: string, options?: CookieAttributes): void;
  }

  const Cookies: CookiesStatic;
  export = Cookies;
}
