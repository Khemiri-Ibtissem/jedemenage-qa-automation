import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Tableau de bord administrateur : /admin/dashboard (« Admin Control Center »)
 */
export class AdminDashboardPage extends BasePage {
  readonly listeInscrits: Locator;
  readonly listeDemenagements: Locator;

  constructor(page: Page) {
    super(page);
    this.listeInscrits = page.getByRole('heading', { name: 'Recently Registered' }).locator('xpath=following::ul[1]');
    this.listeDemenagements = page.getByRole('heading', { name: 'Latest Relocations' }).locator('xpath=following::ul[1]');
  }

  async ouvrir(): Promise<number | undefined> {
    return this.goto('/admin/dashboard');
  }

  /** Chiffre d'une tuile de statistiques (« Total Users », « Active Movers »…). */
  statistique(titre: 'Total Users' | 'Active Movers' | 'Active Clients' | 'Active Moves'): Locator {
    return this.page.getByRole('term').filter({ hasText: titre }).locator('xpath=following-sibling::dd[1]');
  }

  async valeurStatistique(titre: Parameters<AdminDashboardPage['statistique']>[0]): Promise<string> {
    return (await this.statistique(titre).innerText()).trim();
  }

  inscrit(email: string): Locator {
    return this.listeInscrits.getByRole('listitem').filter({ hasText: email });
  }

  demenagement(depart: string): Locator {
    return this.listeDemenagements.getByRole('listitem').filter({ hasText: depart });
  }
}
