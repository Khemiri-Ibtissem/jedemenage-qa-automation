import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config'; // charge les variables du fichier .env dans process.env
import path from 'node:path';
import { BASE_URL, PORT_APP, RACINE_PROJET, ENV_LARAVEL, adresseVite } from './src/outils/environnement';

const vite = adresseVite();
const routeurLaravel = 'vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php';
const preparerBase = path.join(__dirname, 'src/outils/preparer-base.mjs');

export default defineConfig({
  // Dossier où Playwright cherche les fichiers *.spec.ts
  testDir: './tests',

  // Temps max pour UN test, et pour UN expect.
  // Certains tests préparent un parcours complet (client → offre → réservation → GPS → fin) :
  // avec le serveur PHP intégré (1 requête à la fois), il faut une large marge.
  timeout: 120_000,
  expect: { timeout: 10_000 },

  // Tous les tests partagent la même base de test, et le serveur PHP intégré ne traite
  // qu'une requête à la fois → 1 seul navigateur à la fois : résultats stables et rejouables
  workers: 1,
  fullyParallel: false,

  // Pas de nouvelle tentative : un test instable doit se voir, pas être caché
  retries: 0,

  // Rapport dans le terminal (list) + rapport HTML (npm run report)
  reporter: [['list'], ['html', { open: 'never' }]],

  // Réglages communs à tous les tests
  use: {
    baseURL: BASE_URL,               // page.goto('/login') → http://127.0.0.1:8010/login
    locale: 'en-US',                 // l'application est en anglais
    screenshot: 'only-on-failure',   // capture d'écran si le test échoue
    video: 'retain-on-failure',      // vidéo gardée seulement si échec
    trace: 'retain-on-failure',      // trace (film pas à pas) gardée seulement si échec
    // Ralenti pour REGARDER un test : pause (en ms) entre chaque action. 0 = vitesse normale.
    launchOptions: { slowMo: Number(process.env.LENTEUR ?? 0) },
  },

  // Les 2 serveurs nécessaires, démarrés automatiquement par Playwright et arrêtés à la fin
  webServer: [
    {
      // Vite : sert les fichiers Vue/CSS. Si `npm run dev` tourne déjà, il est réutilisé.
      command: `npx vite --port ${vite.port} --strictPort`,
      cwd: RACINE_PROJET,
      url: `${vite.url}/@vite/client`,
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      // Laravel sur une base SQLite de test remise à zéro (la base MySQL n'est jamais touchée)
      // (lancé depuis public/, comme `php artisan serve`)
      command: `node "${preparerBase}" && php -S 127.0.0.1:${PORT_APP} ../${routeurLaravel}`,
      cwd: path.join(RACINE_PROJET, 'public'),
      env: ENV_LARAVEL,
      url: `${BASE_URL}/up`,
      reuseExistingServer: false, // toujours un serveur neuf → toujours une base neuve
      timeout: 120_000,
    },
  ],

  // Les "projets" = les appareils sur lesquels on lance les tests
  projects: [
    {
      name: 'chromium',
      // channel: 'chrome' → on utilise le Google Chrome installé sur le PC (aucun téléchargement)
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
      grepInvert: /@mobile/, // tous les tests SAUF ceux marqués @mobile
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'], channel: 'chrome' }, // Chrome qui imite un téléphone
      grep: /@mobile/, // UNIQUEMENT les tests marqués @mobile
    },
  ],
});
