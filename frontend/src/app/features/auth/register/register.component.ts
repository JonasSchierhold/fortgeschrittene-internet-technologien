import { Component } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Observable, map, catchError, of, debounceTime, switchMap, first } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { UserService, GeoService } from '../../../core/services';
import { User } from '../../../core/models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatSnackBarModule,
    MatIconModule,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.sass',
})
export class RegisterComponent {
  registerForm: FormGroup;
  hidePassword = true;

  constructor(
    private readonly fb: FormBuilder,
    private readonly userService: UserService,
    private readonly geoService: GeoService,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar,
  ) {
    this.registerForm = this.fb.group(
      {
        loginName: [
          '',
          [Validators.required, Validators.minLength(3)],
          [this.loginNameValidator.bind(this)],
        ],
        passwort: ['', [Validators.required, Validators.minLength(4)]],
        passwortConfirm: ['', [Validators.required]],
        vorname: ['', Validators.required],
        nachname: ['', Validators.required],
        strasse: ['', Validators.required],
        plz: ['', [Validators.required, Validators.pattern(/^\d{4,5}$/)]],
        ort: ['', Validators.required],
        land: ['Deutschland', Validators.required],
        telefon: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
      },
      { validators: this.passwordMatchValidator },
    );
  }

  onPlzBlur(): void {
    const plz = this.registerForm.get('plz')?.value;
    if (plz && plz.length >= 4) {
      this.geoService.getOrtByPlz(plz).subscribe({
        next: (response) => {
          if (response.postalCodes && response.postalCodes.length > 0) {

            response.postalCodes = response.postalCodes.filter((entry) => entry.countryCode === 'DE')

            this.registerForm.patchValue({ ort: response.postalCodes[0].placeName });
          }
        },
        error: () => {
          this.snackBar.open('Ort konnte nicht ermittelt werden.', 'OK', { duration: 3000 });
        },
      });
    }
  }

  onSubmit(): void {
    if (this.registerForm.invalid) return;

    const formValue = this.registerForm.value;
    const user: User = {
      loginName: formValue.loginName,
      passwort: { passwort: formValue.passwort },
      vorname: formValue.vorname,
      nachname: formValue.nachname,
      strasse: formValue.strasse,
      plz: formValue.plz,
      ort: formValue.ort,
      land: formValue.land,
      telefon: formValue.telefon,
      email: { adresse: formValue.email },
    };

    this.userService.addUser(user).subscribe({
      next: (response) => {
        if (response.ergebnis) {
          this.snackBar.open('Registrierung erfolgreich!', 'OK', { duration: 3000 });
          this.router.navigate(['/auth/login']);
        } else {
          this.snackBar.open(response.meldung || 'Registrierung fehlgeschlagen.', 'OK', {
            duration: 5000,
          });
        }
      },
      error: () => {
        this.snackBar.open('Fehler bei der Registrierung.', 'OK', { duration: 5000 });
      },
    });
  }

  private loginNameValidator(control: AbstractControl): Observable<ValidationErrors | null> {
    if (!control.value || control.value.length < 3) {
      return of(null);
    }
    return of(control.value).pipe(
      debounceTime(400),
      switchMap((value) => this.userService.checkLoginName(value)),
      map((response) => (response.ergebnis ? null : { loginNameTaken: true })),
      catchError(() => of(null)),
      first(),
    );
  }

  private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('passwort')?.value;
    const confirm = group.get('passwortConfirm')?.value;
    return password === confirm ? null : { passwordMismatch: true };
  }
}
