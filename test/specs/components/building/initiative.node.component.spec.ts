import { ComponentFixture, TestBed, async, inject, fakeAsync } from '@angular/core/testing';
import { DebugElement, NO_ERRORS_SCHEMA } from '@angular/core'
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import { BuildingComponent } from '../../../../app/components/building/building.component';
import { InitiativeNodeComponent } from '../../../../app/components/building/initiative.node.component';
import { InitiativeComponent } from '../../../../app/components/initiative/initiative.component';
import { TreeComponent, TreeNode, TreeModel, ITreeOptions } from 'angular2-tree-component';
import { InitiativeNode } from '../../../../app/model/initiative.data';
import { FocusIfDirective } from '../../../../app/directives/focusif.directive';

describe('initiative.node.component.ts', () => {

    let component: InitiativeNodeComponent;
    let target: ComponentFixture<InitiativeNodeComponent>;
    // let nodes: Array<InitiativeNode>;
    let root = new InitiativeNode(), node0 = new InitiativeNode(), node1 = new InitiativeNode(), node2 = new InitiativeNode(), node3 = new InitiativeNode();
    let tree: TreeModel;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [FormsModule],
            declarations: [InitiativeNodeComponent, FocusIfDirective]
        })
            .compileComponents()

    }));

    beforeEach(() => {
        target = TestBed.createComponent(InitiativeNodeComponent);
        component = target.componentInstance;

        root.id = -1, node1.id = 1, node2.id = 2; node3.id = 3;
        node1.name = 'first', node2.name = 'second'; node3.name = 'third';
        root.name = 'root';
        root.children = [node1, node2, node3];

        tree = new TreeModel();
        tree.nodes = [root];
        component.node = new TreeNode(root, tree.getTreeNode(root, undefined), tree);

        target.detectChanges(); // trigger initial data binding
    });

    describe("View", () => {
        it('should display the correct buttons for the root node', () => {
            let spyIsRoot = spyOn(component, "isRoot").and.returnValue(true);
            target.detectChanges();
            //console.log(target.debugElement.nativeElement);
            expect(target.debugElement.query(By.css('label')).nativeElement.innerHTML).toBe("Project");
            expect(target.debugElement.queryAll(By.css('a.toggleExpandLink')).length).toBe(1);
            expect(target.debugElement.queryAll(By.css('input.inputNodeName')).length).toBe(1);
            expect(target.debugElement.queryAll(By.css('a.btnAddNode')).length).toBe(1);
            expect(target.debugElement.queryAll(By.css('a.btnRemoveNode')).length).toBe(0);
            expect(target.debugElement.queryAll(By.css('a.btnEditNode')).length).toBe(0);
            expect(target.debugElement.queryAll(By.css('a.btnZoomNode')).length).toBe(0);

            expect(spyIsRoot).toHaveBeenCalled();
        });

        it('should display the correct buttons for the regular node', () => {
            let spyIsRoot = spyOn(component, "isRoot").and.returnValue(false);
            target.detectChanges();
            //console.log(target.debugElement.nativeElement);
            expect(target.debugElement.queryAll(By.css('a.toggleExpandLink')).length).toBe(1);
            expect(target.debugElement.queryAll(By.css('input.inputNodeName')).length).toBe(1);
            expect(target.debugElement.queryAll(By.css('a.btnAddNode')).length).toBe(1);
            expect(target.debugElement.queryAll(By.css('a.btnRemoveNode')).length).toBe(1);
            expect(target.debugElement.queryAll(By.css('a.btnEditNode')).length).toBe(1);
            expect(target.debugElement.queryAll(By.css('a.btnZoomNode')).length).toBe(1);

            expect(spyIsRoot).toHaveBeenCalled();
        });

        describe('Toggling', () => {
            it('should display hide button when node is expanded', () => {
                let spyHasChildren = spyOn(component, "hasChildren").and.returnValue(true);
                let spyIsExpanded = spyOn(component, "isExpanded").and.returnValue(true);
                target.detectChanges();

                expect(target.debugElement.queryAll(By.css('a.toggleHideLink')).length).toBe(1);
                expect(target.debugElement.queryAll(By.css('a.toggleExpandLink')).length).toBe(0);
                expect(spyHasChildren).toHaveBeenCalled();
                expect(spyIsExpanded).toHaveBeenCalled();
            });

            it('should display expand button when node is hidden', () => {
                let spyHasChildren = spyOn(component, "hasChildren").and.returnValue(true);
                let spyIsExpanded = spyOn(component, "isExpanded").and.returnValue(false);
                target.detectChanges();

                expect(target.debugElement.queryAll(By.css('a.toggleHideLink')).length).toBe(0);
                expect(target.debugElement.queryAll(By.css('a.toggleExpandLink')).length).toBe(1);
                expect(spyHasChildren).toHaveBeenCalled();
                expect(spyIsExpanded).toHaveBeenCalled();
            });

            it('should disable toggle buttons when node does not have children', () => {
                let spyHasChildren = spyOn(component, "hasChildren").and.returnValue(false);
                target.detectChanges();

                expect(target.debugElement.queryAll(By.css('a.toggleHideLink')).length).toBe(0);
                expect(target.debugElement.queryAll(By.css('a.toggleExpandLink')).length).toBe(0);
                expect(spyHasChildren).toHaveBeenCalled();
            });


        });


        describe('Name', () => {
            it('should save name when changed on input', () => {
                let spySaveName = spyOn(component, "saveNodeName");
                let inputElement = target.debugElement.query(By.css('.inputNodeName')).nativeElement as HTMLInputElement;
                expect(inputElement).toBeDefined();

                inputElement.value = "new name";
                inputElement.dispatchEvent(new Event('input'));
                target.detectChanges();

                expect(inputElement.value).toBe('new name');
                expect(spySaveName).toHaveBeenCalledWith('new name', component.node.data);
            });
        });

        describe('Add button', () => {
            it('should add node when clicked', () => {
                let spyAdd = spyOn(component, "addChildNode");
                let button = target.debugElement.query(By.css('.btnAddNode')).nativeElement as HTMLAnchorElement;

                button.dispatchEvent(new Event('click'));
                target.detectChanges();

                expect(spyAdd).toHaveBeenCalledWith(component.node.data);
            });
        });


        describe('Remove button', () => {
            it('should remove node when clicked', () => {
                let spyRemove = spyOn(component, "removeChildNode");
                let button = target.debugElement.query(By.css('.btnRemoveNode')).nativeElement as HTMLAnchorElement;

                button.dispatchEvent(new Event('click'));
                target.detectChanges();

                expect(spyRemove).toHaveBeenCalledWith(component.node.data);
            });
        });

        describe('Open button', () => {
            it('should open node when clicked', () => {
                let spyOpen = spyOn(component, "openNode");
                let button = target.debugElement.query(By.css('.btnEditNode')).nativeElement as HTMLAnchorElement;

                button.dispatchEvent(new Event('click'));
                target.detectChanges();

                expect(spyOpen).toHaveBeenCalledWith(component.node.data);
            });
        });

        describe('Zoom in button', () => {
            it('should zoom in node when clicked', () => {
                let spyZoomIn = spyOn(component, "zoomInNode");
                let button = target.debugElement.query(By.css('.btnZoomNode')).nativeElement as HTMLAnchorElement;

                button.dispatchEvent(new Event('click'));
                target.detectChanges();

                expect(spyZoomIn).toHaveBeenCalledWith(component.node.data);
            });
        });
    });

    describe("Controller", () => {

        describe("Tree manipulation", () => {

            describe("hasChildren", () => {
                it('should return true for root node', () => {
                    component.node = new TreeNode(root, tree.getTreeNode(root, undefined), tree);
                    expect(component.hasChildren()).toBe(true);
                });

                it('should return false for regular node', () => {
                    component.node = new TreeNode(node1, tree.getTreeNode(root, undefined), tree);
                    expect(component.hasChildren()).toBe(false);
                });
            });

            describe("isExpanded", () => {
                it('should return true after it is expanded', () => {
                    component.node.setIsExpanded(true);
                    expect(component.isExpanded()).toBe(true);
                });

                it('should return false after it is collapsed', () => {
                    component.node.setIsExpanded(false);
                    expect(component.isExpanded()).toBe(false);
                });
            });

            describe("Add a node", () => {
                it("should add a child to given node", () => {
                    let treeNode = new TreeNode(node2, component.node, tree);
                    let spyUpdate = spyOn(component.updateTreeEvent, "emit");
                    let spyGetNodeById = spyOn(component.node.treeModel, "getNodeById").and.returnValue(treeNode);
                    let spyExpandNode = spyOn(component.node.treeModel, "setExpandedNode");
                    component.addChildNode(node2);

                    expect(spyGetNodeById).toHaveBeenCalled();
                    expect(node2.children.length).toBe(1);
                    expect(node2.children[0].hasFocus).toBe(true);
                    expect(spyExpandNode).toHaveBeenCalledWith(treeNode, true);
                    expect(spyUpdate).toHaveBeenCalledWith(component.node.treeModel);
                });
            });

            describe("Removes a node", () => {
                it("should remove given node from the tree", () => {
                    let treeNode = new TreeNode(node2, component.node, tree);
                    let spyUpdate = spyOn(component.updateTreeEvent, "emit");
                    let spyGetNodeById = spyOn(component.node.treeModel, "getNodeById").and.returnValue(treeNode);

                    expect(root.children.length).toBe(3);
                    component.removeChildNode(node2);

                    expect(root.children.length).toBe(2);
                    expect(spyGetNodeById).toHaveBeenCalled();
                    expect(spyUpdate).toHaveBeenCalledWith(component.node.treeModel);
                });
            });

            describe("Toggle", () => {
                it("should toggle the selected node", () => {
                    let toggledNode = new InitiativeNode();
                    toggledNode.id = 1;
                    let toggledTreeNode = new TreeNode(toggledNode, component.node, component.node.treeModel);

                    let spyToggle = spyOn(toggledTreeNode, "toggleExpanded");
                    let spyGetNode = spyOn(component.node.treeModel, "getNodeById").and.returnValue(toggledTreeNode);;

                    component.toggleNode(toggledNode);
                    expect(spyGetNode).toHaveBeenCalledWith(1);
                    expect(spyToggle).toHaveBeenCalled();
                });
            });

            describe("Open", () => {
                it("should open the selected node", () => {
                    let openInitiativeEvent = new InitiativeNode();
                    openInitiativeEvent.id = 1;
                    let spy = spyOn(component.openSelectedEvent, "emit");
                    component.openNode(openInitiativeEvent);
                    expect(spy).toHaveBeenCalledWith(openInitiativeEvent);
                });
            });

            describe("Zoom in", () => {
                it("should zoom on the selected node", () => {
                    node1.isZoomedOn = true;
                    let spyUpdate = spyOn(component.updateDataEvent, "emit");

                    component.zoomInNode(node2);

                    expect(node2.isZoomedOn).toBe(true);
                    expect(root.isZoomedOn).toBe(false);
                    expect(node1.isZoomedOn).toBe(false);
                    expect(spyUpdate).toHaveBeenCalledWith(component.node.treeModel.nodes);
                });
            });

            describe("Edit", () => {
                it("should save name of selected node", () => {
                    let node = new InitiativeNode();
                    node.name = "old"
                    let spyUpdate = spyOn(component.updateDataEvent, "emit");

                    component.saveNodeName("new", node);
                    expect(node.name).toBe("new");
                    expect(spyUpdate).toHaveBeenCalledWith(component.node.treeModel.nodes);
                });
            });
        });
    });
});