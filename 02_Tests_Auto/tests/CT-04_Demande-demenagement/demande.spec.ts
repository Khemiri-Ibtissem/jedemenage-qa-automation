import { test, expect } from '../../src/fixtures/fixtures';
import { unique } from '../../src/data/comptes';
import { dansNJours, injections, objets, messages } from '../../src/data/valeurs';

/*
 * CT-04 · Demande de déménagement (espace client)
 * Chaque test = UN scénario de 01_Tests_Manuels/CT-04_Demande-demenagement/01_Scenario.docx
 *
 * Chaque test inscrit un NOUVEAU client : son tableau de bord est vide au départ.
 */
const msg = messages.demande;

test.describe('CT-04 · Demande de déménagement', () => {

  test.beforeEach(async ({ parcours }) => {
    await parcours.inscrire('client');
  });

  test('CT-04-S01 · Tableau de bord vide', async ({ page, clientDashboard }) => {
    await clientDashboard.ouvrir();
    await expect(clientDashboard.messageAucuneDemande).toBeVisible();
    await clientDashboard.boutonPremiereDemande.click();
    await expect(page).toHaveURL(/\/client\/requests\/create$/);
  });

  test('CT-04-S02 · Affichage du formulaire @smoke', async ({ nouvelleDemande }) => {
    await nouvelleDemande.ouvrir();

    await expect(nouvelleDemande.titreEcran).toHaveText('Post New Relocation Request');
    await expect(nouvelleDemande.champDepart).toBeVisible();
    await expect(nouvelleDemande.champArrivee).toBeVisible();
    await expect(nouvelleDemande.champDate).toHaveAttribute('type', 'datetime-local');
    await expect(nouvelleDemande.inventaireVide).toBeVisible();
    await expect(nouvelleDemande.volumeTotal).toHaveText('0.00 m³');
    await expect(nouvelleDemande.boutonPublier).toBeDisabled();
  });

  test('CT-04-S03 · Bouton désactivé tant qu\'un champ manque', async ({ nouvelleDemande }) => {
    // Table de décision : le bouton ne s'active qu'avec départ + arrivée + date
    await nouvelleDemande.ouvrir();
    await nouvelleDemande.champDepart.fill('Paris');
    await expect(nouvelleDemande.boutonPublier).toBeDisabled();
    await nouvelleDemande.champArrivee.fill('Nice');
    await expect(nouvelleDemande.boutonPublier).toBeDisabled();
    await nouvelleDemande.champDate.fill(dansNJours(10));
    await expect(nouvelleDemande.boutonPublier).toBeEnabled();
    await nouvelleDemande.champDepart.fill('');
    await expect(nouvelleDemande.boutonPublier).toBeDisabled();
  });

  test('CT-04-S04 · Ajout d\'objets et calcul du volume @smoke', async ({ nouvelleDemande }) => {
    await nouvelleDemande.ouvrir();

    // Données : Medium Box ×2 (0,2 m³) + Fridge ×1 (1 m³) → 1,40 m³, 3 objets
    await nouvelleDemande.ajouterObjet(objets.moyenneBoite.nom, 2);
    await nouvelleDemande.ajouterObjet(objets.frigo.nom);

    await expect(nouvelleDemande.quantite(objets.moyenneBoite.nom)).toHaveText('2');
    await expect(nouvelleDemande.volumeTotal).toHaveText('1.40 m³');
    await expect(nouvelleDemande.nombreObjets).toContainText('3');
    await expect(nouvelleDemande.chargeEstimee).toHaveText('1.40 m³');
    await expect(nouvelleDemande.inventaireVide).toBeHidden();
  });

  test('CT-04-S05 · Boutons + et - (minimum 1)', async ({ nouvelleDemande }) => {
    await nouvelleDemande.ouvrir();
    await nouvelleDemande.ajouterObjet(objets.canape3.nom);

    await nouvelleDemande.plus(objets.canape3.nom);
    await expect(nouvelleDemande.quantite(objets.canape3.nom)).toHaveText('2');
    await expect(nouvelleDemande.volumeTotal).toHaveText('4.40 m³');

    // Valeur limite : « - » à 1 ne descend pas à 0
    await nouvelleDemande.moins(objets.canape3.nom);
    await nouvelleDemande.moins(objets.canape3.nom);
    await expect(nouvelleDemande.quantite(objets.canape3.nom)).toHaveText('1');
    await expect(nouvelleDemande.volumeTotal).toHaveText('2.20 m³');
  });

  test('CT-04-S06 · Objet fragile', async ({ nouvelleDemande }) => {
    await nouvelleDemande.ouvrir();
    await nouvelleDemande.ajouterObjet(objets.frigo.nom);

    await expect(nouvelleDemande.boutonFragile(objets.frigo.nom)).toHaveText('Mark Fragile');
    await nouvelleDemande.boutonFragile(objets.frigo.nom).click();
    await expect(nouvelleDemande.boutonFragile(objets.frigo.nom)).toHaveText('Fragile');
    await nouvelleDemande.boutonFragile(objets.frigo.nom).click();
    await expect(nouvelleDemande.boutonFragile(objets.frigo.nom)).toHaveText('Mark Fragile');
  });

  test('CT-04-S07 · Supprimer un objet', async ({ nouvelleDemande }) => {
    await nouvelleDemande.ouvrir();
    await nouvelleDemande.ajouterObjet(objets.petiteBoite.nom);
    await nouvelleDemande.supprimer(objets.petiteBoite.nom);

    await expect(nouvelleDemande.ligneInventaire(objets.petiteBoite.nom)).toHaveCount(0);
    await expect(nouvelleDemande.inventaireVide).toBeVisible();
    await expect(nouvelleDemande.volumeTotal).toHaveText('0.00 m³');
  });

  test('CT-04-S08 · Récapitulatif en direct', async ({ nouvelleDemande }) => {
    await nouvelleDemande.ouvrir();
    await expect(nouvelleDemande.resumeDate).toHaveText('Not set');
    await nouvelleDemande.remplir('Lyon', 'Marseille', dansNJours(10));

    await expect(nouvelleDemande.resumeTrajet).toContainText('Lyon');
    await expect(nouvelleDemande.resumeTrajet).toContainText('Marseille');
    await expect(nouvelleDemande.resumeDate).not.toHaveText('Not set');
  });

  test('CT-04-S09 · Publication valide @smoke', async ({ page, nouvelleDemande, clientDashboard }) => {
    const depart = `Paris QA-${unique()}`;
    await nouvelleDemande.ouvrir();
    await nouvelleDemande.publier({ depart, arrivee: 'Nice', date: dansNJours(10), objets: [objets.moyenneBoite.nom] });

    // Attendu : retour au tableau de bord, la demande apparaît « pending » avec 0 offre
    await expect(page).toHaveURL(/\/client\/dashboard/);
    await expect(clientDashboard.carte(depart)).toBeVisible();
    await expect(clientDashboard.statut(depart)).toHaveText('pending');
    await expect(clientDashboard.nombreOffres(depart)).toContainText('0 Offers Received');
    await expect(clientDashboard.boutonVoirOffres(depart)).toBeVisible();
    await expect(clientDashboard.boutonNouvelleDemande).toBeVisible();
  });

  test('CT-04-S10 · Message de confirmation après publication', async ({ nouvelleDemande, clientDashboard }) => {
    test.fail(true, 'ANO-002 : les messages de confirmation (flash) ne sont jamais transmis aux pages (HandleInertiaRequests)');
    await nouvelleDemande.ouvrir();
    await nouvelleDemande.publier({ depart: `Paris QA-${unique()}`, arrivee: 'Nice', date: dansNJours(10), objets: [objets.frigo.nom] });

    // Attendu : « Relocation request posted successfully! » (message prévu par le contrôleur)
    await expect(clientDashboard.message(msg.publiee)).toBeVisible();
  });

  test('CT-04-S11 · Date dans le passé ou aujourd\'hui', async ({ page, nouvelleDemande }) => {
    test.fail(true, 'ANO-003 : une date d\'aujourd\'hui est acceptée, même à une heure déjà passée (règle after:today)');
    // Valeurs limites : hier, aujourd'hui → refusées ; demain → acceptée
    for (const jours of [-1, 0]) {
      await test.step(`dans ${jours} jour(s) → refusée`, async () => {
        await nouvelleDemande.ouvrir();
        await nouvelleDemande.publier({ depart: `Paris QA-${unique()}`, arrivee: 'Nice', date: dansNJours(jours), objets: [objets.frigo.nom] });
        await expect(nouvelleDemande.message(msg.dateDansLePasse)).toBeVisible();
        await expect(page).toHaveURL(/\/client\/requests\/create$/);
      });
    }
    await test.step('demain → acceptée', async () => {
      await nouvelleDemande.ouvrir();
      await nouvelleDemande.publier({ depart: `Paris QA-${unique()}`, arrivee: 'Nice', date: dansNJours(1), objets: [objets.frigo.nom] });
      await expect(page).toHaveURL(/\/client\/dashboard/);
    });
  });

  test('CT-04-S12 · Inventaire vide', async ({ page, nouvelleDemande }) => {
    await nouvelleDemande.ouvrir();
    await nouvelleDemande.publier({ depart: `Paris QA-${unique()}`, arrivee: 'Nice', date: dansNJours(10), objets: [] });

    await expect(nouvelleDemande.message(msg.inventaireVide)).toBeVisible();
    await expect(page).toHaveURL(/\/client\/requests\/create$/);
  });

  test('CT-04-S13 · Injection dans les adresses @securite', async ({ nouvelleDemande, clientDashboard }) => {
    const depart = `${injections.image} QA-${unique()}`;
    await nouvelleDemande.ouvrir();
    await nouvelleDemande.publier({ depart, arrivee: injections.script, date: dansNJours(10), objets: [objets.frigo.nom] });

    // Attendu : adresses affichées comme du TEXTE, aucun script exécuté
    await expect(clientDashboard.carte(depart)).toBeVisible();
    expect(clientDashboard.popupsOuvertes).toEqual([]);
  });

  test('CT-04-S14 · Affichage mobile @mobile', async ({ nouvelleDemande }) => {
    await nouvelleDemande.ouvrir();
    await nouvelleDemande.ajouterObjet(objets.frigo.nom);
    expect(await nouvelleDemande.aUnDefilementHorizontal()).toBe(false);
    await expect(nouvelleDemande.boutonPublier).toBeVisible();
  });
});
