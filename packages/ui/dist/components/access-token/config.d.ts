export declare const config: {
    readonly name: "AccessToken";
    readonly label: "Jetons d’accès";
    readonly description: "Gérez vos jetons d’accès depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "name";
        readonly label: "Nom";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "owner";
        readonly label: "Propriétaire";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "scope";
        readonly label: "Permissions";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "expiresOn";
        readonly label: "Expiration";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["active", "expired", "revoked"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifyAccessToken";
        readonly label: "Notifications : jetons d’accès";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveAccessToken";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section jetons d’accès.";
    }, {
        readonly key: "approveAccessToken";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
