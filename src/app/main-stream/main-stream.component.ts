import { Component, ElementRef, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { CallService } from '@core/services/call.service';
import { distinct, filter, Observable, of, switchMap } from 'rxjs';
import { DialogData } from '../models/dialog-data.model';
import { CallInfoDialogComponent } from './components/callinfo-dialog/callinfo-dialog.component';

@Component({
  selector: 'app-main-stream',
  templateUrl: './main-stream.component.html',
  styleUrls: ['./main-stream.component.scss']
})
export class MainStreamComponent implements OnInit, OnDestroy {
  public isCallStarted$: Observable<boolean>;
  private peerId: string | null;
  public videoOn = true;
  public audioOn = true;
  checked = false;

  @ViewChild('videos') videos!: ElementRef;

  constructor(
    public dialog: MatDialog, 
    private callService: CallService, 
    private renderer: Renderer2,
    ) {
    this.isCallStarted$ = this.callService.isCallStarted$;
    this.peerId = this.callService.initPeer();
  }

  ngOnInit(): void {
    this.isCallStarted$.subscribe((val) => {
      console.log('isCallStarted$', val);
    })
    this.getStream();
  }

  public getStream() {
    this.callService.localStream$
      .pipe(filter((res: any) => !!res))
      .subscribe((stream: MediaProvider | null) => {
        console.log('local', stream);
        if (stream){
          const video = this.renderer.createElement('video');
          this.renderer.addClass(video, 'video');
          this.renderer.addClass(video, 'local');
          this.renderer.setAttribute(video, 'autoplay', 'true');
          this.renderer.setAttribute(video, 'playsinline', 'true');
          this.renderer.setAttribute(video, 'muted', 'true');
          video.srcObject = stream;
          this.renderer.appendChild(this.videos.nativeElement, video);
        }
        // this.localVideo.nativeElement.srcObject = stream;
    });
    this.callService.remoteStream$
      .pipe(
        filter((res: MediaStream) => !!res),
        distinct((stream) => stream.id)
        )
      .subscribe((stream: MediaStream | null) => {
        console.log('stream', stream);
        if (stream){
          const video = this.renderer.createElement('video');
          this.renderer.addClass(video, 'video');
          this.renderer.addClass(video, 'remote');
          this.renderer.setAttribute(video, 'id', 'videoId');
          this.renderer.setAttribute(video, 'autoplay', 'true');
          this.renderer.setAttribute(video, 'playsinline', 'true');
          video.srcObject = stream;
          this.renderer.appendChild(this.videos.nativeElement, video);
          // this.remoteVideo.nativeElement.srcObject = stream
        }
    });
  }

  ngOnDestroy(): void {
    this.callService.destroyPeer();
  }

  public showModal(joinCall: boolean): void {
    let dialogData: DialogData = joinCall ? {peerId: undefined, joinCall: true} : {peerId: this.peerId!, joinCall: false};
    const dialogRef = this.dialog.open(CallInfoDialogComponent, {
      width: '250px',
      data: dialogData
    });

    dialogRef.afterClosed()
      .pipe(
        switchMap((peerId) => {
          return joinCall ? of(this.callService.establishMediaCall(peerId)) : of(this.callService.enableCallAnswer());
        }),
      )
      .subscribe(_ => {});
  }

  public onScreenShare($event: MatSlideToggleChange){
    this.checked = $event.checked
    this.callService.sharedScreen($event.checked);
  }

  public onVideoClick() {
    this.videoOn = !this.videoOn;
    if (this.checked) {
      this.checked = this.videoOn;
    }
    this.callService.sharedVideo(this.videoOn);
  }

  public onAudioClick() {
    this.audioOn = !this.audioOn;
    this.callService.sharedAudio(this.audioOn);
  }

  public endCall() {
    Array.from(document.getElementsByClassName('video')).forEach((video) => {
      video.remove();
    })
    this.callService.closeMediaCall();
  }
}
