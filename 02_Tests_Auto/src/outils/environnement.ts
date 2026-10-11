import path from 'node:path';
import fs from 'node:fs';

/**
 * Tout ce qu'il faut pour lancer JeDemenage en mode « test », sans toucher à la base MySQL de développement.
 * Utilisé par playwright.config.ts (serveurs) et par global-setup.ts (remise à zéro de la base).
 */

// Racine du projet Laravel (2 dossiers au-dessus de QA/02_Tests_Auto)
export const RACINE_PROJET = path.resolve(__dirname, '../../../..');
export const DOSSIER_TESTS = path.resolve(__dirname, '../..');

// Base SQLite dédiée aux tests : recréée à chaque lancement (dossier .e2e, ignoré par Git)
export const BASE_DE_TEST = path.join(DOSSIER_TESTS, '.e2e', 'jedemenage-e2e.sqlite');

export const PORT_APP = 8010;
export const BASE_URL = process.env.BASE_URL ?? `http://127.0.0.1:${PORT_APP}`;

/**
 * Variables d'environnement données à PHP : elles passent AVANT celles du .env de Laravel.
 * → l'application utilise la base SQLite de test, et les emails partent dans storage/logs (pas d'envoi réel).
 */
export const ENV_LARAVEL: Record<string, string> = {
  APP_ENV: 'local',
  APP_URL: BASE_URL,
  DB_CONNECTION: 'sqlite',
  DB_DATABASE: BASE_DE_TEST,
  SESSION_DRIVER: 'database',
  CACHE_STORE: 'database', // le blocage après 5 mauvais mots de passe est remis à zéro avec la base
  QUEUE_CONNECTION: 'sync',
  MAIL_MAILER: 'log',
  // SQLite est désactivé dans le php.ini du PC : on l'active seulement pour les tests (php/e2e.ini)
  PHP_INI_SCAN_DIR: path.join(DOSSIER_TESTS, 'php'),
};

/**
 * Adresse du serveur Vite (les fichiers Vue/CSS en mode développement).
 * Laravel la lit dans public/hot : si ce fichier existe, on réutilise la même adresse.
 */
export function adresseVite(): { url: string; port: number } {
  const fichierHot = path.join(RACINE_PROJET, 'public', 'hot');
  const url = fs.existsSync(fichierHot)
    ? fs.readFileSync(fichierHot, 'utf8').trim()
    : 'http://localhost:5173';
  return { url, port: Number(new URL(url).port || 5173) };
}
