var IDB = /** @class */ (function () {
    function IDB() {
        this.DB_NAME = "timeManagerDB";
        this.DB_VERSION = 1;
        if (!window.indexedDB) {
            window.alert("このブラウザは安定板の IndexedDB をサポートしていません。IndexedDB の機能は利用できません。");
        }
    }
    IDB.prototype.open = function () {
        var _this = this;
        var openRequest = indexedDB.open(this.DB_NAME, this.DB_VERSION);
        openRequest.onsuccess = function (event) {
            _this.db = event.target.result;
        };
        openRequest.onerror = function (event) {
            _this.handleError(event.target.error);
        };
        openRequest.onupgradeneeded = function (event) {
            var timesStore = event.currentTarget.result.createObjectStore(_this.TIMES_STORE, { key: "id", autoIncrement: true });
            var settingsStore = event.currentTarget.result.createObjectStore(_this.SETTINGS_STORE, { key: "id", autoIncrement: true });
        };
    };
    /**
     * @param {string} store_name
     * @param {string} mode
     */
    IDB.prototype.getObjectStore = function (store_name, mode) {
        var transaction = this.db.transaction(store_name, mode);
        var objectStore = transaction.objectStore(store_name);
        return objectStore;
    };
    IDB.prototype.clearObjectStore = function (store_name) {
        var _this = this;
        var objectStore = this.getObjectStore(store_name, "readwrite");
        var request = objectStore.clear();
        request.onsuccess = function (event) {
            console.log(store_name + " cleared");
        };
        request.onerror = function (event) {
            _this.handleError(event.target);
        };
    };
    IDB.prototype.getObjectStoreAll = function (store_name) {
        var objectStore = this.getObjectStore(store_name, "readonly");
        var request = objectStore.openCursor();
        var cursors = [];
        request.onsuccess = function (event) {
            var cursor = event.target.result;
            var id = cursor.key;
            var data = cursor.value;
            console.log("id " + id);
            console.log("data " + data);
            cursors.push(cursor);
            cursor["continue"]();
        };
        console.log(cursors);
        return cursors;
    };
    IDB.prototype.addData = function (store_name, obj) {
        var _this = this;
        var objectStore = this.getObjectStore(store_name, "readwrite");
        var request = objectStore.add(obj);
        request.onsuccess = function (event) {
            console.log("success");
        };
        request.onerror = function (event) {
            // this.handleError(this.error)
            _this.handleError(event);
        };
    };
    IDB.prototype.editData = function (store_name, id, obj) {
        var _this = this;
        var objectStore = this.getObjectStore(store_name, "readwrite");
        var request = objectStore.get(id);
        request.onsuccess = function (event) {
            var data = request.result;
            console.log("get: " + data);
            data = obj;
            var requestUpdate = objectStore.put(data);
            console.log("updated: " + data);
            requestUpdate.onsuccess = function (event) {
                console.log("update successs");
            };
            requestUpdate.onerror = function (event) {
                // this.handleError(this.error);
                _this.handleError(event);
            };
        };
        request.onerror = function (event) {
            // this.handleError("editTask" + event.target.errorCode);
            _this.handleError("editTask" + event.target);
        };
    };
    IDB.prototype.deleteTask = function (store_name, id) {
        var _this = this;
        var objectStore = this.getObjectStore(store_name, "readwrite");
        var getRequest = objectStore.get(id);
        getRequest.onsuccess = function (event) {
            var record = event.target.result;
            console.log("record: " + record);
            if (typeof record == "undefined") {
                _this.handleError("No matchiing record found");
                return;
            }
            var request = objectStore["delete"](id);
            request.onsuccess = function (event) {
                console.log("event:", event);
                console.log("event.target:", event.target);
                console.log("event.target.result:", event.target.result);
            };
            request.onerror = function (event) {
                // this.handleError(event.target.errorCode);
                _this.handleError(event.target);
            };
        };
        getRequest.onerror = function (event) {
            // this.handleError(event.target.errorCode);
            _this.handleError(event.target);
        };
    };
    IDB.prototype.handleError = function (message) {
        console.error(message);
    };
    return IDB;
}());
