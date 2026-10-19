export declare const config: {
    readonly name: "Campaign";
    readonly label: "Campagnes";
    readonly description: "Gérez vos campagnes depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "name";
        readonly label: "Nom";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "channel";
        readonly label: "Canal";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "budget";
        readonly label: "Budget";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "startsOn";
        readonly label: "Début";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["draft", "active", "paused", "completed"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifyCampaign";
        readonly label: "Notifications : campagnes";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveCampaign";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section campagnes.";
    }, {
        readonly key: "approveCampaign";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
