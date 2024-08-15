import { DataService } from './../../services/data.service';
import { Component, Input, signal } from '@angular/core';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import e from 'express';

@Component({
  selector: 'app-route-editor',
  standalone: true,
  imports: [
    DragDropModule,
    CommonModule,
    MatExpansionModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
  ],
  templateUrl: './route-editor.component.html',
  styleUrl: './route-editor.component.scss',
})
export class RouteEditorComponent {
  @Input() routes!: any[] | undefined;
  @Input() serviceAreas!: any[] | undefined;

  step = signal(-1);
  routeForm: FormGroup = new FormGroup({
    name: new FormControl(null, Validators.required),
    serviceAreas: new FormControl([], Validators.required),
  });
  msg = '';

  constructor(private DataService: DataService) {
    this.DataService.routes$.subscribe((routes) => {
      this.routes = routes.data;
      this.routeForm.reset();
      this.DataService.clearFormGroupErrors(this.routeForm);
    });
  }
  drop(
    event: CdkDragDrop<string[]>,
    serviceObject: { name: String; serviceAreas: [] }
  ): void {
    moveItemInArray(
      serviceObject.serviceAreas,
      event.previousIndex,
      event.currentIndex
    );
  }

  getRouteServiceAreas(areas: any) {
    let result = areas.map((a: { name: string }) => a.name);

    return result;
  }

  setStep(index: number) {
    this.step.set(index);
  }

  createRoute() {
    let name = this.routeForm.get('name')!.value;
    let serviceAreas = this.routeForm.get('serviceAreas')!.value;

    let transformedAreas = serviceAreas.map((a: any) => {
      return { name: a, time: null, increment: 0.5 };
    });
    this.DataService.createRoute(name, transformedAreas);
  }

  updateRoute(route: any) {
    const idForm = `${route.name}-editor`;
    let routeData = this.routes?.find((r) => r._id == route._id);
    const newName = document.getElementById(idForm)?.innerText;

    routeData = { ...routeData, name: newName };

    this.DataService.updateRoute(route._id, routeData);
  }

  toggleRouteNameEdit(event: Event, route: any, index: any) {
    this.setStep(index);
    const edit = route.edit == undefined ? true : !route.edit;

    event.stopPropagation();
    const idForm = `${route.name}-editor`;

    document
      .getElementById(idForm)
      ?.setAttribute('contentEditable', edit.toString());

    if (edit) {
      setTimeout(() => {
        document.getElementById(idForm)?.focus();

        let element = document.getElementById(idForm)!;

        const range = document.createRange();
        const selection = window.getSelection()!;

        range.selectNodeContents(element);
        range.collapse(false);

        selection.removeAllRanges();
        selection.addRange(range);
      }, 100);
    }

    this.routes = this.routes?.map((r) => {
      if (r.name == route.name && r.edit) r.edit = !r.edit;
      else if (r.name == route.name) r.edit = true;
      return r;
    });
  }
}
