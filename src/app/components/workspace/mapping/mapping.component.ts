import 'rxjs/add/operator/map';

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ComponentFactory,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Angulartics2Mixpanel } from 'angulartics2';
import { compact } from 'lodash';
import { BehaviorSubject, ReplaySubject, Subject, Subscription } from 'rxjs/Rx';

import { Initiative } from './../../../shared/model/initiative.data';
import { SelectableTag, Tag } from './../../../shared/model/tag.data';
import { DataService } from './../../../shared/services/data.service';
import { UIService } from './../../../shared/services/ui/ui.service';
import { URIService } from './../../../shared/services/uri.service';
import { IDataVisualizer } from './mapping.interface';
import { MemberSummaryComponent } from './member-summary/member-summary.component';
import { MappingNetworkComponent } from './network/mapping.network.component';
import { MappingTreeComponent } from './tree/mapping.tree.component';
import { MappingZoomableComponent } from './zoomable/mapping.zoomable.component';

// import { MappingNetworkComponent } from "./network/mapping.network.component";
// import { MappingCirclesComponent } from "./circles/mapping.circles.component";
@Component({
  selector: "mapping",
  templateUrl: "./mapping.component.html",
  styleUrls: ["./mapping.component.css"],
  entryComponents: [
    MappingTreeComponent,
    MappingNetworkComponent,
    MemberSummaryComponent,
    MappingZoomableComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MappingComponent {
  isFirstEdit: boolean;
  PLACEMENT: string = "left";
  TOGGLE: string = "tooltip";
  TOOLTIP_PEOPLE_VIEW: string = "People view";
  TOOLTIP_INITIATIVES_VIEW: string = "Initiatives view";
  TOOLTIP_ZOOM_IN: string = "Zoom in";
  TOOLTIP_ZOOM_OUT: string = "Zoom out";
  TOOLTIP_ZOOM_FIT: string = "Zoom fit";

  public data: {
    initiative: Initiative;
    datasetId: string;
    teamName: string;
    teamId: string;
  };
  public x: number;
  public y: number;
  public scale: number;
  // public isLocked: boolean = true;

  //   public isCollapsed: boolean = true;
  //   public isSettingsPanelCollapsed: boolean = true;
  //   public isTagSettingActive: boolean;
  public isSettingToggled: boolean;
  public isSearchToggled: boolean;

  public zoom$: Subject<number>;
  public isReset$: Subject<boolean>;
  public selectableTags$: Subject<Array<SelectableTag>>;
  // public selectableUsers$: Subject<Array<SelectableUser>>;

  public VIEWPORT_WIDTH: number = window.screen.availWidth;
  public VIEWPORT_HEIGHT: number = window.screen.availHeight;

  public isLoading: boolean;
  public datasetId: string;
  public datasetName: string;
  public initiative: Initiative;
  public flattenInitiative: Initiative[] = [];
  public teamName: string;
  public teamId: string;
  public slug: string;
  public tags: Array<SelectableTag>;
  public tagsFragment: string;
  public fontSize$: BehaviorSubject<number>;
  public fontColor$: BehaviorSubject<string>;
  public mapColor$: BehaviorSubject<string>;

  public zoomToInitiative$: Subject<Initiative>;
  public closeEditingPanel$: BehaviorSubject<boolean>;
  public data$: Subject<{ initiative: Initiative; datasetId: string }>;

  @Input("tags") selectableTags: Array<SelectableTag>;
  @Output("showDetails") showDetails = new EventEmitter<Initiative>();
  @Output("addInitiative") addInitiative = new EventEmitter<Initiative>();
  @Output("removeInitiative") removeInitiative = new EventEmitter<Initiative>();
  @Output("moveInitiative")
  moveInitiative = new EventEmitter<{
    node: Initiative;
    from: Initiative;
    to: Initiative;
  }>();
  @Output("closeEditingPanel") closeEditingPanel = new EventEmitter<boolean>();
  @Output("openTreePanel") openTreePanel = new EventEmitter<boolean>();
  @Output("toggleSettingsPanel")
  toggleSettingsPanel = new EventEmitter<boolean>();
  @Output("applySettings")
  applySettings = new EventEmitter<{ initiative: Initiative; tags: Tag[] }>();

  public componentFactory: ComponentFactory<IDataVisualizer>;
  // public layout: string;
  public subscription: Subscription;
  public instance: IDataVisualizer;


  fontColor = localStorage.getItem("FONT_COLOR")
    ? localStorage.getItem("FONT_COLOR")
    : "#000";
  mapColor = localStorage.getItem("MAP_COLOR")
    ? localStorage.getItem("MAP_COLOR")
    : "#f5f5f5";
  fontSize = Number.parseFloat(localStorage.getItem("FONT_SIZE"))
    ? Number.parseFloat(localStorage.getItem("FONT_SIZE"))
    : 1;

  isFiltersToggled: boolean = false;
  isSearchDisabled: boolean = false;

  constructor(
    private dataService: DataService,
    private cd: ChangeDetectorRef,
    private route: ActivatedRoute,
    private analytics: Angulartics2Mixpanel,
    private uriService: URIService,
    private uiService: UIService
  ) {
    this.zoom$ = new Subject<number>();
    this.isReset$ = new Subject<boolean>();
    this.selectableTags$ = new ReplaySubject<Array<SelectableTag>>();
    // this.selectableUsers$ = new ReplaySubject<Array<SelectableUser>>();
    this.fontSize$ = new BehaviorSubject<number>(this.fontSize);
    this.fontColor$ = new BehaviorSubject<string>(this.fontColor);
    this.mapColor$ = new BehaviorSubject<string>(this.mapColor);
    this.zoomToInitiative$ = new Subject();
    // this.isLocked$ = new BehaviorSubject<boolean>(this.isLocked);
    this.closeEditingPanel$ = new BehaviorSubject<boolean>(false);
    this.data$ = new Subject<{
      initiative: Initiative;
      datasetId: string;
    }>();


  }

  ngAfterViewInit() { }

  onActivate(component: IDataVisualizer) {

    component.showDetailsOf$.asObservable().subscribe(node => {
      this.showDetails.emit(node);
    });
    component.addInitiative$.asObservable().subscribe(node => {
      this.addInitiative.emit(node);
    });
    component.removeInitiative$.asObservable().subscribe(node => {
      this.removeInitiative.emit(node);
    });
    component.moveInitiative$
      .asObservable()
      .subscribe(({ node: node, from: from, to: to }) => {
        this.moveInitiative.emit({ node: node, from: from, to: to });
      });
    component.closeEditingPanel$.asObservable().subscribe((close: boolean) => {
      this.closeEditingPanel.emit(true);
    });

    let f = this.route.snapshot.fragment || this.getFragment(component);
    this.x = Number.parseFloat(this.uriService.parseFragment(f).get("x"));
    this.y = Number.parseFloat(this.uriService.parseFragment(f).get("y"));
    this.scale = Number.parseFloat(
      this.uriService.parseFragment(f).get("scale")
    );

    let tagsState =
      this.uriService.parseFragment(f).has("tags") &&
        this.uriService.parseFragment(f).get("tags")
        ? this.uriService
          .parseFragment(f)
          .get("tags")
          .split(",")
          .map(
          (s: string) => new SelectableTag({ shortid: s, isSelected: true })
          )
        : [];
    // let membersState = this.uriService.parseFragment(f).has("users") && this.uriService.parseFragment(f).get("users")
    //     ? this.uriService.parseFragment(f).get("users")
    //         .split(",")
    //         .map((s: string) => new SelectableUser({ shortid: s, isSelected: true }))
    //     : [];

    // this.layout = this.getLayout(component);

    component.width = this.VIEWPORT_WIDTH;
    component.height = this.VIEWPORT_HEIGHT;

    component.margin = 50;
    component.zoom$ = this.zoom$.asObservable();
    component.selectableTags$ = this.selectableTags$.asObservable();
    // component.selectableUsers$ = this.selectableUsers$.asObservable();
    component.fontSize$ = this.fontSize$.asObservable();
    component.fontColor$ = this.fontColor$.asObservable();
    component.mapColor$ = this.mapColor$.asObservable();
    component.zoomInitiative$ = this.zoomToInitiative$.asObservable();
    // component.isLocked$ = this.isLocked$.asObservable();
    component.translateX = this.x;
    component.translateY = this.y;
    component.scale = this.scale;
    component.tagsState = tagsState;
    this.selectableTags$.next(tagsState);
    // this.selectableUsers$.next(membersState)

    component.analytics = this.analytics;
    component.isReset$ = this.isReset$.asObservable();

    if (component.constructor === MemberSummaryComponent) {
      this.isSearchDisabled = true;
      this.isSearchToggled = false;
    }
    else {
      this.isSearchDisabled = false;
    }
  }

  onDeactivate(component: any) { }

  ngOnInit() {
    this.subscription = this.route.params
      .do(params => {
        this.datasetId = params["mapid"];
        this.slug = params["mapslug"];
        this.cd.markForCheck();
      })
      .combineLatest(this.dataService.get())
      .map(data => data[1])
      .combineLatest(this.route.fragment) // PEFORMACE : with latest changes
      .subscribe(([data, fragment]) => {
        if (!data.initiative.children || !data.initiative.children[0] || !data.initiative.children[0].children) {
          this.isFirstEdit = true;
          this.cd.markForCheck();
        }
        else {
          this.isFirstEdit = false;
          this.cd.markForCheck();
        }

        let fragmentTags =
          this.uriService.parseFragment(fragment).has("tags") &&
            this.uriService.parseFragment(fragment).get("tags")
            ? this.uriService
              .parseFragment(fragment)
              .get("tags")
              .split(",")
              .map(
              (s: string) =>
                new SelectableTag({ shortid: s, isSelected: true })
              )
            : <SelectableTag[]>[];
        // let fragmentUsers = this.uriService.parseFragment(fragment).has("users") && this.uriService.parseFragment(fragment).get("users")
        //     ? this.uriService.parseFragment(fragment).get("users")
        //         .split(",")
        //         .map((s: string) => new SelectableUser({ shortid: s, isSelected: true }))
        //     : <SelectableUser[]>[];

        this.tags = compact<SelectableTag>(
          data.tags.map((dataTag: SelectableTag) => {
            let searchTag = fragmentTags.find(
              t => t.shortid === dataTag.shortid
            );
            return new SelectableTag({
              shortid: dataTag.shortid,
              name: dataTag.name,
              color: dataTag.color,
              isSelected: searchTag !== undefined
            });
          })
        );

        // this.members = _.compact<SelectableUser>(data.members.map((dataUser: SelectableUser) => {
        //     let searchUser = fragmentUsers.find(t => t.shortid === dataUser.shortid);
        //     return new SelectableUser({ shortid: dataUser.shortid, name: dataUser.name, picture: dataUser.picture, isSelected: searchUser !== undefined })

        // }));
        this.datasetName = data.initiative.name;
        this.initiative = data.initiative;
        this.flattenInitiative = data.initiative.flatten();
        this.cd.markForCheck();
      });

    this.route.fragment.subscribe(f => { });
  }

  ngOnDestroy() {
    if (this.subscription) this.subscription.unsubscribe();
  }

  getFragment(component: IDataVisualizer) {
    switch (component.constructor) {
      case MappingZoomableComponent:
        return `x=${this.VIEWPORT_WIDTH / 2}&y=${this.VIEWPORT_WIDTH / 2 - 180}&scale=1`;
      case MappingTreeComponent:
        return `x=${this.VIEWPORT_WIDTH / 10}&y=${this.VIEWPORT_HEIGHT / 2}&scale=1`;
      case MappingNetworkComponent:
        return `x=0&y=${-this.VIEWPORT_HEIGHT / 4}&scale=1`;
      case MemberSummaryComponent:
        return `x=0&y=0&scale=1`;
      default:
        return `x=${this.VIEWPORT_WIDTH / 2}&y=${this.VIEWPORT_HEIGHT /
          2}&scale=1`;
    }
  }

  zoomOut() {
    this.zoom$.next(0.9);
    this.analytics.eventTrack("Map", {
      action: "zoom out",
      mode: "button",
      team: this.teamName,
      teamId: this.teamId
    });
  }

  zoomIn() {
    this.zoom$.next(1.1);
    this.analytics.eventTrack("Map", {
      action: "zoom in",
      mode: "button",
      team: this.teamName,
      teamId: this.teamId
    });
  }

  resetZoom() {
    this.isReset$.next(true);
    this.analytics.eventTrack("Map", {
      action: "reset zoom",
      mode: "button",
      team: this.teamName,
      teamId: this.teamId
    });
  }

  changeFontSize(size: number) {
    this.fontSize$.next(size);
    localStorage.setItem("FONT_SIZE", `${size}`);
    this.analytics.eventTrack("Map", {
      action: "change font size",
      size: size,
      team: this.teamName,
      teamId: this.teamId
    });
  }

  changeFontColor(color: string) {
    this.fontColor$.next(color);
    localStorage.setItem("FONT_COLOR", `${color}`);
    this.fontColor = color;
    this.analytics.eventTrack("Map", {
      action: "change font color",
      color: color,
      team: this.teamName,
      teamId: this.teamId
    });
  }

  changeMapColor(color: string) {
    this.mapColor$.next(color);
    localStorage.setItem("MAP_COLOR", `${color}`);
    this.mapColor = color;
    this.analytics.eventTrack("Map", {
      action: "change map color",
      color: color,
      team: this.teamName,
      teamId: this.teamId
    });
  }

  addFirstNode() {
    this.addInitiative.emit(this.initiative);
    this.openTreePanel.emit(true);
    this.analytics.eventTrack("Map", { mode: "instruction", action: "add", team: this.teamName, teamId: this.teamId });
  }

  public broadcastTagsSelection(tags: SelectableTag[]) {
    this.selectableTags$.next(tags);
    this.applySettings.emit({ initiative: this.initiative, tags: tags });

    let tagsHash = tags
      .filter(t => t.isSelected === true)
      .map(t => t.shortid)
      .join(",");
    this.tagsFragment = `tags=${tagsHash}`;

    let ancient = this.uriService.parseFragment(this.route.snapshot.fragment);
    ancient.set("tags", tagsHash);
    location.hash = this.uriService.buildFragment(ancient);
  }

  zoomToInitiative(selected: Initiative) {
    this.zoomToInitiative$.next(selected);
  }
}