type ICallback = (...args: any[]) => any;

interface IListenerMap {
  [s: string]: any;
}

type MapToList<T, V extends keyof T> = { [K in V]: T[K][]};

export class EventEmitter<T extends IListenerMap> {

  protected eventMap: MapToList<T, keyof T>  = {} as MapToList<T, keyof T>;

  public listeners<K extends keyof T>(type: K): T[K][] {
    return this.eventMap[type] || [];
  }

  public emit<K extends keyof T>(type: K, ...args: any[]): boolean {
    const cbs = this.eventMap[type];
    if (Array.isArray(cbs)) {
      cbs.forEach((fn: ICallback) => fn.apply(this, args));
      return true;
    }
    return false;
  }

  public off<K extends keyof T>(type: K, fn: T[K]): EventEmitter<T> {
    const cbs = this.eventMap[type];
    if (Array.isArray(cbs)) {
      this.eventMap[type] = cbs.filter((v) => v !== fn);
    }
    return this;
  }

  public on<K extends keyof T>(type: K, fn: T[K]): EventEmitter<T> {
    if (this.eventMap[type]) {
      this.eventMap[type].push(fn);
    } else {
      this.eventMap[type] = [fn];
    }
    return this;
  }

  public once<K extends keyof T>(type: K, fn: T[K]): EventEmitter<T> {
    const callback = (...args: any[]) => {
      this.off(type, callback as T[K]);
      fn.apply(this, args);
    }
    this.on(type, callback as T[K]);
    return this
  }

  public removeAllListeners<K extends keyof T>(type?: K): EventEmitter<T> {
    if (undefined === type) {
      this.eventMap = {} as any;
    } else if (this.eventMap[type]) {
      this.eventMap[type].splice(0);
    }
    return this;
  }
}
