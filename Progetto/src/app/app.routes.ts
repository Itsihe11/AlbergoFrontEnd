import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Prenotazioni } from './components/prenotazioni/prenotazioni';
import { CamereService } from './components/camere/camere';
import { Servizi } from './components/servizi/servizi';
import { Contatti } from './components/contatti/contatti';
import { Utenti } from './components/utenti/utenti';
import { Clienti } from './components/clienti/clienti';
import { Admin } from './components/admin/admin';
import { adminGuard, clienteGuard } from './auth/auth-guard';

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
        component: CamereService,
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
    {
        path: 'clienti',
        component: Clienti,
        canActivate: [clienteGuard]
    },
    {
        path: 'admin',
        component: Admin,
        canActivate: [adminGuard]
    },
    {
        path: '**',
        redirectTo: 'utenti',
        pathMatch: 'full'
    }
];