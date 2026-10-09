export declare const config: {
    readonly name: "SavedFilter";
    readonly label: "Filtres enregistrés";
    readonly description: "Gérez vos filtres enregistrés depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "name";
        readonly label: "Nom";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "query";
        readonly label: "Recherche";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "owner";
        readonly label: "Propriétaire";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "resultCount";
        readonly label: "Résultats";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "updatedAt";
        readonly label: "Mise à jour";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["draft", "active", "shared", "archived"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifySavedFilter";
        readonly label: "Notifications : filtres enregistrés";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveSavedFilter";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section filtres enregistrés.";
    }, {
        readonly key: "approveSavedFilter";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
