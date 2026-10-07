# Commerce — icônes

59 icônes de la catégorie `commerce`, nommées avec le suffixe Icon et réparties en fichiers séparés. Provenance : lucide (39), tabler (20). La catégorie vient du classement du catalogue ; les noms ne sont pas une garantie de fonction métier.

## Imports exacts


```tsx
import {CreditCardIcon} from '@mdevs/icons';
// Alternatives :
import {CreditCardIcon} from '@mdevs/icons/commerce';
import {CreditCardIcon} from '@mdevs/icons/commerce/credit-card';
```

Conserver une seule des trois lignes. Les sous-chemins du tableau correspondent aux exports publics. Le SVG brut de chaque entrée est accessible sous @mdevs/icons/svg/<catégorie>/<slug> (sans extension dans l’import public, le fichier cible porte .svg) ; son traitement en URL, chaîne ou composant dépend du bundler du projet hôte. Aucun loader SVG particulier n’est fourni.
## Contrat commun


```ts
export type IconNode = readonly (readonly [
    string,
    Readonly<Record<string, string | number>>
])[];

export interface IconProps extends SVGProps<SVGSVGElement> {
    /** Base viewBox is 0 0 24 24; native props can override it. Size accepts CSS units. */
    size?: number | string;
    title?: string;
    /** Keep strokes fixed in screen units during CSS/SVG scaling. */
    absoluteStrokeWidth?: boolean;
}
```


| Prop | Défaut | Comportement |
| --- | --- | --- |
| size | 24 | Nombre en pixels ou chaîne CSS, notamment em/rem ; définit width et height. |
| strokeWidth | 1.5 | Épaisseur de référence du contour minimaliste. |
| absoluteStrokeWidth | false | Ajoute vectorEffect="non-scaling-stroke" aux nœuds géométriques pour une épaisseur fixe à l’écran. |
| title | Absent | Crée un title avec id unique et nomme le SVG comme image. |
| aria-label / aria-labelledby | Absent | Nom accessible si l’icône porte une information autonome. |
| color / style / className | Noir/blanc adaptatif | Le contour utilise currentColor avec une couleur propre : --md-icon-color ou light-dark. color puis style.color peuvent personnaliser ce défaut. |
| ref | Optionnel | Ref vers SVGSVGElement, transmise par forwardRef. |
| children | Optionnel | Nœuds SVG supplémentaires ; aucune modification des géométries du catalogue. |

## Grille et adaptation

Le viewBox par défaut est 0 0 24 24 et les géométries sont dessinées sur cette grille. size permet de les rendre à 16, 20, 24, 32 px ou en unités relatives ; une dimension en pourcentage exige un conteneur dimensionné. Les attributs SVG natifs sont transmis après les défauts : garder le viewBox du package afin de conserver la grille. Un SVG s’adapte à la densité d’écran sans bitmap ; vérifier visuellement les très petites tailles et l’épaisseur du trait. La taille d’une icône ne définit pas la zone tactile de son bouton.

## Exemples accessibles


```tsx
import {CreditCardIcon} from '@mdevs/icons/commerce/credit-card';

export function IconExamples() {
  return <>
    {/* Bouton nommé : son icône est décorative par défaut. */}
    <button type="button" aria-label="Ouvrir les détails"><CreditCardIcon size="1.25rem"/></button>
    {/* Icône informative autonome : fournir un nom. */}
    <CreditCardIcon size={32} title="Commerce" absoluteStrokeWidth style={{color:'currentColor'}}/>
  </>;
}
```

Sans title, aria-label et aria-labelledby, le wrapper ajoute aria-hidden=true. Avec un nom, il expose role="img". Les props SVG fournies par le parent peuvent remplacer les valeurs par défaut : ne pas combiner un nom informatif et aria-hidden=true. Sur un bouton avec texte visible, laisser l’icône décorative. Pour les SVG bruts, l’application définit elle-même les attributs ARIA et le nom du contrôle.
## Catalogue complet de cette catégorie


| Nom exporté | Import ciblé | SVG brut | Source React | Provenance | Mots-clés |
| --- | --- | --- | --- | --- | --- |
| `CreditCardIcon` | `@mdevs/icons/commerce/credit-card` | [credit-card.svg](../../svg/commerce/credit-card.svg) | [TSX](../../src/icons/commerce/credit-card.tsx) | lucide | bank, purchase, payment, cc |
| `CreditCardCheckIcon` | `@mdevs/icons/commerce/credit-card-check` | [credit-card-check.svg](../../svg/commerce/credit-card-check.svg) | [TSX](../../src/icons/commerce/credit-card-check.tsx) | lucide | debit, payment, banking, finance, transaction, wallet, purchase, checkout, billing, account, cardholder, verified, approved, authorized, valid, success, complete, check, bank, cc |
| `CreditCardMinusIcon` | `@mdevs/icons/commerce/credit-card-minus` | [credit-card-minus.svg](../../svg/commerce/credit-card-minus.svg) | [TSX](../../src/icons/commerce/credit-card-minus.tsx) | lucide | debit, payment, remove, delete, unlink, revoke, decline, canceled, banking, finance, wallet, transaction, billing, account, purchase, checkout, subtract, minus, bank, cc |
| `CreditCardPlusIcon` | `@mdevs/icons/commerce/credit-card-plus` | [credit-card-plus.svg](../../svg/commerce/credit-card-plus.svg) | [TSX](../../src/icons/commerce/credit-card-plus.tsx) | lucide | debit, payment, banking, finance, transaction, wallet, purchase, checkout, billing, account, cardholder, add, new, link, save, method, plastic, bank, cc |
| `CreditCardReaderIcon` | `@mdevs/icons/commerce/credit-card-reader` | [credit-card-reader.svg](../../svg/commerce/credit-card-reader.svg) | [TSX](../../src/icons/commerce/credit-card-reader.tsx) | lucide | bank, purchase, payment, cc, atm, terminal, checkout, kiosk, pos, point of sale, transaction, contactless, chip, swipe, tap, banking, finance, retail |
| `CreditCardXIcon` | `@mdevs/icons/commerce/credit-card-x` | [credit-card-x.svg](../../svg/commerce/credit-card-x.svg) | [TSX](../../src/icons/commerce/credit-card-x.tsx) | lucide | debit, payment, banking, finance, transaction, wallet, purchase, checkout, billing, account, cardholder, declined, rejected, failed, invalid, canceled, error, cancel, bank, cc |
| `CurrencyIcon` | `@mdevs/icons/commerce/currency` | [currency.svg](../../svg/commerce/currency.svg) | [TSX](../../src/icons/commerce/currency.tsx) | lucide | finance, money |
| `CurrencyAfghaniIcon` | `@mdevs/icons/commerce/currency-afghani` | [currency-afghani.svg](../../svg/commerce/currency-afghani.svg) | [TSX](../../src/icons/commerce/currency-afghani.tsx) | tabler | money, coin, cash, commerce, afghanistan, currency, afghani, finance, payment, monetary |
| `CurrencyBahrainiIcon` | `@mdevs/icons/commerce/currency-bahraini` | [currency-bahraini.svg](../../svg/commerce/currency-bahraini.svg) | [TSX](../../src/icons/commerce/currency-bahraini.tsx) | tabler | bahraini, bhd, commerce, dinar, money, banknote, pay, currency, finance, payment |
| `CurrencyBahtIcon` | `@mdevs/icons/commerce/currency-baht` | [currency-baht.svg](../../svg/commerce/currency-baht.svg) | [TSX](../../src/icons/commerce/currency-baht.tsx) | tabler | thb, thai, baht, money, banknote, pay, currency, finance, payment, monetary |
| `CurrencyBitcoinIcon` | `@mdevs/icons/commerce/currency-bitcoin` | [currency-bitcoin.svg](../../svg/commerce/currency-bitcoin.svg) | [TSX](../../src/icons/commerce/currency-bitcoin.tsx) | tabler | crypto, bitcoin, lightning network, mining, digital, blockchain, p2p, peer, money, banknote, pay |
| `CurrencyCentIcon` | `@mdevs/icons/commerce/currency-cent` | [currency-cent.svg](../../svg/commerce/currency-cent.svg) | [TSX](../../src/icons/commerce/currency-cent.tsx) | tabler | cent, coin, money, centavo, penny, banknote, pay, currency, finance, payment |
| `CurrencyDinarIcon` | `@mdevs/icons/commerce/currency-dinar` | [currency-dinar.svg](../../svg/commerce/currency-dinar.svg) | [TSX](../../src/icons/commerce/currency-dinar.tsx) | tabler | kwd, dinar, kuwait, money, banknote, pay, currency, finance, payment, monetary |
| `CurrencyDirhamIcon` | `@mdevs/icons/commerce/currency-dirham` | [currency-dirham.svg](../../svg/commerce/currency-dirham.svg) | [TSX](../../src/icons/commerce/currency-dirham.tsx) | tabler | trade, aed, uae, dirham, money, banknote, pay, currency, finance, payment |
| `CurrencyDogecoinIcon` | `@mdevs/icons/commerce/currency-dogecoin` | [currency-dogecoin.svg](../../svg/commerce/currency-dogecoin.svg) | [TSX](../../src/icons/commerce/currency-dogecoin.tsx) | tabler | crypto, bitcoin, lightning network, mining, digital, blockchain, p2p, peer, money, banknote, pay |
| `CurrencyDollarIcon` | `@mdevs/icons/commerce/currency-dollar` | [currency-dollar.svg](../../svg/commerce/currency-dollar.svg) | [TSX](../../src/icons/commerce/currency-dollar.tsx) | tabler | american, us, dollar, usd, sign, bucks, usa, money, banknote, pay |
| `CurrencyDollarAustralianIcon` | `@mdevs/icons/commerce/currency-dollar-australian` | [currency-dollar-australian.svg](../../svg/commerce/currency-dollar-australian.svg) | [TSX](../../src/icons/commerce/currency-dollar-australian.tsx) | tabler | dollar, aud, australian, money, banknote, pay, currency, finance, payment, usd |
| `CurrencyDollarBruneiIcon` | `@mdevs/icons/commerce/currency-dollar-brunei` | [currency-dollar-brunei.svg](../../svg/commerce/currency-dollar-brunei.svg) | [TSX](../../src/icons/commerce/currency-dollar-brunei.tsx) | tabler | exchange, buisness, commerce, currency, dollar, brunei, finance, payment, money, usd |
| `CurrencyDollarCanadianIcon` | `@mdevs/icons/commerce/currency-dollar-canadian` | [currency-dollar-canadian.svg](../../svg/commerce/currency-dollar-canadian.svg) | [TSX](../../src/icons/commerce/currency-dollar-canadian.tsx) | tabler | trade, dollar, cad, canadian, money, banknote, pay, currency, finance, payment |
| `CurrencyDollarGuyaneseIcon` | `@mdevs/icons/commerce/currency-dollar-guyanese` | [currency-dollar-guyanese.svg](../../svg/commerce/currency-dollar-guyanese.svg) | [TSX](../../src/icons/commerce/currency-dollar-guyanese.tsx) | tabler | exchange, buisness, commerce, currency, dollar, guyanese, finance, payment, money, usd |
| `CurrencyDollarOffIcon` | `@mdevs/icons/commerce/currency-dollar-off` | [currency-dollar-off.svg](../../svg/commerce/currency-dollar-off.svg) | [TSX](../../src/icons/commerce/currency-dollar-off.tsx) | tabler | american, us, dollar, usd, sign, bucks, usa, money, banknote, pay |
| `CurrencyDollarSingaporeIcon` | `@mdevs/icons/commerce/currency-dollar-singapore` | [currency-dollar-singapore.svg](../../svg/commerce/currency-dollar-singapore.svg) | [TSX](../../src/icons/commerce/currency-dollar-singapore.tsx) | tabler | singapore, dollar, exchange, sgd, money, banknote, pay, currency, finance, payment |
| `CurrencyDollarZimbabweanIcon` | `@mdevs/icons/commerce/currency-dollar-zimbabwean` | [currency-dollar-zimbabwean.svg](../../svg/commerce/currency-dollar-zimbabwean.svg) | [TSX](../../src/icons/commerce/currency-dollar-zimbabwean.tsx) | tabler | exchange, buisness, commerce, currency, dollar, zimbabwean, finance, payment, money, usd |
| `CurrencyDongIcon` | `@mdevs/icons/commerce/currency-dong` | [currency-dong.svg](../../svg/commerce/currency-dong.svg) | [TSX](../../src/icons/commerce/currency-dong.tsx) | tabler | vietnam, exchange, finance, money, cash, currency, dong, payment, monetary, banking |
| `CurrencyDramIcon` | `@mdevs/icons/commerce/currency-dram` | [currency-dram.svg](../../svg/commerce/currency-dram.svg) | [TSX](../../src/icons/commerce/currency-dram.tsx) | tabler | exchange, finance, money, cash, armenia, currency, dram, payment, monetary, banking |
| `CurrencyEthereumIcon` | `@mdevs/icons/commerce/currency-ethereum` | [currency-ethereum.svg](../../svg/commerce/currency-ethereum.svg) | [TSX](../../src/icons/commerce/currency-ethereum.tsx) | tabler | ethereum, digital, crypto, ether, blockchain, money, banknote, pay, currency, finance |
| `CurrencyEuroIcon` | `@mdevs/icons/commerce/currency-euro` | [currency-euro.svg](../../svg/commerce/currency-euro.svg) | [TSX](../../src/icons/commerce/currency-euro.tsx) | tabler | euro, eur, trade, finance, europe, eu, money, banknote, pay, currency |
| `DollarSignIcon` | `@mdevs/icons/commerce/dollar-sign` | [dollar-sign.svg](../../svg/commerce/dollar-sign.svg) | [TSX](../../src/icons/commerce/dollar-sign.tsx) | lucide | currency, money, payment |
| `EuroIcon` | `@mdevs/icons/commerce/euro` | [euro.svg](../../svg/commerce/euro.svg) | [TSX](../../src/icons/commerce/euro.tsx) | lucide | currency, money, payment |
| `GiftIcon` | `@mdevs/icons/commerce/gift` | [gift.svg](../../svg/commerce/gift.svg) | [TSX](../../src/icons/commerce/gift.tsx) | lucide | present, box, birthday, party |
| `ReceiptIcon` | `@mdevs/icons/commerce/receipt` | [receipt.svg](../../svg/commerce/receipt.svg) | [TSX](../../src/icons/commerce/receipt.tsx) | lucide | bill, voucher, slip, check, counterfoil, currency, dollar, usd, $ |
| `ReceiptCentIcon` | `@mdevs/icons/commerce/receipt-cent` | [receipt-cent.svg](../../svg/commerce/receipt-cent.svg) | [TSX](../../src/icons/commerce/receipt-cent.tsx) | lucide | bill, voucher, slip, check, counterfoil, currency, cents, dollar, usd, $, ¢ |
| `ReceiptEuroIcon` | `@mdevs/icons/commerce/receipt-euro` | [receipt-euro.svg](../../svg/commerce/receipt-euro.svg) | [TSX](../../src/icons/commerce/receipt-euro.tsx) | lucide | bill, voucher, slip, check, counterfoil, currency, € |
| `ReceiptIndianRupeeIcon` | `@mdevs/icons/commerce/receipt-indian-rupee` | [receipt-indian-rupee.svg](../../svg/commerce/receipt-indian-rupee.svg) | [TSX](../../src/icons/commerce/receipt-indian-rupee.tsx) | lucide | bill, voucher, slip, check, counterfoil, currency, inr, ₹ |
| `ReceiptJapaneseYenIcon` | `@mdevs/icons/commerce/receipt-japanese-yen` | [receipt-japanese-yen.svg](../../svg/commerce/receipt-japanese-yen.svg) | [TSX](../../src/icons/commerce/receipt-japanese-yen.tsx) | lucide | bill, voucher, slip, check, counterfoil, currency, jpy, ¥ |
| `ReceiptPoundSterlingIcon` | `@mdevs/icons/commerce/receipt-pound-sterling` | [receipt-pound-sterling.svg](../../svg/commerce/receipt-pound-sterling.svg) | [TSX](../../src/icons/commerce/receipt-pound-sterling.tsx) | lucide | bill, voucher, slip, check, counterfoil, british, currency, gbp, £ |
| `ReceiptRussianRubleIcon` | `@mdevs/icons/commerce/receipt-russian-ruble` | [receipt-russian-ruble.svg](../../svg/commerce/receipt-russian-ruble.svg) | [TSX](../../src/icons/commerce/receipt-russian-ruble.tsx) | lucide | bill, voucher, slip, check, counterfoil, currency, rub, ₽ |
| `ReceiptSwissFrancIcon` | `@mdevs/icons/commerce/receipt-swiss-franc` | [receipt-swiss-franc.svg](../../svg/commerce/receipt-swiss-franc.svg) | [TSX](../../src/icons/commerce/receipt-swiss-franc.tsx) | lucide | bill, voucher, slip, check, counterfoil, currency, chf, ₣ |
| `ReceiptTextIcon` | `@mdevs/icons/commerce/receipt-text` | [receipt-text.svg](../../svg/commerce/receipt-text.svg) | [TSX](../../src/icons/commerce/receipt-text.tsx) | lucide | bill, voucher, slip, check, counterfoil, details, small print, terms, conditions, contract |
| `ReceiptTurkishLiraIcon` | `@mdevs/icons/commerce/receipt-turkish-lira` | [receipt-turkish-lira.svg](../../svg/commerce/receipt-turkish-lira.svg) | [TSX](../../src/icons/commerce/receipt-turkish-lira.tsx) | lucide | bill, voucher, slip, check, counterfoil, currency, try, ₺ |
| `ShoppingBagIcon` | `@mdevs/icons/commerce/shopping-bag` | [shopping-bag.svg](../../svg/commerce/shopping-bag.svg) | [TSX](../../src/icons/commerce/shopping-bag.tsx) | lucide | ecommerce, cart, purchase, store |
| `ShoppingBasketIcon` | `@mdevs/icons/commerce/shopping-basket` | [shopping-basket.svg](../../svg/commerce/shopping-basket.svg) | [TSX](../../src/icons/commerce/shopping-basket.tsx) | lucide | cart, e-commerce, store, purchase, products, items, ingredients |
| `ShoppingCartIcon` | `@mdevs/icons/commerce/shopping-cart` | [shopping-cart.svg](../../svg/commerce/shopping-cart.svg) | [TSX](../../src/icons/commerce/shopping-cart.tsx) | lucide | trolley, cart, basket, e-commerce, store, purchase, products, items, ingredients |
| `ShoppingCartMinusIcon` | `@mdevs/icons/commerce/shopping-cart-minus` | [shopping-cart-minus.svg](../../svg/commerce/shopping-cart-minus.svg) | [TSX](../../src/icons/commerce/shopping-cart-minus.tsx) | lucide | trolley, cart, basket, e-commerce, ecommerce, store, purchase, products, items, checkout, order, retail, remove, decrease, quantity, subtract |
| `ShoppingCartPlusIcon` | `@mdevs/icons/commerce/shopping-cart-plus` | [shopping-cart-plus.svg](../../svg/commerce/shopping-cart-plus.svg) | [TSX](../../src/icons/commerce/shopping-cart-plus.tsx) | lucide | trolley, cart, basket, e-commerce, ecommerce, store, purchase, products, items, checkout, order, retail, add, increase, quantity, buy |
| `StoreIcon` | `@mdevs/icons/commerce/store` | [store.svg](../../svg/commerce/store.svg) | [TSX](../../src/icons/commerce/store.tsx) | lucide | shop, supermarket, stand, boutique, building |
| `TagIcon` | `@mdevs/icons/commerce/tag` | [tag.svg](../../svg/commerce/tag.svg) | [TSX](../../src/icons/commerce/tag.tsx) | lucide | label, badge, ticket, mark |
| `TagPlusIcon` | `@mdevs/icons/commerce/tag-plus` | [tag-plus.svg](../../svg/commerce/tag-plus.svg) | [TSX](../../src/icons/commerce/tag-plus.tsx) | lucide | label, badge, ticket, mark, new, add, create, + |
| `TagXIcon` | `@mdevs/icons/commerce/tag-x` | [tag-x.svg](../../svg/commerce/tag-x.svg) | [TSX](../../src/icons/commerce/tag-x.tsx) | lucide | label, badge, ticket, mark, x, delete, remove |
| `TicketIcon` | `@mdevs/icons/commerce/ticket` | [ticket.svg](../../svg/commerce/ticket.svg) | [TSX](../../src/icons/commerce/ticket.tsx) | lucide | entry, pass, voucher, event, concert, show, perforated, dashed |
| `TicketCheckIcon` | `@mdevs/icons/commerce/ticket-check` | [ticket-check.svg](../../svg/commerce/ticket-check.svg) | [TSX](../../src/icons/commerce/ticket-check.tsx) | lucide | entry, pass, voucher, event, concert, show, booked, purchased, receipt, redeemed, validated, verified, certified, checked, used |
| `TicketMinusIcon` | `@mdevs/icons/commerce/ticket-minus` | [ticket-minus.svg](../../svg/commerce/ticket-minus.svg) | [TSX](../../src/icons/commerce/ticket-minus.tsx) | lucide | entry, pass, voucher, event, concert, show, remove, cancel, unbook, subtract, decrease, - |
| `TicketPercentIcon` | `@mdevs/icons/commerce/ticket-percent` | [ticket-percent.svg](../../svg/commerce/ticket-percent.svg) | [TSX](../../src/icons/commerce/ticket-percent.tsx) | lucide | discount, reduced, offer, voucher, entry, pass, event, concert, show, book, purchase, % |
| `TicketPlusIcon` | `@mdevs/icons/commerce/ticket-plus` | [ticket-plus.svg](../../svg/commerce/ticket-plus.svg) | [TSX](../../src/icons/commerce/ticket-plus.tsx) | lucide | entry, pass, voucher, event, concert, show, book, purchase, add, + |
| `TicketSlashIcon` | `@mdevs/icons/commerce/ticket-slash` | [ticket-slash.svg](../../svg/commerce/ticket-slash.svg) | [TSX](../../src/icons/commerce/ticket-slash.tsx) | lucide | entry, pass, voucher, event, concert, show, redeemed, used, marked, checked, verified, spoiled, invalidated, void, denied, refused, banned, barred, forbidden, prohibited, cancelled, cancellation, refunded, delete, remove, clear, error |
| `TicketXIcon` | `@mdevs/icons/commerce/ticket-x` | [ticket-x.svg](../../svg/commerce/ticket-x.svg) | [TSX](../../src/icons/commerce/ticket-x.tsx) | lucide | entry, pass, voucher, event, concert, show, cancelled, cancellation, refunded, used, void, invalidated, spoiled, denied, refused, banned, barred, forbidden, prohibited, delete, remove, clear, error, x |
| `WalletIcon` | `@mdevs/icons/commerce/wallet` | [wallet.svg](../../svg/commerce/wallet.svg) | [TSX](../../src/icons/commerce/wallet.tsx) | lucide | money, finance, pocket |
| `Wallet2Icon` | `@mdevs/icons/commerce/wallet-2` | [wallet-2.svg](../../svg/commerce/wallet-2.svg) | [TSX](../../src/icons/commerce/wallet-2.tsx) | lucide | — |
| `WalletCardsIcon` | `@mdevs/icons/commerce/wallet-cards` | [wallet-cards.svg](../../svg/commerce/wallet-cards.svg) | [TSX](../../src/icons/commerce/wallet-cards.tsx) | lucide | wallet, cards, banking, cash, debit, transport, money, finance, pocket, credit, purchase, payment, shopping, retail, consumer, cc |

## Recherche et traçabilité

Le [manifeste global](../manifest.json) fournit name, slug, category, tags, import, svg, source et geometryHash pour chaque entrée. Copier le nom exact ; ne pas inventer de suffixe ni reprendre un alias non sélectionné d’un projet source. geometryHash identifie la géométrie normalisée ; les variantes de taille/couleur ne sont pas de nouvelles icônes.

## Licences et redistribution

Conserver [NOTICE.md](../../NOTICE.md), [la licence du wrapper](../../LICENSE), [LICENSE-LUCIDE](../../LICENSE-LUCIDE) et [LICENSE-TABLER](../../LICENSE-TABLER). Les géométries sont issues des versions indiquées dans le manifeste ; elles ne sont pas présentées comme des dessins originaux Mdevs.

## Repères pour les agents

- [Instructions du package](../../AGENTS.md).
- [API et provenance détaillées](../docs/ICONS.md).
- [Guide général des agents](../docs/AI_AGENTS.md).
- [Wrapper createIcon et types](../../src/create-icon.tsx).

Dans le monorepo, préfixer les chemins de fichiers par packages/icons/. Dans le package installé, les mêmes sources et SVG se trouvent sous node_modules/@mdevs/icons/. Aucune feuille CSS UI n’est nécessaire pour utiliser ces icônes seules.
