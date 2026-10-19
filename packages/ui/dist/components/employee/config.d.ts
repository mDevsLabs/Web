export declare const config: {
    readonly name: "Employee";
    readonly label: "Collaborateurs";
    readonly description: "Gérez vos collaborateurs depuis une interface claire.";
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
        readonly key: "department";
        readonly label: "Service";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "joinedOn";
        readonly label: "Arrivée";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["active", "on-leave", "inactive"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifyEmployee";
        readonly label: "Notifications : collaborateurs";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveEmployee";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section collaborateurs.";
    }, {
        readonly key: "approveEmployee";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
