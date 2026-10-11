import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Évaluation du déménageur : /client/requests/{id}/review (« Rate Your Mover »)
 */
export class EvaluationPage extends BasePage {
  readonly etoiles: Locator;
  readonly champCommentaire: Locator;
  readonly boutonEnvoyer: Locator;

  constructor(page: Page) {
    super(page);
    // Les 5 étoiles sont des boutons sans texte, juste après le libellé « Your Rating »
    this.etoiles = page.locator('label', { hasText: 'Your Rating' }).locator('xpath=following-sibling::div[1]').getByRole('button');
    this.champCommentaire = page.getByLabel('Additional Comments (Optional)');
    this.boutonEnvoyer = page.getByRole('button', { name: 'Submit Professional Review' });
  }

  async ouvrir(idDemande: number): Promise<number | undefined> {
    return this.goto(`/client/requests/${idDemande}/review`);
  }

  /** Clique sur la n-ième étoile (1 à 5). */
  async choisirNote(note: number): Promise<void> {
    await this.etoiles.nth(note - 1).click();
  }

  async evaluer(note: number, commentaire = ''): Promise<void> {
    await this.choisirNote(note);
    await this.champCommentaire.fill(commentaire);
    await this.boutonEnvoyer.click();
  }
}
