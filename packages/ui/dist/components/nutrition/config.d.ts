export declare const config: {
    readonly name: "Nutrition";
    readonly label: "Suivi nutritionnel";
    readonly description: "Gérez vos suivi nutritionnel depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "meal";
        readonly label: "Repas";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "food";
        readonly label: "Aliment";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "calories";
        readonly label: "Calories";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "proteinGrams";
        readonly label: "Protéines (g)";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["planned", "logged", "archived"];
    }];
    readonly titleKey: "meal";
    readonly settings: readonly [{
        readonly key: "notifyNutrition";
        readonly label: "Notifications : suivi nutritionnel";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveNutrition";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section suivi nutritionnel.";
    }, {
        readonly key: "approveNutrition";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
