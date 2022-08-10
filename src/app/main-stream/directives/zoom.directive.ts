import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[zoom]'
})
export class ZoomDirective {
  @Input('zoomSize') size!: number;

  constructor(private el: ElementRef) { }

  @HostListener('mouseenter') onMouseEnter() {
    this.setFontSize(this.size);
  }
  @HostListener('mouseleave') onMouseLeave() {
    this.setFontSize(16);
  }

  setFontSize(value: number | string): void {
    this.el.nativeElement.style.fontSize = `${value}px`;
  }
}
