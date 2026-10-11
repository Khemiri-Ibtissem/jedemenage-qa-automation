import { test, expect } from '../../src/fixtures/fixtures';
import { demenageur } from '../../src/data/comptes';
import { messages } from '../../src/data/valeurs';

/*
 * CT-06 · Suivi en direct, clôture et évaluation
 * Chaque test = UN scénario de 01_Tests_Manuels/CT-06_Suivi-cloture-evaluation/01_Scenario.docx
 *
 * Restent MANUELS (voir 00_Plan_de_test.docx) : S12 Carte et déplacement du camion (jugement visuel).
 */
test.describe('CT-06 · Suivi, clôture et évaluation', () => {

  test('CT-06-S01 · Suivi par le client @smoke', async ({ page, parcours, clientDashboard, suiviPage }) => {
    test.fail(true, 'ANO-006 : page de suivi : « No mover assigned yet » même après réservation (computed non importé dans Tracking.vue)');
    const { demande } = await parcours.demandeDansEtat('booked');
    await clientDashboard.ouvrir();
    await clientDashboard.boutonSuivre(demande.depart).click();

    // Attendu : page de suivi, carte, déménageur assigné, PAS de bouton GPS pour le client
    await expect(page).toHaveURL(new RegExp(`/requests/${demande.id}/track$`));
    await expect(suiviPage.titreEcran).toContainText(demande.depart);
    await expect(suiviPage.carte).toBeVisible();
    await expect(suiviPage.demenageurAssigne).toContainText(demenageur.nom);
    await expect(suiviPage.boutonSimulerGps).toHaveCount(0);
  });

  test('CT-06-S02 · Position GPS envoyée par le déménageur @smoke', async ({ page, parcours, moverDashboard, suiviPage, clientDashboard }) => {
    const { client, demande } = await parcours.demandeDansEtat('booked');
    await parcours.connecter(demenageur);
    await moverDashboard.ouvrir();
    await moverDashboard.suivre(demande.depart);
    await expect(page).toHaveURL(new RegExp(`/requests/${demande.id}/track$`));

    await suiviPage.simulerEtapeGps();

    await test.step('le client voit « in-transit »', async () => {
      await parcours.connecter(client);
      await clientDashboard.ouvrir();
      await expect(clientDashboard.statut(demande.depart)).toHaveText('in-transit');
    });
  });

  test('CT-06-S03 · Bouton Exit Tracking', async ({ page, parcours, suiviPage }) => {
    const { demande } = await parcours.demandeDansEtat('booked');
    await suiviPage.ouvrir(demande.id);
    await suiviPage.lienQuitter.click();
    await expect(page).toHaveURL(/\/client\/dashboard/);
  });

  test('CT-06-S04 · Marquer comme terminé @smoke', async ({ parcours, clientDashboard }) => {
    const { demande } = await parcours.demandeDansEtat('in-transit');
    await clientDashboard.ouvrir();
    await clientDashboard.boutonTerminer(demande.depart).click();

    // Attendu : « completed », bouton « Rate Your Mover », plus de suivi
    await expect(clientDashboard.statut(demande.depart)).toHaveText('completed');
    await expect(clientDashboard.boutonEvaluer(demande.depart)).toBeVisible();
    await expect(clientDashboard.boutonSuivre(demande.depart)).toBeHidden();
    await expect(clientDashboard.boutonTerminer(demande.depart)).toBeHidden();
  });

  test('CT-06-S05 · Évaluer le déménageur @smoke', async ({ page, parcours, clientDashboard, evaluationPage }) => {
    test.fail(true, 'ANO-007 : « Submit Professional Review » ne fait rien (Ziggy : route requests.review.store inconnue)');
    const { demande } = await parcours.demandeDansEtat('completed');
    await clientDashboard.ouvrir();
    await clientDashboard.boutonEvaluer(demande.depart).click();

    await expect(page).toHaveURL(new RegExp(`/client/requests/${demande.id}/review$`));
    await expect(evaluationPage.titreEcran).toContainText(demenageur.nom);
    await expect(evaluationPage.etoiles).toHaveCount(5);
    await evaluationPage.evaluer(4, 'Ponctuel et soigneux.');

    await expect(page).toHaveURL(/\/client\/dashboard/);
  });

  test('CT-06-S06 · Plus de bouton « Rate Your Mover » après évaluation', async ({ parcours, clientDashboard, evaluationPage }) => {
    test.fail(true, "ANO-008 : « Rate Your Mover » reste affiché après l'évaluation (la note n'est pas chargée avec la demande)");
    const { demande } = await parcours.demandeDansEtat('completed');
    // L'évaluation est envoyée directement au serveur : le bouton de la page est cassé (ANO-007)
    await evaluationPage.ouvrir(demande.id);
    expect(await evaluationPage.envoyerPost(`/client/requests/${demande.id}/review`, { score: 5, comment: 'Parfait.' })).toBe(302);
    await clientDashboard.ouvrir();

    // Attendu : on ne peut évaluer qu'une fois → le bouton disparaît
    await expect(clientDashboard.boutonEvaluer(demande.depart)).toBeHidden();
  });

  test('CT-06-S07 · Deuxième évaluation refusée', async ({ parcours, evaluationPage }) => {
    test.fail(true, 'ANO-009 : le serveur accepte une 2e évaluation pour le même déménagement');
    const { demande } = await parcours.demandeDansEtat('completed');
    await evaluationPage.ouvrir(demande.id);
    const chemin = `/client/requests/${demande.id}/review`;

    // 1re note acceptée (envoi direct : le bouton de la page est cassé, ANO-007)
    expect(await evaluationPage.envoyerPost(chemin, { score: 5, comment: 'Première note.' })).toBe(302);
    // Attendu : la 2e est refusée proprement (pas d'erreur serveur, pas de 2e note)
    expect([403, 422]).toContain(await evaluationPage.envoyerPost(chemin, { score: 1, comment: 'Deuxième note' }));
  });

  test('CT-06-S08 · Commentaire trop long (1001 caractères)', async ({ page, parcours, evaluationPage }) => {
    test.fail(true, "Bloqué par ANO-007 : le formulaire d'évaluation ne s'envoie pas (la règle 1000 caractères existe côté serveur)");
    const { demande } = await parcours.demandeDansEtat('completed');
    await evaluationPage.ouvrir(demande.id);
    await evaluationPage.evaluer(3, 'a'.repeat(1001));

    await expect(evaluationPage.message(messages.evaluation.commentaireTropLong)).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/client/requests/${demande.id}/review$`));
  });

  test('CT-06-S09 · Note hors limites (0 et 6) @securite', async ({ parcours, evaluationPage }) => {
    const { demande } = await parcours.demandeDansEtat('completed');
    await evaluationPage.ouvrir(demande.id);
    for (const score of [0, 6]) {
      await test.step(`note ${score}`, async () => {
        const statut = await evaluationPage.envoyerPost(`/client/requests/${demande.id}/review`, { score, comment: '' });
        expect(statut).toBe(422);
      });
    }
  });

  test('CT-06-S10 · Évaluer un déménagement non terminé', async ({ parcours, evaluationPage }) => {
    const { demande } = await parcours.demandeDansEtat('booked');
    const statut = await evaluationPage.ouvrir(demande.id);
    expect(statut).toBe(403);
  });

  test('CT-06-S11 · Terminer une demande sans déménageur', async ({ parcours, ecran, clientDashboard }) => {
    test.fail(true, 'ANO-010 : le serveur accepte de terminer une demande « pending » (aucun contrôle du statut)');
    const { demande } = await parcours.demandeDansEtat('pending');
    await clientDashboard.ouvrir();
    // Le bouton n'est pas proposé…
    await expect(clientDashboard.boutonTerminer(demande.depart)).toHaveCount(0);

    // … mais on envoie la demande « à la main » : le serveur doit refuser
    const statut = await ecran.envoyerPost(`/client/requests/${demande.id}/complete`);
    expect([403, 422]).toContain(statut);
  });

  test('CT-06-S13 · Position GPS après la fin du déménagement', async ({ parcours, suiviPage, clientDashboard }) => {
    test.fail(true, 'ANO-011 : une position GPS repasse un déménagement « completed » en « in-transit »');
    const { client, demande } = await parcours.demandeDansEtat('completed');

    // Actions : le déménageur rouvre le suivi (adresse) et envoie encore une position
    await parcours.connecter(demenageur);
    await suiviPage.ouvrir(demande.id);
    await suiviPage.envoyerPost(`/requests/${demande.id}/location`, { lat: 43.3, lng: 5.4 });

    // Attendu : le déménagement reste « completed »
    await parcours.connecter(client);
    await clientDashboard.ouvrir();
    await expect(clientDashboard.statut(demande.depart)).toHaveText('completed');
  });

  test('CT-06-S14 · Statut mis à jour sur la page de suivi', async ({ parcours, suiviPage }) => {
    test.fail(true, 'ANO-014 : après « Simulate GPS Step », le badge de la page de suivi reste « booked » (le serveur est bien passé à in-transit)');
    const { demande } = await parcours.demandeDansEtat('booked');
    await parcours.connecter(demenageur);
    await suiviPage.ouvrir(demande.id);
    await suiviPage.simulerEtapeGps();
    await expect(suiviPage.statut).toHaveText('in-transit');
  });
});
