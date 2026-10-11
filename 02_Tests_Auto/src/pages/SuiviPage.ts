import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Suivi en direct d'un déménagement : /requests/{id}/track (« Live Tracking »)
 * Visible par le client propriétaire et par le déménageur choisi.
 */
export class SuiviPage extends BasePage {
  readonly carte: Locator;
  readonly camion: Locator;
  readonly statut: Locator;
  readonly boutonSimulerGps: Locator;
  readonly demenageurAssigne: Locator;
  readonly lienQuitter: Locator;

  constructor(page: Page) {
    super(page);
    this.carte = page.locator('.leaflet-container');
    this.camion = page.locator('.leaflet-marker-icon'); // le camion, dessiné quand Leaflet (CDN) est chargé
    this.statut = page.locator('header h2').locator('xpath=following-sibling::div[1]');
    this.boutonSimulerGps = page.getByRole('button', { name: 'Simulate GPS Step' });
    this.demenageurAssigne = page.getByText('Assigned Mover', { exact: true }).locator('xpath=following-sibling::*[1]');
    this.lienQuitter = page.getByRole('link', { name: 'Exit Tracking' });
  }

  async ouvrir(idDemande: number): Promise<number | undefined> {
    return this.goto(`/requests/${idDemande}/track`);
  }

  /** Attend que la carte et le camion soient dessinés, clique sur « Simulate GPS Step », attend le serveur. */
  async simulerEtapeGps(): Promise<void> {
    await this.camion.waitFor();
    const reponse = this.page.waitForResponse((r) => r.url().includes('/location') && r.request().method() === 'POST');
    await this.boutonSimulerGps.click();
    await reponse;
  }
}
