export declare const config: {
    readonly name: "MediaAsset";
    readonly label: "Médias";
    readonly description: "Gérez vos médias depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "name";
        readonly label: "Nom";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "mediaType";
        readonly label: "Type";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "sizeMb";
        readonly label: "Taille (Mo)";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "uploadedOn";
        readonly label: "Ajout";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["processing", "ready", "failed"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifyMediaAsset";
        readonly label: "Notifications : médias";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveMediaAsset";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section médias.";
    }, {
        readonly key: "approveMediaAsset";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
