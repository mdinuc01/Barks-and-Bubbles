import { DataService } from './../../services/data.service';
import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { StorageService } from '../../services/storage.service';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { BehaviorSubject, Observable } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  enterKeyClicked($event: Event) {
    throw new Error('Method not implemented.');
  }
  isLoggedIn = false;
  isLoginFailed = false;
  errorMessage = '';
  roles: string[] = [];
  loginForm!: FormGroup;
  hide = true;
  private loaderSubject: BehaviorSubject<any> = new BehaviorSubject<any>([]);
  loader$: Observable<any> = this.loaderSubject.asObservable();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private storageService: StorageService,
    private dataService: DataService
  ) {}

  ngOnInit(): void {
    this.loaderSubject.next(true);
    if (this.storageService.isLoggedIn()) {
      this.isLoggedIn = true;
      this.roles = this.storageService.getUser().roles;
    }

    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });

    this.loaderSubject.next(false);
  }

  togglePassword(event: Event): void {
    event.preventDefault();
    this.hide = !this.hide;
  }

  login(): void {
    const { username, password } = this.loginForm.value;
    this.loaderSubject.next(true);

    this.authService.login(username, password).subscribe({
      next: async (data) => {
        await this.storageService.saveUser(data);

        this.isLoginFailed = false;
        this.isLoggedIn = true;

        this.dataService.goHome();
        setTimeout(() => {
          this.reloadPage();
          this.loaderSubject.next(false);
        }, 200);
      },
      error: (err) => {
        this.errorMessage = err.error.message;
        this.isLoginFailed = true;
      },
    });
  }

  reloadPage(): void {
    window.location.reload();
  }
}
