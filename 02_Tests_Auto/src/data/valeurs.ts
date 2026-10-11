/**
 * Données de test qui ne sont PAS des secrets (on peut les écrire ici).
 */

/** Date au format du champ « Preferred Move Date » (AAAA-MM-JJTHH:MM), dans N jours à 10 h. */
export function dansNJours(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  const deux = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}T10:00`;
}

// Mots de passe autour de la limite des 8 caractères (analyse des valeurs limites)
export const motsDePasse = {
  septCaracteres: 'Abcd123',  // 7 → refusé
  huitCaracteres: 'Abcd1234', // 8 → accepté
  faux: 'Faux12345',
};

// Emails au mauvais format
export const emailsInvalides = {
  sansArobase: 'jedemenage',
  rienApresArobase: 'jedemenage@',
};

// Tentatives d'injection (le site doit les afficher comme du texte, sans les exécuter)
export const injections = {
  script: '<script>alert(1)</script>',
  image: '<img src=x onerror=alert(1)>',
  sql: "' OR '1'='1",
};

// Objets de l'Inventory Builder (« Common Items ») et leur volume en m³
export const objets = {
  petiteBoite: { nom: 'Small Box', volume: 0.1 },
  moyenneBoite: { nom: 'Medium Box', volume: 0.2 },
  canape3: { nom: 'Sofa (3 Seater)', volume: 2.2 },
  frigo: { nom: 'Fridge', volume: 1.0 },
};

// Textes exacts affichés par l'application (en anglais). S'ils changent, on ne les corrige qu'ICI.
export const messages = {
  connexion: {
    identifiantsIncorrects: 'These credentials do not match our records.',
    tropDEssais: /Too many login attempts\. Please try again in \d+ seconds\./,
  },
  inscription: {
    emailDejaPris: 'The email has already been taken.',
    motDePasseTropCourt: 'The password field must be at least 8 characters.',
    confirmationDifferente: 'The password field confirmation does not match.',
    emailMajuscules: 'The email field must be lowercase.',
  },
  motDePasseOublie: {
    lienEnvoye: 'We have emailed your password reset link.',
    emailInconnu: "We can't find a user with that email address.",
  },
  demande: {
    dateDansLePasse: 'The move date field must be a date after today.',
    inventaireVide: 'The inventory field is required.',
    publiee: 'Relocation request posted successfully!',
  },
  offre: {
    prixTropBas: 'The price field must be at least 0.01.',
  },
  evaluation: {
    commentaireTropLong: 'The comment field must not be greater than 1000 characters.',
  },
  acces: {
    refuse: 'Unauthorized action.',
  },
};
