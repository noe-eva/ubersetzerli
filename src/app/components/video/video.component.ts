import {AfterViewInit, Component, ElementRef, HostBinding, ViewChild} from '@angular/core';
import {Select, Store} from '@ngxs/store';
import {combineLatest, Observable} from 'rxjs';
import {CameraSettings, VideoStateModel} from '../../core/modules/ngxs/store/video/video.state';
import Stats from 'stats.js';
import {filter, map, takeUntil, tap} from 'rxjs/operators';
import {BaseComponent} from '../base/base.component';
import {wait} from '../../core/helpers/wait/wait';
import {PoseVideoFrame} from '../../modules/pose/pose.actions';
import {Pose, PoseStateModel} from '../../modules/pose/pose.state';
import {PoseService} from '../../modules/pose/pose.service';
import {HandsStateModel} from '../../modules/hands/hands.state';
import {HandsService} from '../../modules/hands/hands.service';

@Component({
  selector: 'app-video',
  templateUrl: './video.component.html',
  styleUrls: ['./video.component.scss']
})
export class VideoComponent extends BaseComponent implements AfterViewInit {
  @Select(state => state.video) videoState$: Observable<VideoStateModel>;
  @Select(state => state.pose) poseState$: Observable<PoseStateModel>;
  @Select(state => state.hands) handsState$: Observable<HandsStateModel>;
  // @Select(state => state.models.signingProbability) signingProbability$: Observable<number>;
  // @Select(state => state.models.isSigning) isSigning$: Observable<boolean>;

  @ViewChild('video') videoEl: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvasEl: ElementRef<HTMLCanvasElement>;
  @ViewChild('stats') statsEl: ElementRef;

  @HostBinding('class') aspectRatio = 'aspect-16-9';

  canvasCtx!: CanvasRenderingContext2D;

  fpsStats = new Stats();
  signingStats = new Stats();

  constructor(private store: Store,
              private poseService: PoseService,
              private handsService: HandsService) {
    super();
  }

  ngAfterViewInit(): void {
    this.setCamera();
    this.drawChanges();
    this.setStats();
    this.trackPose();

    this.canvasCtx = this.canvasEl.nativeElement.getContext('2d');
    this.videoEl.nativeElement.addEventListener('loadeddata', this.appLoop.bind(this));
  }

  async appLoop(): Promise<void> {
    const fps = this.store.snapshot().video.cameraSettings.frameRate;
    const video = this.videoEl.nativeElement;
    const poseAction = new PoseVideoFrame(this.videoEl.nativeElement);

    let lastTime = null;
    while (true) {
      if (video.readyState !== 4) {
        break;
      }

      // Make sure the frame changed
      if (video.currentTime > lastTime) {
        lastTime = video.currentTime;

        // Get pose estimation
        await this.store.dispatch(poseAction).toPromise();
      }

      await wait(0);
    }
  }

  setCamera(): void {
    const video = this.videoEl.nativeElement;
    video.addEventListener('loadedmetadata', e => video.play());

    this.videoState$.pipe(
      map(state => state.camera),
      tap(camera => video.srcObject = camera),
      // tap(camera => {
      //   video.src = 'assets/videos/example_maayan.mp4';
      //   video.muted = true;
      //   setTimeout(() => this.aspectRatio = 'aspect-16-9', 0);
      // }),
      takeUntil(this.ngUnsubscribe)
    ).subscribe();

    this.videoState$.pipe(
      map(state => state.cameraSettings),
      filter(Boolean),
      tap(({width, height}) => {
        this.canvasEl.nativeElement.width = width;
        this.canvasEl.nativeElement.height = height;
      }),
      tap((settings: CameraSettings) => this.aspectRatio = 'aspect-' + settings.aspectRatio),
      takeUntil(this.ngUnsubscribe)
    ).subscribe();
  }

  trackPose(): void {
    this.poseState$.pipe(
      map(state => state.pose),
      filter(Boolean),
      tap((pose: Pose) => {
        this.fpsStats.end(); // End previous frame time
        this.fpsStats.begin(); // Start new frame time
      }),
      takeUntil(this.ngUnsubscribe)
    ).subscribe();
  }

  drawChanges(): void {
    combineLatest([this.poseState$, this.handsState$]).pipe(
      tap(([poseState, handsState]) => {
        if (poseState.pose) {
          this.poseService.draw(poseState.pose, this.canvasCtx);
          this.handsService.draw(handsState, this.canvasCtx);
        }
      }),
      takeUntil(this.ngUnsubscribe)
    ).subscribe();

  }

  setStats(): void {
    this.fpsStats.showPanel(0);
    this.fpsStats.domElement.style.position = 'absolute';
    this.statsEl.nativeElement.appendChild(this.fpsStats.dom);

    const signingPanel = new Stats.Panel('Signing', '#ff8', '#221');
    this.signingStats.dom.innerHTML = '';
    this.signingStats.addPanel(signingPanel);
    this.signingStats.showPanel(0);
    this.signingStats.domElement.style.position = 'absolute';
    this.signingStats.domElement.style.left = '80px';
    this.statsEl.nativeElement.appendChild(this.signingStats.dom);

    // this.setDetectorListener(signingPanel);
  }

  // setDetectorListener(panel: Stats.Panel): void {
  //   this.signingProbability$.pipe(
  //     tap(v => panel.update(v * 100, 100)),
  //     takeUntil(this.ngUnsubscribe)
  //   ).subscribe();
  // }
}
