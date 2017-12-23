class TimeManagerDB {
    constructor() {
        this.DB_NAME = "timeManagerDB";
        this.DB_VERSION = 1;
        this.STATUS_STORE = "status";
        this.TIMES_STORE = "Times";
        this.SETTINGS_STORE = "Settings";
        if (!window.indexedDB) {
            window.alert("このブラウザは安定板の IndexedDB をサポートしていません。IndexedDB の機能は利用できません。");
        }
    }
    open() {
        const openRequest = indexedDB.open(this.DB_NAME, this.DB_VERSION);
        openRequest.onsuccess = event => {
            this.db = event.target.result;
        };
        openRequest.onerror = event => {
            this.handleError(event.target.error);
        };
        openRequest.onupgradeneeded = event => {
            const timesStore = event.currentTarget.result.createObjectStore(this.TIMES_STORE, { keyPath: "id", autoIncrement: true });
            timesStore.createIndex("id", "id", { unipue: true });
            const settingsStore = event.currentTarget.result.createObjectStore(this.SETTINGS_STORE, { keyPath: "id", autoIncrement: true });
            const statusStore = event.currentTarget.result.createObjectStore(this.STATUS_STORE, { keyPath: "id", autoIncrement: true });
        };
    }
    /**
     * @param {string} store_name
     * @param {string} mode
     */
    getObjectStore(store_name, mode) {
        const transaction = this.db.transaction(store_name, mode);
        const objectStore = transaction.objectStore(store_name);
        return objectStore;
    }
    clearObjectStore(store_name) {
        const objectStore = this.getObjectStore(store_name, "readwrite");
        const request = objectStore.clear();
        request.onsuccess = event => {
            this.handleError(store_name + " cleared");
        };
        request.onerror = event => this.handleError(event.target);
    }
    getLastTimesId() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(this.TIMES_STORE, "readonly");
            const objectStore = transaction.objectStore(this.TIMES_STORE);
            let id;
            const request = objectStore.openCursor(null, "prev");
            request.onsuccess = event => {
                const cursor = event.target.result;
                if (!cursor)
                    return;
                id = cursor.key;
            };
            request.onerror = event => this.handleError(event.target);
            transaction.oncomplete = () => {
                resolve(id);
            };
        });
    }
    addStartTimeForTimesStore(startTime) {
        const objectStore = this.getObjectStore(this.TIMES_STORE, "readwrite");
        const obj = { startTime: startTime };
        const request = objectStore.add(obj);
        request.onsuccess = event => {
            console.log("TimesStore added.");
        };
        request.onerror = event => this.handleError(event.target);
    }
    editColumnForTimesStore(id, endTime) {
        const objectStore = this.getObjectStore(this.TIMES_STORE, "readwrite");
        const request = objectStore.get(id);
        request.onsuccess = event => {
            const data = request.result;
            const start = moment(data.startTime);
            let end = moment(endTime);
            if (end.diff(start, "days") > 0) {
                end = moment(data.startTime).endOf("d");
                const nextStart = moment(endTime).startOf("d");
                const nextEnd = moment(endTime);
                const nextRest = nextEnd.diff(nextStart);
                this.addColumnForTimesStore(nextStart.format('YYYY-MM-DDTHH:mm:ss'), nextEnd.format('YYYY-MM-DDTHH:mm:ss'), nextRest);
            }
            const rest = end.diff(start);
            data.endTime = end.format('YYYY-MM-DDTHH:mm:ss');
            data.restTime = rest;
            console.log("upateted data is");
            console.log(data);
            const requestUpdate = objectStore.put(data);
            requestUpdate.onsuccess = event => {
                console.log("TimesStore updated.");
            };
            requestUpdate.onerror = event => this.handleError(event.target);
        };
        request.onerror = event => this.handleError(event.target);
    }
    addColumnForTimesStore(startTime, endTime, restTime) {
        const objectStore = this.getObjectStore(this.TIMES_STORE, "readwrite");
        const data = { startTime: startTime, endTime: endTime, restTime: restTime };
        const request = objectStore.add(data);
        console.log("added data is");
        console.log(data);
        request.onsuccess = event => {
            console.log("TimesStore added.");
        };
        request.onerror = event => this.handleError(event.target);
    }
    // public getTimesIds(): Promise<number> {
    //     return new Promise((resolve, reject) => {
    //         const transaction: IDBTransaction = this.db.transaction(this.TIMES_STORE, "readonly");
    //         const objectStore = transaction.objectStore(this.TIMES_STORE);
    //         let ids: number[] = new Array();
    //         const request = objectStore.openCursor();
    //         request.onsuccess = event => {
    //             const cursor = (<IDBRequest>event.target).result;
    //             if (!cursor) return;
    //             ids.push(cursor.key);
    //             cursor.continue();
    //         };
    //         request.onerror = e => console.error(e);
    //         transaction.oncomplete = () => {
    //             resolve(ids);
    //         };
    //     });
    // }
    editData(store_name, id, obj) {
        const objectStore = this.getObjectStore(store_name, "readwrite");
        const request = objectStore.get(id);
        request.onsuccess = event => {
            let data = request.result;
            console.log("get: " + data);
            data = obj;
            const requestUpdate = objectStore.put(data);
            console.log("updated: " + data);
            requestUpdate.onsuccess = event => {
                console.log("update successs");
            };
            requestUpdate.onerror = event => this.handleError(event);
        };
        request.onerror = event => this.handleError(event.target);
    }
    deleteTask(store_name, id) {
        const objectStore = this.getObjectStore(store_name, "readwrite");
        const getRequest = objectStore.get(id);
        getRequest.onsuccess = event => {
            const record = event.target.result;
            console.log("record: " + record);
            if (typeof record == "undefined") {
                this.handleError("No matchiing record found");
                return;
            }
            const request = objectStore.delete(id);
            request.onsuccess = event => {
                console.log("event:", event);
                console.log("event.target:", event.target);
                console.log("event.target.result:", event.target.result);
            };
            request.onerror = event => this.handleError(event.target);
        };
        getRequest.onerror = event => this.handleError(event.target);
    }
    // private searchTimesStore(id: number) {
    //     const key: number = id;
    //     const objectStore = this.getObjectStore(this.TIMES_STORE, "readonly");
    //     // const index = objectStore.index("title");
    //     index.get(key).onsuccess = event () => {
    //         const data = event.target.result;
    //     };
    // }
    handleError(message) {
        console.debug(message);
    }
}
