import { test, expect } from '../../src/fixtures/fixtures';
import { client } from '../../src/data/comptes';

/*
 * CT-01 · Page d'accueil
 * Chaque test = UN scénario de 01_Tests_Manuels/CT-01_Page-accueil/01_Scenario.docx
 * (mêmes actions, mêmes données, même résultat attendu).
 *
 * Restent MANUELS (voir 00_Plan_de_test.docx) : S10 Textes et visuel, S11 Badge « Database: Connected ».
 */
test.describe('CT-01 · Page d\'accueil', () => {

  test('CT-01-S01 · Affichage complet @smoke', async ({ accueilPage }) => {
    // Actions : ouvrir la page d'accueil sans être connecté
    await accueilPage.ouvrir();

    // Attendu : menu, titre, boutons d'action, 3 fonctionnalités, appel final et pied de page visibles
    await expect(accueilPage.logo).toBeVisible();
    await expect(accueilPage.titrePrincipal).toContainText('Relocation');
    await expect(accueilPage.lienLogIn).toBeVisible();
    await expect(accueilPage.lienStartMoving).toBeVisible();
    await expect(accueilPage.boutonImMoving).toBeVisible();
    await expect(accueilPage.boutonImAMover).toBeVisible();
    await expect(accueilPage.blocSmartInventory).toBeVisible();
    await expect(accueilPage.blocLiveLogistics).toBeVisible();
    await expect(accueilPage.blocTrustEngine).toBeVisible();
    await expect(accueilPage.lienCreateAccount).toBeVisible();
    await expect(accueilPage.lienAccessPortal).toBeVisible();
    await expect(accueilPage.piedDePage).toContainText('JeDemenage');
    expect(accueilPage.erreursJavaScript).toEqual([]);
  });

  test('CT-01-S02 · Bouton Log in @smoke', async ({ page, accueilPage }) => {
    await accueilPage.ouvrir();
    await accueilPage.lienLogIn.click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('CT-01-S03 · Bouton Start Moving', async ({ page, accueilPage, registerPage }) => {
    await accueilPage.ouvrir();
    await accueilPage.lienStartMoving.click();

    // Attendu : inscription, rôle « Client » proposé par défaut
    await expect(page).toHaveURL(/\/register$/);
    await expect(registerPage.listeRole).toHaveValue('client');
  });

  test('CT-01-S04 · Bouton I\'m Moving', async ({ page, accueilPage, registerPage }) => {
    await accueilPage.ouvrir();
    await accueilPage.boutonImMoving.click();
    await expect(page).toHaveURL(/\/register$/);
    await expect(registerPage.listeRole).toHaveValue('client');
  });

  test('CT-01-S05 · Bouton I\'m a Mover @smoke', async ({ page, accueilPage, registerPage }) => {
    await accueilPage.ouvrir();
    await accueilPage.boutonImAMover.click();

    // Attendu : inscription avec le rôle « Mover » déjà choisi
    await expect(page).toHaveURL(/\/register\?role=mover$/);
    await expect(registerPage.listeRole).toHaveValue('mover');
  });

  test('CT-01-S06 · Boutons du bas de page', async ({ page, accueilPage }) => {
    await test.step('a) Create Account → inscription', async () => {
      await accueilPage.ouvrir();
      await accueilPage.lienCreateAccount.click();
      await expect(page).toHaveURL(/\/register$/);
    });
    await test.step('b) Access Portal → connexion', async () => {
      await accueilPage.ouvrir();
      await accueilPage.lienAccessPortal.click();
      await expect(page).toHaveURL(/\/login$/);
    });
  });

  test('CT-01-S07 · Survol des fonctionnalités', async ({ accueilPage }) => {
    await accueilPage.ouvrir();

    // Attendu : le panneau de droite change selon le bloc survolé
    await expect(accueilPage.panneauFonctionnalite('JSON Schema Builder')).toBeVisible(); // affiché par défaut
    await accueilPage.blocTrustEngine.hover();
    await expect(accueilPage.panneauFonctionnalite('Excellent Service')).toBeVisible();
    await accueilPage.blocLiveLogistics.hover();
    await expect(accueilPage.panneauFonctionnalite('Excellent Service')).toBeHidden();
    await expect(accueilPage.panneauFonctionnalite('JSON Schema Builder')).toBeHidden();
    await accueilPage.blocSmartInventory.hover();
    await expect(accueilPage.panneauFonctionnalite('JSON Schema Builder')).toBeVisible();
  });

  test('CT-01-S08 · Visite en étant connecté', async ({ page, accueilPage, parcours }) => {
    // Actions : se connecter (compte client), puis revenir sur l'accueil
    await parcours.connecter(client);
    await accueilPage.ouvrir();

    // Attendu : « Go to Dashboard » à la place de « Log in », et il mène au tableau de bord
    await expect(accueilPage.lienGoToDashboard).toBeVisible();
    await expect(accueilPage.lienLogIn).toBeHidden();
    await accueilPage.lienGoToDashboard.click();
    await expect(page).toHaveURL(/\/client\/dashboard/);
  });

  test('CT-01-S09 · Affichage mobile @mobile', async ({ accueilPage }) => {
    await accueilPage.ouvrir();

    // Attendu : pas de défilement horizontal, boutons principaux visibles
    expect(await accueilPage.aUnDefilementHorizontal()).toBe(false);
    await expect(accueilPage.boutonImMoving).toBeVisible();
    await expect(accueilPage.boutonImAMover).toBeVisible();
  });
});
