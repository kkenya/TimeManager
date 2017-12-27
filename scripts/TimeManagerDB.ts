import moment from '../node_modules/moment/moment';

class TimeManagerDB {
    private DB_NAME: string = "timeManagerDB"
    private DB_VERSION: number = 1;
    private db: IDBDatabase;
    private STATUS_STORE: string = "status";
    private TIMES_STORE: string = "Times";
    private DATE_STORE: string = "Date";
    private SETTINGS_STORE: string = "Settings";

    constructor() {
        if (!window.indexedDB) {
            window.alert("このブラウザは安定板の IndexedDB をサポートしていません。IndexedDB の機能は利用できません。");
        }
    }

    public open(): Promise<void> {
        return new Promise((resolve, reject) => {
            const openRequest: IDBOpenDBRequest = indexedDB.open(this.DB_NAME, this.DB_VERSION);
            openRequest.onsuccess = event => {
                this.db = (<IDBOpenDBRequest>event.target).result;
                resolve();
            };
            openRequest.onerror = event => {
                this.handleError((<IDBOpenDBRequest>event.target).error);
            };
            openRequest.onupgradeneeded = event => {
                this.db = (<IDBOpenDBRequest>event.currentTarget).result;

                const timesStore = this.db.createObjectStore(
                    this.TIMES_STORE, { keyPath: "id", autoIncrement: true }
                );
                // todo indexをdateで作成する
                timesStore.createIndex("id", "id", { unique: true });

                const dateStore = this.db.createObjectStore(
                    this.DATE_STORE, { keyPath: "id", autoIncrement: true }
                );
                dateStore.createIndex("date", "date", { unique: true });

                const settingsStore = this.db.createObjectStore(
                    this.SETTINGS_STORE, { keyPath: "id" }
                );

                const statusStore = this.db.createObjectStore(
                    this.STATUS_STORE, { keyPath: "id" }
                );

                settingsStore.transaction.oncomplete = event => {
                    console.log("settingsStore transaction oncomplete.");
                    const settingsObjectStore = this.getObjectStore(this.SETTINGS_STORE, "readwrite");
                    // きょうもいちにちがんばるぞい！
                    const settingsRequest = settingsObjectStore.add({ id: 1, goal: "目標を設定しよう" });
                    settingsRequest.onsuccess = event => console.log("settingsStore initialized.");
                    settingsRequest.onerror = event => this.handleError(event.target);
                };

                statusStore.transaction.oncomplete = event => {
                    const statusObjectStore = this.getObjectStore(this.STATUS_STORE, "readwrite");
                    const statusRequest = statusObjectStore.add({ id: 1, state: "active" });
                    statusRequest.onsuccess = event => console.log("statusStore initialized.");
                    statusRequest.onerror = event => this.handleError(event.target);
                };
            };
        });
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
            this.handleError(store_name + " cleared");
        };
        request.onerror = event => this.handleError(event.target);
    }

    public getLastIdOfTimes(): Promise<number> {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(this.TIMES_STORE, "readonly");
            const objectStore = transaction.objectStore(this.TIMES_STORE);
            let id: number;
            const request = objectStore.openCursor(null, "prev");

            request.onsuccess = event => {
                const cursor = (<IDBRequest>event.target).result;

                if (!cursor) return;
                id = cursor.key;
            };
            request.onerror = event => this.handleError(event.target);
            transaction.oncomplete = () => {
                resolve(id);
            };
        });
    }

    public addStartTimeOfTimes(startTime: string): void {
        const objectStore: IDBObjectStore = this.getObjectStore(this.TIMES_STORE, "readwrite");
        const data = { startTime: startTime };
        const request: IDBRequest = objectStore.add(data);
        request.onsuccess = event => console.log("TimesStore added.");
        request.onerror = event => this.handleError(event.target);
    }

    public editColumnOfTimes(id: number, endTime: string): void {
        const objectStore = this.getObjectStore(this.TIMES_STORE, "readwrite");
        const request = objectStore.get(id);
        request.onsuccess = event => {
            const data = request.result;
            const start: moment.Moment = moment(data.startTime);
            let end: moment.Moment = moment(endTime);

            if (end.diff(start, "days") > 0) {
                end = moment(data.startTime).endOf("d");

                const nextStart: moment.Moment = moment(endTime).startOf("d");
                const nextEnd: moment.Moment = moment(endTime);
                const nextRest: number = nextEnd.diff(nextStart);
                this.addColumnOfTimes(nextStart.format('YYYY-MM-DDTHH:mm:ss'), nextEnd.format('YYYY-MM-DDTHH:mm:ss'), nextRest);

            }

            const rest: number = end.diff(start);

            data.endTime = end.format('YYYY-MM-DDTHH:mm:ss');
            data.restTime = rest;

            console.log("upateted data is");
            console.log(data);

            const requestUpdate = objectStore.put(data);
            requestUpdate.onsuccess = event => {
                console.log("TimesStore updated.");
                const date: string = moment(data.endTime).format('YYYY-MM-DD');
                this.addColumnOfDate(date, data.restTime)
            }
            requestUpdate.onerror = event => this.handleError(event.target);
        };
        request.onerror = event => this.handleError(event.target);
    }

    private addColumnOfTimes(startTime: string, endTime: string, restTime: number): void {
        const objectStore: IDBObjectStore = this.getObjectStore(this.TIMES_STORE, "readwrite");
        const data = { startTime: startTime, endTime: endTime, restTime: restTime };
        const request: IDBRequest = objectStore.add(data);

        console.log("added data is");
        console.log(data);

        request.onsuccess = event => console.log("TimesStore added.");
        request.onerror = event => this.handleError(event.target);
    }

    public getRestTimeOfDate(date: string): any {
        const objectStore: IDBObjectStore = this.getObjectStore(this.DATE_STORE, "readonly");
        const index: IDBIndex = objectStore.index("date");
        const request: IDBRequest = index.get(date);
        request.onsuccess = event => {
            const data = request.result;
            return data.restTime;
        }
        request.onerror = event => this.handleError(event.target);
    }

    private addColumnOfDate(date: string, restTime: string): void {
        const objectStore: IDBObjectStore = this.getObjectStore(this.DATE_STORE, "readwrite");
        const index: IDBIndex = objectStore.index("date");
        const request: IDBRequest = index.get(date);
        request.onsuccess = event => {
            // todo dataの取得方法をどちらにするか
            // let data = request.result;
            let data = (<IDBRequest>event.target).result;
            if (data) {
                data.restTime += restTime;
            } else {
                data = { date: date, restTime: restTime };
            }

            console.log("added data is");
            console.log(data);

            const requestUpdate = objectStore.put(data);
            requestUpdate.onsuccess = event => console.log("DateStore updated.");
            requestUpdate.onerror = event => this.handleError(event.target);
        };
        request.onerror = event => this.handleError(event.target);
    }

    public getGoalOfSettings(callback): void {
        const objectStore: IDBObjectStore = this.getObjectStore(this.SETTINGS_STORE, "readonly");
        const request = objectStore.get(1);
        request.onsuccess = event => {
            const data = request.result;
            const goal = data.goal;
            callback(goal);
        };
        request.onerror = event => this.handleError(event.target);
    }

    public addGoalOfSettings(goal: string): void {
        const objectStore: IDBObjectStore = this.getObjectStore(this.SETTINGS_STORE, "readwrite");
        const data = {
            id: 1,
            goal: goal
        };
        const request = objectStore.put(data);
        console.log(data);
        request.onsuccess = event => console.log("SettingsStore updated.");
        request.onerror = event => this.handleError(event.target);
    }

    public getStateOfStatus(callback) {
        const objectStore: IDBObjectStore = this.getObjectStore(this.STATUS_STORE, "readonly");
        const request = objectStore.get(1);
        request.onsuccess = event => {
            const data = request.result;
            const state = data.state;
            callback(state);
        };
        request.onerror = event => this.handleError(event.target);
    }

    public addStateOfStatus(state: string): void {
        const objectStore: IDBObjectStore = this.getObjectStore(this.STATUS_STORE, "readwrite");
        const data = {
            id: 1,
            state: state
        };
        const request = objectStore.put(data);
        console.log(data);
        request.onsuccess = event => console.log("StatusStore updated.");
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
    // nsaction.oncomplete = () => {
    //             resolve(ids);
    //         };
    //     });
    // }

    // private deleteTask(store_name: string, id: number) {
    //     const objectStore: IDBObjectStore = this.getObjectStore(store_name, "readwrite");
    //     const getRequest = objectStore.get(id);
    //     getRequest.onsuccess = event => {
    //         const record = (<IDBRequest>event.target).result;
    //         console.log("record: " + record);
    //         if (typeof record == "undefined") {
    //             this.handleError("No matchiing record found");
    //             return;
    //         }

    //         const request = objectStore.delete(id);
    //         request.onsuccess = event => {
    //             console.log("event:", event);
    //             console.log("event.target:", event.target);
    //             console.log("event.target.result:", (<IDBRequest>event.target).result);
    //         };
    //         request.onerror = event => this.handleError(event.target);
    //     };
    //     getRequest.onerror = event => this.handleError(event.target);
    // }

    // private searchTimesStore(id: number) {
    //     const key: number = id;
    //     const objectStore = this.getObjectStore(this.TIMES_STORE, "readonly");
    //     // const index = objectStore.index("title");
    //     index.get(key).onsuccess = event () => {
    //         const data = event.target.result;
    //     };
    // }

    private handleError(message: any) {
        console.debug(message);
    }

}