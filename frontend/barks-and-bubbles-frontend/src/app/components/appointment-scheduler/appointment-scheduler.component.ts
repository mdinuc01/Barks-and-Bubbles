import { PanelService } from './../../services/panel service/panel-service';
import { DataService } from './../../services/data.service';
import { ToastService } from './../../services/toast.service';
import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
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
} from '@angular/cdk/drag-drop';

interface Reply {
  defaultTime: boolean;
  time: string | null;
  id: string;
  petName: string;
  petParentName: string;
  serviceArea: string;
  contactMethod: string;
  clientReplies: [];
  addedClient: boolean;
}

interface Location {
  [key: string]: {
    replies: Reply[];
    location: String;
    increment: String;
  };
}

interface ServiceAreaCounter {
  name: string;
  increment: number;
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
    MatMenuModule,
  ],
  templateUrl: './appointment-scheduler.component.html',
  styleUrl: './appointment-scheduler.component.scss',
})
export class AppointmentSchedulerComponent implements OnInit {
  hours: string[] = [];
  @Input() clients!: any[];
  @Input() scheduler!: any[];
  @Input() appId!: string;
  counters: ServiceAreaCounter[] = [];

  currentReply: any;
  resetTime = false;
  resetSave = false;
  locations: string[] = [];
  appointment: any;
  panelType = '';
  petsWithLocations: any;
  hoveredTime: string | null = null;
  firstActiveCard: any;
  secondActiveCard: any;
  activeReplies: any;
  hourToSwitch: string | null = null;
  loadingReplies = false;
  selectedClient: any;

  constructor(
    private readonly ToastService: ToastService,
    protected readonly DataService: DataService,
    private readonly dialog: MatDialog
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
    this.DataService.replyLoader$.subscribe((res) => {
      this.loadingReplies = res;
    });

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
            let index = this.counters.findIndex((a) => area.name == a.name);
            this.counters[index].increment = area.increment;
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
  }

  filterByTime(data: any[], time: string | null): any[] {
    let matchingReplies: any[] = [];
    let repliesWithMatchingTime: any[];

    if (time == '' && data && data.length) {
      repliesWithMatchingTime = data.filter(
        (reply) => reply['time'] == null && !reply.delete
      );
      return repliesWithMatchingTime;
    }

    if (data)
      data.forEach((location) => {
        if (location && location.replies && location.replies.length) {
          repliesWithMatchingTime = location.replies.filter(
            (reply: { delete: boolean; time: string | null }) =>
              reply.time === time && !reply.delete
          );

          matchingReplies = matchingReplies.concat(repliesWithMatchingTime);
        }
      });

    return matchingReplies;
  }

  filterAndRemoveByTime(time: string | null): any[] {
    let matchingReplies: any[] = [];
    let repliesWithMatchingTime: any[];

    if (time == '' && this.scheduler.length) {
      repliesWithMatchingTime = this.scheduler.filter((area) => {
        if (area.name == this.activeReplies.name) {
          return area.replies.filter(
            (reply: { time: string }) => reply.time == time
          );
        }
      });
      return repliesWithMatchingTime;
    }

    this.scheduler.forEach((reply) => {
      if (reply.name == this.activeReplies.name) {
        const [repliesWithMatchingTime, remainingReplies] =
          reply.replies.reduce(
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

        reply.replies = remainingReplies;
        matchingReplies = matchingReplies.concat(repliesWithMatchingTime);
      }
    });

    return matchingReplies;
  }

  getClientName(phoneNumber: string) {
    phoneNumber = phoneNumber.substring(2);
    let client = this.clients.find((c) => c.contactMethod == phoneNumber);

    return client.petName;
  }

  onDragStart(reply: any) {
    this.currentReply = reply;
  }

  drop() {
    this.scheduler = this.scheduler.map((location) => {
      if (location.name == this.currentReply.serviceArea) {
        const areaObj = this.appointment.app.route.serviceAreas.find(
          (a: { name: any }) => a.name == location.name
        );
        location.replies = location.replies.map(
          (a: { defaultTime: boolean; id: any; time: string | null }) => {
            if (a.id == this.currentReply.id) {
              a.time = this.hoveredTime;
              a.defaultTime =
                areaObj && areaObj.time
                  ? areaObj.time == this.hoveredTime
                  : true;
            }
            return a;
          }
        );
      }
      return location;
    });
  }

  onDragOver(event: any) {
    event.preventDefault();
  }

  saveReplies(enableToast: boolean) {
    this.DataService.saveTimes(this.appId, this.scheduler);
    this.resetSave = enableToast;
  }

  resetAppTimes() {
    this.scheduler = this.scheduler.map((reply) => {
      let serviceArea = this.appointment.app.route.serviceAreas.find(
        (a: { name: string }) => a.name == reply.name
      );

      const newReplies = reply.replies.map((r: any) => {
        return {
          ...r,
          time: serviceArea && serviceArea.time ? serviceArea.time : null,
          defaultTime: !!serviceArea,
        };
      });
      return {
        ...reply,
        replies: newReplies,
        increment: serviceArea ? serviceArea.increment : reply.increment,
      };
    });

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

  incrementCounter(serviceArea: string): void {
    const index = this.scheduler.findIndex((sa) => sa.name === serviceArea);
    const replyObj = this.scheduler[index];
    let increment = replyObj.increment;

    if (index >= 0 && increment <= 9.5) {
      this.scheduler[index].increment = increment + 0.5;
    }
  }

  decrementCounter(serviceArea: string): void {
    const index = this.scheduler.findIndex((sa) => sa.name === serviceArea);

    const replyObj = this.scheduler[index];
    let increment = replyObj.increment;

    if (index >= 0 && increment >= 1) {
      this.scheduler[index].increment = increment - 0.5;
    }
  }

  getLocationInitials(input: string): string {
    if (!input) return '';
    const words = input.replaceAll('(', '').split(' ');

    const initials = words.map((word) => word.charAt(0)).join('');
    return initials.substring(0, 2);
  }

  toggleActiveCard(client: any, screenIndex: number, hour: string): void {
    let index = 0;
    this.scheduler.forEach((area) => {
      if (area.name == client.serviceArea) {
        index = area.replies.findIndex(
          (reply: { id: any }) => reply.id == client.id
        );
      }
    });

    if (
      (this.firstActiveCard && this.hourToSwitch !== hour) ||
      (this.activeReplies && this.activeReplies.name !== client.serviceArea)
    ) {
      this.firstActiveCard = {
        index,
        screenIndex,
      };
      this.secondActiveCard = null;
      this.hourToSwitch = hour;
      this.activeReplies = this.scheduler.find((r) => {
        const clientFound = r.replies.some((a: { id: any }) => {
          return a.id == client.id;
        });
        if (clientFound) return r;
      });
      return;
    }

    if (
      this.firstActiveCard &&
      this.firstActiveCard.screenIndex === screenIndex
    ) {
      this.firstActiveCard = null;
      return;
    }
    if (
      this.secondActiveCard &&
      this.secondActiveCard.screenIndex === screenIndex
    ) {
      this.secondActiveCard = null;
      return;
    }

    if (this.firstActiveCard == null) {
      this.firstActiveCard = {
        index,
        screenIndex,
      };
    } else {
      this.secondActiveCard = {
        index,
        screenIndex,
      };
    }

    this.activeReplies = this.scheduler.find((r) => {
      const clientFound = r.replies.some((a: { id: any }) => {
        return a.id == client.id;
      });
      if (clientFound) return r;
    });
    this.hourToSwitch = hour;
  }

  switchReplies(): void {
    if (this.firstActiveCard == null || this.secondActiveCard == null) {
      console.error('Active card indexes must be defined');
      return;
    }

    const arrayToModify = this.filterByTime(this.scheduler, this.hourToSwitch);

    if (
      this.firstActiveCard.index < 0 ||
      this.secondActiveCard.index < 0 ||
      this.firstActiveCard.index >= arrayToModify.length ||
      this.secondActiveCard.index >= arrayToModify.length
    ) {
      console.error('Invalid indices for swap operation');
      return;
    }

    let data = this.filterAndRemoveByTime(this.hourToSwitch);

    moveItemInArray(
      data,
      this.firstActiveCard.index,
      this.secondActiveCard.index
    );

    const updateIndex = this.scheduler.findIndex(
      (area) => area.name == this.activeReplies.name
    );

    this.scheduler[updateIndex] = {
      ...this.activeReplies,
      replies: data,
    };

    this.hourToSwitch = null;
    this.firstActiveCard = null;
    this.secondActiveCard = null;
  }

  loadReplies() {
    this.loadingReplies = true;

    this.DataService.loadReplies(
      this.appointment.app._id,
      this.appointment.app.messages.sentDate
    );
  }

  viewClientReplies(event: Event, client: any) {
    event.stopPropagation();
    this.selectedClient = client;
  }

  formatStatus(status: string): string {
    if (status.length === 0) {
      return status;
    }

    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  openAddReplyMenu() {
    this.panelType = 'clients';
    this.saveReplies(false);
  }

  deleteClient(client: any, event: Event) {
    event.stopPropagation();
    console.log('deleteClient()', { client });
    this.DataService.deleteReply(this.appId, client.id);
  }
}
