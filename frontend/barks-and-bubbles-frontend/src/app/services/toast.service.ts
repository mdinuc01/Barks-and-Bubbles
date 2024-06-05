// toast.service.ts
import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private alertIntervals: { [_id: number]: NodeJS.Timeout } = {};
  constructor(private snackBar: MatSnackBar) {}

  private getSnackbarConfig(): MatSnackBarConfig {
    return {
      duration: 3000, // Set the duration in milliseconds
      horizontalPosition: 'end', // Position the snackbar at the end (right)
      verticalPosition: 'bottom', // Position the snackbar at the bottom
    };
  }

  showSuccess(message: string): void {
    const config = this.getSnackbarConfig();
    this.snackBar.open(message, 'Close', {
      ...config,
    });
  }

  // showError(message: string): void {
  //   const config = this.getSnackbarConfig();
  //   this.snackBar.open(message, 'Close', {
  //     ...config,
  //   });
  // }

  // showInfo(message: string): void {
  //   const config = this.getSnackbarConfig();
  //   this.snackBar.open(message, 'Close', {
  //     ...config,
  //   });
  // }

  // showWarning(message: string): void {
  //   const config = this.getSnackbarConfig();
  //   this.snackBar.open(message, 'Close', {
  //     ...config,
  //   });
  // }

  setEventInterval(eventId: number, interval: number) {
    this.alertIntervals[eventId] = setInterval(() => {
      // Emit an event, or perform any action to notify about the event
      console.log(`Event with ID ${eventId} is starting now!`);
    }, interval);
  }

  clearEventInterval(eventId: number) {
    if (this.alertIntervals[eventId]) {
      clearInterval(this.alertIntervals[eventId]);
      delete this.alertIntervals[eventId];
    }
  }
}
