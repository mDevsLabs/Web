export declare const config: {
    readonly name: "Board";
    readonly label: "Tableaux de travail";
    readonly description: "Gérez vos tableaux de travail depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "name";
        readonly label: "Nom";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "owner";
        readonly label: "Responsable";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "columnCount";
        readonly label: "Colonnes";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "cardCount";
        readonly label: "Cartes";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["active", "private", "archived"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifyBoard";
        readonly label: "Notifications : tableaux de travail";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveBoard";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section tableaux de travail.";
    }, {
        readonly key: "approveBoard";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
