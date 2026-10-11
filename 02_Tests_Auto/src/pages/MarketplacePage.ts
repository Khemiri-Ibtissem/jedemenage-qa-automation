import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Place de marché du déménageur : /mover/marketplace (« Relocation Hub - Available Jobs »)
 * Liste les demandes encore « pending ».
 */
export class MarketplacePage extends BasePage {
  readonly messageAucuneDemande: Locator;

  constructor(page: Page) {
    super(page);
    this.messageAucuneDemande = page.getByText('No pending move requests at the moment.');
  }

  async ouvrir(): Promise<void> {
    await this.goto('/mover/marketplace');
    await this.titreEcran.waitFor();
  }

  /** La carte d'une demande, retrouvée par son lieu de départ (unique dans chaque test). */
  carte(depart: string): Locator {
    return this.page
      .getByRole('heading', { level: 3, name: depart })
      .locator('xpath=ancestor::div[contains(@class, "shadow-sm")][1]');
  }

  /** Valeur affichée sous « Volume » ou « Items » dans la carte. */
  valeur(depart: string, libelle: 'Volume' | 'Items'): Locator {
    return this.carte(depart).getByText(libelle, { exact: true }).locator('xpath=following-sibling::p[1]');
  }

  /** Texte « Posted … » (depuis quand la demande est publiée). */
  datePublication(depart: string): Locator {
    return this.carte(depart).getByText(/Posted/);
  }

  async voirDetails(depart: string): Promise<void> {
    await this.carte(depart).getByRole('link', { name: 'View Details & Bid' }).click();
  }
}
