import { test, expect } from '../../src/fixtures/fixtures';
import { demenageur } from '../../src/data/comptes';
import { objets, messages } from '../../src/data/valeurs';

/*
 * CT-05 · Offres : le déménageur propose un prix, le client accepte
 * Chaque test = UN scénario de 01_Tests_Manuels/CT-05_Offres/01_Scenario.docx
 *
 * Les données sont préparées avec « parcours » (nouveau client + nouvelle demande à chaque test).
 */
test.describe('CT-05 · Offres', () => {

  test('CT-05-S01 · La demande apparaît sur la marketplace @smoke', async ({ parcours, marketplace }) => {
    const { demande } = await parcours.demandeDansEtat('pending'); // Medium Box + Fridge = 1,2 m³, 2 objets
    await parcours.connecter(demenageur);
    await marketplace.ouvrir();

    await expect(marketplace.carte(demande.depart)).toBeVisible();
    await expect(marketplace.carte(demande.depart)).toContainText(demande.arrivee);
    await expect(marketplace.valeur(demande.depart, 'Volume')).toContainText('1.2');
    await expect(marketplace.valeur(demande.depart, 'Items')).toHaveText('2');
  });

  test('CT-05-S02 · Date de publication affichée', async ({ parcours, marketplace }) => {
    test.fail(true, 'ANO-004 : la carte affiche « Posted » sans date (champ created_at_human jamais envoyé)');
    const { demande } = await parcours.demandeDansEtat('pending');
    await parcours.connecter(demenageur);
    await marketplace.ouvrir();

    // Attendu : « Posted 1 minute ago » (ou équivalent) — pas « Posted » tout seul
    await expect(marketplace.datePublication(demande.depart)).toHaveText(/Posted\s+\S+/);
  });

  test('CT-05-S03 · Détail de la demande', async ({ page, parcours, marketplace, detailDemande }) => {
    const { client, demande } = await parcours.demandeDansEtat('pending');
    await parcours.connecter(demenageur);
    await marketplace.ouvrir();
    await marketplace.voirDetails(demande.depart);

    await expect(page).toHaveURL(new RegExp(`/mover/requests/${demande.id}$`));
    await expect(detailDemande.info('Pickup Point')).toHaveText(demande.depart);
    await expect(detailDemande.info('Drop-off Point')).toHaveText(demande.arrivee);
    await expect(detailDemande.info('Client')).toHaveText(client.nom);
    await expect(detailDemande.ligneInventaire(objets.moyenneBoite.nom)).toBeVisible();
    await expect(detailDemande.ligneInventaire(objets.frigo.nom)).toBeVisible();
    await expect(detailDemande.volumeTotal).toContainText('1.20');
    await expect(detailDemande.messageAucuneOffre).toBeVisible();
  });

  test('CT-05-S04 · Offre valide @smoke', async ({ page, parcours, detailDemande, moverDashboard }) => {
    const { demande } = await parcours.demandeDansEtat('pending');
    await parcours.connecter(demenageur);
    await detailDemande.ouvrir(demande.id);
    await detailDemande.proposerPrix('850');

    // Attendu : retour au tableau de bord du déménageur, l'offre est listée avec son prix
    await expect(page).toHaveURL(/\/mover\/dashboard/);
    await expect(moverDashboard.ligneOffre(demande.depart)).toContainText('$850');
    await expect(moverDashboard.ligneOffre(demande.depart)).toContainText(/pending/i);
  });

  test('CT-05-S05 · Prix à 0 ou négatif', async ({ page, parcours, detailDemande }) => {
    const { demande } = await parcours.demandeDansEtat('pending');
    await parcours.connecter(demenageur);
    // Valeurs limites : 0 et -10 → refusés (minimum 0,01)
    for (const prix of ['0', '-10']) {
      await test.step(`prix ${prix}`, async () => {
        await detailDemande.ouvrir(demande.id);
        await detailDemande.proposerPrix(prix);
        await expect(detailDemande.message(messages.offre.prixTropBas)).toBeVisible();
        await expect(page).toHaveURL(new RegExp(`/mover/requests/${demande.id}$`));
      });
    }
  });

  test('CT-05-S06 · Prix vide', async ({ page, parcours, detailDemande }) => {
    const { demande } = await parcours.demandeDansEtat('pending');
    await parcours.connecter(demenageur);
    await detailDemande.ouvrir(demande.id);
    await detailDemande.boutonEnvoyerOffre.click();

    await expect(page).toHaveURL(new RegExp(`/mover/requests/${demande.id}$`));
    expect(await detailDemande.champPrix.evaluate((el: HTMLInputElement) => el.validity.valueMissing)).toBe(true);
  });

  test('CT-05-S07 · Le client voit l\'offre @smoke', async ({ page, parcours, clientDashboard, offresClient }) => {
    const { demande } = await parcours.demandeDansEtat('avec offre'); // offre de 850 $
    await clientDashboard.ouvrir();
    await expect(clientDashboard.nombreOffres(demande.depart)).toContainText('1 Offers Received');

    await clientDashboard.boutonVoirOffres(demande.depart).click();
    await expect(page).toHaveURL(new RegExp(`/client/requests/${demande.id}/bids$`));
    await expect(offresClient.carteOffre(demenageur.nom)).toBeVisible();
    await expect(offresClient.prix(demenageur.nom)).toHaveText('$850');
  });

  test('CT-05-S08 · Annuler l\'acceptation', async ({ page, parcours, offresClient, clientDashboard }) => {
    const { demande } = await parcours.demandeDansEtat('avec offre');
    await offresClient.ouvrir(demande.id);
    await offresClient.accepter(demenageur.nom, false); // « Annuler » dans la fenêtre de confirmation

    // Attendu : rien ne change
    await expect(page).toHaveURL(new RegExp(`/client/requests/${demande.id}/bids$`));
    await clientDashboard.ouvrir();
    await expect(clientDashboard.statut(demande.depart)).toHaveText('pending');
  });

  test('CT-05-S09 · Accepter une offre @smoke', async ({ page, parcours, offresClient, clientDashboard, marketplace }) => {
    const { demande } = await parcours.demandeDansEtat('avec offre');
    await offresClient.ouvrir(demande.id);
    await offresClient.accepter(demenageur.nom);

    // Attendu : demande « booked », boutons de suivi et de clôture visibles
    await expect(page).toHaveURL(/\/client\/dashboard/);
    await expect(clientDashboard.statut(demande.depart)).toHaveText('booked');
    await expect(clientDashboard.boutonSuivre(demande.depart)).toBeVisible();
    await expect(clientDashboard.boutonTerminer(demande.depart)).toBeVisible();
    await expect(clientDashboard.boutonVoirOffres(demande.depart)).toBeHidden();

    await test.step('la demande n\'est plus sur la marketplace', async () => {
      await parcours.connecter(demenageur);
      await marketplace.ouvrir();
      await expect(marketplace.carte(demande.depart)).toHaveCount(0);
    });
  });

  test('CT-05-S10 · Plusieurs offres : une acceptée, les autres refusées', async ({ parcours, offresClient, moverDashboard }) => {
    const { client, demande } = await parcours.demandeDansEtat('pending');
    const deuxiemeDemenageur = await parcours.inscrire('mover');
    await parcours.faireOffre(demande, '700', deuxiemeDemenageur);
    await parcours.faireOffre(demande, '900', demenageur);

    // Le client choisit l'offre du déménageur « seed » (900 $)
    await parcours.connecter(client);
    await offresClient.ouvrir(demande.id);
    await expect(offresClient.carteOffre(deuxiemeDemenageur.nom)).toBeVisible();
    await offresClient.accepter(demenageur.nom);

    await test.step('déménageur choisi : offre acceptée', async () => {
      await parcours.connecter(demenageur);
      await moverDashboard.ouvrir();
      await expect(moverDashboard.ligneOffre(demande.depart).getByRole('link', { name: 'Track & Update' })).toBeVisible();
    });
    await test.step('autre déménageur : offre refusée, pas de suivi', async () => {
      await parcours.connecter(deuxiemeDemenageur);
      await moverDashboard.ouvrir();
      await expect(moverDashboard.ligneOffre(demande.depart)).toContainText(/rejected/i);
      await expect(moverDashboard.ligneOffre(demande.depart).getByRole('link', { name: 'Track & Update' })).toHaveCount(0);
    });
  });

  test('CT-05-S11 · Offre sur une demande déjà réservée @securite', async ({ parcours, detailDemande }) => {
    test.fail(true, 'ANO-005 : le serveur accepte une offre sur une demande déjà réservée');
    const { demande } = await parcours.demandeDansEtat('booked');
    await parcours.inscrire('mover'); // un autre déménageur, connecté

    // Actions : un autre déménageur ouvre la demande par son adresse et envoie une offre
    await detailDemande.ouvrir(demande.id);
    const statut = await detailDemande.envoyerPost(`/mover/requests/${demande.id}/bids`, { price: 500 });

    // Attendu : refusé (la demande n'est plus « pending »)
    expect([403, 422]).toContain(statut);
  });
});
