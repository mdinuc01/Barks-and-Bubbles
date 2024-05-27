import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'appointmentFilter',
  standalone: true,
})
export class AppointmentFilterPipe implements PipeTransform {
  transform(items: any[], showActive: boolean): any[] {
    if (!items) return [];
    if (showActive === undefined) return items; // If no filter is applied, return all items

    return items.filter((item) => item.active === !showActive);
  }
}
