import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export type Role = 'client' | 'mover';

/**
 * Écran d'inscription : /register (et /register?role=mover depuis « I'm a Mover »)
 */
export class RegisterPage extends BasePage {
  readonly champNom: Locator;
  readonly champEmail: Locator;
  readonly champMotDePasse: Locator;
  readonly champConfirmation: Locator;
  readonly listeRole: Locator;
  readonly boutonRegister: Locator;
  readonly lienDejaInscrit: Locator;

  constructor(page: Page) {
    super(page);
    this.champNom = page.getByLabel('Name', { exact: true });
    this.champEmail = page.getByLabel('Email', { exact: true });
    // exact: true → « Password » ne doit pas trouver aussi « Confirm Password »
    this.champMotDePasse = page.getByLabel('Password', { exact: true });
    this.champConfirmation = page.getByLabel('Confirm Password');
    this.listeRole = page.getByLabel('I want to...');
    this.boutonRegister = page.getByRole('button', { name: 'Register' });
    this.lienDejaInscrit = page.getByRole('link', { name: 'Already registered?' });
  }

  async ouvrir(chemin = '/register'): Promise<void> {
    await this.goto(chemin);
    await this.champNom.waitFor();
  }

  /** Remplit tout le formulaire, SANS valider. La confirmation = le mot de passe, sauf si on la précise. */
  async remplir(donnees: {
    nom: string;
    email: string;
    motDePasse: string;
    confirmation?: string;
    role?: Role;
  }): Promise<void> {
    await this.champNom.fill(donnees.nom);
    await this.champEmail.fill(donnees.email);
    await this.champMotDePasse.fill(donnees.motDePasse);
    await this.champConfirmation.fill(donnees.confirmation ?? donnees.motDePasse);
    if (donnees.role) await this.listeRole.selectOption(donnees.role);
  }

  async inscrire(donnees: Parameters<RegisterPage['remplir']>[0]): Promise<void> {
    await this.remplir(donnees);
    await this.boutonRegister.click();
  }
}
