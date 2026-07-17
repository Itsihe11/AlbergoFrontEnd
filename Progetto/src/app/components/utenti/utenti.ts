import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth-services';

@Component({
  selector: 'app-utenti',
  imports: [FormsModule],
  templateUrl: './utenti.html',
  styleUrl: './utenti.css',
})


export class Utenti {

  authService = inject(AuthService);
  private router = inject(Router);
  
  email = '';
  password = '';
  errore: string | null = null;

  login(): void {
    this.errore = null;

    this.authService.login(this.email, this.password).subscribe({
      next: (res) => {
        this.authService.token = res.token;
        this.authService.ruolo = res.ruolo;

        if (res.ruolo === 'CLIENTE') {
          this.router.navigate(['/clienti']);
        } else if (res.ruolo === 'ADMIN') {
          this.router.navigate(['/admin']);
        }
      },
      error: () => {
        this.errore = 'Credenziali non valide. Riprova.';
      }
    });
  }
}
