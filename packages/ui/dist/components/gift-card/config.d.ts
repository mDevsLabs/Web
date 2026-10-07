export declare const config: {
    readonly name: "GiftCard";
    readonly label: "Cartes cadeaux";
    readonly description: "Gérez vos cartes cadeaux depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "code";
        readonly label: "Code";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "recipient";
        readonly label: "Bénéficiaire";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "balance";
        readonly label: "Solde";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "expiresOn";
        readonly label: "Expiration";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["active", "redeemed", "expired"];
    }];
    readonly titleKey: "code";
    readonly settings: readonly [{
        readonly key: "notifyGiftCard";
        readonly label: "Notifications : cartes cadeaux";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveGiftCard";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section cartes cadeaux.";
    }, {
        readonly key: "approveGiftCard";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
