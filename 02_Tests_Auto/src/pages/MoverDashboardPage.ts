import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Tableau de bord du déménageur : /mover/dashboard (« Mover Marketplace Hub »)
 * Liste ses offres (« My Current Offers »).
 */
export class MoverDashboardPage extends BasePage {
  readonly messageAucuneOffre: Locator;
  readonly boutonMarketplace: Locator;

  constructor(page: Page) {
    super(page);
    this.messageAucuneOffre = page.getByText("You haven't placed any bids yet.");
    this.boutonMarketplace = page.getByRole('link', { name: 'Explore Relocation Marketplace' });
  }

  async ouvrir(): Promise<void> {
    await this.goto('/mover/dashboard');
    await this.titreEcran.waitFor();
  }

  /** La ligne d'une offre, retrouvée par le lieu de départ de la demande. */
  ligneOffre(depart: string): Locator {
    return this.page.getByRole('listitem').filter({ hasText: depart });
  }

  async suivre(depart: string): Promise<void> {
    await this.ligneOffre(depart).getByRole('link', { name: 'Track & Update' }).click();
  }
}
