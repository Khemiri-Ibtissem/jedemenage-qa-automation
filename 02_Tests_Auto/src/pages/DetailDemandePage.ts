import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Détail d'une demande vu par le déménageur : /mover/requests/{id} (« Relocation Details »)
 * C'est ici qu'il propose son prix (« Place Your Bid »).
 */
export class DetailDemandePage extends BasePage {
  readonly champPrix: Locator;
  readonly boutonEnvoyerOffre: Locator;
  readonly tableauInventaire: Locator;
  readonly volumeTotal: Locator;
  readonly messageAucuneOffre: Locator;
  readonly lienRetour: Locator;

  constructor(page: Page) {
    super(page);
    this.champPrix = page.getByLabel('Your Price Quote ($)');
    this.boutonEnvoyerOffre = page.getByRole('button', { name: 'Submit Formal Bid' });
    this.tableauInventaire = page.getByRole('table');
    this.volumeTotal = page.getByText(/Total Volume:/);
    this.messageAucuneOffre = page.getByText('No bids have been placed yet.');
    this.lienRetour = page.getByRole('link', { name: /Back to Marketplace/ });
  }

  async ouvrir(idDemande: number): Promise<number | undefined> {
    const statut = await this.goto(`/mover/requests/${idDemande}`);
    return statut;
  }

  /** Valeur affichée sous un petit titre (« Pickup Point », « Drop-off Point », « Move Date », « Client »). */
  info(titre: 'Pickup Point' | 'Drop-off Point' | 'Move Date' | 'Client'): Locator {
    return this.page.getByRole('heading', { level: 4, name: titre, exact: true }).locator('xpath=following-sibling::*[1]');
  }

  /** Une ligne du tableau d'inventaire, retrouvée par le nom de l'objet. */
  ligneInventaire(objet: string): Locator {
    return this.tableauInventaire.getByRole('row').filter({ hasText: objet });
  }

  async proposerPrix(prix: string): Promise<void> {
    await this.champPrix.fill(prix);
    await this.boutonEnvoyerOffre.click();
  }

  /** Offres déjà faites, dans « Current Market Offers » (une ligne par offre). */
  offresDuMarche(): Locator {
    return this.page.getByText(/^\s*Status: /);
  }
}
