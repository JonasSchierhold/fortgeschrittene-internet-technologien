import { Component, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
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
import { LocationMapComponent } from '../location-map/location-map.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatSnackBarModule,
    MatIconModule,
    LocationMapComponent,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.sass',
})
export class RegisterComponent {
  registerForm: FormGroup;
  hidePassword = true;
  
  // Mathematische Aufgabe für CAPTCHA
  mathNumber1: number;
  mathNumber2: number;
  correctAnswer: number;

  constructor(
    private readonly fb: FormBuilder,
    private readonly userService: UserService,
    private readonly geoService: GeoService,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar,
  ) {
    // Generiere zwei Zufallszahlen <= 99
    this.mathNumber1 = Math.floor(Math.random() * 100);
    this.mathNumber2 = Math.floor(Math.random() * 100);
    this.correctAnswer = this.mathNumber1 + this.mathNumber2;
    
    this.registerForm = this.fb.group({
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
      mathAnswer: ['', [Validators.required, this.mathAnswerValidator.bind(this)]],
    });

    // Füge den Passwort-Match-Validator zum Bestätigungsfeld hinzu
    this.registerForm.get('passwortConfirm')?.addValidators(this.confirmPasswordValidator.bind(this));

    // Aktualisiere die Validierung wenn das Passwort sich ändert
    this.registerForm.get('passwort')?.valueChanges.subscribe(() => {
      this.registerForm.get('passwortConfirm')?.updateValueAndValidity();
    });
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

  private confirmPasswordValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null; // required validator handles empty
    }
    const password = this.registerForm?.get('passwort')?.value;
    return control.value === password ? null : { passwordMismatch: true };
  }

  private mathAnswerValidator(control: AbstractControl): ValidationErrors | null {
    const userAnswer = control.value;
    if (userAnswer === null || userAnswer === '') {
      return null; // required validator handles this
    }
    const answer = parseInt(userAnswer, 10);
    return answer === this.correctAnswer ? null : { incorrectAnswer: true };
  }
}
