export declare const config: {
    readonly name: "Quote";
    readonly label: "Devis";
    readonly description: "Gérez vos devis depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "number";
        readonly label: "Numéro";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "customer";
        readonly label: "Client";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "amount";
        readonly label: "Montant";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "validUntil";
        readonly label: "Validité";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["draft", "sent", "accepted", "declined"];
    }];
    readonly titleKey: "number";
    readonly settings: readonly [{
        readonly key: "notifyQuote";
        readonly label: "Notifications : devis";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveQuote";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section devis.";
    }, {
        readonly key: "approveQuote";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
