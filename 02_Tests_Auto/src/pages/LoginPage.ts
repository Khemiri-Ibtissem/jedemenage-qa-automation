import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Écran de connexion : /login
 * Tous les sélecteurs de cet écran sont ICI, et nulle part ailleurs.
 */
export class LoginPage extends BasePage {
  readonly champEmail: Locator;
  readonly champMotDePasse: Locator;
  readonly caseSeSouvenir: Locator;
  readonly boutonLogIn: Locator;
  readonly lienMotDePasseOublie: Locator;

  constructor(page: Page) {
    super(page);
    this.champEmail = page.getByLabel('Email', { exact: true });
    this.champMotDePasse = page.getByLabel('Password', { exact: true });
    this.caseSeSouvenir = page.getByRole('checkbox', { name: 'Remember me' });
    this.boutonLogIn = page.getByRole('button', { name: 'Log in' });
    this.lienMotDePasseOublie = page.getByRole('link', { name: 'Forgot your password?' });
  }

  /** Ouvre la page de connexion. */
  async ouvrir(): Promise<void> {
    await this.goto('/login');
    await this.champEmail.waitFor();
  }

  /** Remplit email + mot de passe, SANS valider. */
  async remplir(email: string, motDePasse: string): Promise<void> {
    await this.champEmail.fill(email);
    await this.champMotDePasse.fill(motDePasse);
  }

  /** Remplit email + mot de passe puis clique sur Log in, et attend la réponse du serveur. */
  async seConnecter(email: string, motDePasse: string): Promise<void> {
    await this.remplir(email, motDePasse);
    const reponse = this.page.waitForResponse((r) => r.url().endsWith('/login') && r.request().method() === 'POST');
    await this.boutonLogIn.click();
    await reponse;
    // Puis on attend la fin : soit on a quitté /login (connexion réussie), soit le formulaire est
    // de nouveau prêt (échec). Sinon un 2e essai tapé trop tôt serait effacé et jamais envoyé.
    await this.page.waitForFunction(() => {
      const bouton = document.querySelector<HTMLButtonElement>('form button');
      return location.pathname !== '/login' || (bouton !== null && !bouton.disabled);
    });
  }

  /** Valide le formulaire avec la touche Entrée (au lieu du bouton). */
  async validerAvecEntree(): Promise<void> {
    await this.champMotDePasse.press('Enter');
  }

  /** Message de validation du navigateur (bulle « Veuillez remplir ce champ ») sur un champ. */
  async bulleDuNavigateur(champ: Locator): Promise<string> {
    return champ.evaluate((el: HTMLInputElement) => el.validationMessage);
  }
}
