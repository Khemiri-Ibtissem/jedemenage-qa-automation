import { type Page, type Locator } from '@playwright/test';

/** Ce que le site a fait "en coulisses" dans un onglet (partagé par toutes les pages de cet onglet). */
type EtatOnglet = {
  popupsOuvertes: string[];    // fenêtres alert() ouvertes (ex. injection de script réussie)
  erreursServeur: string[];    // réponses du serveur en erreur 500+
  erreursJavaScript: string[]; // plantages de la page (écran blanc, composant Vue cassé…)
  confirmer: boolean;          // réponse aux fenêtres confirm() : true = OK, false = Annuler
};
const etats = new WeakMap<Page, EtatOnglet>();

/**
 * On écoute l'onglet UNE seule fois, même si plusieurs pages (LoginPage, OffresClientPage…)
 * l'utilisent : sinon chaque page répondrait à la même fenêtre confirm().
 */
function etatDe(page: Page): EtatOnglet {
  let etat = etats.get(page);
  if (!etat) {
    const nouvelEtat: EtatOnglet = { popupsOuvertes: [], erreursServeur: [], erreursJavaScript: [], confirmer: true };
    page.on('dialog', async (dialogue) => {
      if (dialogue.type() === 'confirm') {
        await (nouvelEtat.confirmer ? dialogue.accept() : dialogue.dismiss());
        return;
      }
      nouvelEtat.popupsOuvertes.push(dialogue.message());
      await dialogue.dismiss();
    });
    page.on('response', (reponse) => {
      if (reponse.status() >= 500) nouvelEtat.erreursServeur.push(`${reponse.status()} ${reponse.url()}`);
    });
    page.on('pageerror', (erreur) => nouvelEtat.erreursJavaScript.push(erreur.message));
    etats.set(page, nouvelEtat);
    etat = nouvelEtat;
  }
  return etat;
}

/**
 * Page "mère" : tout ce qui est commun à TOUS les écrans de JeDemenage.
 * Les autres pages (LoginPage, RegisterPage…) héritent de celle-ci avec "extends BasePage".
 */
export class BasePage {
  // "page" = l'onglet du navigateur piloté par Playwright
  constructor(readonly page: Page) {
    etatDe(page);
  }

  get popupsOuvertes(): string[] {
    return etatDe(this.page).popupsOuvertes;
  }

  get erreursServeur(): string[] {
    return etatDe(this.page).erreursServeur;
  }

  get erreursJavaScript(): string[] {
    return etatDe(this.page).erreursJavaScript;
  }

  /** Réponse aux prochaines fenêtres confirm() : true = OK, false = Annuler. */
  set reponseAuxConfirmations(ok: boolean) {
    etatDe(this.page).confirmer = ok;
  }

  /** Ouvre une adresse. '/login' devient http://127.0.0.1:8010/login (baseURL de la config). */
  async goto(chemin: string): Promise<number | undefined> {
    const reponse = await this.page.goto(chemin);
    return reponse?.status();
  }

  /** Touche F5. */
  async recharger(): Promise<void> {
    await this.page.reload();
  }

  /** Bouton « Précédent » du navigateur. */
  async retourArriere(): Promise<void> {
    await this.page.goBack();
  }

  /** Repartir déconnecté(e), sans passer par le menu Log Out (Laravel garde la session dans un cookie). */
  async effacerSession(): Promise<void> {
    await this.page.context().clearCookies();
  }

  /** Le titre de l'écran (bandeau blanc sous le menu, sur les pages connectées). */
  get titreEcran(): Locator {
    return this.page.locator('header h2');
  }

  /** Bouton du menu en haut à droite, qui affiche le nom de la personne connectée. */
  boutonProfil(nom: string): Locator {
    return this.page.locator('nav').getByRole('button', { name: nom });
  }

  /** Menu en haut à droite → Log Out. */
  async seDeconnecter(nom: string): Promise<void> {
    await this.boutonProfil(nom).click();
    await this.page.getByRole('button', { name: 'Log Out' }).click();
    await this.page.waitForURL((url) => url.pathname === '/');
  }

  /**
   * Retrouve un message affiché à l'écran (erreur ou confirmation), par son texte.
   * filter visible : on ne regarde que les textes réellement affichés.
   */
  message(texte: string | RegExp): Locator {
    return this.page.getByText(texte).filter({ visible: true });
  }

  /** true si la page est plus large que l'écran (= défilement horizontal). */
  async aUnDefilementHorizontal(): Promise<boolean> {
    return this.page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
  }

  /**
   * Données envoyées par Laravel à la page (Inertia les range dans l'attribut data-page de #app).
   * Utile pour lire un numéro (id) qui n'est pas affiché à l'écran.
   * ⚠️ Valable juste après un chargement complet (goto / F5), pas après un clic de navigation.
   */
  async donneesDeLaPage<T = Record<string, unknown>>(): Promise<T> {
    const json = await this.page.locator('#app').getAttribute('data-page');
    return JSON.parse(json ?? '{}').props as T;
  }

  /**
   * Envoie une requête POST « à la main », comme le ferait une personne mal intentionnée
   * avec les outils du navigateur (F12) : sans passer par les boutons de l'écran.
   * Sert aux tests @securite (« le serveur refuse-t-il vraiment ? »).
   * Renvoie le code HTTP : 403 = refusé, 422 = données invalides, 200/302 = accepté.
   */
  async envoyerPost(chemin: string, donnees: Record<string, unknown> = {}): Promise<number> {
    return this.page.evaluate(
      async ({ chemin, donnees }) => {
        // Laravel protège les formulaires avec un jeton (CSRF) lu dans le cookie XSRF-TOKEN
        const cookie = document.cookie.split('; ').find((c) => c.startsWith('XSRF-TOKEN='));
        const jeton = decodeURIComponent(cookie?.split('=')[1] ?? '');
        const reponse = await fetch(chemin, {
          method: 'POST',
          redirect: 'manual',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-XSRF-TOKEN': jeton,
            'X-Requested-With': 'XMLHttpRequest',
          },
          body: JSON.stringify(donnees),
        });
        // redirect: 'manual' → une redirection (302) apparaît avec le statut 0 : on la renvoie comme 302
        return reponse.type === 'opaqueredirect' ? 302 : reponse.status;
      },
      { chemin, donnees },
    );
  }
}
