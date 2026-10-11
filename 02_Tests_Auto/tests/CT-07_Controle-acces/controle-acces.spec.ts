import { test, expect } from '../../src/fixtures/fixtures';
import { admin, client, demenageur } from '../../src/data/comptes';

/*
 * CT-07 · Contrôle d'accès par rôle (sécurité)
 * Chaque test = UN scénario de 01_Tests_Manuels/CT-07_Controle-acces/01_Scenario.docx
 *
 * Question posée à chaque fois : « un utilisateur peut-il voir ou modifier ce qui n'est pas à lui ? »
 * Les requêtes « à la main » (envoyerPost) imitent ce qu'on peut faire avec F12 ou Postman.
 */
test.describe('CT-07 · Contrôle d\'accès @securite', () => {

  test('CT-07-S01 · Client → pages déménageur et admin', async ({ parcours, ecran }) => {
    await parcours.connecter(client);
    for (const chemin of ['/mover/dashboard', '/mover/marketplace', '/mover/profile', '/admin/dashboard']) {
      await test.step(chemin, async () => {
        expect(await ecran.goto(chemin)).toBe(403);
      });
    }
  });

  test('CT-07-S02 · Déménageur → pages client et admin', async ({ parcours, ecran }) => {
    await parcours.connecter(demenageur);
    for (const chemin of ['/client/dashboard', '/client/requests/create', '/admin/dashboard']) {
      await test.step(chemin, async () => {
        expect(await ecran.goto(chemin)).toBe(403);
      });
    }
  });

  test('CT-07-S03 · Admin → pages client et déménageur', async ({ parcours, ecran }) => {
    await parcours.connecter(admin);
    for (const chemin of ['/client/dashboard', '/mover/marketplace']) {
      await test.step(chemin, async () => {
        expect(await ecran.goto(chemin)).toBe(403);
      });
    }
  });

  test('CT-07-S04 · /dashboard redirige selon le rôle', async ({ page, parcours, ecran }) => {
    const cas = [
      { compte: client, url: /\/client\/dashboard/ },
      { compte: demenageur, url: /\/mover\/dashboard/ },
      { compte: admin, url: /\/admin\/dashboard/ },
    ];
    for (const { compte, url } of cas) {
      await test.step(compte.nom, async () => {
        await parcours.connecter(compte);
        await ecran.goto('/dashboard');
        await expect(page).toHaveURL(url);
      });
    }
  });

  test('CT-07-S05 · Offres de la demande d\'un autre client', async ({ parcours, offresClient }) => {
    const { demande } = await parcours.demandeDansEtat('avec offre');
    await parcours.inscrire('client'); // un AUTRE client
    expect(await offresClient.ouvrir(demande.id)).toBe(403);
  });

  test('CT-07-S06 · Accepter une offre sur la demande d\'un autre client', async ({ parcours, offresClient, ecran }) => {
    const { demande } = await parcours.demandeDansEtat('avec offre');
    // Numéro de l'offre, lu par le vrai client (c'est la seule offre de la demande)
    await offresClient.ouvrir(demande.id);
    const { request } = await offresClient.donneesDeLaPage<{ request: { bids: { id: number }[] } }>();
    const idOffre = request.bids[0].id;

    await parcours.inscrire('client'); // un AUTRE client
    await ecran.goto('/client/dashboard');
    expect(await ecran.envoyerPost(`/client/bids/${idOffre}/accept`)).toBe(403);
  });

  test('CT-07-S07 · Terminer la demande d\'un autre client', async ({ parcours, ecran }) => {
    const { demande } = await parcours.demandeDansEtat('booked');
    await parcours.inscrire('client'); // un AUTRE client
    expect(await ecran.envoyerPost(`/client/requests/${demande.id}/complete`)).toBe(403);
  });

  test('CT-07-S08 · Suivre le déménagement d\'un autre client', async ({ parcours, suiviPage }) => {
    const { demande } = await parcours.demandeDansEtat('booked');
    await parcours.inscrire('client'); // un AUTRE client
    expect(await suiviPage.ouvrir(demande.id)).toBe(403);
  });

  test('CT-07-S09 · Suivi par un déménageur non choisi', async ({ parcours, suiviPage }) => {
    const { demande } = await parcours.demandeDansEtat('booked'); // choisi : déménageur seed
    await parcours.inscrire('mover'); // un AUTRE déménageur
    expect(await suiviPage.ouvrir(demande.id)).toBe(403);
    expect(await suiviPage.envoyerPost(`/requests/${demande.id}/location`, { lat: 1, lng: 1 })).toBe(403);
  });

  test('CT-07-S10 · Évaluer le déménagement d\'un autre client', async ({ parcours, evaluationPage, ecran }) => {
    test.fail(true, "ANO-012 : un client peut envoyer une note sur le déménagement d'un autre client (aucun contrôle dans RatingController@store)");
    const { demande } = await parcours.demandeDansEtat('completed');
    await parcours.inscrire('client'); // un AUTRE client

    await test.step('page d\'évaluation refusée', async () => {
      expect(await evaluationPage.ouvrir(demande.id)).toBe(403);
    });
    await test.step('envoi direct de la note refusé', async () => {
      await ecran.goto('/client/dashboard');
      expect(await ecran.envoyerPost(`/client/requests/${demande.id}/review`, { score: 1, comment: 'Faux avis' })).toBe(403);
    });
  });

  test('CT-07-S11 · Tableaux de bord « démo » sans connexion', async ({ ecran }) => {
    test.fail(true, "ANO-013 : /demo/dashboard/client plante (la page attend moveRequests, le contrôleur envoie requests)");
    // Le mode démo sert aux présentations : il ne doit montrer QUE des données fictives et ne pas planter
    for (const role of ['client', 'mover', 'admin']) {
      await test.step(role, async () => {
        expect(await ecran.goto(`/demo/dashboard/${role}`)).toBe(200);
        await expect(ecran.titreEcran).toBeVisible();
      });
    }
    expect(ecran.erreursJavaScript).toEqual([]);
  });
});
