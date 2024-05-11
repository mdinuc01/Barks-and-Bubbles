import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-appointment-scheduler',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './appointment-scheduler.component.html',
  styleUrl: './appointment-scheduler.component.scss',
})
export class AppointmentSchedulerComponent implements OnInit {
  hours: string[] = [];
  @Input() clients!: any[];
  @Input() replies!: any[];
  @Output() repliesEvent = new EventEmitter<any>();
  currentReply: any;

  constructor() {
    // Generate hours from 12:00 AM to 11:00 PM
    for (let i = 7; i < 12; i++) {
      this.hours.push(`${i === 0 ? 12 : i}:00 AM`);
    }
    for (let i = 12; i < 22; i++) {
      this.hours.push(`${i === 12 ? 12 : i - 12}:00 PM`);
    }
  }
  ngOnInit(): void {
    console.log({ r: this.replies, c: this.clients });
  }

  filter(arr: any[], filterParam: any) {
    return arr.filter((a) => a.direction == 'inbound' && a.time == filterParam);
  }

  getClientName(phoneNumber: string) {
    phoneNumber = phoneNumber.substring(2);
    let client = this.clients.find((c) => c.contactMethod == phoneNumber);

    return client.petName;
  }

  onDragStart(reply: any) {
    this.currentReply = reply;
  }

  onDrop(event: any, time: any) {
    event.preventDefault();

    let reply = this.replies.find((r) => r.sid == this.currentReply.sid);
    if (reply != undefined) reply.time = time;

    this.currentReply = null;
  }

  onDragOver(event: any) {
    event.preventDefault();
  }

  sendReplies() {
    this.repliesEvent.emit(this.replies);
  }

  resetAppTimes() {
    this.replies = this.replies.map((r) => {
      r.time = null;
      return r;
    });
  }
}
