export declare const config: {
    readonly name: "Contact";
    readonly label: "Contacts";
    readonly description: "Gérez vos contacts depuis une interface claire.";
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
        readonly key: "company";
        readonly label: "Entreprise";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "phone";
        readonly label: "Téléphone";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["active", "inactive", "archived"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifyContact";
        readonly label: "Notifications : contacts";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveContact";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section contacts.";
    }, {
        readonly key: "approveContact";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
