import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-contatti',
  imports: [RouterLink],
  templateUrl: './contatti.html',
  styleUrl: './contatti.css',
})
export class Contatti {
  indirizzo = 'Via del Mare 12, 00100 Roma';
  telefono = '+39 06 1234567';
  email = 'info@hotelsfigati.it';
}