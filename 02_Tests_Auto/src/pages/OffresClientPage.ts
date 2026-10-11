import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Offres reçues par le client pour une demande : /client/requests/{id}/bids (« Review Offers »)
 */
export class OffresClientPage extends BasePage {
  readonly messageAucuneOffre: Locator;
  readonly lienRetour: Locator;

  constructor(page: Page) {
    super(page);
    this.messageAucuneOffre = page.getByText('No offers received yet.');
    this.lienRetour = page.getByRole('link', { name: /Back to Dashboard/ });
  }

  async ouvrir(idDemande: number): Promise<number | undefined> {
    return this.goto(`/client/requests/${idDemande}/bids`);
  }

  /** La carte d'une offre, retrouvée par le nom du déménageur. */
  carteOffre(nomDemenageur: string): Locator {
    return this.page
      .getByRole('heading', { level: 3, name: nomDemenageur, exact: true })
      .locator('xpath=ancestor::div[contains(@class, "shadow-sm")][1]');
  }

  prix(nomDemenageur: string): Locator {
    return this.carteOffre(nomDemenageur).getByText(/^\s*\$[\d.]+\s*$/);
  }

  boutonAccepter(nomDemenageur: string): Locator {
    return this.carteOffre(nomDemenageur).getByRole('button', { name: 'Accept Offer' });
  }

  /**
   * Clique sur « Accept Offer ». Une fenêtre confirm() s'ouvre :
   * confirmer = true → OK (réservation), false → Annuler (rien ne doit changer).
   */
  async accepter(nomDemenageur: string, confirmer = true): Promise<void> {
    this.reponseAuxConfirmations = confirmer;
    await this.boutonAccepter(nomDemenageur).click();
  }
}
