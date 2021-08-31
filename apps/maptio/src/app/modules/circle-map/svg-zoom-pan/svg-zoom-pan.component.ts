import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  ChangeDetectorRef
} from '@angular/core';

import { SubSink } from 'subsink';

import { SvgZoomPanService } from './svg-zoom-pan.service';
import { InitiativeNode } from '../initiative.model';


@Component({
  selector: 'maptio-svg-zoom-pan',
  templateUrl: './svg-zoom-pan.component.html',
  styleUrls: ['./svg-zoom-pan.component.scss']
})
export class SvgZoomPanComponent implements OnInit, OnDestroy {
  @ViewChild('map') private svgElement: ElementRef;
  private svgCTM: SVGMatrix;

  private subs = new SubSink();

  scale = 1;
  translateX = 0;
  translateY = 0;
  transform = '';

  isPanning = false;
  panStartX = 0;
  panStartY = 0;
  isClickSideEffectOfPanning = false;

  zoomCenter?: SVGPoint;

  constructor(
    private svgZoomPanService: SvgZoomPanService,
    private changeDetector: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.subs.sink = this.svgZoomPanService.zoomedInitiativeNode.subscribe((node?: InitiativeNode) => {
      if (node) {
        this.zoomToCircle(node.x, node.y, node.r);
      } else {
        this.zoomToCircle(500, 500, 450);
      }
    });
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  onPanStart() {
    this.svgCTM = this.refreshScreenCTM();
    this.panStartX = this.translateX;
    this.panStartY = this.translateY;
  }

  onPan($event: HammerInput) {
    if (!this.svgCTM) {
      return;
    }

    this.translateX = this.panStartX + $event.deltaX / this.svgCTM.a / 10;
    this.translateY = this.panStartY + $event.deltaY / this.svgCTM.a / 10;

    this.setTransform();

    const panningThreshold = 3;
    if (Math.abs($event.deltaX) >= panningThreshold || Math.abs($event.deltaY) >= panningThreshold) {
      this.isPanning = true;
      this.isClickSideEffectOfPanning = true;
    }
  }

  onPanEnd() {
    this.isPanning = false;

    // In case click after panning doesn't get immediately caught by wrapper
    // (e.g. when pointer moves onto browser UI at the end of pan), make sure
    // we reset treating clicks as coming from panning events
    setTimeout(() => {
      this.isClickSideEffectOfPanning = false;
    });
  }

  // This is used for capturing clicks that happen at the end of the pan event
  // as a bit of a nasty side effect
  onWrapperClick($event: PointerEvent) {
    if (this.isClickSideEffectOfPanning) {
      $event.stopPropagation();
      this.isClickSideEffectOfPanning = false;
    }
  }

  onWheel($event: WheelEvent) {
    this.zoomCenter = this.findZoomCenter($event);

    console.log($event);
    console.log(typeof $event);
    console.log(this.zoomCenter);

    const relativeStep = $event.deltaY / $event.screenY / 2;

    this.scale -= this.scale * relativeStep;
    // this.zoomToCircle(this.zoomCenter.x, this.zoomCenter.y, 1000);
    this.setTransform();
  }

  private refreshScreenCTM() {
    return this.svgElement.nativeElement.getScreenCTM();
  }

  private findZoomCenter($event: WheelEvent) {
    this.svgCTM = this.refreshScreenCTM();

    const zoomCenterInDomCoordinates = this.svgElement.nativeElement.createSVGPoint();
    zoomCenterInDomCoordinates.x = $event.clientX;
    zoomCenterInDomCoordinates.y = $event.clientY;

    return zoomCenterInDomCoordinates.matrixTransform(
      this.svgCTM.inverse()
    );
  }

  zoomToCircle(x: number, y: number, r: number) {
    this.scale = (1000 - 100) / (2 * r);
    this.translateX = this.scaleCoordinatesAndConvertToPercentages(500 - x);
    this.translateY = this.scaleCoordinatesAndConvertToPercentages(500 - y);
    this.setTransform();
  }

  private scaleCoordinatesAndConvertToPercentages(coordinate: number) {
    return 100 * this.scale * coordinate / 1000;
  }

  setTransform() {
    this.transform = 'translate(' + this.translateX + '%, ' + this.translateY + '%) scale(' + this.scale + ')';
  }
}
