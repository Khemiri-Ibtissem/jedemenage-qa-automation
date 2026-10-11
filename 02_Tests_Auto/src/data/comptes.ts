/**
 * Comptes de test.
 * Les 3 comptes « seed » sont créés par database/seeders/DatabaseSeeder.php dans la base de TEST
 * (remise à zéro à chaque lancement) : ce ne sont pas de vrais comptes.
 * On peut les changer dans le fichier .env (voir .env.example).
 */
const motDePasseSeed = process.env.COMPTE_MDP || 'password';

export type Compte = { nom: string; email: string; motDePasse: string };

export const admin: Compte = {
  nom: 'Super Admin',
  email: process.env.COMPTE_ADMIN_EMAIL || 'admin@jedemenage.com',
  motDePasse: motDePasseSeed,
};

export const demenageur: Compte = {
  nom: 'Premium Mover',
  email: process.env.COMPTE_MOVER_EMAIL || 'mover@jedemenage.com',
  motDePasse: motDePasseSeed,
};

export const client: Compte = {
  nom: 'Relocation Client',
  email: process.env.COMPTE_CLIENT_EMAIL || 'client@jedemenage.com',
  motDePasse: motDePasseSeed,
};

/**
 * Valeur unique à chaque appel (ex. « 1728551234567-3 ») : chaque test crée SES données
 * (emails, adresses) → les tests ne se gênent jamais entre eux, même rejoués plusieurs fois.
 */
let compteur = 0;
export function unique(): string {
  compteur += 1;
  return `${Date.now()}-${compteur}`;
}

/** Un nouveau compte jamais inscrit (email en example.com : domaine réservé, n'existe pas). */
export function nouveauCompte(prefixe = 'qa'): Compte {
  const id = unique();
  return { nom: `QA ${prefixe} ${id}`, email: `${prefixe}.${id}@example.com`, motDePasse: 'Demenage2026!' };
}
