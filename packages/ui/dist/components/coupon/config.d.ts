export declare const config: {
    readonly name: "Coupon";
    readonly label: "Codes promotionnels";
    readonly description: "Gérez vos codes promotionnels depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "code";
        readonly label: "Code";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "discountPercent";
        readonly label: "Réduction (%)";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "expiresOn";
        readonly label: "Expiration";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "usageCount";
        readonly label: "Utilisations";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["draft", "active", "expired"];
    }];
    readonly titleKey: "code";
    readonly settings: readonly [{
        readonly key: "notifyCoupon";
        readonly label: "Notifications : codes promotionnels";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveCoupon";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section codes promotionnels.";
    }, {
        readonly key: "approveCoupon";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
