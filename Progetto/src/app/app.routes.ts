import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Prenotazioni } from './components/prenotazioni/prenotazioni';
import { Camere } from './components/camere/camere';
import { Servizi } from './components/servizi/servizi';
import { Contatti } from './components/contatti/contatti';
import { Utenti } from './components/utenti/utenti';

export const routes: Routes = [
    {
        path: '', 
        component: Home,
    },
    {
        path: 'prenotazioni', 
        component: Prenotazioni,
    },
    {
        path: 'camere', 
        component: Camere,
    },
    {
        path: 'servizi', 
        component: Servizi,
    },
    {
        path: 'contatti', 
        component: Contatti,
    },
    {
        path: 'utenti', 
        component: Utenti,
    },
];