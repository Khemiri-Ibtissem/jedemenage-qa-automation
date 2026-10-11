import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Écran « mot de passe oublié » : /forgot-password
 * En test, l'email n'est pas envoyé : Laravel l'écrit dans storage/logs/laravel.log (MAIL_MAILER=log).
 */
export class ForgotPasswordPage extends BasePage {
  readonly champEmail: Locator;
  readonly boutonEnvoyer: Locator;

  constructor(page: Page) {
    super(page);
    this.champEmail = page.getByLabel('Email', { exact: true });
    this.boutonEnvoyer = page.getByRole('button', { name: 'Email Password Reset Link' });
  }

  async ouvrir(): Promise<void> {
    await this.goto('/forgot-password');
    await this.champEmail.waitFor();
  }

  async demanderLien(email: string): Promise<void> {
    await this.champEmail.fill(email);
    await this.boutonEnvoyer.click();
  }
}
