import { PanelService } from './../../services/panel service/panel-service';
import { DataService } from './../../services/data.service';
import { ToastService } from './../../services/toast.service';
import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { lastValueFrom } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatBadgeModule } from '@angular/material/badge';

interface Reply {
  sid: string;
  body: string;
  from: string;
  to: string;
  time: string | null;
  status: string;
  id: string;
  petName: string;
  petParentName: string;
  serviceArea: string;
}

interface Location {
  [key: string]: {
    replies: Reply[];
    location: String;
    increment: String;
  };
}

@Component({
  selector: 'app-appointment-scheduler',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatExpansionModule,
    MatBadgeModule,
  ],
  templateUrl: './appointment-scheduler.component.html',
  styleUrl: './appointment-scheduler.component.scss',
})
export class AppointmentSchedulerComponent implements OnInit {
  hours: string[] = [];
  @Input() clients!: any[];
  @Input() replies!: any[];
  @Input() appId!: string;
  counters: { [key: string]: number } = {};

  colors: string[] = [
    '#FF0000',
    '#00FF00',
    '#0000FF',
    '#FFFF00',
    '#FF00FF',
    '#00FFFF',
    '#800000',
    '#008000',
    '#000080',
    '#808000',
    '#800080',
    '#008080',
    '#FF5733',
    '#33FF57',
    '#3357FF',
    '#FF33A1',
    '#A1FF33',
    '#FFAA33',
    '#33FFAA',
    '#AA33FF',
    '#FFA533',
    '#33FFA5',
    '#5733FF',
    '#A533FF',
    '#FF33F5',
    '#33F5FF',
    '#F5FF33',
    '#33FF33',
    '#FF5733',
    '#FF3333',
  ];

  currentReply: any;
  resetTime = false;
  resetSave = false;
  locations: string[] = [];

  constructor(
    private ToastService: ToastService,
    private DataService: DataService,
    private dialog: MatDialog
  ) {
    // Generate hours from 12:00 AM to 11:00 PM
    for (let i = 7; i < 12; i++) {
      this.hours.push(`${i === 0 ? 12 : i}:00 AM`);
      this.hours.push(`${i === 0 ? 12 : i}:15 AM`);
      this.hours.push(`${i === 0 ? 12 : i}:30 AM`);
      this.hours.push(`${i === 0 ? 12 : i}:45 AM`);
    }
    for (let i = 12; i < 21; i++) {
      this.hours.push(`${i === 12 ? 12 : i - 12}:00 PM`);
      this.hours.push(`${i === 12 ? 12 : i - 12}:15 PM`);
      this.hours.push(`${i === 12 ? 12 : i - 12}:30 PM`);
      this.hours.push(`${i === 12 ? 12 : i - 12}:45 PM`);
    }
    this.hours.push(`9:00 PM`);
  }
  ngOnInit(): void {
    this.DataService.currentAppointment$.subscribe((res) => {
      if (res.message == 'Replies Saved' && this.resetSave) {
        this.ToastService.showSuccess('Route Saved Successfully!');
        this.resetSave = false;
      }

      if (res.message == 'Replies Saved' && this.resetTime)
        this.ToastService.showSuccess('Appointments Reset Successfully!');

      if (res.message == 'Replies sent')
        this.ToastService.showSuccess('Replies sent Successfully!');

      this.resetTime = false;
    });

    this.locations = this.getDistinctServiceAreas(this.clients);
    this.initializeCounters();
  }

  filterByTime(data: Location[], time: string): any[] {
    let matchingReplies: any[] = [];
    let repliesWithMatchingTime: any[];

    if (time == '' && data.length) {
      return (repliesWithMatchingTime = data.filter(
        (reply) => reply['time'] == null
      ));
    }
    if (data)
      data.forEach((location) => {
        Object.values(location).forEach((area) => {
          if (area && area.replies.length) {
            repliesWithMatchingTime = area.replies.filter(
              (reply) => reply.time === time
            );

            matchingReplies = matchingReplies.concat(repliesWithMatchingTime);
          }
        });
      });

    return matchingReplies;
  }

  filterBySid(data: Location[], sid: string): Reply[] {
    let matchingReplies: Reply[] = [];

    data.forEach((location) => {
      Object.values(location).forEach((area) => {
        if (area.replies) {
          const repliesWithMatchingTime = area.replies.filter(
            (reply: { sid: string }) => reply.sid === sid
          );
          matchingReplies = matchingReplies.concat(repliesWithMatchingTime);
        }
      });
    });

    return matchingReplies;
  }

  getClientName(phoneNumber: string) {
    phoneNumber = phoneNumber.substring(2);
    let client = this.clients.find((c) => c.contactMethod == phoneNumber);

    return client.petName;
  }

  objectKeys = Object.keys;

  onDragStart(reply: any) {
    this.currentReply = reply;
  }

  onDrop(event: any, time: any) {
    event.preventDefault();

    if (!this.currentReply) return;

    let findNumber = this.currentReply.from.toString().substring(2);

    let reply = this.filterBySid(this.replies, this.currentReply.sid)[0];
    let client = this.clients.find(
      (client) => client.contactMethod == findNumber
    );
    if (reply != undefined && client.petParentName) {
      reply.time = time;
      reply.petParentName = client.petParentName;
    }
    this.currentReply = null;
  }

  onDragOver(event: any) {
    event.preventDefault();
  }

  saveReplies(enableToast: boolean) {
    this.DataService.saveTimes(this.appId, this.replies);
    this.resetSave = enableToast;
  }

  resetAppTimes() {
    // this.replies = this.replies.map((location) => {
    //   let local = this.objectKeys(location)[0];
    //   console.log({ r: location[local].replies });
    //   if (location[local].replies && location[local].replies.length)
    //     return location[local].replies.forEach(
    //       (reply: { time: string | null }) => {
    //         reply.time = null;
    //       }
    //     );
    //     return location;
    //   });

    this.replies = this.replies.map((location) => {
      // Assuming location is an object whose values are the areas
      Object.values(location).forEach((area: any) => {
        area.increment = 0.5;
        area.replies.forEach((reply: any) => (reply.time = null));
      });
      return location;
    });
    this.initializeCounters();
    this.resetTime = true;
    this.saveReplies(false);
  }

  async openPanel() {
    this.saveReplies(false);

    const dialogRef = this.dialog.open(PanelService, {
      data: {
        title: 'Send Replies to Clients',
        confirmMsg: `Are you sure you want to out all replies? This will send a reply message to each of the replies currently scheduled. 
        <br><br>The time for each reply will be the start for the range. If a reply was scheduled at 8:00 AM, then 8:00 AM - 9:00 AM will be used in the message.`,
        subMsg: 'This action cannot be undone.',
        btnTitle: 'Confirm',
      },
    });

    const result = await lastValueFrom(dialogRef.afterClosed());

    if (result) {
      this.DataService.sendReplies(this.appId);
    }
  }

  getDistinctServiceAreas(objects: any[]): string[] {
    if (!objects || !objects.length) return [];
    const serviceAreaSet = new Set<string>();

    for (const obj of objects) {
      serviceAreaSet.add(obj.serviceArea);
    }

    return Array.from(serviceAreaSet);
  }

  initializeCounters() {
    this.replies.forEach((reply) => {
      this.objectKeys(reply).forEach((key) => {
        const incrementValue = parseFloat(reply[key].increment);
        this.counters[key] = isNaN(incrementValue) ? 0.5 : incrementValue;
      });
    });
  }

  incrementCounter(key: string) {
    if (this.counters[key] !== undefined) {
      this.counters[key] += 0.5;
      this.updateIncrementInLocations(key);
    }
  }

  decrementCounter(key: string) {
    if (this.counters[key] !== undefined && this.counters[key] > 0.5) {
      this.counters[key] -= 0.5;
      this.updateIncrementInLocations(key);
    }
  }

  updateIncrementInLocations(key: string) {
    this.replies.forEach((reply) => {
      if (reply[key]) {
        reply[key].increment = this.counters[key].toString();
      }
    });
  }

  getLocationInitials(input: string): string {
    // Split the string by spaces to get the words
    const words = input.split(' ');

    // Map over the words array and get the first letter of each word
    const initials = words.map((word) => word.charAt(0)).join('');

    return initials;
  }
}
