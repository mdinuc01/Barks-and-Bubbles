import { DataService } from './data.service';
import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { Observable } from 'rxjs';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private storageService: StorageService,
    private router: Router,
    private DataService: DataService
  ) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    if (this.storageService.isLoggedIn()) {
      return true;
    } else {
      // this.DataService.showLoader();
      // this.DataService.goToLogin();
      // this.router.navigate(['/login']);
      return false;
    }
  }
}
