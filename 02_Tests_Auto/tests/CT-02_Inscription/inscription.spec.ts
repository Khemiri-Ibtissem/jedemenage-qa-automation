import { test, expect } from '../../src/fixtures/fixtures';
import { client, nouveauCompte } from '../../src/data/comptes';
import { emailsInvalides, injections, motsDePasse, messages } from '../../src/data/valeurs';

/*
 * CT-02 · Inscription
 * Chaque test = UN scénario de 01_Tests_Manuels/CT-02_Inscription/01_Scenario.docx
 *
 * En local, on peut créer de vrais comptes : la base de test est remise à zéro à chaque lancement.
 */
const msg = messages.inscription;

test.describe('CT-02 · Inscription', () => {

  test('CT-02-S01 · Affichage de la page @smoke', async ({ registerPage }) => {
    await registerPage.ouvrir();

    // Attendu : Name, Email, Password, Confirm Password, I want to..., Register, Already registered?
    await expect(registerPage.champNom).toBeVisible();
    await expect(registerPage.champEmail).toBeVisible();
    await expect(registerPage.champMotDePasse).toBeVisible();
    await expect(registerPage.champConfirmation).toBeVisible();
    await expect(registerPage.listeRole).toHaveValue('client');
    await expect(registerPage.boutonRegister).toBeVisible();
    await expect(registerPage.lienDejaInscrit).toBeVisible();
  });

  test('CT-02-S02 · Inscription client valide @smoke', async ({ page, registerPage, clientDashboard }) => {
    const compte = nouveauCompte('client');
    await registerPage.ouvrir();
    await registerPage.inscrire({ ...compte, role: 'client' });

    // Attendu : connecté automatiquement, sur l'espace client, avec son nom dans le menu
    await expect(page).toHaveURL(/\/client\/dashboard/);
    await expect(clientDashboard.titreEcran).toHaveText('My Relocation Hub');
    await expect(clientDashboard.boutonProfil(compte.nom)).toBeVisible();
    await expect(clientDashboard.messageAucuneDemande).toBeVisible();
  });

  test('CT-02-S03 · Inscription déménageur valide @smoke', async ({ page, registerPage, moverDashboard }) => {
    const compte = nouveauCompte('mover');
    await registerPage.ouvrir('/register?role=mover');
    await registerPage.inscrire(compte); // rôle « Mover » déjà choisi grâce au lien

    // Attendu : espace déménageur
    await expect(page).toHaveURL(/\/mover\/dashboard/);
    await expect(moverDashboard.titreEcran).toHaveText('Mover Marketplace Hub');
    await expect(moverDashboard.messageAucuneOffre).toBeVisible();
  });

  test('CT-02-S04 · Champs vides', async ({ page, registerPage }) => {
    await registerPage.ouvrir();
    await registerPage.boutonRegister.click();

    // Attendu : le navigateur bloque l'envoi (champs obligatoires) et reste sur /register
    await expect(page).toHaveURL(/\/register$/);
    expect(await registerPage.champNom.evaluate((el: HTMLInputElement) => el.validity.valueMissing)).toBe(true);
  });

  test('CT-02-S05 · Email déjà utilisé', async ({ page, registerPage }) => {
    // Données : email du compte client existant
    await registerPage.ouvrir();
    await registerPage.inscrire({ ...nouveauCompte(), email: client.email });

    await expect(page).toHaveURL(/\/register$/);
    await expect(registerPage.message(msg.emailDejaPris)).toBeVisible();
  });

  test('CT-02-S06 · Mot de passe : 7 et 8 caractères', async ({ page, registerPage }) => {
    await test.step('a) 7 caractères → refusé', async () => {
      await registerPage.ouvrir();
      await registerPage.inscrire({ ...nouveauCompte(), motDePasse: motsDePasse.septCaracteres });
      await expect(registerPage.message(msg.motDePasseTropCourt)).toBeVisible();
      await expect(page).toHaveURL(/\/register$/);
    });
    await test.step('b) 8 caractères → accepté', async () => {
      await registerPage.ouvrir();
      await registerPage.inscrire({ ...nouveauCompte(), motDePasse: motsDePasse.huitCaracteres });
      await expect(page).toHaveURL(/\/client\/dashboard/);
    });
  });

  test('CT-02-S07 · Confirmation différente', async ({ page, registerPage }) => {
    await registerPage.ouvrir();
    await registerPage.inscrire({ ...nouveauCompte(), confirmation: 'Autre12345!' });

    await expect(page).toHaveURL(/\/register$/);
    await expect(registerPage.message(msg.confirmationDifferente)).toBeVisible();
  });

  test('CT-02-S08 · Format d\'email invalide', async ({ page, registerPage }) => {
    for (const email of [emailsInvalides.sansArobase, emailsInvalides.rienApresArobase]) {
      await test.step(`« ${email} »`, async () => {
        await registerPage.ouvrir();
        await registerPage.inscrire({ ...nouveauCompte(), email });
        // Attendu : refusé par le navigateur (champ de type email), on reste sur /register
        await expect(page).toHaveURL(/\/register$/);
        expect(await registerPage.champEmail.evaluate((el: HTMLInputElement) => el.validity.valid)).toBe(false);
      });
    }
  });

  test('CT-02-S09 · Email avec des majuscules', async ({ page, registerPage }) => {
    test.fail(true, 'ANO-001 : un email contenant une majuscule est refusé (« The email field must be lowercase. ») au lieu d\'être mis en minuscules');
    // Données : « Prenom.NOM…@Example.com » : un utilisateur tape souvent une majuscule au début
    const compte = nouveauCompte('maj');
    await registerPage.ouvrir();
    await registerPage.inscrire({ ...compte, email: compte.email.replace('maj', 'Maj').toUpperCase() });

    // Attendu (bonne pratique) : l'email est accepté et enregistré en minuscules
    await expect(page).toHaveURL(/\/client\/dashboard/);
  });

  test('CT-02-S10 · Rôle falsifié (admin) @securite', async ({ registerPage }) => {
    // Actions : envoyer le formulaire d'inscription « à la main » (F12 / Postman) avec role = admin
    const compte = nouveauCompte('pirate');
    await registerPage.ouvrir();
    const statut = await registerPage.envoyerPost('/register', {
      name: compte.nom,
      email: compte.email,
      password: compte.motDePasse,
      password_confirmation: compte.motDePasse,
      role: 'admin',
    });

    // Attendu : refusé par le serveur (422 = données invalides) — impossible de devenir administrateur
    expect(statut).toBe(422);
  });

  test('CT-02-S11 · Injection dans le nom @securite', async ({ page, registerPage, clientDashboard }) => {
    const compte = { ...nouveauCompte(), nom: injections.image };
    await registerPage.ouvrir();
    await registerPage.inscrire(compte);

    // Attendu : compte créé, le nom est affiché comme du TEXTE (aucun script exécuté)
    await expect(page).toHaveURL(/\/client\/dashboard/);
    await expect(clientDashboard.boutonProfil(injections.image)).toBeVisible();
    expect(clientDashboard.popupsOuvertes).toEqual([]);
  });

  test('CT-02-S12 · Lien Already registered?', async ({ page, registerPage }) => {
    await registerPage.ouvrir();
    await registerPage.lienDejaInscrit.click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('CT-02-S13 · Mots de passe masqués @securite', async ({ registerPage }) => {
    await registerPage.ouvrir();
    await expect(registerPage.champMotDePasse).toHaveAttribute('type', 'password');
    await expect(registerPage.champConfirmation).toHaveAttribute('type', 'password');
  });

  test('CT-02-S14 · Affichage mobile @mobile', async ({ page, registerPage }) => {
    await registerPage.ouvrir();
    expect(await registerPage.aUnDefilementHorizontal()).toBe(false);
    await registerPage.inscrire(nouveauCompte('mobile'));
    await expect(page).toHaveURL(/\/client\/dashboard/);
  });
});
