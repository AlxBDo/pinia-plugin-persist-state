import Persister from "../../services/Persister";
import { ClientStorage } from "../../types/storage";
import { IndexedDB } from "./indexedDb";
import { localStorageMock } from "./localStorage";

export default class PersisterMock extends Persister {
    override defineDb(): ClientStorage {
        return (this.dbName === 'localStorage' || this.dbName === 'sessionStorage')
            ? localStorageMock
            : new IndexedDB()
    }
}