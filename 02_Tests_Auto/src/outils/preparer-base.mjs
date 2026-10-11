// Lancé par playwright.config.ts juste avant le serveur PHP.
// Remet la base de test à zéro : chaque lancement de tests part des mêmes données
// (les 3 comptes de database/seeders/DatabaseSeeder.php, et rien d'autre).
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const base = process.env.DB_DATABASE;
if (!base || !base.endsWith('.sqlite')) {
  // Garde-fou : on ne vide JAMAIS une autre base (ex. la base MySQL de développement)
  throw new Error(`DB_DATABASE doit être la base SQLite de test, reçu : ${base}`);
}

fs.mkdirSync(path.dirname(base), { recursive: true });
fs.writeFileSync(base, ''); // fichier vide = base vide

// Racine du projet Laravel : 4 dossiers au-dessus de ce fichier (QA/02_Tests_Auto/src/outils)
const racine = path.resolve(import.meta.dirname, '../../../..');
execSync('php artisan migrate:fresh --seed --force', { cwd: racine, stdio: 'inherit' });
