import { Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { CallService } from '@core/services/call.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {
  public isCallStarted$: Observable<boolean>;

  constructor(private callService: CallService, private renderer: Renderer2) {
    this.isCallStarted$ = this.callService.isCallStarted$;
  }
  
  @ViewChild('scrollChat') scrollConteiner!: ElementRef;

  ngOnInit(): void {
    this.getChat();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  getChat() {
    this.callService.removedMessageBs.subscribe((message) => {
      if (message) {
        const messageElem = this.renderer.createElement('div');
        this.renderer.addClass(messageElem, 'message');
        const messageBody = this.renderer.createElement('div');
        this.renderer.addClass(messageBody, 'message__body');
        messageBody.textContent = message;
        this.renderer.appendChild( messageElem, messageBody);
        this.renderer.appendChild( this.scrollConteiner.nativeElement, messageElem);
      }
    })
  }

  sendMessage(message: string) {
    const messageElem = this.renderer.createElement('div');
    this.renderer.addClass(messageElem, 'message');
    this.renderer.addClass(messageElem, 'right');
    const messageBody = this.renderer.createElement('div');
    this.renderer.addClass(messageBody, 'message__body');
    messageBody.textContent = message;
    this.renderer.appendChild( messageElem, messageBody);
    this.renderer.appendChild( this.scrollConteiner.nativeElement, messageElem);
    this.callService.localMessageBs.next(message);
  }

  public scrollToBottom(): void {
    try {
      this.scrollConteiner.nativeElement.scrollTop = this.scrollConteiner.nativeElement.scrollHeight;
    } catch (err) {}
  }
}
