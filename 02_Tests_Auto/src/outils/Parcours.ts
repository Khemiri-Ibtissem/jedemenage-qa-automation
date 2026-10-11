import { type Page, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage, type Role } from '../pages/RegisterPage';
import { ClientDashboardPage } from '../pages/ClientDashboardPage';
import { NouvelleDemandePage } from '../pages/NouvelleDemandePage';
import { DetailDemandePage } from '../pages/DetailDemandePage';
import { OffresClientPage } from '../pages/OffresClientPage';
import { SuiviPage } from '../pages/SuiviPage';
import { demenageur as demenageurSeed, nouveauCompte, unique, type Compte } from '../data/comptes';
import { dansNJours, objets } from '../data/valeurs';

export type Demande = { id: number; depart: string; arrivee: string };
export type Etat = 'pending' | 'avec offre' | 'booked' | 'in-transit' | 'completed';

/**
 * Raccourcis pour PRÉPARER les données d'un test, en passant par l'application elle-même
 * (mêmes écrans qu'un vrai utilisateur). Les vérifications du test se font ensuite dans le test.
 *
 * Exemple : const { client, demande } = await parcours.demandeDansEtat('booked');
 *   → un nouveau client a publié une demande, le déménageur a fait une offre, le client l'a acceptée.
 */
export class Parcours {
  constructor(private readonly page: Page) {}

  /** Se déconnecte (cookies effacés), puis se connecte avec ce compte. */
  async connecter(compte: Compte): Promise<void> {
    await this.page.context().clearCookies();
    const login = new LoginPage(this.page);
    await login.ouvrir();
    await login.seConnecter(compte.email, compte.motDePasse);
    await this.page.waitForURL(/\/(client|mover|admin)\/dashboard/);
  }

  /** Inscrit un nouveau compte (client ou déménageur). Il reste connecté à la fin. */
  async inscrire(role: Role = 'client'): Promise<Compte> {
    const compte = nouveauCompte(role);
    await this.page.context().clearCookies();
    const register = new RegisterPage(this.page);
    await register.ouvrir();
    await register.inscrire({ ...compte, role });
    await this.page.waitForURL(new RegExp(`/${role}/dashboard`));
    return compte;
  }

  /** Le client CONNECTÉ publie une demande. Le lieu de départ est unique → on la retrouve facilement. */
  async creerDemande(objetsAjoutes: string[] = [objets.moyenneBoite.nom, objets.frigo.nom]): Promise<Demande> {
    const id = unique();
    const depart = `Paris QA-${id}`;
    const arrivee = `Nice QA-${id}`;
    const formulaire = new NouvelleDemandePage(this.page);
    await formulaire.ouvrir();
    await formulaire.publier({ depart, arrivee, date: dansNJours(10), objets: objetsAjoutes });
    await this.page.waitForURL(/\/client\/dashboard/);
    const tableau = new ClientDashboardPage(this.page);
    return { id: await tableau.idDemande(depart), depart, arrivee };
  }

  /** Un déménageur se connecte et propose un prix pour la demande. */
  async faireOffre(demande: Demande, prix = '850', compte: Compte = demenageurSeed): Promise<void> {
    await this.connecter(compte);
    const detail = new DetailDemandePage(this.page);
    await detail.ouvrir(demande.id);
    await detail.proposerPrix(prix);
    await this.page.waitForURL(/\/mover\/dashboard/);
  }

  /** Le client se connecte et accepte l'offre du déménageur (OK dans la fenêtre de confirmation). */
  async accepterOffre(client: Compte, demande: Demande, compteDemenageur: Compte = demenageurSeed): Promise<void> {
    await this.connecter(client);
    const offres = new OffresClientPage(this.page);
    await offres.ouvrir(demande.id);
    await offres.accepter(compteDemenageur.nom);
    await this.page.waitForURL(/\/client\/dashboard/);
  }

  /** Le déménageur choisi se connecte et envoie une position GPS (→ statut in-transit). */
  async envoyerPositionGps(demande: Demande, compteDemenageur: Compte = demenageurSeed): Promise<void> {
    await this.connecter(compteDemenageur);
    const suivi = new SuiviPage(this.page);
    await suivi.ouvrir(demande.id);
    await suivi.simulerEtapeGps();
  }

  /** Le client se connecte et clique sur « Mark as Completed ». */
  async terminer(client: Compte, demande: Demande): Promise<void> {
    await this.connecter(client);
    const tableau = new ClientDashboardPage(this.page);
    await tableau.ouvrir();
    await tableau.boutonTerminer(demande.depart).click();
    await expect(tableau.statut(demande.depart)).toHaveText('completed');
  }

  /**
   * Prépare une demande dans l'état voulu, pour un NOUVEAU client.
   * À la fin, c'est le CLIENT qui est connecté.
   */
  async demandeDansEtat(etat: Etat): Promise<{ client: Compte; demande: Demande }> {
    const client = await this.inscrire('client');
    const demande = await this.creerDemande();
    if (etat === 'pending') return { client, demande };

    await this.faireOffre(demande);
    if (etat === 'avec offre') {
      await this.connecter(client);
      return { client, demande };
    }

    await this.accepterOffre(client, demande);
    if (etat === 'booked') return { client, demande };

    await this.envoyerPositionGps(demande);
    if (etat === 'in-transit') {
      await this.connecter(client);
      return { client, demande };
    }

    await this.terminer(client, demande);
    return { client, demande };
  }
}
