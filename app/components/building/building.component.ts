import { Component, OnInit, ViewChild, ViewChildren, Directive, Input, ElementRef, Inject, QueryList, Query } from '@angular/core';
//import { InitiativeComponent} from './initiative.component'
import { Initiative } from '../../model/initiative.data';
import { Team } from '../../model/team.data'
import { Person } from '../../model/person.data'
import { InitiativeComponent } from '../initiative/initiative.component';
import { TreeComponent, TreeNode } from 'angular2-tree-component';
import { DataService } from '../../services/data.service';
//import { TreeExplorationService } from '../../services/tree.exploration.service'
import { FocusIfDirective } from '../../directives/focusif.directive'
import { AutoSelectDirective } from '../../directives/autoselect.directive'
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import 'rxjs/add/operator/map';
import { InitiativeNodeComponent } from './initiative.node.component'


@Component({
    selector: 'building',
    template: require('./building.component.html'),
    styles: [require('./building.component.css').toString()]
})

export class BuildingComponent {

    searched: string;
    nodes: Array<Initiative>;

    @ViewChild(TreeComponent)
    tree: TreeComponent;

    @ViewChild('initiative')
    initiativeEditComponent: InitiativeComponent

    @ViewChild(InitiativeNodeComponent)
    node: InitiativeNodeComponent;

    private dataService: DataService;
    //private treeExplorationService: TreeExplorationService;

    constructor(dataService: DataService) {
        this.dataService = dataService;
        // this.treeExplorationService = treeExplorationService;
        this.nodes = [];
    }

    // isEmpty(): boolean {
    //     return !this.nodes[0] || this.nodes[0].children.length === 0; // check if the root has any children
    // }

    isRootValid(): boolean {
        return (this.nodes[0].name != undefined) && this.nodes[0].name.trim().length > 0;
    }



    mapData() {
        //console.log("SAVE HERE");
        // console.log(JSON.stringify(this.nodes));
        this.dataService.setAsync(this.nodes[0]);
    }


    updateTreeModel() {
        // console.log("UPdate");
        //  console.log(JSON.stringify(this.nodes));
        this.tree.treeModel.update();
    }

    editInitiative(node: Initiative) {
        this.initiativeEditComponent.data = node;
        this.initiativeEditComponent.open();
    }


    loadData(url: string) {
        this.dataService.loadFromAsync(url).then(data => {
            this.nodes = [];
            let rootNode: Initiative = Object.assign(new Initiative(), data);
            this.nodes.push(rootNode);

            // FIXME : this should be another function/service
            let members = new Array<Person>();
            rootNode.traverse(function (node: Initiative) {
                if (node.accountable && !members.find(function (person) {
                    return person.name === node.accountable.name
                })) {
                    members.push(node.accountable)
                }
            }
            );
            this.initiativeEditComponent.team = { members: members };

            this.mapData();
        });
    }

    filterNodes(searched: string) {
        //TreeExplorationService.traverseAll<Initiative>(this.nodes, function (node) { node.isSearchedFor = false });
        this.nodes.forEach(function (i: Initiative) {
            i.traverse(function (node) { node.isSearchedFor = false });
        });

        this.tree.treeModel.filterNodes(
            (node: TreeNode) => {
                let initiative = (<Initiative>node.data);
                initiative.isSearchedFor = initiative.search(searched);
                return initiative.isSearchedFor;
            },
            true);
        this.mapData();

    }

}