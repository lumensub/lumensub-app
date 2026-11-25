/**
 * UI strings. English is the source of truth: every other locale is typed
 * against it, so a missing key fails the typecheck rather than rendering
 * an empty label.
 */
const en = {
  "nav.merchants": "Merchants",
  "nav.account": "My subscriptions",
  "nav.docs": "Docs",
  "nav.skip": "Skip to content",
  "wallet.connect": "Connect wallet",
  "wallet.connecting": "Connecting...",
  "wallet.disconnect": "Disconnect",
  "wallet.missing": "Install Freighter to continue",
  "theme.toggle": "Toggle dark mode",
  "locale.label": "Language",
  "common.loading": "Loading...",
  "common.retry": "Try again",
  "common.offline": "The LumenSub API isn't reachable right now. Showing what we can.",
  "status.Trialing": "Trial",
  "status.Active": "Active",
  "status.PastDue": "Past due",
  "status.Paused": "Paused",
  "status.Cancelled": "Cancelled",
  "status.Lapsed": "Lapsed",
  "status.Completed": "Completed",
  "checkout.title": "Subscribe",
  "checkout.approve": "Confirm subscription",
  "checkout.success": "You're subscribed",
  "account.title": "Your subscriptions",
  "account.empty": "No subscriptions for this wallet yet.",
  "merchant.title": "Merchant dashboard",
  "footer.note": "Recurring payments on Stellar, settled by Soroban contracts.",
} as const;

export type MessageKey = keyof typeof en;
export type Messages = Record<MessageKey, string>;

const fr: Messages = {
  "nav.merchants": "Marchands",
  "nav.account": "Mes abonnements",
  "nav.docs": "Docs",
  "nav.skip": "Aller au contenu",
  "wallet.connect": "Connecter le portefeuille",
  "wallet.connecting": "Connexion...",
  "wallet.disconnect": "Déconnecter",
  "wallet.missing": "Installez Freighter pour continuer",
  "theme.toggle": "Basculer le mode sombre",
  "locale.label": "Langue",
  "common.loading": "Chargement...",
  "common.retry": "Réessayer",
  "common.offline": "L'API LumenSub est injoignable pour le moment. Affichage des données disponibles.",
  "status.Trialing": "Essai",
  "status.Active": "Actif",
  "status.PastDue": "En retard",
  "status.Paused": "En pause",
  "status.Cancelled": "Annulé",
  "status.Lapsed": "Expiré",
  "status.Completed": "Terminé",
  "checkout.title": "S'abonner",
  "checkout.approve": "Confirmer l'abonnement",
  "checkout.success": "Vous êtes abonné",
  "account.title": "Vos abonnements",
  "account.empty": "Aucun abonnement pour ce portefeuille.",
  "merchant.title": "Tableau de bord marchand",
  "footer.note": "Paiements récurrents sur Stellar, réglés par des contrats Soroban.",
};

export const LOCALES = { en, fr } as const;
export type Locale = keyof typeof LOCALES;
export const LOCALE_NAMES: Record<Locale, string> = { en: "English", fr: "Français" };
