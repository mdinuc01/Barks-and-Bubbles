import { DataService } from './../../services/data.service';
import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-service-area-editor',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    DragDropModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './service-area-editor.component.html',
  styleUrl: './service-area-editor.component.scss',
})
export class ServiceAreaEditorComponent implements OnInit {
  @Input() serviceAreas: {
    length: any;
    name: string;
    clients: any[];
  }[] = [];
  selectedServiceArea: { name: string; clients: any[] } | null = null;

  constructor(private readonly DataService: DataService) {}

  async ngOnInit() {
    await this.DataService.getAllPets();

    if (this.serviceAreas.length) {
      this.serviceAreas = this.serviceAreas.sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    }
  }

  selectArea(area: any) {
    if (
      this.selectedServiceArea &&
      this.selectedServiceArea.name == area.name
    ) {
      this.selectedServiceArea = null;
    } else {
      this.selectedServiceArea = area;
    }

    this.serviceAreas.forEach((area) => {
      area.clients.sort((a: { order: number }, b: { order: number }) => {
        if (a.order < b.order) {
          return -1;
        } else if (a.order > b.order) {
          return 1;
        }
        return 0;
      });
    });
  }

  drop(event: CdkDragDrop<string[]>): void {
    if (this.selectedServiceArea && this.selectedServiceArea.clients)
      moveItemInArray(
        this.selectedServiceArea.clients,
        event.previousIndex,
        event.currentIndex
      );
  }

  saveClients() {
    let orderIndex = 0;

    const clients = this.selectedServiceArea!.clients.map((client) => {
      const newOrder = orderIndex;
      orderIndex++;

      return {
        ...client,
        order: newOrder,
      };
    });

    this.selectedServiceArea = {
      ...this.selectedServiceArea,
      name: this.selectedServiceArea!.name,
      clients,
    };

    this.DataService.updateClientOrder(this.selectedServiceArea);
  }
}
