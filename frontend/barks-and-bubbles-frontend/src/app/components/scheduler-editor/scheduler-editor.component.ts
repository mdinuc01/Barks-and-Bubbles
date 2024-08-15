import { CommonModule } from '@angular/common';
import { DataService } from './../../services/data.service';
import { Component, Input, OnInit } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-scheduler-editor',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './scheduler-editor.component.html',
  styleUrl: './scheduler-editor.component.scss',
})
export class SchedulerEditorComponent implements OnInit {
  @Input() route: any = [];
  @Input() hours: any;
  @Input() app: any;
  currentArea: any;

  constructor(private DataService: DataService) {}

  ngOnInit(): void {
    this.DataService.routes$.subscribe((response) => {
      if (response.message == 'Route Updated Successfully') {
        let routeData = response.data.find(
          (r: { _id: any }) => r._id == this.app.route._id
        );
        this.app.route.serviceAreas = routeData.serviceAreas;
      }
    });
  }

  getAppsByTime(time: string | null) {
    return this.route.serviceAreas.filter(
      (r: { time: string }) => r.time === time
    );
  }

  incrementCounter(area: any) {
    this.updateCounter(area, true);
  }

  decrementCounter(area: any) {
    this.updateCounter(area, false);
  }

  updateCounter(area: any, increment: boolean) {
    this.route.serviceAreas = this.route.serviceAreas.map(
      (a: { name: any; time: any; increment: number }) => {
        if (
          a.name == area.name &&
          a.time == area.time &&
          a.increment == area.increment &&
          a.increment <= 10 &&
          a.increment >= 0.5
        ) {
          if (increment) {
            a.increment = a.increment + 0.5;
            if (a.increment == 10.5) a.increment = 10;
          } else {
            a.increment = a.increment - 0.5;
            if (a.increment == 0) a.increment = 0.5;
          }
        }
        return a;
      }
    );
  }

  onDragStart(area: any) {
    this.currentArea = area;
  }

  onDrop(event: any, time: any) {
    event.preventDefault();

    if (!this.currentArea) return;

    this.route.serviceAreas = this.route.serviceAreas.map(
      (r: { time: any; name: any }) => {
        if (r.name == this.currentArea.name) {
          return { ...r, time };
        } else return { ...r };
      }
    );
    this.currentArea = null;
  }

  onDragOver(event: any) {
    event.preventDefault();
  }

  saveChanges() {
    this.DataService.updateRoute(this.route._id, this.route);
  }
}
