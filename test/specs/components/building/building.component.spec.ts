import { ComponentFixture, TestBed, async, inject, fakeAsync } from '@angular/core/testing';
import { DebugElement, NO_ERRORS_SCHEMA } from '@angular/core'
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import { BuildingComponent } from '../../../../app/components/building/building.component';
import { InitiativeComponent } from '../../../../app/components/initiative/initiative.component';
import { TreeComponent, TreeNode } from 'angular2-tree-component';
import { FocusIfDirective } from '../../../../app/directives/focusif.directive'
import { DataService } from '../../../../app/services/data.service'
import { ErrorService } from '../../../../app/services/error.service';
import { TreeExplorationService } from '../../../../app/services/tree.exploration.service'
import { MockBackend, MockConnection } from '@angular/http/testing';
import { Http, HttpModule, Response, Headers, RequestOptions, BaseRequestOptions, ResponseOptions } from '@angular/http';
import { InitiativeNode } from '../../../../app/model/initiative.data';
import { Person } from '../../../../app/model/person.data';

describe('building.component.ts', () => {

    let component: BuildingComponent;
    let target: ComponentFixture<BuildingComponent>;
    let nodes: Array<InitiativeNode>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [FormsModule],
            providers: [DataService, ErrorService, TreeExplorationService,
                {
                    provide: Http,
                    useFactory: (mockBackend: MockBackend, options: BaseRequestOptions) => {
                        return new Http(mockBackend, options);
                    },
                    deps: [MockBackend, BaseRequestOptions]
                },
                MockBackend,
                BaseRequestOptions],
            declarations: [BuildingComponent, TreeComponent, FocusIfDirective, InitiativeComponent],
            schemas: [NO_ERRORS_SCHEMA]
        })
            .compileComponents()

    }));

    beforeEach(() => {
        target = TestBed.createComponent(BuildingComponent);
        component = target.componentInstance;

        target.detectChanges(); // trigger initial data binding
    });

    describe("View", () => {

        describe("Tree configuration", () => {
            it('should search tree on input', () => {
                let spy = spyOn(component, "filterNodes");
                let element = target.debugElement.query(By.css('#searchTreeInput')).nativeElement as HTMLInputElement;
                element.value = "some search";
                element.dispatchEvent(new Event('input'));
                expect(spy).toHaveBeenCalledWith('some search')
            });

            it("should send data to mapping component on tree update", () => {
                let spy = spyOn(component, "mapData");
                component.tree.treeModel.update();
                expect(spy).toHaveBeenCalled();
            });

            it("should bind tree nodes to component nodes", () => {
                let root = new InitiativeNode(), node1 = new InitiativeNode(), node2 = new InitiativeNode(), node3 = new InitiativeNode();
                root.children = [node1, node2, node3];
                component.nodes = [root];
                target.detectChanges();
                expect(component.tree.treeModel.nodes).toBe(component.nodes);
            });
        });

        describe("Tree display", () => {

            it("should display one node matching the correct data", () => {
                let root = new InitiativeNode(), node1 = new InitiativeNode(), node2 = new InitiativeNode(), node3 = new InitiativeNode();
                root.children = [node1, node2, node3];
                component.nodes = [root];

                target.detectChanges();
                let treeNode = target.debugElement.queryAll(By.css('Tree treenode'));
                expect(treeNode.length).toBe(1); //one and only one root
                let dataNode = <InitiativeNode>treeNode[0].context.$implicit.data;
                expect(dataNode).toBe(root);
            });
        });

    });


    describe("Controller", () => {
        describe("Loading data", () => {
            it("shoud loads data and initializes tree", () => {
                let url = "http://getdata.com/data.json";

                fixture.load("test/specs/components/building/fixtures/data.json");
                let spyDataService = spyOn(DataService.prototype, "loadFromAsync").and.returnValue(Promise.resolve(fixture.json[0]));

                component.loadData(url);
                target.whenStable().then(() => {
                    expect(spyDataService).toHaveBeenCalledWith(url);
                    expect(component.nodes.length).toBe(1);
                });
            });

            it("should loads data and initializes team", () => {
                let url = "http://getdata.com/data.json";

                fixture.load("test/specs/components/building/fixtures/data.json");
                let spyDataService = spyOn(DataService.prototype, "loadFromAsync").and.returnValue(Promise.resolve(fixture.json[0]));

                component.loadData(url);
                target.whenStable().then(() => {
                    expect(spyDataService).toHaveBeenCalledWith(url);
                    expect(component.initiativeEditComponent.team.members.length).toBe(2);
                    expect(component.initiativeEditComponent.team.members.find(function (p) { return p.name == 'CTO' })).toBeDefined("Cant find CTO");
                    expect(component.initiativeEditComponent.team.members.find(function (p) { return p.name == 'CMO' })).toBeDefined("Cant find CMO");
                });
            });

            it("should loads data and initializes mapping component", () => {
                let url = "http://getdata.com/data.json";

                fixture.load("test/specs/components/building/fixtures/data.json");
                let spyDataService = spyOn(DataService.prototype, "loadFromAsync").and.returnValue(Promise.resolve(fixture.json[0]));
                let spyMapData = spyOn(component, "mapData");

                component.loadData(url);
                target.whenStable().then(() => {
                    expect(spyDataService).toHaveBeenCalledWith(url);
                    expect(spyMapData).toHaveBeenCalled();
                });
            });

        });

        describe("Mapping data", () => {
            it("should sends data to dataservice", () => {
                let node1 = new InitiativeNode(), node2 = new InitiativeNode();
                node1.name = 'first', node2.name = 'second';

                component.nodes = [node1, node2];
                let spy = spyOn(DataService.prototype, "setAsync");
                component.mapData();
                expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({ name: 'first' }));

            });
        });

        describe("Filtering ", () => {

            it("should highlights all nodes when the search term is empty", () => {
                let root = new InitiativeNode(), node1 = new InitiativeNode(), node2 = new InitiativeNode(), node3 = new InitiativeNode();
                node1.name = 'first', node2.name = 'second'; node3.name = 'third';
                root.children = [node1, node2, node3];
                component.nodes = [root];
                target.detectChanges();
                let spy = spyOn(component, "mapData");

                component.filterNodes('');
                expect(root.isSearchedFor).toBe(true);
                expect(node1.isSearchedFor).toBe(true);
                expect(node2.isSearchedFor).toBe(true);
                expect(node3.isSearchedFor).toBe(true);
                expect(spy).toHaveBeenCalled();
            });

            it("should highlight correct nodes when searching on name", () => {
                let root = new InitiativeNode(), node1 = new InitiativeNode(), node2 = new InitiativeNode(), node3 = new InitiativeNode();
                node1.name = 'first', node2.name = 'second'; node3.name = 'second third';
                root.children = [node1, node2, node3];
                component.nodes = [root];
                target.detectChanges();
                let spy = spyOn(component, "mapData");

                component.filterNodes('second');
                expect(root.isSearchedFor).toBe(false);
                expect(node1.isSearchedFor).toBe(false);
                expect(node2.isSearchedFor).toBe(true);
                expect(node3.isSearchedFor).toBe(true);
                expect(spy).toHaveBeenCalled();
            });

            it("should hightlight correct nodes when searching on description", () => {
                let root = new InitiativeNode(), node1 = new InitiativeNode(), node2 = new InitiativeNode(), node3 = new InitiativeNode();
                node1.name = 'first', node2.name = 'second'; node3.name = 'third';
                node1.description = 'primero', node2.description = 'segundo'; node3.description = 'segundo tercero';
                root.children = [node1, node2, node3];
                component.nodes = [root];
                target.detectChanges();
                let spy = spyOn(component, "mapData");

                component.filterNodes('segundo');
                expect(root.isSearchedFor).toBe(false);
                expect(node1.isSearchedFor).toBe(false);
                expect(node2.isSearchedFor).toBe(true);
                expect(node3.isSearchedFor).toBe(true);
                expect(spy).toHaveBeenCalled();
            });
        });

        describe("Tree manipulation", () => {
            describe("Update", () => {
                it("should update tree component", () => {
                    let spy = spyOn(component.tree.treeModel, "update");
                    component.updateTreeModel();
                    expect(spy).toHaveBeenCalled();
                });
            });

            describe("Validate", () => {
                it("should check that the root's name is valid", () => {
                    let root = new InitiativeNode();
                    component.nodes = [root];
                    expect(component.isRootValid()).toBe(false);
                });

                it("should check that the root's name is valid", () => {
                    let root = new InitiativeNode();
                    root.name = "anything"
                    component.nodes = [root];
                    expect(component.isRootValid()).toBe(true);
                });

                it("should check that the root's name is valid", () => {
                    let root = new InitiativeNode();
                    root.name = "     "
                    component.nodes = [root];
                    expect(component.isRootValid()).toBe(false);
                });
            });
        });
    });


});
