export declare const config: {
    readonly name: "Contract";
    readonly label: "Contrats";
    readonly description: "Gérez vos contrats depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "title";
        readonly label: "Titre";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "counterparty";
        readonly label: "Partenaire";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "amount";
        readonly label: "Montant";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "endsOn";
        readonly label: "Fin";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["draft", "review", "signed", "expired"];
    }];
    readonly titleKey: "title";
    readonly settings: readonly [{
        readonly key: "notifyContract";
        readonly label: "Notifications : contrats";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveContract";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section contrats.";
    }, {
        readonly key: "approveContract";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
