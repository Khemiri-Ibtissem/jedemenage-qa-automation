import { test, expect } from '../../src/fixtures/fixtures';
import { admin } from '../../src/data/comptes';

/*
 * CT-08 · Tableau de bord administrateur
 * Chaque test = UN scénario de 01_Tests_Manuels/CT-08_Administration/01_Scenario.docx
 *
 * La base de test est partagée par tous les tests : on compare donc des chiffres AVANT / APRÈS,
 * jamais des chiffres fixes.
 */
test.describe('CT-08 · Administration', () => {

  test('CT-08-S01 · Affichage du tableau de bord @smoke', async ({ parcours, adminDashboard }) => {
    await parcours.connecter(admin);
    await adminDashboard.ouvrir();

    await expect(adminDashboard.titreEcran).toHaveText('Admin Control Center');
    for (const tuile of ['Total Users', 'Active Movers', 'Active Clients', 'Active Moves'] as const) {
      await expect(adminDashboard.statistique(tuile)).toHaveText(/^\s*\d+\s*$/);
    }
    await expect(adminDashboard.listeInscrits).toBeVisible();
    await expect(adminDashboard.listeDemenagements).toBeVisible();
  });

  test('CT-08-S02 · Les compteurs suivent les inscriptions', async ({ parcours, adminDashboard }) => {
    await parcours.connecter(admin);
    await adminDashboard.ouvrir();
    const avant = {
      total: Number(await adminDashboard.valeurStatistique('Total Users')),
      demenageurs: Number(await adminDashboard.valeurStatistique('Active Movers')),
      clients: Number(await adminDashboard.valeurStatistique('Active Clients')),
    };

    await parcours.inscrire('client');
    await parcours.inscrire('mover');
    await parcours.connecter(admin);
    await adminDashboard.ouvrir();

    expect(Number(await adminDashboard.valeurStatistique('Total Users'))).toBe(avant.total + 2);
    expect(Number(await adminDashboard.valeurStatistique('Active Movers'))).toBe(avant.demenageurs + 1);
    expect(Number(await adminDashboard.valeurStatistique('Active Clients'))).toBe(avant.clients + 1);
  });

  test('CT-08-S03 · Nouvel inscrit dans « Recently Registered »', async ({ parcours, adminDashboard }) => {
    const nouveau = await parcours.inscrire('mover');
    await parcours.connecter(admin);
    await adminDashboard.ouvrir();

    await expect(adminDashboard.inscrit(nouveau.email)).toBeVisible();
    await expect(adminDashboard.inscrit(nouveau.email)).toContainText(/mover/i);
    await expect(adminDashboard.inscrit(nouveau.email)).toContainText('Unverified');
  });

  test('CT-08-S04 · Nouvelle demande dans « Latest Relocations »', async ({ parcours, adminDashboard }) => {
    const { client, demande } = await parcours.demandeDansEtat('pending');
    await parcours.connecter(admin);
    await adminDashboard.ouvrir();

    await expect(adminDashboard.demenagement(demande.depart)).toBeVisible();
    await expect(adminDashboard.demenagement(demande.depart)).toContainText(client.nom);
    await expect(adminDashboard.demenagement(demande.depart)).toContainText('pending');
  });

  test('CT-08-S05 · Bouton Verify d\'un déménageur', async ({ parcours, adminDashboard }) => {
    test.fixme(true, 'Fonctionnalité pas finie : les boutons Verify et Manage ne sont reliés à aucune action (code du 10/10/2026)');
    const nouveau = await parcours.inscrire('mover');
    await parcours.connecter(admin);
    await adminDashboard.ouvrir();
    await adminDashboard.inscrit(nouveau.email).getByRole('button', { name: 'Verify' }).click();
    await expect(adminDashboard.inscrit(nouveau.email)).not.toContainText('Unverified');
  });
});
