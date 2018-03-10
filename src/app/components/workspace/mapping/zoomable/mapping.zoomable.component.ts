import { URIService } from "./../../../../shared/services/uri.service";
import { DataService } from "./../../../../shared/services/data.service";
import { UserFactory } from "./../../../../shared/services/user.factory";
import { UIService } from "./../../../../shared/services/ui/ui.service";
import { ColorService } from "./../../../../shared/services/ui/color.service";
import { Angulartics2Mixpanel } from "angulartics2";
import { Initiative } from "./../../../../shared/model/initiative.data";
import { SelectableUser } from "./../../../../shared/model/user.data";
import { SelectableTag, Tag } from "./../../../../shared/model/tag.data";
import { IDataVisualizer } from "./../../mapping/mapping.interface";
import { Observable, Subject } from "rxjs/Rx";
import { Router } from "@angular/router";
import { Subscription } from "rxjs/Subscription";
import {
  Component,
  ViewEncapsulation,
  ChangeDetectorRef,
  ChangeDetectionStrategy
} from "@angular/core";
import { D3Service, D3, ScaleLinear, HSLColor } from "d3-ng2-service";
import { transition } from "d3-transition";
import { partition } from "lodash";

@Component({
  selector: "zoomable",
  templateUrl: "./mapping.zoomable.component.html",
  styleUrls: ["./mapping.zoomable.component.css"],
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MappingZoomableComponent implements IDataVisualizer {
  private d3: D3;
  public datasetId: string;
  public teamId: string;
  public teamName: string;
  public width: number;
  public height: number;
  public translateX: number;
  public translateY: number;
  public scale: number;
  public tagsState: Array<SelectableTag>;

  public margin: number;
  public zoom$: Observable<number>;
  public selectableTags$: Observable<Array<SelectableTag>>;
  public selectableUsers$: Observable<Array<SelectableUser>>;
  public isReset$: Observable<boolean>;
  public fontSize$: Observable<number>;
  public fontColor$: Observable<string>;
  public mapColor$: Observable<string>;
  public zoomInitiative$: Observable<Initiative>;
  public isLocked$: Observable<boolean>;
  public data$: Subject<{
    initiative: Initiative;
    datasetId: string;
    teamName: string;
    teamId: string;
  }>;
  public rootNode: Initiative;

  public showDetailsOf$: Subject<Initiative> = new Subject<Initiative>();
  public addInitiative$: Subject<Initiative> = new Subject<Initiative>();
  public removeInitiative$: Subject<Initiative> = new Subject<Initiative>();
  public moveInitiative$: Subject<{
    node: Initiative;
    from: Initiative;
    to: Initiative;
  }> = new Subject<{ node: Initiative; from: Initiative; to: Initiative }>();
  public closeEditingPanel$: Subject<boolean> = new Subject<boolean>();

  private zoomSubscription: Subscription;
  private dataSubscription: Subscription;
  private resetSubscription: Subscription;
  private fontSubscription: Subscription;
  private lockedSubscription: Subscription;
  private tagsSubscription: Subscription;

  public analytics: Angulartics2Mixpanel;

  private svg: any;
  private g: any;
  private diameter: number;
  private definitions: any;
  private fontSize: number;
  private fonts: ScaleLinear<number, number>;
  public isWaitingForDestinationNode: boolean = false;
  public isTooltipDescriptionVisible: boolean = false;
  public isFirstEditing: boolean = false;
  public isLocked: boolean;
  public isLoading: boolean;

  public selectedNode: Initiative;
  public selectedNodeParent: Initiative;
  public hoveredNode: Initiative;

  private color: ScaleLinear<HSLColor, string>;
  public slug: string;

  CIRCLE_RADIUS: number = 12;
  MAX_TEXT_LENGTH = 35;
  TRANSITION_DURATION = 750;
  TRANSITION_OPACITY = 750;
  RATIO_FOR_VISIBILITY = 0.08;
  OPACITY_DISAPPEARING = 0.1;
  T: any;

  POSITION_INITIATIVE_NAME = { x: 0.9, y: 0.1, fontRatio: 1 };
  POSITION_TAGS_NAME = { x: 0, y: 0.3, fontRatio: 0.65 };
  POSITION_ACCOUNTABLE_NAME = { x: 0, y: 0.45, fontRatio: 0.8 };
  DEFAULT_PICTURE_ANGLE = Math.PI - Math.PI * 36 / 180;

  constructor(
    public d3Service: D3Service,
    public colorService: ColorService,
    public uiService: UIService,
    public router: Router,
    private userFactory: UserFactory,
    private cd: ChangeDetectorRef,
    private dataService: DataService,
    private uriService: URIService
  ) {
    this.d3 = d3Service.getD3();
    this.T = this.d3.transition(null).duration(this.TRANSITION_DURATION);
    this.data$ = new Subject<{
      initiative: Initiative;
      datasetId: string;
      teamName: string;
      teamId: string;
    }>();
  }

  ngOnInit() {
    this.isLoading = true;
    this.init();
    this.dataSubscription = this.dataService
      .get()
      .combineLatest(this.mapColor$)
      .subscribe((complexData: [any, string]) => {
        let data = <any>complexData[0].initiative;
        this.datasetId = complexData[0].datasetId;
        this.rootNode = complexData[0].initiative;
        this.slug = data.getSlug();
        // this.tagsState = complexData[1];
        this.update(data, complexData[1]);
        this.analytics.eventTrack("Map", {
          view: "initiatives",
          team: data.teamName,
          teamId: data.teamId
        });
        this.isLoading = false;
        this.cd.markForCheck();
      });
    this.selectableTags$.subscribe(tags => this.tagsState = tags)
  }

  ngOnDestroy() {
    if (this.zoomSubscription) {
      this.zoomSubscription.unsubscribe();
    }
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
    if (this.resetSubscription) {
      this.resetSubscription.unsubscribe();
    }
    if (this.fontSubscription) {
      this.fontSubscription.unsubscribe();
    }
    if (this.lockedSubscription) {
      this.lockedSubscription.unsubscribe();
    }
    if (this.tagsSubscription) {
      this.tagsSubscription.unsubscribe();
    }
  }

  init() {
    this.uiService.clean();
    let d3 = this.d3;

    let margin = { top: 20, right: 200, bottom: 20, left: 200 };
    let width = this.width - margin.left - margin.right,
      height = this.height - margin.top - margin.bottom;

    let svg: any = d3
      .select("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom),
      diameter = +width,
      g = svg
        .append("g")
        .attr(
        "transform",
        `translate(${diameter / 2 + margin.left}, ${diameter / 2 + margin.top}) scale(${this.scale})`
        ),
      definitions = svg.append("svg:defs");
    g.append("g").attr("class", "paths");
    let zooming = d3
      .zoom()
      .scaleExtent([1 / 3, 4 / 3])
      .on("zoom", zoomed)
      .on("end", () => {
        let transform = d3.event.transform;
        svg.attr("scale", transform.k);
        let tagFragment = this.tagsState
          .filter(t => t.isSelected)
          .map(t => t.shortid)
          .join(",");
        location.hash = this.uriService.buildFragment(
          new Map([
            ["x", transform.x],
            ["y", transform.y],
            ["scale", transform.k],
            ["tags", tagFragment]
          ])
        );
      });

    try {
      // the zoom generates an DOM Excpetion Error 9 for Chrome (not tested on other browsers yet)
      // svg.call(zooming.transform, d3.zoomIdentity.translate(diameter / 2, diameter / 2));
      svg.call(
        zooming.transform,
        d3.zoomIdentity
          .translate(this.translateX, this.translateY)
          .scale(this.scale)
      );
      svg.call(zooming);
    } catch (error) { }

    function zoomed() {
      g.attr("transform", d3.event.transform);
    }

    this.resetSubscription = this.isReset$.filter(r => r).subscribe(isReset => {
      // console.log("resetting")
      svg.call(
        zooming.transform,
        d3.zoomIdentity.translate(
          diameter / 2 + margin.left,
          diameter / 2 + margin.top
        )
      );
    });

    this.zoomSubscription = this.zoom$.subscribe((zf: number) => {
      try {
        // the zoom generates an DOM Excpetion Error 9 for Chrome (not tested on other browsers yet)
        if (zf) {
          zooming.scaleBy(svg, zf);
        } else {
          svg.call(
            zooming.transform,
            d3.zoomIdentity.translate(this.translateX, this.translateY)
          );
        }
      } catch (error) { }
    });

    this.fontSubscription = this.fontSize$
      .combineLatest(this.fontColor$)
      .subscribe((format: [number, string]) => {
        // font size
        svg.attr("font-size", format[0] + "rem");
        svg.selectAll("text").attr("font-size", format[0] + "rem");
        this.fontSize = format[0];
        // font color
        svg.style("fill", format[1]);
        svg.selectAll("text").style("fill", format[1]);
      });

    this.zoomInitiative$.subscribe(node => {
      svg.select(`circle.node.initiative-map[id="${node.id}"]`).dispatch("click");
    });

    this.selectableTags$.subscribe(tags => {

      this.tagsState = tags;
      let [selectedTags, unselectedTags] = partition(tags, t => t.isSelected);
      // let [selectedUsers, unselectedUsers] = _.partition(users, u => u.isSelected);
      let uiService = this.uiService
      function filterByTags(d: any): number {
        return uiService.filter(selectedTags, unselectedTags, d.data.tags.map((t: Tag) => t.shortid))
          // &&
          // uiService.filter(selectedUsers, unselectedUsers, _.compact(_.flatten([...[d.data.accountable], d.data.helpers])).map(u => u.shortid))
          ? 1
          : 0.1
      }
      g.selectAll("g.node.initiative-map").style("opacity", function (d: any) {
        return filterByTags(d)
      });
    })

    this.svg = svg;
    this.g = g;
    // this.color = color;
    this.diameter = diameter;
    this.definitions = definitions;
  }

  getTags() {
    return this.tagsState;
  }

  update(data: Initiative, seedColor: string) {
    if (this.d3.selectAll("g").empty()) {
      this.init();
    }
    let d3 = this.d3;
    let diameter = this.diameter;
    let margin = this.margin;
    let g = this.g;
    let svg = this.svg;
    let scale = this.scale;
    let translateX = this.translateX;
    let translateY = this.translateY;
    let definitions = this.definitions;
    let uiService = this.uiService;
    let fontSize = this.fontSize;
    let marginLeft = 200;
    let TOOLTIP_PADDING = 20;
    let CIRCLE_RADIUS = this.CIRCLE_RADIUS;
    let TRANSITION_DURATION = this.TRANSITION_DURATION;
    // let fonts = this.fonts;
    let showDetailsOf$ = this.showDetailsOf$;
    let datasetId = this.datasetId;
    let datasetSlug = this.slug;
    let router = this.router;
    let getTags = this.getTags.bind(this)

    let POSITION_INITIATIVE_NAME = this.POSITION_INITIATIVE_NAME;
    let POSITION_TAGS_NAME = this.POSITION_TAGS_NAME;
    let POSITION_ACCOUNTABLE_NAME = this.POSITION_ACCOUNTABLE_NAME;
    let DEFAULT_PICTURE_ANGLE = this.DEFAULT_PICTURE_ANGLE;
    let PADDING_CIRCLE = 20

    let pack = d3
      .pack()
      .size([diameter - margin, diameter - margin])
      .padding(function (d: any) {
        return PADDING_CIRCLE;
      });

    let root: any = d3
      .hierarchy(data)
      .sum(function (d) {
        return (d.accountable ? 1 : 0) + (d.helpers ? d.helpers.length : 0) + 1;
      })
      .sort(function (a, b) {
        return b.value - a.value;
      });

    let depth = 0;
    root.eachAfter(function (n: any) {
      depth = depth > n.depth ? depth : n.depth;
    });
    let fonts = this.colorService.getFontSizeRange(depth, fontSize);
    let color = this.colorService.getColorRange(depth, seedColor);

    let focus = root,
      nodes = pack(root).descendants(),
      list = d3.hierarchy(data).descendants(),
      view: any;


    function getDepthDifference(d: any): number {
      return d.depth - focus.depth;
    }

    function isBranchDisplayed(d: any): boolean {
      return getDepthDifference(d) <= 3;
    }
    
    function isLeafDisplayed(d: any): boolean {
      return getDepthDifference(d) <= 2;
    }

    buildPatterns();

    buildTooltips();

    let path = buildPaths();

    let initiative = g
      .selectAll("g.node.initiative-map")
      .data(nodes, function (d: any) {
        return `${d.data.id}`;
      });

    initiative.exit().remove();

    let initiativeEnter = initiative.enter()
      .append("g")
      .attr("class", function (d: any) {
        return d.parent
          ? d.children ? "node" : "node node--leaf"
          : "node node--root";
      })
      .classed("initiative-map", true)
      .attr("id", function (d: any) {
        return `${d.data.id}`;
      })

    initiativeEnter.append("circle")
    initiativeEnter.filter((d: any) => d.children).append("text").attr("class", "name with-children").classed("initiative-map", true);
    initiativeEnter.filter((d: any) => !d.children).append("text").attr("class", "name no-children").classed("initiative-map", true);

    initiativeEnter.filter((d: any) => !d.children).append("text").attr("class", "tags no-children").classed("initiative-map", true);

    initiativeEnter.filter((d: any) => d.children).append("circle").attr("class", "accountable with-children").classed("initiative-map", true);
    initiativeEnter.filter((d: any) => !d.children).append("circle").attr("class", "accountable no-children").classed("initiative-map", true);

    initiativeEnter.filter((d: any) => !d.children).append("text").attr("class", "accountable no-children").classed("initiative-map", true)

    initiative = initiativeEnter.merge(initiative);


    let circle = initiative.select("circle")
      .attr("class", function (d: any) {
        return d.parent
          ? d.children ? "node" : "node node--leaf"
          : "node node--root";
      })
      .classed("initiative-map", true)
      .each((d: any) => (d.k = 1))
      .attr("id", function (d: any) {
        return `${d.data.id}`;
      })
      .classed("with-border", function (d: any) {
        return !d.children && d.parent === root;
      })

      .on("click", function (d: any) {
        if (focus !== d) zoom(d), d3.event.stopPropagation();
      });

    g.selectAll("circle.node")
      .style("fill", function (d: any) {
        return d.children
          ? color(d.depth)
          : !d.children && d.parent === root ? color(d.depth) : null;
      })
      ;

    let textAround = initiative.select("text.name.with-children")
      .attr("id", function (d: any) {
        return `${d.data.id}`;
      })
      .style("pointer-events", "none")
      .style("opacity", function (d: any) {
        return isBranchDisplayed(d) ? 1 : 0;
      })
      .style("display", function (d: any) {
        return d !== root
          ? isBranchDisplayed(d) ? "inline" : "none"
          : "none";
      })
      .html(function (d: any) {
        return `<textPath xlink:href="#path${d.data.id}" startOffset="10%">
                  <tspan>${d.data.name || ""}</tspan>
                  </textPath>`;
      });



    let initiativeName = initiative.select("text.name.no-children")
      .attr("id", function (d: any) {
        return `${d.data.id}`;
      })
      .classed("initiative-map", true)
      .style("pointer-events", "none")
      .attr("dy", 0)
      .attr("x", function (d: any) {
        return -d.r * POSITION_INITIATIVE_NAME.x;
      })
      .attr("y", function (d: any) {
        return -d.r * POSITION_INITIATIVE_NAME.y;
      })
      .attr("font-size", function (d: any) {
        return `${fonts(d.depth)}rem`;
      })
      .text(function (d: any) {
        return d.data.name;
      })
      .style("display", "inline")
      .style("opacity", function (d: any) {
        return isLeafDisplayed(d) ? 1 : 0;
      })
      .each(function (d: any) {
        uiService.wrap(
          d3.select(this),
          d.data.name,
          d.data.tags,
          d.r * 2 * 0.95
        );
      });

    let tagsName = initiative.select("text.tags")
      .attr("id", function (d: any) {
        return `${d.data.id}`;
      })
      .style("pointer-events", "none")
      .attr("text-anchor", "middle")
      .attr("x", function (d: any) {
        return -d.r * POSITION_TAGS_NAME.x;
      })
      .attr("y", function (d: any) {
        return -d.r * POSITION_TAGS_NAME.y;
      })
      .attr("font-size", function (d: any) {
        return `${fonts(d.depth) * POSITION_TAGS_NAME.fontRatio}rem`;
      })
      .style("display", "inline")
      .style("opacity", function (d: any) {
        return isLeafDisplayed(d) ? 1 : 0;
      })
      .html(function (d: any) {
        return d.data.tags.map((tag: Tag) => `<tspan fill="${tag.color}" class="dot-tags">&#xf02b</tspan><tspan fill="${tag.color}">${tag.name}</tspan>`).join(" ");
      });

    let accountablePictureWithChildren = initiative.select("circle.accountable.with-children")
      .attr("pointer-events", "none")
      .attr("fill", function (d: any) {
        return "url(#image" + d.data.id + ")";
      })
      .style("fill-opacity", function (d: any) {
        return isBranchDisplayed(d) ? 1 : 0;
      })
      .style("display", function (d: any) {
        return d !== root
          ? isBranchDisplayed(d) ? "inline" : "none"
          : "none";
      });

    let accountablePictureWithoutChildren = initiative.select("circle.accountable.no-children")
      .attr("pointer-events", "none")
      .attr("fill", function (d: any) {
        return "url(#image" + d.data.id + ")";
      })
      .style("opacity", function (d: any) {
        return isLeafDisplayed(d) ? 1 : 0;
      });

    let accountableName = initiative.select("text.accountable.no-children")
      .attr("text-anchor", "middle")
      .style("pointer-events", "none")
      .attr("id", function (d: any) {
        return `${d.data.id}`;
      })
      .style("display", "inline")
      .style("opacity", function (d: any) {
        return isLeafDisplayed(d) ? 1 : 0;
      })
      .attr("font-size", function (d: any) {
        return `${fonts(d.depth) * POSITION_ACCOUNTABLE_NAME.fontRatio}rem`;
      })
      .attr("x", function (d: any) {
        return d.r * POSITION_ACCOUNTABLE_NAME.x;
      })
      .attr("y", function (d: any) {
        return -d.r * POSITION_ACCOUNTABLE_NAME.y;
      })
      .text(function (d: any) {
        return d.data.accountable ? d.data.accountable.name : "";
      });

    let node = g.selectAll("g.node");

    svg.on("click", function () {
      zoom(root);
    });

    zoomTo([root.x, root.y, root.r * 2 + margin]);

    function zoom(d: any) {
      let focus0 = focus;
      focus = d;

      let transition = d3
        .transition("zooming")
        .duration(TRANSITION_DURATION)
        .tween("zoom", function (d) {
          let i = d3.interpolateZoom(view, [
            focus.x,
            focus.y,
            focus.r * 2 + margin
          ]);
          return function (t) {
            zoomTo(i(t));
          };
        })
        .on("start", function (d: any) {
          d3.selectAll(`div.arrow_box`).classed("show", false)
        })
        .on("end", function (d: any) {



        });

      let revealTransition = d3
        .transition("reveal")
        .delay(TRANSITION_DURATION)
        .duration(TRANSITION_DURATION);

      // with children

      transition
        .selectAll("text.name")
        .filter((d: any) => d.children)
        .on("start", function (d: any) {
          d3.select(this).style("opacity", 0);
        })
        .on("end", function (d: any) {
          d3
            .select(this)
            .style("opacity", function (d: any) {
              return isBranchDisplayed(d) ? 1 : 0;
            })
            .style("display", function (d: any) {
              return d !== root
                ? isBranchDisplayed(d) ? "inline" : "none"
                : "none";
            });
          // .attr("font-size", function (d: any) { return `${fonts(d.depth) * d.k / 2}px` })
        });

      transition
        .selectAll("circle.accountable")
        .filter((d: any) => d.children)
        .style("fill-opacity", function (d: any) {
          return isBranchDisplayed(d) ? 1 : 0;
        })
        .style("display", function (d: any) {
          return d !== root
            ? isBranchDisplayed(d) ? "inline" : "none"
            : "none";
        });

      // nochildren
      revealTransition
        .selectAll("text")
        .filter((d: any) => !d.children)
        .style("opacity", function (d: any) {
          return isLeafDisplayed(d) ? "1" : "0";
        });
      revealTransition
        .selectAll("circle.accountable")
        .filter((d: any) => !d.children)
        .style("opacity", function (d: any) {
          return isLeafDisplayed(d) ? "1" : "0";
        });

      transition
        .selectAll("text.name")
        .filter((d: any) => !d.children)
        .on("start", function (d: any) {
          d3.select(this).style("opacity", 0);
        })
        .on("end", function (d: any) {
          d3
            .select(this)
            .attr("x", function (d: any) {
              return -d.r * d.k * POSITION_INITIATIVE_NAME.x;
            })
            .attr("y", function (d: any) {
              return -d.r * d.k * POSITION_INITIATIVE_NAME.y;
            })
            .attr("dy", 0)
            .attr("font-size", function (d: any) {
              return `${fonts(d.depth) / (d.depth <= 2 ? 1 : 2) * d.k}rem`;
            })
            .each(function (d: any) {
              uiService.wrap(
                d3.select(this),
                d.data.name,
                d.data.tags,
                d.r * d.k * 2 * 0.95
              );
            })
            .style("opacity", function (d: any) {
              return isLeafDisplayed(d) ? "1" : "0";
            });
        });

      transition
        .selectAll("text.accountable")
        .filter((d: any) => !d.children)
        .on("start", function (d: any) {
          d3.select(this).style("opacity", 0);
        })
        .on("end", function (d: any) {
          d3
            .select(this)
            .attr("text-anchor", "middle")
            .attr("x", function (d: any) {
              return d.r * POSITION_ACCOUNTABLE_NAME.x;
            })
            .attr("y", function (d: any) {
              return -d.r * d.k * POSITION_ACCOUNTABLE_NAME.y;
            })
            .attr("font-size", function (d: any) {
              return `${fonts(d.depth) /
                (d.depth <= 2 ? 1 : 2) *
                d.k *
                POSITION_ACCOUNTABLE_NAME.fontRatio}rem`;
            });
        });

      transition
        .selectAll("text.tags")
        .filter((d: any) => !d.children)
        .filter(function (d: any) {
          return d.data.tags;
        })
        .on("start", function (d: any) {
          d3.select(this).style("opacity", 0);
        })
        .on("end", function (d: any) {
          d3
            .select(this)
            .attr("x", function (d: any) {
              return -d.r * d.k * POSITION_TAGS_NAME.x;
            })
            .attr("y", function (d: any) {
              return -d.r * d.k * POSITION_TAGS_NAME.y;
            })
            .attr("font-size", function (d: any) {
              return `${fonts(d.depth) /
                (d.depth <= 2 ? 1 : 2) *
                d.k *
                POSITION_TAGS_NAME.fontRatio}rem`;
            });
        });

      // all
      // console.log("zoom to ", getTags())
      let [selectedTags, unselectedTags] = partition(getTags(), (t: SelectableTag) => t.isSelected);

      transition
        .selectAll("g.node.initiative-map")
        .style("opacity", function (d: any) {
          return getTags().every((t: SelectableTag) => !t.isSelected)
            // no tags selecteed, we apply node focusing
            ? (<any[]>focus.descendants()).find(desc => desc.data.id === d.data.id) ? 1 : 0.1
            // otherwise, we apply tags focusing
            : uiService.filter(selectedTags, unselectedTags, d.data.tags.map((t: Tag) => t.shortid)) ? 1 : 0.1;
        });
    }

    function zoomTo(v: any) {
      let k = diameter / v[2];
      view = v;
      node.attr("transform", function (d: any) {
        return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")";
      })


        ;
      circle
        .attr("r", function (d: any) {
          return d.r * k;
        })
        .each((d: any) => (d.k = k))
        .on("mouseover", function (d: any) {
          d3.event.stopPropagation();

          let tooltip = d3.select(`div.arrow_box[id="${d.data.id}"]`);
          let matrix = this.getScreenCTM().translate(
            +this.getAttribute("cx"),
            +this.getAttribute("cy")
          );


          let TOOLTIP_HEIGHT = (tooltip.node() as HTMLElement).getBoundingClientRect()
            .height;
          let TOOLTIP_WIDTH = (tooltip.node() as HTMLElement).getBoundingClientRect()
            .width;
          let ARROW_DIMENSION = 10;
          let DEFAULT_ANGLE = 180 - 36;
          let svgScale = + svg.attr("scale");

          let center = { x: window.pageXOffset + matrix.e, y: window.pageYOffset + matrix.f };
          let radius = d.r * d.k * svgScale;

          let left = center.x - TOOLTIP_WIDTH / 2;
          let top = center.y - TOOLTIP_HEIGHT - ARROW_DIMENSION - radius;
          let bottom = center.y + ARROW_DIMENSION + radius;

          let isHorizontalPosition = top < 0 && bottom + TOOLTIP_HEIGHT > Number.parseFloat(svg.attr("height"));
          tooltip
            .style("z-index", 2000)
            .style("left", () => {
              return isHorizontalPosition
                ? `${center.x + radius * Math.cos(DEFAULT_PICTURE_ANGLE) - TOOLTIP_WIDTH / 2 - ARROW_DIMENSION}px`
                : `${left}px`
            })
            .style("top", () => {
              return isHorizontalPosition
                ? `${center.y - radius * Math.sin(DEFAULT_PICTURE_ANGLE) + CIRCLE_RADIUS * 2}px`
                : (
                  top > 0
                    ? `${top}px`
                    : `${bottom}px`);
            })
            .classed("show", true)
            .classed("arrow-top", top < 0)
            .classed("arrow-bottom", top >= 0)
            .on("click", function (d: any) {
              tooltip.classed("show", false);
            });
        })
        .on("mouseout", function (d: any) {
          let tooltip = d3.select(`div.arrow_box[id="${d.data.id}"]`);
          tooltip.classed("show", false);
        });

      path.attr("transform", "scale(" + k + ")");

      // accountableName

      g
        .selectAll("circle.accountable")
        .attr("r", function (d: any) {
          return `${CIRCLE_RADIUS}px`;
        })
        .attr("cx", function (d: any) {
          return d.children
            ? Math.cos(DEFAULT_PICTURE_ANGLE) * (d.r * k) - 12
            : 0;
        })
        .attr("cy", function (d: any) {
          return d.children
            ? -Math.sin(DEFAULT_PICTURE_ANGLE) * (d.r * k) + 7
            : -d.r * k * 0.8;
        });



    }

    function buildPatterns() {
      let patterns = definitions.selectAll("pattern").data(
        nodes.filter(function (d: any) {
          return d.data.accountable;
        }),
        function (d: any) {
          return d.data.id;
        }
      );
      let enterPatterns = patterns
        .enter()
        .filter(function (d: any) {
          return d.data.accountable;
        })
        .append("pattern");

      enterPatterns
        .attr("id", function (d: any) {
          return "image" + d.data.id;
        })
        .attr("width", "100%")
        .attr("height", "100%")
        .filter(function (d: any) {
          return d.data.accountable;
        })
        .append("image")
        .attr("width", CIRCLE_RADIUS * 2)
        .attr("height", CIRCLE_RADIUS * 2)
        .attr("xlink:href", function (d: any) {
          return d.data.accountable.picture;
        });

      patterns
        .attr("id", function (d: any) {
          return "image" + d.data.id;
        })
        .attr("width", "100%")
        .attr("height", "100%")
        .filter(function (d: any) {
          return d.data.accountable;
        })
        .select("image")
        .attr("width", CIRCLE_RADIUS * 2)
        .attr("height", CIRCLE_RADIUS * 2)
        .attr("xlink:href", function (d: any) {
          return d.data.accountable.picture;
        });
      patterns.exit().remove();
    }

    function buildTooltips() {
      let tooltip = d3
        .select("body")
        .selectAll("div.arrow_box")
        .data(nodes, function (d: any) {
          return d.data.id;
        })
      tooltip.exit().remove();

      tooltip = tooltip.enter()
        .append("div")
        .attr("class", "arrow_box")
        .classed("show", false)
        .merge(tooltip)
        .attr("id", function (d: any) {
          return `${d.data.id}`;
        })
        .on("mouseenter", function () {
          d3.select(this).classed("show", true);
        })
        .on("mouseleave", function () {
          tooltip.classed("show", false);
        })
        .html(function (d: any) {
          return uiService.getTooltipHTML(d.data);
        });

      d3.selectAll(`.open-initiative`).on("click", function (d: any) {
        let id = Number.parseFloat(d3.select(this).attr("id"));
        showDetailsOf$.next(list.find(n => (<any>n.data).id === id).data);
      });
      d3.selectAll(`.open-summary`).on("click", function (d: any) {
        let shortid = d3.select(this).attr("data-shortid");
        let slug = d3.select(this).attr("data-slug");
        router.navigateByUrl(
          `/map/${datasetId}/${datasetSlug}/u/${shortid}/${slug}`
        );
      });
    }

    function buildPaths() {
      let path = g.select("g.paths")
        .selectAll("path")
        .data(nodes, function (d: any) {
          return d.data.id;
        })

      path.exit().remove();
      path = path.enter()
        .append("path")
        .merge(path)
        .attr("id", function (d: any) {
          return `path${d.data.id}`;
        })
        .style("stroke", "none")
        .style("fill", "none")
        .attr("d", function (d: any, i: number) {
          let radius = d.r + 1;
          return uiService.getCircularPath(radius, -radius, 0);
        });

      return path;
    }
  }
}