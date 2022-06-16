import { Component } from '@angular/core';
import { Servers } from '../models/servers.model';
import {
  AngularFirestore,
  AngularFirestoreDocument
} from '@angular/fire/compat/firestore';
import { FormGroup, FormControl } from '@angular/forms';
import { Offer } from '../models/offer.model';
import { map } from 'rxjs';
import { Answer } from '../models/answer.model';

const servers: Servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
}

@Component({
  selector: 'app-main-stream',
  templateUrl: './main-stream.component.html',
  styleUrls: ['./main-stream.component.scss']
})
export class MainStreamComponent {
  startBtn = false;
  callBtn = true;
  answerBtn = true;
  hangupBtn = true;
  localStream: any;
  remoteStream: any;
  pc = new RTCPeerConnection(servers);
  public createOffer: FormGroup;
  public value = '';

  constructor(private firestore: AngularFirestore) {
    this.createOffer = new FormGroup({
      call: new FormControl(null),
    })
  }

  async getUserMedia() {
    this.localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    })

    this.remoteStream = new MediaStream();

    this.localStream.getTracks().forEach((track: MediaStreamTrack) => {
      this.pc.addTrack(track, this.localStream);
    })

    this.pc.ontrack = (event: any) => {
      event.streams[0].getTracks((track: MediaStreamTrack) => {
        this.remoteStream.addTrack(track);
      })
    }

    this.callBtn = false;
    this.answerBtn = false;
    this.startBtn = true;
  }

  async call() {
    const callDoc = this.firestore.collection('calls').doc();
    const offerCandidates = callDoc.collection('offerCandidates');
    const answerCandidates = callDoc.collection('answerCandidates');

    this.value = callDoc.ref.id;

    this.pc.onicecandidate = (event: any) => {
      // console.log('event', event);
      // console.log('event.candidate', event.candidate);
      event.candidate && offerCandidates.add(event.candidate.toJSON());
    }

    const offerDescription = await this.pc.createOffer();
    await this.pc.setLocalDescription(offerDescription);

    const offer: Offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type
    }

    await callDoc.set({offer});

    callDoc.snapshotChanges().subscribe((snapshot) => {
      const data: any = snapshot.payload.data();

      if (!this.pc.currentRemoteDescription && data.answer) {
        const answerDescription = new RTCSessionDescription(data.answer);
        this.pc.setRemoteDescription(answerDescription);
      }

      answerCandidates.snapshotChanges().pipe(map((changes) => changes.map((change) => {

        if (change.type === 'added') {
          const candidate = new RTCIceCandidate(change.payload.doc.data());
          this.pc.addIceCandidate(candidate);
        }
      })));
    });

    this.hangupBtn = false;
  }

  async answer() {
    const callId = this.value;

    const callDoc = this.firestore.collection('calls').doc(callId);
    const answerCandidates = callDoc.collection('answerCandidates');
    const offerCandidates = callDoc.collection('offerCandidates');
    
    this.pc.onicecandidate = (event: any) => {
      event.candidate && answerCandidates.add(event.candidate.toJson());
    }

    let callData: any;
    callDoc.get().subscribe((d) => {
      callData = d.data();
    })

    if (callData) {
      const offerDescription = callData.offer; 
      await this.pc.setRemoteDescription(new RTCSessionDescription(offerDescription));
    }

    const answerDescription = await this.pc.createAnswer();
    await this.pc.setLocalDescription(new RTCSessionDescription(answerDescription));

    const answer: Answer = {
      type: answerDescription.type,
      sdp: answerDescription.sdp
    }

    await callDoc.update({answer});

    offerCandidates.snapshotChanges().pipe(map((changes) => changes.map((change) => {

      if (change.type === 'added') {
        let data = change.payload.doc.data();
        this.pc.addIceCandidate( new RTCIceCandidate(data));
      }
    })));
  }
}
