import moment, { weekdays } from '../node_modules/moment/moment';
import testDate from 'testData.js';

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

    /**
     * データベースを開いた後、初期値の設定を行う
     */
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
                const dateStore = this.db.createObjectStore(
                    this.DATE_STORE, { keyPath: "id", autoIncrement: true }
                );
                const settingsStore = this.db.createObjectStore(
                    this.SETTINGS_STORE, { keyPath: "id" }
                );
                const statusStore = this.db.createObjectStore(
                    this.STATUS_STORE, { keyPath: "id" }
                );
                timesStore.createIndex("id", "id", { unique: true });
                dateStore.createIndex("date", "date", { unique: true });

                //transaction object (IDBTransaction) containing the IDBTransaction.
                //objectStore method, which you can use to access your object store.
                const transaction = (<IDBOpenDBRequest>event.currentTarget).transaction;
                const emptyDateStore = transaction.objectStore(this.DATE_STORE);
                const emptySettingsStore = transaction.objectStore(this.SETTINGS_STORE);
                const emptyStatusStore = transaction.objectStore(this.STATUS_STORE);

                this.initObjectStore(emptySettingsStore, { id: 1, goal: "目標を設定しよう", latLng: { lat: 36.5310338, lng: 136.6284361 } });
                this.initObjectStore(emptyStatusStore, { id: 1, state: "active" });
                //todo test
                for (let i in testDate) {
                    let daterequest = emptyDateStore.put(testDate[i]);
                    daterequest.onsuccess = event => console.log(`testDate[${i}] saved`);
                    daterequest.onerror = event => console.log(event.target);
                }
            };
        });
    }

    /**
     * オブジェクトストアのデータに初期値を保存する
     * @param objectStore
     * @param data データベース作成時に保存しておくデータ
     */
    private initObjectStore(objectStore: IDBObjectStore, data: object): void {
        const request = objectStore.put(data);
        request.onsuccess = event => console.log(`${objectStore.name} initialized.`);
        request.onerror = event => this.handleError(event.target);
    }

    /**
     * オブジェクトストアを取得する
     * @param storeName オブジェクトストアの名前
     * @param mode ["readwrite", readonly] トランザクションに指定するモード
     * @returns 取得したオブジェクトストア
     */
    private getObjectStore(storeName: string, mode: IDBTransactionMode): IDBObjectStore {
        const transaction: IDBTransaction = this.db.transaction(storeName, mode);
        const objectStore = transaction.objectStore(storeName);
        return objectStore;
    }

    /**
     * Timesオブジェクトストアから一番最後のIdを取得する
     * @returns 最後に保存したデータのId
     */
    public getLastIdOfTimes(): Promise<number> {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(this.TIMES_STORE, "readonly");
            const objectStore = transaction.objectStore(this.TIMES_STORE);
            let id: number;
            const request = objectStore.openCursor(null, "prev");

            request.onsuccess = event => {
                const cursor = (<IDBRequest>event.target).result;
                if (typeof cursor == "undefined") return;
                id = cursor.key;
            };
            request.onerror = event => this.handleError(event.target);
            transaction.oncomplete = () => {
                resolve(id);
            };
        });
    }

    /**
     * TimesオブジェクトストアにstartTimeを追加する
     * @param startTime 休憩時間の開始時 format('YYYY-MM-DDTHH:mm:ss')
     */
    public addStartTimeOfTimes(startTime: string): void {
        const objectStore: IDBObjectStore = this.getObjectStore(this.TIMES_STORE, "readwrite");
        const data = { startTime: startTime };
        const request: IDBRequest = objectStore.add(data);
        request.onsuccess = event => console.log("TimesStore added.");
        request.onerror = event => this.handleError(event.target);
    }

    /**
     * Timesオブジェクトストアのデータを追加し、日を跨いだ場合に新しいデータとして保存する
     * @param id 追加するデータのid
     * @param endTime 休憩時間の終了時
     */
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

    /**
     * Timesストアにデータを追加する
     * @param startTime 休憩を開始した時間
     * @param endTime 休憩を終了した時間
     * @param restTime 休憩時間(ミリ秒)
     */
    private addColumnOfTimes(startTime: string, endTime: string, restTime: number): void {
        const objectStore: IDBObjectStore = this.getObjectStore(this.TIMES_STORE, "readwrite");
        const data = { startTime: startTime, endTime: endTime, restTime: restTime };
        const request: IDBRequest = objectStore.add(data);

        request.onsuccess = event => console.log("TimesStore added.");
        request.onerror = event => this.handleError(event.target);
    }

    /**
     * Dateオブジェクトストアのデータを日付から検索する
     * @param date 日にち format('YYYY-MM-DD')
     * @returns 休憩時間(ミリ秒)
     */
    public getRestTimeOfDate(date: string): Promise<number> {
        return new Promise((resolve, reject) => {
            const objectStore: IDBObjectStore = this.getObjectStore(this.DATE_STORE, "readonly");
            const index: IDBIndex = objectStore.index("date");
            const request: IDBRequest = index.get(date);
            request.onsuccess = event => {
                const data = request.result;
                resolve(data.restTime);
            }
            request.onerror = event => this.handleError(event.target);
        });
    }

    /**
     * 1週間の休憩時間を取得する。記録が存在する日のデータのみを返す
     * @param today 取得したい週に含まれる日付(YYYY-MM-DD)
     * @returns 1週間のデータ [{date: "MM/DD(dddd)", restTime: number(ms)}]
     */
    public getWeekRecordOfDate(today: string): Promise<Array<{}>> {
        return new Promise((resolve, reject) => {

            const transaction: IDBTransaction = this.db.transaction(this.DATE_STORE, "readonly");
            const objectStore = transaction.objectStore(this.DATE_STORE);
            const index: IDBIndex = objectStore.index("date");
            let weekData = [];

            const firstDate = moment(today).startOf('week').format('YYYY-MM-DD');
            const lastDate = moment(today).endOf('week').format('YYYY-MM-DD');

            const boundKeyRange = IDBKeyRange.bound(firstDate, lastDate, false, false);
            const request = index.openCursor(boundKeyRange)
            request.onsuccess = event => {
                const cursor = (<IDBRequest>event.target).result;
                if (cursor) {
                    const record = cursor.value;
                    const oneDay = {
                        date: moment(record.date).locale('ja').format('MM/DD(ddd)'),
                        restTime: record.restTime
                    };
                    weekData.push(oneDay);

                    cursor.continue();
                }
            };
            transaction.oncomplete = event => {
                resolve(weekData);
            };
        });
    }

    /**
     * Dateオブジェクトストアにデータを追加する
     * @param date 日にち format('YYYY-MM-DD')
     * @param restTime 休憩時間(ミリ秒)
     */
    private addColumnOfDate(date: string, restTime: string): void {
        const objectStore: IDBObjectStore = this.getObjectStore(this.DATE_STORE, "readwrite");
        const index: IDBIndex = objectStore.index("date");
        const request: IDBRequest = index.get(date);
        request.onsuccess = event => {
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

    /**
     * SettingsオブジェクトストアからGoal(目標)を取得する
     * @param callback 取得したGoal(目標)を引数にとるコールバック関数
     */
    public getGoalOfSettings(callback: (string) => void): void {
        const objectStore: IDBObjectStore = this.getObjectStore(this.SETTINGS_STORE, "readonly");
        const request = objectStore.get(1);
        request.onsuccess = event => {
            const data = request.result;
            const goal = data.goal;
            callback(goal);
        };
        request.onerror = event => this.handleError(event.target);
    }

    /**
     * SettingsオブジェクトストアへGoal(目標)を保存する
     * @param goal 目標
     */
    public addGoalOfSettings(goal: string): void {
        const objectStore: IDBObjectStore = this.getObjectStore(this.SETTINGS_STORE, "readwrite");
        const request: IDBRequest = objectStore.get(1);
        request.onsuccess = event => {
            const data = request.result;
            data.goal = goal;

            const requestUpdate = objectStore.put(data);
            requestUpdate.onsuccess = event => console.log("SettingsStore updated.");
            requestUpdate.onerror = event => this.handleError(event.target);
        }
        request.onerror = event => this.handleError(event.target);
    }

    //todo オブジェクトストアからデータ取得する処理を共通化する
    //todo 睡眠時間の変数に単位を含める
    /**
     * Settingsオブジェクトストアから睡眠時間を取得する
     * @param callback 取得したsleepTime(睡眠時間)を引数にとるコールバック関数
     */
    public getSleepTimeOfSettings(callback: (number) => void): void {
        const objectStore: IDBObjectStore = this.getObjectStore(this.SETTINGS_STORE, "readonly");
        const request: IDBRequest = objectStore.get(1);
        request.onsuccess = event => {
            const data = request.result;
            const sleepTime = data.sleepTime;
            callback(sleepTime);
        };
        request.onerror = event => this.handleError(event.target);
    }

    /**
     * Settingsオブジェクトストアへ睡眠時間を保存する
     * @param sleepTime 睡眠時間
     */
    public addSleepTimeOfSettings(sleepTime: number): void {
        const objectStore: IDBObjectStore = this.getObjectStore(this.SETTINGS_STORE, "readwrite");
        const request: IDBRequest = objectStore.get(1);
        request.onsuccess = event => {
            const data = request.result
            data.sleepTime = sleepTime;

            const requestUpdate = objectStore.put(data);
            requestUpdate.onsuccess = event => console.log("SettingsStore updated.");
            requestUpdate.onerror = event => this.handleError(event.target);
        }
        request.onerror = event => this.handleError(event.target);
    }

    /**
     * Settingsオブジェクトストアから緯度経度を取得する
     * @param callback 取得したlatLng(緯度軽度)を引数にとるコールバック関数
     */
    public getLatLngOfSettings(callback: ({ }) => void): void {
        const objectStore: IDBObjectStore = this.getObjectStore(this.SETTINGS_STORE, "readonly");
        const request: IDBRequest = objectStore.get(1);
        request.onsuccess = event => {
            const data = request.result;
            const latLng = data.latLng;
            callback(latLng);
        };
        request.onerror = event => this.handleError(event.target);
    }

    /**
     * Settingsオブジェクトストアへ緯度経度を保存する
     * @param sleepTime 緯度経度 { lat: number, lng: number }
     */
    public addLatLngOfSettings(latLng: { lat: number, lng: number }): void {
        const objectStore: IDBObjectStore = this.getObjectStore(this.SETTINGS_STORE, "readwrite");
        const request: IDBRequest = objectStore.get(1);
        request.onsuccess = event => {
            const data = request.result
            data.latLng = latLng;

            const requestUpdate = objectStore.put(data);
            requestUpdate.onsuccess = event => console.log("SettingsStore updated.");
            requestUpdate.onerror = event => this.handleError(event.target);
        }
        request.onerror = event => this.handleError(event.target);
    }

    /**
     * Stateオブジェクトストアから休憩の状態("active" or "rest")を取得する
     * @param callback 取得したStateを引数にとるコールバック関数
     */
    public getStateOfStatus(callback: (string) => void): void {
        const objectStore: IDBObjectStore = this.getObjectStore(this.STATUS_STORE, "readonly");
        const request = objectStore.get(1);
        request.onsuccess = event => {
            const data = request.result;
            const state = data.state;
            callback(state);
        };
        request.onerror = event => this.handleError(event.target);
    }

    /**
     * Stateオブジェクトストアに休憩の状態("active" or "rest")を保存する
     * @param state 休憩の状態("active" or "rest")
     */
    public addStateOfStatus(state: string): void {
        const objectStore: IDBObjectStore = this.getObjectStore(this.STATUS_STORE, "readwrite");
        const data = {
            id: 1,
            state: state
        };
        const request = objectStore.put(data);
        request.onsuccess = event => console.log("StatusStore updated.");
        request.onerror = event => this.handleError(event.target);
    }

    /**
     * コンソールに出力する
     * @param message 出力するデータ
     */
    private handleError(message: any): void {
        console.debug(message);
    }

}