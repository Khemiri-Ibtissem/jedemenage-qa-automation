import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Tableau de bord du client : /client/dashboard (« My Relocation Hub »)
 * Une « carte » par demande de déménagement.
 */
export class ClientDashboardPage extends BasePage {
  readonly messageAucuneDemande: Locator;
  readonly boutonPremiereDemande: Locator;
  readonly boutonNouvelleDemande: Locator;

  constructor(page: Page) {
    super(page);
    this.messageAucuneDemande = page.getByText('No move requests posted yet.');
    this.boutonPremiereDemande = page.getByRole('link', { name: 'Post My First Request' });
    this.boutonNouvelleDemande = page.getByRole('link', { name: 'Post New Relocation Request' });
  }

  async ouvrir(): Promise<void> {
    await this.goto('/client/dashboard');
    await this.titreEcran.waitFor();
  }

  /** La carte de la demande « départ → arrivée » (on retrouve la demande par son lieu de départ, unique). */
  carte(depart: string): Locator {
    return this.page
      .getByRole('heading', { level: 3, name: depart })
      .locator('xpath=ancestor::div[contains(@class, "shadow-sm")][1]');
  }

  statut(depart: string): Locator {
    // Le badge à droite : pending, booked, in-transit ou completed
    return this.carte(depart).locator('span').filter({ hasText: /^\s*(pending|booked|in-transit|completed)\s*$/ });
  }

  nombreOffres(depart: string): Locator {
    return this.carte(depart).getByText(/Offers Received/);
  }

  boutonVoirOffres(depart: string): Locator {
    return this.carte(depart).getByRole('link', { name: 'Review All Offers' });
  }

  boutonTerminer(depart: string): Locator {
    return this.carte(depart).getByRole('button', { name: 'Mark as Completed' });
  }

  boutonEvaluer(depart: string): Locator {
    return this.carte(depart).getByRole('link', { name: 'Rate Your Mover' });
  }

  boutonSuivre(depart: string): Locator {
    return this.carte(depart).getByRole('link', { name: 'Track Live Move' });
  }

  /** Numéro (id) de la demande, lu dans le lien « Review All Offers » : /client/requests/12/bids → 12. */
  async idDemande(depart: string): Promise<number> {
    const lien = await this.boutonVoirOffres(depart).getAttribute('href');
    const id = lien?.match(/requests\/(\d+)\//)?.[1];
    if (!id) throw new Error(`Impossible de lire le numéro de la demande « ${depart} » (lien : ${lien})`);
    return Number(id);
  }
}
