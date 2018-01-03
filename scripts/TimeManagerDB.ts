import moment, { weekdays } from '../node_modules/moment/moment';
import testDate from 'testData.js';

class TimeManagerDB {
    private DB_NAME: string = "timeManagerDB"
    private DB_VERSION: number = 1;
    private db: IDBDatabase;
    private STATUS_STORE: string = "status";
    private TIMES_STORE: string = "Times";
    private DATES_STORE: string = "Date";
    private SETTINGS_STORE: string = "Settings";
    private ADVICES_STORE: string = "Advices";

    /**
     * indexedDBを利用できるかのチェック
     */
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
                    this.DATES_STORE, { keyPath: "id", autoIncrement: true }
                );
                const settingsStore = this.db.createObjectStore(
                    this.SETTINGS_STORE, { keyPath: "id" }
                );
                const statusStore = this.db.createObjectStore(
                    this.STATUS_STORE, { keyPath: "id" }
                );
                const adviceStore = this.db.createObjectStore(
                    this.ADVICES_STORE, { keyPath: "id" }
                );
                timesStore.createIndex("id", "id", { unique: true });
                dateStore.createIndex("date", "date", { unique: true });

                //オブジェクトストアの作成後に初期データの保存を行う
                //transaction object (IDBTransaction) containing the IDBTransaction.
                //objectStore method, which you can use to access your object store.
                const transaction = (<IDBOpenDBRequest>event.currentTarget).transaction;
                const emptySettingsStore = transaction.objectStore(this.SETTINGS_STORE);
                const emptyStatusStore = transaction.objectStore(this.STATUS_STORE);
                const emptyDateStore = transaction.objectStore(this.DATES_STORE);

                this.initObjectStore(emptySettingsStore, { id: 1, goal: "目標を設定しよう", latLng: { lat: 36.5310338, lng: 136.6284361 }, defaultSleepMs: 77760000 });
                this.initObjectStore(emptyStatusStore, { id: 1, state: "active" });
                //todo test
                // for (let i in testDate) {
                //     const request = emptyDateStore.put(testDate[i]);
                //     request.onsuccess = event => console.log(`testDate[${i}] saved`);
                //     request.onerror = event => console.log(event.target);
                // }
            };
        });
    }

    /**
     * オブジェクトストアの初期データを保存する
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
     * Timesオブジェクトストアの新たなデータにstartTimeを追加する
     * @param startTime 休憩時間の開始時 format('YYYY-MM-DDTHH:mm:ss')
     */
    public addStartTimeOfTimes(startTime: string): void {
        const objectStore: IDBObjectStore = this.getObjectStore(this.TIMES_STORE, "readwrite");
        const data = { startTime: startTime };
        const request: IDBRequest = objectStore.add(data);
        request.onsuccess = event => console.log("startTime added.");
        request.onerror = event => this.handleError(event.target);
    }

    /**
     * TimesオブジェクトストアのデータにendTimeを追加し、日を跨いだ場合に新しいデータとして保存する
     * @param id 追加するデータのid
     * @param endTime 休憩時間の終了時
     */
    public editColumnOfTimes(id: number, endTime: string): void {
        const objectStore = this.getObjectStore(this.TIMES_STORE, "readwrite");
        const request = objectStore.get(id);
        request.onsuccess = event => {
            const data = request.result;
            const startMoment: moment.Moment = moment(data.startTime);
            let endMoment: moment.Moment = moment(endTime);

            // 日を跨いだ場合endTimeを日の終わりに設定し、
            // endTimeの日付の始まりをstartTime終わりをendTimeとして新しいデータを保存する
            if (endMoment.diff(startMoment, "days") > 0) {
                endMoment = moment(data.startTime).endOf("d");

                const nextStart: moment.Moment = moment(endTime).startOf("d");
                const nextEnd: moment.Moment = moment(endTime);
                const nextRestMs: number = nextEnd.diff(nextStart);
                this.addColumnOfTimes(nextStart.format('YYYY-MM-DDTHH:mm:ss'), nextEnd.format('YYYY-MM-DDTHH:mm:ss'), nextRestMs);
            }

            const restTimeMs: number = endMoment.diff(startMoment);
            data.endTime = endMoment.format('YYYY-MM-DDTHH:mm:ss');
            data.restTimeMs = restTimeMs;

            const requestUpdate = objectStore.put(data);
            requestUpdate.onsuccess = event => {
                console.log("TimesStore updated.");
                //その日の休憩時間と睡眠時間を記録する
                const date: string = moment(data.endTime).format('YYYY-MM-DD');
                this.getDefaultSleepMsOfSettings((sleepTimeMs) => {
                    this.addColumnOfDate(date, data.restTimeMs, sleepTimeMs);
                });
            }
            requestUpdate.onerror = event => this.handleError(event.target);
        };
        request.onerror = event => this.handleError(event.target);
    }

    /**
     * Timesストアにデータを追加する
     * @param startTime 休憩を開始した時間
     * @param endTime 休憩を終了した時間
     * @param restTimeMs 休憩時間(ミリ秒)
     */
    private addColumnOfTimes(startTime: string, endTime: string, restTimeMs: number): void {
        const objectStore: IDBObjectStore = this.getObjectStore(this.TIMES_STORE, "readwrite");
        const data = { startTime: startTime, endTime: endTime, restTimeMs: restTimeMs };
        const request: IDBRequest = objectStore.add(data);

        request.onsuccess = event => {
            console.log("new starttime endtime added.");
            const date: string = moment(startTime).format('YYYY-MM-DD');
            this.getSleepTimeMsOfDate((sleepTime) => {
                const sleepTimeMs: number = sleepTime
                this.addColumnOfDate(date, restTimeMs, sleepTimeMs);
            });
        };
        request.onerror = event => this.handleError(event.target);
    }

    /**
     * Dateオブジェクトストアのデータを日付から検索する
     * データが見つからなかった場合現在設定されている睡眠時間を返し、オブジェクトストアにデータを保存する
     * @param date 取得するデータの日付("YYYY-MM-DD")
     * @returns 休憩時間(ミリ秒)
     */
    public getRestTimeMsOfDate(date: string): Promise<number> {
        return new Promise((resolve, reject) => {
            const objectStore: IDBObjectStore = this.getObjectStore(this.DATES_STORE, "readonly");
            const index: IDBIndex = objectStore.index("date");
            const request: IDBRequest = index.get(date);
            request.onsuccess = event => {
                const data = request.result;
                if (typeof data == "undefined") {
                    this.getDefaultSleepMsOfSettings((sleepTime) => {
                        resolve(sleepTime);
                        this.addColumnOfDate(date, 1000, sleepTime);
                    });
                } else {
                    resolve(data.restTimeMs);
                }
            }
            request.onerror = event => this.handleError(event.target);
        });
    }

    /**
     * Dateオブジェクトストアから実行した日付の睡眠時間を取得する
     * データが見つからなかった場合デフォルト値6時間を返し、実行した日の睡眠時間を更新する
     * @param callback 取得したsleepTimeMs(睡眠時間)を引数にとるコールバック関数
     */
    public getSleepTimeMsOfDate(callback: (number) => void): void {
        const objectStore: IDBObjectStore = this.getObjectStore(this.DATES_STORE, "readonly");
        const index: IDBIndex = objectStore.index("date");
        const request: IDBRequest = index.get(moment().format('YYYY-MM-DD'));
        request.onsuccess = event => {
            const data = request.result;
            if (data) {
                callback(data.sleepTimeMs);
            } else {
                this.getDefaultSleepMsOfSettings((sleepTimeMs) => {
                    this.addSleepTimeMsOfDate(sleepTimeMs);
                    callback(sleepTimeMs);
                });
            }
        };
        request.onerror = event => this.handleError(event.target);
    }

    /**
     * Dateオブジェクトストアへ実行した日付の睡眠時間を保存する
     * @param sleepTimeMs 睡眠時間
     */
    public addSleepTimeMsOfDate(sleepTimeMs: number): void {
        const objectStore: IDBObjectStore = this.getObjectStore(this.DATES_STORE, "readwrite");
        const index: IDBIndex = objectStore.index("date");
        const request: IDBRequest = index.get(moment().format('YYYY-MM-DD'));
        request.onsuccess = event => {
            let data = request.result;
            if (data) {
                data.sleepTimeMs = sleepTimeMs;
            } else {
                data = { date: moment().format("YYYY-MM-DD"), sleepTimeMs: sleepTimeMs };
            }
            const requestUpdate = objectStore.put(data);
            requestUpdate.onsuccess = event => console.log("sleeptimeMs updated.");
            requestUpdate.onerror = event => this.handleError(event.target);
        }
        request.onerror = event => this.handleError(event.target);
    }

    /**
     * Dateオブジェクトストアにデータを追加する
     * @param date 日付("YYYY-MM-DD")
     * @param restTimeMs 休憩時間(ミリ秒)
     * @param sleepTimeMs 睡眠時間(ミリ秒)
     */
    private addColumnOfDate(date: string, restTimeMs: number, sleepTimeMs: number): void {
        const objectStore: IDBObjectStore = this.getObjectStore(this.DATES_STORE, "readwrite");
        const index: IDBIndex = objectStore.index("date");
        const request: IDBRequest = index.get(date);
        request.onsuccess = event => {
            let data = (<IDBRequest>event.target).result;
            if (data) {
                data.restTimeMs += restTimeMs;
                data.sleepTimeMs = sleepTimeMs;
            } else {
                data = { date: date, restTimeMs: restTimeMs, sleepTimeMs: sleepTimeMs };
            }

            const requestUpdate = objectStore.put(data);
            requestUpdate.onsuccess = event => console.log(`{date(${date}) updated.}`);
            requestUpdate.onerror = event => this.handleError(event.target);
        };
        request.onerror = event => this.handleError(event.target);
    }

    /**
     * 1週間の休憩時間を取得する。記録が存在しない場合デフォルト値を返す
     * @param today 取得したい週に含まれる日付("YYYY-MM-DD")
     * @returns 1週間のデータ weekData: { dates: ["MM/DD(dddd)", ...], restTimes: [number(ms), ...], sleepTimes: [number(ms), ...]}
     */
    public getWeekRecordOfDate(today: string): Promise<({})> {
        return new Promise((resolve, reject) => {
            const transaction: IDBTransaction = this.db.transaction(this.DATES_STORE, "readonly");
            const objectStore = transaction.objectStore(this.DATES_STORE);
            const index: IDBIndex = objectStore.index("date");
            const weekData = { dates: [], restTimes: [], sleepTimes: [] };

            const firstDate = moment(today).startOf('week').format('YYYY-MM-DD');
            const lastDate = moment(today).endOf('week').format('YYYY-MM-DD');

            const boundKeyRange = IDBKeyRange.bound(firstDate, lastDate, false, false); //境界を含む
            const request = index.openCursor(boundKeyRange)
            request.onsuccess = event => {
                const cursor = (<IDBRequest>event.target).result;

                if (cursor) {
                    const record = cursor.value;
                    if (moment(record.date).isBetween(firstDate, lastDate, null, '[]')) {
                        const oneDay = {
                            date: moment(record.date).locale('ja').format('DD(ddd)'),
                            restTimeMs: record.restTimeMs,
                            sleepTimeMs: record.sleepTimeMs
                        };
                        weekData.dates.push(oneDay.date);
                        weekData.restTimes.push(oneDay.restTimeMs);
                        weekData.sleepTimes.push(oneDay.sleepTimeMs);
                    }
                    cursor.continue();
                }
            };
            transaction.oncomplete = event => {
                //7日間の分のデータが取得できなかったときにデフォルト値を格納する
                if (weekData.dates.length < 7) {
                    const oneday: moment.Moment = moment(today).startOf('week');
                    const fullWeek = { dates: [], restTimes: [], sleepTimes: [] };
                    this.getDefaultSleepMsOfSettings((defaultSleepMs) => {
                        for (let i = 0; i < 7; i++) {
                            //配列に含まれていない日があった時デフォルト値を挿入する
                            if (weekData.dates[i] != oneday.locale('ja').format('DD(ddd)')) {
                                fullWeek.dates.push(oneday.locale('ja').format('DD(ddd)'));
                                fullWeek.restTimes.push(1000);
                                fullWeek.sleepTimes.push(defaultSleepMs);
                            }
                            oneday.add(1, "days") //破壊的なメソッド
                        }
                        resolve(fullWeek);
                    });
                } else {
                    resolve(weekData);
                }
            };
        });
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
            requestUpdate.onsuccess = event => console.log("goal updated.");
            requestUpdate.onerror = event => this.handleError(event.target);
        }
        request.onerror = event => this.handleError(event.target);
    }


    /**
     * Settingsオブジェクトストアからデフォルトに設定した睡眠時間を取得する
     * @param callback 取得した睡眠時間を引数にとるコールバック関数
     */
    private getDefaultSleepMsOfSettings(callback: (number) => void): void {
        const objectStore: IDBObjectStore = this.getObjectStore(this.SETTINGS_STORE, "readonly");
        const request = objectStore.get(1);
        request.onsuccess = event => {
            const data = request.result;
            const sleepMs = data.defaultSleepMs;
            callback(sleepMs);
        };
        request.onerror = event => this.handleError(event.target);
    }

    /**
     * 睡眠時間の変更がない場合この値を使い続ける
     * @param sleepMs 設定した共通の睡眠時間
     */
    private addDefaultSleepMsForSettings(sleepMs: number) {
        const objectStore: IDBObjectStore = this.getObjectStore(this.SETTINGS_STORE, "readwrite");
        const request: IDBRequest = objectStore.get(1);
        request.onsuccess = event => {
            const data = request.result;
            data.defaultSleepMs = sleepMs;

            const requestUpdate = objectStore.put(data);
            requestUpdate.onsuccess = event => console.log("defaultSleepMs updated.");
            requestUpdate.onerror = event => this.handleError(event.target);
        }
        request.onerror = event => this.handleError(event.target);
    }

    /**
     * Advicesオブジェクトストアから活動場所を取得する
     * @param callback 取得したカフェ・図書館を引数にとるコールバック関数
     */
    public getActPlacesOfAdvices(callback: (string) => void): void {
        const objectStore: IDBObjectStore = this.getObjectStore(this.ADVICES_STORE, "readonly");
        const request: IDBRequest = objectStore.get(1);
        request.onsuccess = event => {
            const data = request.result;
            const places = data.places;
            callback(places);
        };
        request.onerror = event => this.handleError(event.target);
    }

    /**
     * Advicesオブジェクトストアから活動場所を取得する
     * @param callback 取得した飲食店を引数にとるコールバック関数
     */
    public getRestPlacesOfAdvices(callback: (string) => void): void {
        const objectStore: IDBObjectStore = this.getObjectStore(this.ADVICES_STORE, "readonly");
        const request: IDBRequest = objectStore.get(2);
        request.onsuccess = event => {
            const data = request.result;
            const places = data.places;
            callback(places);
        };
        request.onerror = event => this.handleError(event.target);
    }

    /**
     * Settingsオブジェクトストアへレストの割合が多いときに表示する活動場所を保存する
     * @param places アドバイスに表示する場所(カフェ・図書館)
     */
    public addActPlacesOfAdvices(places: { name: Array<string>, latLng: Array<{}> }): void {
        const objectStore: IDBObjectStore = this.getObjectStore(this.ADVICES_STORE, "readwrite");
        const data = { id: 1, places: places };
        const request: IDBRequest = objectStore.put(data);

        request.onsuccess = event => console.log("places in Act added.");
        request.onerror = event => this.handleError(event.target);
    }

    /**
     * Settingsオブジェクトストアへアクティブの割合が多いときに表示する休憩場所を保存する
     * @param places アドバイスに表示する場所(飲食店)
     */
    public addRestPlacesOfAdvices(places: { name: Array<string>, latLng: Array<{}> }): void {
        const objectStore: IDBObjectStore = this.getObjectStore(this.ADVICES_STORE, "readwrite");
        const data = { id: 2, places: places };
        const request: IDBRequest = objectStore.put(data);

        request.onsuccess = event => console.log("places in Rest added.");
        request.onerror = event => this.handleError(event.target);
    }

    /**
     * Settingsオブジェクトストアから緯度経度を取得する
     * @param callback 取得したlatLng(緯度軽度)を引数にとるコールバック関数
     */
    public getLatLngOfSettings(callback: (latLng: { lat: number, lng: number }) => void): void {
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
     * @param sleepTimeMs 緯度経度 { lat: number, lng: number }
     */
    public addLatLngOfSettings(latLng: { lat: number, lng: number }): void {
        const objectStore: IDBObjectStore = this.getObjectStore(this.SETTINGS_STORE, "readwrite");
        const request: IDBRequest = objectStore.get(1);
        request.onsuccess = event => {
            const data = request.result
            data.latLng = latLng;

            const requestUpdate = objectStore.put(data);
            requestUpdate.onsuccess = event => console.log("latlng updated.");
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
        request.onsuccess = event => console.log("state updated.");
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