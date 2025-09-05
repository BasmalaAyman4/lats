export interface DictionaryHook {
    dictionary: any;
    loading: boolean;
    error: any;
    t: (key: string) => string;
    locale: string;
}
