import { test, expect } from '../../src/fixtures/fixtures';
import { admin, client, demenageur, nouveauCompte, unique } from '../../src/data/comptes';
import { motsDePasse, messages } from '../../src/data/valeurs';

/*
 * CT-03 · Connexion, déconnexion et mot de passe oublié
 * Chaque test = UN scénario de 01_Tests_Manuels/CT-03_Connexion/01_Scenario.docx
 *
 * Laravel bloque après 5 mauvais mots de passe par minute POUR UN MÊME EMAIL :
 * les tests d'échec utilisent donc des emails inventés, jamais les comptes seed.
 */
const msg = messages.connexion;

test.describe('CT-03 · Connexion', () => {

  test('CT-03-S01 · Affichage de la page @smoke', async ({ loginPage }) => {
    await loginPage.ouvrir();

    await expect(loginPage.champEmail).toBeVisible();
    await expect(loginPage.champMotDePasse).toBeVisible();
    await expect(loginPage.caseSeSouvenir).toBeVisible();
    await expect(loginPage.boutonLogIn).toBeVisible();
    await expect(loginPage.lienMotDePasseOublie).toBeVisible();
  });

  test('CT-03-S02 · Connexion de chaque rôle @smoke', async ({ page, loginPage, ecran }) => {
    // Table de décision : chaque rôle arrive sur SON espace
    const cas = [
      { compte: client, url: /\/client\/dashboard/, titre: 'My Relocation Hub' },
      { compte: demenageur, url: /\/mover\/dashboard/, titre: 'Mover Marketplace Hub' },
      { compte: admin, url: /\/admin\/dashboard/, titre: 'Admin Control Center' },
    ];
    for (const { compte, url, titre } of cas) {
      await test.step(compte.nom, async () => {
        await ecran.effacerSession();
        await loginPage.ouvrir();
        await loginPage.seConnecter(compte.email, compte.motDePasse);
        await expect(page).toHaveURL(url);
        await expect(ecran.titreEcran).toHaveText(titre);
        await expect(ecran.boutonProfil(compte.nom)).toBeVisible();
      });
    }
  });

  test('CT-03-S03 · Mot de passe incorrect @smoke', async ({ page, loginPage, parcours }) => {
    // Données : un compte qui existe vraiment (créé pour ce test) + « Faux12345 »
    const compte = await parcours.inscrire('client');
    await loginPage.effacerSession();
    await loginPage.ouvrir();
    await loginPage.seConnecter(compte.email, motsDePasse.faux);

    await expect(loginPage.message(msg.identifiantsIncorrects)).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('CT-03-S04 · Email inconnu @securite', async ({ page, loginPage }) => {
    await loginPage.ouvrir();
    await loginPage.seConnecter(nouveauCompte('inconnu').email, motsDePasse.faux);

    // Attendu : le MÊME message que S03 → on ne peut pas deviner si un email est inscrit
    await expect(loginPage.message(msg.identifiantsIncorrects)).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('CT-03-S05 · Champs vides', async ({ page, loginPage }) => {
    await loginPage.ouvrir();
    await loginPage.boutonLogIn.click();

    // Attendu : le navigateur bloque l'envoi
    await expect(page).toHaveURL(/\/login$/);
    expect(await loginPage.champEmail.evaluate((el: HTMLInputElement) => el.validity.valueMissing)).toBe(true);
  });

  test('CT-03-S06 · Touche Entrée', async ({ page, loginPage }) => {
    await loginPage.ouvrir();
    await loginPage.remplir(client.email, client.motDePasse);
    await loginPage.validerAvecEntree();
    await expect(page).toHaveURL(/\/client\/dashboard/);
  });

  test('CT-03-S07 · Remember me', async ({ page, loginPage }) => {
    await loginPage.ouvrir();
    await loginPage.remplir(client.email, client.motDePasse);
    await loginPage.caseSeSouvenir.check();
    await loginPage.boutonLogIn.click();
    await expect(page).toHaveURL(/\/client\/dashboard/);

    // Attendu : un cookie « remember_web_… » garde la connexion après fermeture du navigateur
    const cookies = await page.context().cookies();
    expect(cookies.some((c) => c.name.startsWith('remember_web_'))).toBe(true);
  });

  test('CT-03-S08 · Session conservée après F5', async ({ page, parcours, clientDashboard }) => {
    await parcours.connecter(client);
    await clientDashboard.recharger();
    await expect(page).toHaveURL(/\/client\/dashboard/);
    await expect(clientDashboard.boutonProfil(client.nom)).toBeVisible();
  });

  test('CT-03-S09 · Déconnexion @smoke', async ({ page, parcours, clientDashboard }) => {
    await parcours.connecter(client);
    await clientDashboard.seDeconnecter(client.nom);

    // Attendu : retour à l'accueil, puis l'espace client n'est plus accessible
    await expect(page).toHaveURL(/\/$/);
    await clientDashboard.goto('/client/dashboard');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('CT-03-S10 · Page privée sans connexion @securite', async ({ page, ecran }) => {
    for (const chemin of ['/dashboard', '/client/dashboard', '/mover/marketplace', '/admin/dashboard', '/profile']) {
      await test.step(chemin, async () => {
        await ecran.goto(chemin);
        await expect(page).toHaveURL(/\/login$/);
      });
    }
  });

  test('CT-03-S11 · Déjà connecté → /login', async ({ page, parcours, ecran }) => {
    await parcours.connecter(demenageur);
    await ecran.goto('/login');
    // Attendu : renvoyé vers son espace, pas de formulaire de connexion
    await expect(page).toHaveURL(/\/mover\/dashboard/);
  });

  test('CT-03-S12 · Trop d\'essais (blocage temporaire) @securite', async ({ page, loginPage }) => {
    // Données : un email inventé (le blocage ne gêne donc aucun autre test)
    const email = `blocage.${unique()}@example.com`;
    await loginPage.ouvrir();
    for (let essai = 1; essai <= 5; essai++) {
      await loginPage.seConnecter(email, motsDePasse.faux);
      await expect(loginPage.message(msg.identifiantsIncorrects)).toBeVisible();
    }
    // 6e essai
    await loginPage.seConnecter(email, motsDePasse.faux);
    await expect(loginPage.message(msg.tropDEssais)).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('CT-03-S13 · Lien Forgot your password?', async ({ page, loginPage, forgotPasswordPage }) => {
    await loginPage.ouvrir();
    await loginPage.lienMotDePasseOublie.click();
    await expect(page).toHaveURL(/\/forgot-password$/);
    await expect(forgotPasswordPage.champEmail).toBeVisible();
  });

  test('CT-03-S14 · Demande de réinitialisation', async ({ forgotPasswordPage }) => {
    await test.step('a) email inscrit → lien envoyé', async () => {
      await forgotPasswordPage.ouvrir();
      await forgotPasswordPage.demanderLien(client.email);
      await expect(forgotPasswordPage.message(messages.motDePasseOublie.lienEnvoye)).toBeVisible();
    });
    await test.step('b) email inconnu → message', async () => {
      await forgotPasswordPage.ouvrir();
      await forgotPasswordPage.demanderLien(nouveauCompte('oubli').email);
      await expect(forgotPasswordPage.message(messages.motDePasseOublie.emailInconnu)).toBeVisible();
    });
  });

  test('CT-03-S15 · Affichage mobile @mobile', async ({ page, loginPage }) => {
    await loginPage.ouvrir();
    expect(await loginPage.aUnDefilementHorizontal()).toBe(false);
    await loginPage.seConnecter(client.email, client.motDePasse);
    await expect(page).toHaveURL(/\/client\/dashboard/);
  });
});
