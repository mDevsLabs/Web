export declare const config: {
    readonly name: "Environment";
    readonly label: "Environnements";
    readonly description: "Gérez vos environnements depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "name";
        readonly label: "Nom";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "region";
        readonly label: "Région";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "serviceCount";
        readonly label: "Services";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "url";
        readonly label: "Adresse";
        readonly kind: "url";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["active", "provisioning", "disabled"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifyEnvironment";
        readonly label: "Notifications : environnements";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveEnvironment";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section environnements.";
    }, {
        readonly key: "approveEnvironment";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
