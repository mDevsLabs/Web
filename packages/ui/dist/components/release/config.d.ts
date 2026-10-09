export declare const config: {
    readonly name: "Release";
    readonly label: "Versions";
    readonly description: "Gérez vos versions depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "name";
        readonly label: "Nom";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "version";
        readonly label: "Version";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "releasedOn";
        readonly label: "Date";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "changeCount";
        readonly label: "Changements";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["draft", "prerelease", "stable"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifyRelease";
        readonly label: "Notifications : versions";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveRelease";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section versions.";
    }, {
        readonly key: "approveRelease";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
