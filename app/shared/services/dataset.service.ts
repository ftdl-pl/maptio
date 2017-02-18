import { Injectable } from "@angular/core";
import { Http, RequestOptions } from "@angular/http";
import { Subject } from "rxjs/Subject"
import "rxjs/add/operator/map"
import { DataSet } from "../model/dataset.data"
import { ErrorService } from "./error.service";


@Injectable()
export class DataSetService {

    private http: Http;
    private _data$: Subject<DataSet[]>;


    /*
    *   These will be reocrded under an account later.
    */
    private DATASETS: Array<DataSet> = [
        new DataSet("Vestd", "../../../assets/datasets/vestd.json")
        // new DataSet("Mike Bostock's", '../../../assets/datasets/mbostock.json'),
        // new DataSet("Dummy", '../../../assets/datasets/dummy.json')
    ];

    constructor(http: Http, public errorService: ErrorService) {
        this._data$ = new Subject<DataSet[]>();
        this.http = http;
    }


    getData(): Promise<DataSet[]> {

        return this.http.get("")
            .toPromise()
            .then(response => this.DATASETS)
            .catch(this.errorService.handleError);
    }


}