import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sort',
  standalone: true,
})
export class SortPipe implements PipeTransform {
  transform(
    value: any[],
    property: string,
    isAscending: boolean = true
  ): any[] {
    if (!value || !Array.isArray(value)) {
      return value;
    }
    return value.sort((a, b) => {
      const propA = a[property].toLowerCase();
      const propB = b[property].toLowerCase();
      if (propA < propB) {
        return isAscending ? -1 : 1;
      }
      if (propA > propB) {
        return isAscending ? 1 : -1;
      }
      return 0;
    });
  }
}
