declare module 'dexie' {
    export type Table<T, Key> = any;

    export default class Dexie {
        constructor(name: string);
        version(versionNumber: number): { stores(schema: Record<string, string>): void };
        table<T, Key>(name: string): Table<T, Key>;
        transaction(mode: string, ...args: any[]): Promise<void>;
    }
}
