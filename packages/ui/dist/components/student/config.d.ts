export declare const config: {
    readonly name: "Student";
    readonly label: "Apprenants";
    readonly description: "Gérez vos apprenants depuis une interface claire.";
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
        readonly key: "courseCount";
        readonly label: "Formations";
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
        readonly options: readonly ["active", "graduated", "inactive"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifyStudent";
        readonly label: "Notifications : apprenants";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveStudent";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section apprenants.";
    }, {
        readonly key: "approveStudent";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
