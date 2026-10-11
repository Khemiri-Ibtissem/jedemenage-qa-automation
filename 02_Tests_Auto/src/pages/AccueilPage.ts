import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page d'accueil publique : http://127.0.0.1:8010/
 */
export class AccueilPage extends BasePage {
  readonly logo: Locator;
  readonly badgeBaseDeDonnees: Locator;
  readonly titrePrincipal: Locator;
  readonly lienLogIn: Locator;
  readonly lienStartMoving: Locator;
  readonly lienGoToDashboard: Locator;
  readonly boutonImMoving: Locator;
  readonly boutonImAMover: Locator;
  readonly lienCreateAccount: Locator;
  readonly lienAccessPortal: Locator;
  readonly carteDemo: Locator;
  readonly blocSmartInventory: Locator;
  readonly blocLiveLogistics: Locator;
  readonly blocTrustEngine: Locator;
  readonly piedDePage: Locator;

  constructor(page: Page) {
    super(page);
    const menu = page.locator('nav');
    this.logo = menu.getByText('JeDemenage', { exact: true });
    this.badgeBaseDeDonnees = page.getByText('Database: Connected');
    this.titrePrincipal = page.getByRole('heading', { level: 1 });
    this.lienLogIn = menu.getByRole('link', { name: 'Log in' });
    this.lienStartMoving = menu.getByRole('link', { name: 'Start Moving' });
    this.lienGoToDashboard = menu.getByRole('link', { name: 'Go to Dashboard' });
    this.boutonImMoving = page.getByRole('link', { name: "I'm Moving" });
    this.boutonImAMover = page.getByRole('link', { name: "I'm a Mover" });
    this.lienCreateAccount = page.getByRole('link', { name: 'Create Account' });
    this.lienAccessPortal = page.getByRole('link', { name: 'Access Portal' });
    this.carteDemo = page.getByText('Marseille Express');
    this.blocSmartInventory = page.getByRole('heading', { name: 'Smart Inventory' });
    this.blocLiveLogistics = page.getByRole('heading', { name: 'Live Logistics' });
    this.blocTrustEngine = page.getByRole('heading', { name: 'Trust Engine' });
    this.piedDePage = page.locator('footer');
  }

  async ouvrir(): Promise<void> {
    await this.goto('/');
    await this.titrePrincipal.waitFor();
  }

  /** Panneau de droite de « Platform Capabilities » : il change quand on survole un bloc. */
  panneauFonctionnalite(texte: string): Locator {
    return this.message(texte);
  }
}
