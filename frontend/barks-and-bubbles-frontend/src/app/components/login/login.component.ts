import { ToastService } from './../../services/toast.service';
import { DataService } from './../../services/data.service';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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
export class LoginComponent implements OnInit {
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
    private dataService: DataService,
    private ToastService: ToastService // private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });

    if (this.storageService.isLoggedIn()) {
      this.isLoggedIn = true;
      this.roles = this.storageService.getUser().roles;
    }
  }

  togglePassword(event: Event): void {
    event.preventDefault();
    this.hide = !this.hide;
  }

  login(): void {
    const { username, password } = this.loginForm.value;

    this.authService.login(username, password).subscribe({
      next: async (data) => {
        await this.storageService.saveUser(data);

        this.isLoginFailed = false;
        this.isLoggedIn = true;

        this.dataService.goHome();
        setTimeout(async () => {
          this.reloadPage();
          this.loaderSubject.next(false);
        }, 1);
      },
      error: (err) => {
        this.errorMessage = err.error.message;
        this.isLoginFailed = true;
        this.dataService.hideLoader();
        this.ToastService.showSuccess(this.errorMessage);
      },
    });
  }

  reloadPage(): void {
    window.location.reload();
  }
}
