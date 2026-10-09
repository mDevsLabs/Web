export declare const config: {
    readonly name: "Customer";
    readonly label: "Clients";
    readonly description: "Gérez vos clients depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "name";
        readonly label: "Nom";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "email";
        readonly label: "E-mail";
        readonly kind: "email";
        readonly required: true;
    }, {
        readonly key: "lifetimeValue";
        readonly label: "Valeur cumulée";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "joinedOn";
        readonly label: "Inscription";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["active", "new", "inactive"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifyCustomer";
        readonly label: "Notifications : clients";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveCustomer";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section clients.";
    }, {
        readonly key: "approveCustomer";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
