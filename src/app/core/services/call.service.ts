import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import Peer, { MediaConnection, PeerJSOption } from 'peerjs';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class CallService {
  private peer!: Peer;
  private mediaCall!: MediaConnection;

  private localStreamBs: BehaviorSubject<any> =  new BehaviorSubject(null);
  public localStream$ = this.localStreamBs as Observable<MediaStream>;
  private removedStreamBs: BehaviorSubject<any> =  new BehaviorSubject(null);
  public remoteStream$ = this.removedStreamBs as Observable<MediaStream>;

  private isCallStartedBs = new Subject<boolean>();
  public isCallStarted$ = this.isCallStartedBs as Observable<boolean>;

  constructor(private snackBar: MatSnackBar) {}

  public initPeer(): string | null {
    if (!this.peer || this.peer.disconnected) {
      const peerJsOptions: PeerJSOption = {
        debug: 3,
        config: {
          iceServers: [
            {
              urls: [
                'stun:stun1.l.google.com:19302',
                'stun:stun2.l.google.com:19302',
              ],
            }]
        }
      };
      try {
        let id = uuidv4();
        this.peer = new Peer(id, peerJsOptions);
        return id;
      } catch(error) {
        console.error(error);
        throw(error);
      }
    } else {
      return null;
    }
  }

  public async establishMediaCall(remotePeerId: string) {
    console.log('establishMediaCall', remotePeerId);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});

      const connection = this.peer.connect(remotePeerId);
      connection.on('error', (err) => {
        console.error(err);
        this.snackBar.open(err.toString(), 'Close');
      });

      this.mediaCall = this.peer.call(remotePeerId, stream);
      if (!this.mediaCall) {
        let errorMessage = 'Unable to connect to remote peer';
        this.snackBar.open(errorMessage, 'Close');
        throw new Error(errorMessage); 
      }
      this.localStreamBs = new BehaviorSubject(stream);
      this.isCallStartedBs.next(true);

      this.mediaCall.on('stream',
        (remoteStream) => {
          this.removedStreamBs = new BehaviorSubject(remoteStream);
      });

      this.mediaCall.on('error', (err) => {
        this.snackBar.open(err.toString(), 'Close');
        console.error(err);
        this.isCallStartedBs.next(false);
      });
      this.mediaCall.on('close', () => this.onCallClose());
    } catch (err: any) {
      console.error(err);
      this.snackBar.open(err.toString(), 'Close');
      this.isCallStartedBs.next(false);
    }
    this.peer.on('disconnected', () => {
      console.log('disconect');
    })
  }

  public async enableCallAnswer() {
    console.log('enableCallAnswer');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
      this.localStreamBs.next(stream);
      this.peer.on('call', async (call) => {
        this.mediaCall = call;
        this.isCallStartedBs.next(true);

        this.mediaCall.answer(stream);
        this.mediaCall.on('stream', (remoteStream) => {
          this.removedStreamBs.next(remoteStream);
        });
        this.mediaCall.on('error', (err) => {
          this.snackBar.open(err.toString(), 'Close');
          console.error(err);
          this.isCallStartedBs.next(false);
        });
        this.mediaCall.on('close', () => this.onCallClose());
      })

    } catch (err: any) {
      console.error(err);
      this.snackBar.open(err.toString(), 'Close');
      this.isCallStartedBs.next(false);
    }
  }

  public async sharedScreen(sharedScreen: boolean) {
    try {
      const video = this.localStreamBs?.value.getVideoTracks();
      this.localStreamBs?.value.removeTrack(video[0]);
      if (video.length > 0 && sharedScreen){
        const screen = await navigator.mediaDevices.getDisplayMedia({video: true});
        const videoTrack = screen.getVideoTracks()[0];
        this.localStreamBs?.value.addTrack(videoTrack);
      } else {
        const videoCamera = await navigator.mediaDevices.getUserMedia({video: true});
        const videoTrack = videoCamera.getVideoTracks()[0];
        this.localStreamBs?.value.addTrack(videoTrack);
      }
      console.log('treck', this.localStreamBs?.value.getTracks());
    } catch (err: any) {
      console.error(err);
      this.snackBar.open(err.toString(), 'Close');
      this.isCallStartedBs.next(false);
    }
  }

  public async sharedVideo(sharedVideo: boolean) {
    try {
      const video = this.localStreamBs?.value.getVideoTracks();
      if (video.length > 0 && sharedVideo){
        return;
      } else if (!video.length) {
        const videoCamera = await navigator.mediaDevices.getUserMedia({video: true});
        const videoTrack = videoCamera.getVideoTracks()[0];
        this.localStreamBs?.value.addTrack(videoTrack);
      } else {
        this.localStreamBs?.value.removeTrack(video[0]);
      }
      console.log('treck', this.localStreamBs?.value.getTracks());
    } catch (err: any) {
      console.error(err);
      this.snackBar.open(err.toString(), 'Close');
      this.isCallStartedBs.next(false);
    }
  }

  public async sharedAudio(sharedAudio: boolean) {
    try {
      const audio = this.localStreamBs?.value.getAudioTracks();
      if (audio.length > 0 && sharedAudio){
        return;
      } else if (!audio.length) {
        const audio = await navigator.mediaDevices.getUserMedia({audio: true});
        const audioTrack = audio.getAudioTracks()[0];
        this.localStreamBs?.value.addTrack(audioTrack);
      } else {
        this.localStreamBs?.value.removeTrack(audio[0]);
      }
      console.log('treck', this.localStreamBs?.value.getTracks());
    } catch (err: any) {
      console.error(err);
      this.snackBar.open(err.toString(), 'Close');
      this.isCallStartedBs.next(false);
    }
  }

  private onCallClose() {
    this.removedStreamBs?.value.getTracks().forEach((track: any) => {
      track.stop();
    });
    this.localStreamBs?.value.getTracks().forEach((track: any) => {
      track.stop();
    });
    this.snackBar.open('Call Ended', 'Close');
  }

  public closeMediaCall() {
    this.mediaCall.close();
    if (!this.mediaCall) {
      this.onCallClose();
    }
    this.isCallStartedBs.next(false);
  }

  public destroyPeer() {
    this.mediaCall?.close();
    this.peer?.disconnect();
    this.peer?.destroy();
  }
}

