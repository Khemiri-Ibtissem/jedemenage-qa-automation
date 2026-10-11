import { test as base, expect } from '@playwright/test';
import { AccueilPage } from '../pages/AccueilPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { ClientDashboardPage } from '../pages/ClientDashboardPage';
import { NouvelleDemandePage } from '../pages/NouvelleDemandePage';
import { OffresClientPage } from '../pages/OffresClientPage';
import { MarketplacePage } from '../pages/MarketplacePage';
import { DetailDemandePage } from '../pages/DetailDemandePage';
import { MoverDashboardPage } from '../pages/MoverDashboardPage';
import { SuiviPage } from '../pages/SuiviPage';
import { EvaluationPage } from '../pages/EvaluationPage';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { BasePage } from '../pages/BasePage';
import { Parcours } from '../outils/Parcours';

// La liste des pages (et outils) que les tests peuvent demander
type MesPages = {
  ecran: BasePage; // n'importe quel écran : menu, messages, requêtes « à la main »
  accueilPage: AccueilPage;
  loginPage: LoginPage;
  registerPage: RegisterPage;
  forgotPasswordPage: ForgotPasswordPage;
  clientDashboard: ClientDashboardPage;
  nouvelleDemande: NouvelleDemandePage;
  offresClient: OffresClientPage;
  marketplace: MarketplacePage;
  detailDemande: DetailDemandePage;
  moverDashboard: MoverDashboardPage;
  suiviPage: SuiviPage;
  evaluationPage: EvaluationPage;
  adminDashboard: AdminDashboardPage;
  parcours: Parcours;
};

/**
 * On "étend" le test de Playwright : chaque test reçoit ses pages toutes prêtes.
 * Exemple : test('…', async ({ loginPage }) => { await loginPage.ouvrir(); })
 * Chaque test a son propre navigateur tout neuf → les tests sont indépendants.
 */
export const test = base.extend<MesPages>({
  ecran: async ({ page }, use) => use(new BasePage(page)),
  accueilPage: async ({ page }, use) => use(new AccueilPage(page)),
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  registerPage: async ({ page }, use) => use(new RegisterPage(page)),
  forgotPasswordPage: async ({ page }, use) => use(new ForgotPasswordPage(page)),
  clientDashboard: async ({ page }, use) => use(new ClientDashboardPage(page)),
  nouvelleDemande: async ({ page }, use) => use(new NouvelleDemandePage(page)),
  offresClient: async ({ page }, use) => use(new OffresClientPage(page)),
  marketplace: async ({ page }, use) => use(new MarketplacePage(page)),
  detailDemande: async ({ page }, use) => use(new DetailDemandePage(page)),
  moverDashboard: async ({ page }, use) => use(new MoverDashboardPage(page)),
  suiviPage: async ({ page }, use) => use(new SuiviPage(page)),
  evaluationPage: async ({ page }, use) => use(new EvaluationPage(page)),
  adminDashboard: async ({ page }, use) => use(new AdminDashboardPage(page)),
  parcours: async ({ page }, use) => use(new Parcours(page)),
});

// On ré-exporte expect pour que les tests n'importent qu'un seul fichier
export { expect };
