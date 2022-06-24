import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { CallService } from '@core/services/call.service';
import { filter, Observable, of, switchMap } from 'rxjs';
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

  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;

  constructor(public dialog: MatDialog, private callService: CallService) {
    this.isCallStarted$ = this.callService.isCallStarted$;
    this.peerId = this.callService.initPeer();
  }

  ngOnInit(): void {
    this.getStream();
  }

  public getStream() {
    this.callService.localStream$
      .pipe(filter((res: any) => !!res))
      .subscribe((stream: MediaProvider | null) => { 
        this.localVideo.nativeElement.srcObject = stream;
      });
    this.callService.remoteStream$
      .pipe(filter((res: any) => !!res))
      .subscribe((stream: MediaProvider | null) => {
        this.remoteVideo.nativeElement.srcObject = stream
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
    this.callService.shareScreen($event.checked);
  }

  public endCall() {
    this.callService.closeMediaCall();
  }
}
