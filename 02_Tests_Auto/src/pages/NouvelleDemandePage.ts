import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Formulaire « Post New Relocation Request » : /client/requests/create
 * Contient l'Inventory Builder (liste d'objets à déménager, volume calculé).
 */
export class NouvelleDemandePage extends BasePage {
  readonly champDepart: Locator;
  readonly champArrivee: Locator;
  readonly champDate: Locator;
  readonly boutonPublier: Locator;
  readonly volumeTotal: Locator;
  readonly nombreObjets: Locator;
  readonly inventaireVide: Locator;
  readonly chargeEstimee: Locator;
  readonly resumeTrajet: Locator;
  readonly resumeDate: Locator;

  constructor(page: Page) {
    super(page);
    this.champDepart = page.getByLabel('Pickup Location');
    this.champArrivee = page.getByLabel('Drop-off Location');
    this.champDate = page.getByLabel('Preferred Move Date');
    this.boutonPublier = page.getByRole('button', { name: 'Confirm & Post Request' });
    // En-tête de l'Inventory Builder : à droite du titre, « 0.00 m³ » puis « 0 Total Items »
    const compteurs = page.getByRole('heading', { name: 'Inventory Builder' }).locator('xpath=../following-sibling::div[1]');
    this.volumeTotal = compteurs.locator('div').first();
    this.nombreObjets = compteurs.locator('div').nth(1);
    this.inventaireVide = page.getByText('Your inventory is empty.');
    // Barre du bas : chaque valeur est juste après son petit titre gris
    this.resumeTrajet = page.getByText('Route Summary', { exact: true }).locator('xpath=following-sibling::div[1]');
    this.resumeDate = page.getByText('Move Date', { exact: true }).locator('xpath=following-sibling::span[1]');
    this.chargeEstimee = page.getByText('Estimated Load', { exact: true }).locator('xpath=following-sibling::span[1]');
  }

  async ouvrir(): Promise<void> {
    await this.goto('/client/requests/create');
    await this.champDepart.waitFor();
  }

  /** Bouton d'un objet courant (« Medium Box », « Fridge »…) dans « Common Items ». */
  boutonObjet(nom: string): Locator {
    return this.page.getByRole('button', { name: new RegExp(`^${nom.replace(/[()]/g, '\\$&')}`) });
  }

  async ajouterObjet(nom: string, fois = 1): Promise<void> {
    for (let i = 0; i < fois; i++) await this.boutonObjet(nom).click();
  }

  /** La ligne d'un objet déjà ajouté à l'inventaire (colonne de droite). */
  ligneInventaire(nom: string): Locator {
    return this.page.locator('div.group').filter({ has: this.page.getByRole('heading', { level: 5, name: nom, exact: true }) });
  }

  quantite(nom: string): Locator {
    // Le compteur entre les boutons « - » et « + »
    return this.ligneInventaire(nom).getByRole('button', { name: '-', exact: true }).locator('xpath=following-sibling::*[1]');
  }

  async plus(nom: string): Promise<void> {
    await this.ligneInventaire(nom).getByRole('button', { name: '+', exact: true }).click();
  }

  async moins(nom: string): Promise<void> {
    await this.ligneInventaire(nom).getByRole('button', { name: '-', exact: true }).click();
  }

  boutonFragile(nom: string): Locator {
    return this.ligneInventaire(nom).getByRole('button', { name: /Fragile/ });
  }

  async supprimer(nom: string): Promise<void> {
    // Le dernier bouton de la ligne (icône poubelle, sans texte)
    await this.ligneInventaire(nom).getByRole('button').last().click();
  }

  /** Remplit départ, arrivée et date ('AAAA-MM-JJTHH:MM'), SANS publier. */
  async remplir(depart: string, arrivee: string, date: string): Promise<void> {
    await this.champDepart.fill(depart);
    await this.champArrivee.fill(arrivee);
    await this.champDate.fill(date);
  }

  /** Remplit, ajoute les objets puis clique sur « Confirm & Post Request ». */
  async publier(donnees: { depart: string; arrivee: string; date: string; objets?: string[] }): Promise<void> {
    await this.remplir(donnees.depart, donnees.arrivee, donnees.date);
    for (const objet of donnees.objets ?? []) await this.ajouterObjet(objet);
    await this.boutonPublier.click();
  }
}
