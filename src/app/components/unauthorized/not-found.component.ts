import { Component, OnInit } from "@angular/core";

@Component({
    selector: "not-found",
    // templateUrl: "not-found.component.html",
    template: `
    <h4 class="m-3">Either you don't know how to type or we broke something. In doubt, support@maptio.com ;)</h4>
    `
})

export class NotFoundComponent implements OnInit {
    constructor() { }

    ngOnInit() { }
}