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
import { AppointmentClientListComponent } from '../appointment-client-list/appointment-client-list.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { SchedulerEditorComponent } from '../scheduler-editor/scheduler-editor.component';
import {
  CdkDragDrop,
  moveItemInArray,
  CdkDrag,
  CdkDropList,
  CdkDragPlaceholder,
} from '@angular/cdk/drag-drop';

interface Reply {
  defaultTime: boolean;
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
    AppointmentClientListComponent,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
    SchedulerEditorComponent,
    CdkDropList,
    CdkDrag,
    CdkDragPlaceholder,
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

  currentReply: any;
  resetTime = false;
  resetSave = false;
  locations: string[] = [];
  appointment: any;
  panelType = '';
  petsWithLocations: any;
  hoveredTime: string | null = null;
  firstActiveCard: number | null = null;
  secondActiveCard: number | null = null;
  hourToSwitch: string | null = null;

  constructor(
    private ToastService: ToastService,
    private DataService: DataService,
    private dialog: MatDialog
  ) {
    // Generate hours from 12:00 AM to 11:00 PM
    for (let i = 8; i < 12; i++) {
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
    this.DataService.petsWithLocation$.subscribe((response) => {
      if (response.data && response.data.allClients)
        this.petsWithLocations = response.data.allClients;
    });
    this.DataService.routes$.subscribe((response) => {
      if (response.message == 'Route Updated Successfully') {
        let routeData = response.data.find(
          (r: { _id: any }) => r._id == this.appointment.app.route._id
        );
        this.appointment.app.route.serviceAreas = routeData.serviceAreas;
        routeData.serviceAreas.forEach(
          (area: { name: string; increment: number }) => {
            this.counters[area.name] = area.increment;
          }
        );
      }
    });
    this.DataService.currentAppointment$.subscribe((res) => {
      if (res.data) {
        this.appointment = res.data;
      }
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

  filterByTime(data: Location[], time: string | null): any[] {
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

  filterAndRemoveByTime(time: string | null): any[] {
    let matchingReplies: any[] = [];
    let repliesWithMatchingTime: any[];

    if (time == '' && this.replies.length) {
      return (repliesWithMatchingTime = this.replies.filter(
        (reply) => reply['time'] == null
      ));
    }

    this.replies.forEach((location) => {
      Object.values(location).forEach((area: any) => {
        if (area && area.replies.length) {
          const [repliesWithMatchingTime, remainingReplies] =
            area.replies.reduce(
              (
                acc: { time: string | null }[][],
                reply: { time: string | null }
              ) => {
                if (reply.time === time) {
                  acc[0].push(reply);
                } else {
                  acc[1].push(reply);
                }
                return acc;
              },
              [[], []] as [{ time: string | null }[], { time: string | null }[]]
            );

          area.replies = remainingReplies;
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

  drop(event: CdkDragDrop<any[]>) {
    let orgTime = event.item.data.time;

    if (this.hoveredTime == orgTime) {
      console.log({ event });
      let data = this.filterAndRemoveByTime(this.hoveredTime);
      moveItemInArray(data, event.previousIndex, event.currentIndex);

      data.forEach((d) => {
        // console.log({ s: d.serviceArea });
        let reply = this.replies.find((r) => {
          return this.objectKeys(r) == d.serviceArea;
        });
        // console.log({ reply });

        reply[d.serviceArea].replies.push(d);
      });

      // console.log({ data, r: this.replies });
    } else {
      console.log({ h: this.hoveredTime });
      this.replies = this.replies.map((r) => {
        return {
          ...r,
          ...Object.fromEntries(
            Object.entries(r).map(([key, rObj]: [string, any]) => {
              return [
                key,
                {
                  ...rObj,
                  replies: rObj.replies.map(
                    (rArray: { [x: string]: any; sid: any }) => {
                      if (rArray.sid === event.item.data.sid) {
                        let route =
                          this.appointment.app.route.serviceAreas.find(
                            (a: { name: any }) =>
                              a.name == rArray['serviceArea']
                          );
                        return {
                          ...rArray,
                          time: this.hoveredTime,
                          defaultTime: this.hoveredTime == route.time,
                        };
                      } else {
                        return rArray;
                      }
                    }
                  ),
                },
              ];
            })
          ),
        };
      });
    }
  }

  onDragOver(event: any) {
    event.preventDefault();
  }

  saveReplies(enableToast: boolean) {
    this.DataService.saveTimes(this.appId, this.replies);
    this.resetSave = enableToast;
  }

  resetAppTimes() {
    // console.log({ a: this.appointment.app.route.serviceAreas });
    this.replies = this.replies.map((location) => {
      let key = Object.keys(location)[0];
      let serviceArea = this.appointment.app.route.serviceAreas.find(
        (a: { name: string }) => a.name == key
      );

      Object.values(location).forEach((area: any) => {
        area.increment = serviceArea.increment || 0.5;
        area.replies = area.replies.map((reply: any) => {
          return {
            ...reply,
            time: serviceArea.time,
            defaultTime: true,
          };
        });
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
        panelType: 'confirmPanel',
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
    return initials.substring(0, 2);
  }

  toggleActiveCard(index: number, hour: string): void {
    if (this.hourToSwitch !== hour) {
      this.firstActiveCard = index;
      this.secondActiveCard = null;
      this.hourToSwitch = hour;
      return;
    }

    if (this.firstActiveCard === index) {
      this.firstActiveCard = null;
      return;
    }
    if (this.secondActiveCard === index) {
      this.secondActiveCard = null;
      return;
    }

    if (this.firstActiveCard == null) {
      this.firstActiveCard = index;
    } else {
      this.secondActiveCard = index;
    }
  }

  switchReplies(): void {
    // Ensure both indexes are defined
    if (this.firstActiveCard == null || this.secondActiveCard == null) {
      console.error('Active card indexes must be defined');
      return;
    }

    // Get the array using filterByTime
    const arrayToModify = this.filterByTime(this.replies, this.hourToSwitch);

    // Ensure the indices are within bounds
    if (
      this.firstActiveCard < 0 ||
      this.secondActiveCard < 0 ||
      this.firstActiveCard >= arrayToModify.length ||
      this.secondActiveCard >= arrayToModify.length
    ) {
      console.error('Invalid indices for swap operation');
      return;
    }

    let data = this.filterAndRemoveByTime(this.hourToSwitch);
    console.log({ data });
    moveItemInArray(data, this.firstActiveCard, this.secondActiveCard);
    data.forEach((d) => {
      let reply = this.replies.find((r) => {
        return this.objectKeys(r) == d.serviceArea;
      });

      reply[d.serviceArea].replies.push(d);
    });

    this.hourToSwitch = null;
    this.firstActiveCard = null;
    this.secondActiveCard = null;
  }
}
