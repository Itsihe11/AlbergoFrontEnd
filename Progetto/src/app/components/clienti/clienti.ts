import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PrenotazioniService } from '../../services/prenotazioni-service';
import { Prenotazione, Ospite } from '../../interface/prenotazione';

@Component({
  selector: 'app-clienti',
  imports: [FormsModule],
  templateUrl: './clienti.html',
  styleUrl: './clienti.css',
})
export class Clienti implements OnInit {

  private prenotazioniService = inject(PrenotazioniService);

  prenotazioni: Prenotazione[] = [];
  caricamento = true;
  errore: string | null = null;
  messaggio: string | null = null;

  // per il form di cessione
  prenotazioneInCessione: number | null = null;
  nuovoIntestatario: Ospite = { nome: '', cognome: '', dataNascita: '' };

  ngOnInit(): void {
    this.caricaPrenotazioni();
  }

  caricaPrenotazioni(): void {
    this.caricamento = true;
    this.prenotazioniService.getPrenotazioniCliente().subscribe({
      next: (dati) => {
        this.prenotazioni = dati;
        this.caricamento = false;
      },
      error: () => {
        this.errore = 'Impossibile caricare le prenotazioni.';
        this.caricamento = false;
      }
    });
  }

  annulla(id: number | undefined): void {
    if (!id) return;
    if (!confirm('Sei sicuro di voler annullare questa prenotazione? La caparra non verrà rimborsata.')) {
      return;
    }

    this.prenotazioniService.annullaPrenotazione(id).subscribe({
      next: () => {
        this.messaggio = 'Prenotazione annullata.';
        this.caricaPrenotazioni();
      },
      error: () => {
        this.errore = 'Errore durante l\'annullamento.';
      }
    });
  }

  apriCessione(id: number | undefined): void {
    if (!id) return;
    this.prenotazioneInCessione = id;
    this.nuovoIntestatario = { nome: '', cognome: '', dataNascita: '' };
  }

  annullaCessione(): void {
    this.prenotazioneInCessione = null;
  }

  confermaCessione(): void {
    if (!this.prenotazioneInCessione) return;
    if (!this.nuovoIntestatario.nome || !this.nuovoIntestatario.cognome || !this.nuovoIntestatario.dataNascita) {
      this.errore = 'Compila tutti i dati del nuovo intestatario.';
      return;
    }

    this.prenotazioniService.cedePrenotazione(this.prenotazioneInCessione, this.nuovoIntestatario).subscribe({
      next: () => {
        this.messaggio = 'Prenotazione ceduta con successo.';
        this.prenotazioneInCessione = null;
        this.caricaPrenotazioni();
      },
      error: () => {
        this.errore = 'Errore durante la cessione.';
      }
    });
  }
}