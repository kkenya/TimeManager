class TimeManagerDB {
    constructor() {
        this.DB_NAME = "timeManagerDB";
        this.DB_VERSION = 1;
        this.STATUS_STORE = "status";
        this.TIMES_STORE = "Times";
        this.DATE_STORE = "Date";
        this.SETTINGS_STORE = "Settings";
        if (!window.indexedDB) {
            window.alert("このブラウザは安定板の IndexedDB をサポートしていません。IndexedDB の機能は利用できません。");
        }
    }
    /**
     * データベースを開いた後、初期値の設定を行う
     */
    open() {
        return new Promise((resolve, reject) => {
            const openRequest = indexedDB.open(this.DB_NAME, this.DB_VERSION);
            openRequest.onsuccess = event => {
                this.db = event.target.result;
                resolve();
            };
            openRequest.onerror = event => {
                this.handleError(event.target.error);
            };
            openRequest.onupgradeneeded = event => {
                this.db = event.currentTarget.result;
                const timesStore = this.db.createObjectStore(this.TIMES_STORE, { keyPath: "id", autoIncrement: true });
                timesStore.createIndex("id", "id", { unique: true });
                const dateStore = this.db.createObjectStore(this.DATE_STORE, { keyPath: "id", autoIncrement: true });
                dateStore.createIndex("date", "date", { unique: true });
                dateStore.transaction.oncomplete = event => {
                    const objectStore = this.getObjectStore(this.DATE_STORE, "readwrite");
                    //todo test
                    for (let i in testDate) {
                        let request = objectStore.put(testDate[i]);
                        request.onsuccess = event => console.log(`testDate[${i}] saved`);
                        request.onerror = event => console.log(event.target);
                    }
                };
                const settingsStore = this.db.createObjectStore(this.SETTINGS_STORE, { keyPath: "id" });
                settingsStore.transaction.oncomplete = event => {
                    this.initObjectStore(this.SETTINGS_STORE, { id: 1, goal: "目標を設定しよう" });
                };
                // const statusStore = this.db.createObjectStore(this.STATUS_STORE, { keyPath: "id" });
                // statusStore.transaction.oncomplete = event => {
                //     this.initObjectStore(this.STATUS_STORE, { id: 1, state: "active" });
                // };
            };
        });
    }
    /**
     * オブジェクトストアに初期値を設定する
     * @param storeName オブジェクトストア名
     * @param data 追加するデータ
     */
    initObjectStore(storeName, data) {
        const objectStore = this.getObjectStore(storeName, "readwrite");
        const request = objectStore.put(data);
        request.onsuccess = event => console.log(`${storeName} initialized.`);
        request.onerror = event => this.handleError(event.target);
    }
    /**
     * オブジェクトストアを取得する
     * @param storeName オブジェクトストアの名前
     * @param mode ["readwrite", readonly] トランザクションに指定するモード
     * @returns 取得したオブジェクトストア
     */
    getObjectStore(storeName, mode) {
        const transaction = this.db.transaction(storeName, mode);
        const objectStore = transaction.objectStore(storeName);
        return objectStore;
    }
    /**
     * Timesオブジェクトストアから一番最後のIdを取得する
     * @returns 最後に保存したデータのId
     */
    getLastIdOfTimes() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(this.TIMES_STORE, "readonly");
            const objectStore = transaction.objectStore(this.TIMES_STORE);
            let id;
            const request = objectStore.openCursor(null, "prev");
            request.onsuccess = event => {
                const cursor = event.target.result;
                if (typeof cursor == "undefined")
                    return;
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
    addStartTimeOfTimes(startTime) {
        const objectStore = this.getObjectStore(this.TIMES_STORE, "readwrite");
        const data = { startTime: startTime };
        const request = objectStore.add(data);
        request.onsuccess = event => console.log("TimesStore added.");
        request.onerror = event => this.handleError(event.target);
    }
    /**
     * Timesオブジェクトストアのデータを追加し、日を跨いだ場合に新しいデータとして保存する
     * @param id 追加するデータのid
     * @param endTime 休憩時間の終了時
     */
    editColumnOfTimes(id, endTime) {
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
                this.addColumnOfTimes(nextStart.format('YYYY-MM-DDTHH:mm:ss'), nextEnd.format('YYYY-MM-DDTHH:mm:ss'), nextRest);
            }
            const rest = end.diff(start);
            data.endTime = end.format('YYYY-MM-DDTHH:mm:ss');
            data.restTime = rest;
            console.log("upateted data is");
            console.log(data);
            const requestUpdate = objectStore.put(data);
            requestUpdate.onsuccess = event => {
                console.log("TimesStore updated.");
                const date = moment(data.endTime).format('YYYY-MM-DD');
                this.addColumnOfDate(date, data.restTime);
            };
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
    addColumnOfTimes(startTime, endTime, restTime) {
        const objectStore = this.getObjectStore(this.TIMES_STORE, "readwrite");
        const data = { startTime: startTime, endTime: endTime, restTime: restTime };
        const request = objectStore.add(data);
        console.log("added data is");
        console.log(data);
        request.onsuccess = event => console.log("TimesStore added.");
        request.onerror = event => this.handleError(event.target);
    }
    /**
     * Dateオブジェクトストアのデータを日付から検索する
     * @param date 日にち format('YYYY-MM-DD')
     * @returns 休憩時間(ミリ秒)
     */
    getRestTimeOfDate(date) {
        return new Promise((resolve, reject) => {
            const objectStore = this.getObjectStore(this.DATE_STORE, "readonly");
            const index = objectStore.index("date");
            const request = index.get(date);
            request.onsuccess = event => {
                const data = request.result;
                resolve(data.restTime);
            };
            request.onerror = event => this.handleError(event.target);
        });
    }
    getWeekRecordOfDate(today) {
        const objectStore = this.getObjectStore(this.DATE_STORE, "readonly");
        const index = objectStore.index("date");
        const firstDate = moment(today).startOf('week').format('YYYY-MM-DD');
        const lastDate = moment(today).endOf('week').format('YYYY-MM-DD');
        const boundKeyRange = IDBKeyRange.bound(firstDate, lastDate, false, false);
        const request = index.openCursor(boundKeyRange);
        request.onsuccess = event => {
            const cursor = event.target.result;
            if (cursor) {
                console.log(cursor.value);
                cursor.continue();
            }
        };
        // const request: IDBRequest = index.get(firstDate);
        // this.getObjectStore(this.DATE_STORE, "readonly").get(firstDate).onsuccess
    }
    /**
     * Dateオブジェクトストアにデータを追加する
     * @param date 日にち format('YYYY-MM-DD')
     * @param restTime 休憩時間(ミリ秒)
     */
    addColumnOfDate(date, restTime) {
        const objectStore = this.getObjectStore(this.DATE_STORE, "readwrite");
        const index = objectStore.index("date");
        const request = index.get(date);
        request.onsuccess = event => {
            // todo dataの取得方法をどちらにするか
            // let data = request.result;
            let data = event.target.result;
            if (data) {
                data.restTime += restTime;
            }
            else {
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
    getGoalOfSettings(callback) {
        const objectStore = this.getObjectStore(this.SETTINGS_STORE, "readonly");
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
    addGoalOfSettings(goal) {
        const objectStore = this.getObjectStore(this.SETTINGS_STORE, "readwrite");
        const data = {
            id: 1,
            goal: goal
        };
        const request = objectStore.put(data);
        console.log(data);
        request.onsuccess = event => console.log("SettingsStore updated.");
        request.onerror = event => this.handleError(event.target);
    }
    /**
     * Stateオブジェクトストアから休憩の状態("active" or "rest")を取得する
     * @param callback 取得したStateを引数にとるコールバック関数
     */
    getStateOfStatus(callback) {
        const objectStore = this.getObjectStore(this.STATUS_STORE, "readonly");
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
    addStateOfStatus(state) {
        const objectStore = this.getObjectStore(this.STATUS_STORE, "readwrite");
        const data = {
            id: 1,
            state: state
        };
        const request = objectStore.put(data);
        console.log(data);
        request.onsuccess = event => console.log("StatusStore updated.");
        request.onerror = event => this.handleError(event.target);
    }
    /**
     * コンソールに出力する
     * @param message 出力するデータ
     */
    handleError(message) {
        console.debug(message);
    }
}
