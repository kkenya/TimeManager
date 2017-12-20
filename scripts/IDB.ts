class IDB {
    private DB_NAME: string = "timeManagerDB"
    private DB_VERSION: number = 1;
    private db: IDBDatabase;
    private TIMES_STORE: string;
    private SETTINGS_STORE: string;

    constructor() {
        if (!window.indexedDB) {
            window.alert("このブラウザは安定板の IndexedDB をサポートしていません。IndexedDB の機能は利用できません。");
        }
    }

    public open(): void {
        const openRequest: IDBOpenDBRequest = indexedDB.open(this.DB_NAME, this.DB_VERSION);
        openRequest.onsuccess = event => {
            this.db = (<IDBOpenDBRequest>event.target).result;
        };
        openRequest.onerror = event => {
            this.handleError((<IDBOpenDBRequest>event.target).error);
        };
        openRequest.onupgradeneeded = event => {
            const timesStore = (<IDBOpenDBRequest>event.currentTarget).result.createObjectStore(
                this.TIMES_STORE, { key: "id", autoIncrement: true }
            );
            const settingsStore = (<IDBOpenDBRequest>event.currentTarget).result.createObjectStore(
                this.SETTINGS_STORE, { key: "id", autoIncrement: true }
            );
        };
    }

    /**
     * @param {string} store_name
     * @param {string} mode
     */
    private getObjectStore(store_name: string, mode: IDBTransactionMode): IDBObjectStore {
        const transaction: IDBTransaction = this.db.transaction(store_name, mode);
    const objectStore = transaction.objectStore(store_name);
        return objectStore;
    }

    public clearObjectStore(store_name: string): void {
        const objectStore: IDBObjectStore = this.getObjectStore(store_name, "readwrite");
        const request: IDBRequest = objectStore.clear();
        request.onsuccess = event => {
            console.log(store_name + " cleared");
        };
        request.onerror = event => {
            this.handleError(event.target);
        };
    }

    public getObjectStoreAll(store_name: string): Array<IDBCursorWithValue> {
        const objectStore: IDBObjectStore = this.getObjectStore(store_name, "readonly");
        const request: IDBRequest = objectStore.openCursor();
        let cursors: IDBCursorWithValue[] = [];
        request.onsuccess = event => {
            const cursor: IDBCursorWithValue = (<IDBRequest>event.target).result;
            const id = cursor.key;
            const data = cursor.value;
            console.log("id " +id);
            console.log("data " + data);

            cursors.push(cursor);
            cursor.continue();
        }
        console.log(cursors);
        return cursors;
    }

    public addData(store_name: string, obj: any): void{
        const objectStore: IDBObjectStore = this.getObjectStore(store_name, "readwrite");
        const request: IDBRequest = objectStore.add(obj);
        request.onsuccess = event => {
            console.log("success");
        };
        request.onerror = event => {
            // this.handleError(this.error)
            this.handleError(event)
        }
    }

    public editData(store_name: string, id: number, obj): void {
        const objectStore: IDBObjectStore = this.getObjectStore(store_name, "readwrite");
        const request: IDBRequest = objectStore.get(id);
        request.onsuccess = event => {
            let data = request.result;
            console.log("get: " + data);

            data = obj;
            const requestUpdate = objectStore.put(data);
            console.log("updated: " + data);
            requestUpdate.onsuccess = event => {
                console.log("update successs");
            };
            requestUpdate.onerror = event => {
                // this.handleError(this.error);
                this.handleError(event);
            };
        };
        request.onerror = event => {
            // this.handleError("editTask" + event.target.errorCode);
            this.handleError("editTask" + event.target);
        };
    }

    private deleteTask(store_name: string, id: number) {
        const objectStore: IDBObjectStore = this.getObjectStore(store_name, "readwrite");
        const getRequest = objectStore.get(id);
        getRequest.onsuccess = event => {
            const record = (<IDBRequest>event.target).result;
            console.log("record: " + record);
            if(typeof record == "undefined") {
                this.handleError("No matchiing record found");
                return;
            }

            const request = objectStore.delete(id);
            request.onsuccess = event => {
                console.log("event:", event);
                console.log("event.target:", event.target);
                console.log("event.target.result:", (<IDBRequest>event.target).result);
            };
            request.onerror = event => {
                // this.handleError(event.target.errorCode);
                this.handleError(event.target);
            };
        };
        getRequest.onerror = event => {
            // this.handleError(event.target.errorCode);
            this.handleError(event.target);
        }
    }

    private handleError(message: any) {
        console.error(message);
    }

}