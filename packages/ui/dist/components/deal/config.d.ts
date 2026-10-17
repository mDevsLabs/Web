export declare const config: {
    readonly name: "Deal";
    readonly label: "Opportunités";
    readonly description: "Gérez vos opportunités depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "name";
        readonly label: "Nom";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "company";
        readonly label: "Entreprise";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "amount";
        readonly label: "Montant";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "closesOn";
        readonly label: "Clôture";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["discovery", "proposal", "won", "lost"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifyDeal";
        readonly label: "Notifications : opportunités";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveDeal";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section opportunités.";
    }, {
        readonly key: "approveDeal";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
