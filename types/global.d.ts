interface TaskTable {
    id: number;
    name: string;
    createdAt: number;
    updatedAt?: number;
}

interface RemoteSelectorOptions {
    dom: HTMLSelectElement;
    apiPath: string;
    valueKey: string;
    nameKey: string;
    sorter?: (a: any, b: any) => number;
    filter?: (item: any) => boolean;
}
