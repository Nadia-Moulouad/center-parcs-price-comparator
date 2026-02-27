# 🌲 Center Parcs Price Comparator

A web scraper and price comparison tool for Center Parcs Villages Nature Paris cottages.
Track and compare cottage prices based on stay duration, dates, and comfort level to find the best deals.

## 🛠️ Tech Stack

- **Backend:** PHP 8.4 / Laravel 12
- **Frontend:** React + TypeScript (via Inertia.js)
- **Database:** SQLite (développement local)
- **HTTP Client:** Guzzle (requêtes vers Center Parcs)
- **HTML Parser:** Symfony DomCrawler (extraction des données du HTML)

## 🔍 Comment fonctionne le scraper

Le scraping se déroule en 3 phases enchaînées automatiquement au clic d'un bouton :

### Phase 1 — Récupération du token et de la liste des cottages
- Appel HTTP vers la page liste des cottages de Villages Nature Paris.
- Extraction du **token d'authentification** via `preg_match` dans le JavaScript embarqué.
- Extraction des **22 cottages disponibles** via DomCrawler (sélecteur `a.js-open-popinParticipants[data-housingcode]`) :
  - `housing_code`, `housing_type`, `comfort_level`, `nb_personnes`.

### Phase 2 — Appel de l'API de prix
Pour chaque cottage × chaque durée de séjour (2, 3, 4, 5, 6, 7, 10, 11, 14 nuits) :
- Appel à l'API JSON de Center Parcs :
  `GET https://cpe-search-api.groupepvcp.com/v1/product/flexCalendar?univers=cpe&language=fr&market=fr&offer=VN&housing={CODE}&token={TOKEN}&currency=EUR&displayPrice=per_stay&duration={DUREE}`
- Extraction : `prix`, `prix_original`, `discount`, et `stock`.

- hiérarchie de la réponse JSON :
```json
$data
 └── 'results'
      └── 'results'
           └── 'dates'
                ├── '2026-03-20'  ← clé = date d'arrivée
                │    ├── 'cache'
                │    │    ├── 'housingCode'  → "VN1021"
                │    │    ├── 'date'         → "2026-03-20"
                │    │    ├── 'duration'     → 7
                │    │    ├── 'stock'        → 13  (nombre de cottages dispo)
                │    │    ├── 'maxPersons'   → 2
                │    │    └── 'price'
                │    │         ├── 'original'
                │    │         │    └── 'rawBeforeTax' → "1054"  ← prix SANS promo, SANS taxe
                │    │         ├── 'promo'
                │    │         │    └── 'rawBeforeTax' → "852"   ← prix AVEC promo, SANS taxe
                │    │         ├── 'taxTotal'          → 118.3   ← taxe de séjour
                │    │         ├── 'discount'          → 18      ← % de réduction
                │    │         └── 'difference'        → 202     ← économie en €
                │    └── 'housing'
                │         └── 'booking_url'  → URL pour réserver
                ├── '2026-03-23'  ← date suivante...
                ├── '2026-03-27'
                └── ...
```


### Phase 3 — Sauvegarde en base de données
- Suppression des données précédentes (`truncate`).
- Insertion en masse des nouvelles données.
- Résultat : une ligne par combinaison unique `housing_code` × `date_arrivee` × `duree`.

## ✨ Features

- Scraping en un clic de tous les prix.
- ~6000 lignes de prix en base de données.
- Comparaison par date, durée, type de logement et capacité.
- Détection automatique des promotions.
- Affichage en temps réel via React + Inertia.

## ⚙️ Installation

### Prérequis
- PHP >= 8.4
- Composer
- Node.js & npm

### Étapes

1. **Cloner le dépôt**
   ```bash
   git clone https://github.com/Nadia-Moulouad/center-parcs-price-comparator.git
   cd center-parcs-price-comparator
   ```

2. **Installer les dépendances PHP**
   ```bash
   composer install
   ```

3. **Installer les dépendances JS**
   ```bash
   npm install
   ```

4. **Configurer l'environnement**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

5. **Lancer les migrations**
   ```bash
   php artisan migrate
   ```

6. **Démarrer l'application**
   ```bash
   php artisan serve
   npm run dev
   ```
   Puis aller sur `http://localhost:8000/scraper` et cliquer sur **"Lancer le scraping"**.

## 🗄️ Structure de la base de données

### Table `sejours`
| Colonne | Type | Description |
| :--- | :--- | :--- |
| `housing_code` | string | Identifiant du cottage (ex: VN1021) |
| `housing_type` | string | Type de logement (ex: Cottage) |
| `comfort_level` | string | Niveau de confort (ex: VIP, Premium) |
| `nb_personnes` | integer | Capacité maximale |
| `date_arrivee` | date | Date d'arrivée |
| `duree` | integer | Durée du séjour en nuits |
| `prix` | decimal | Prix promo HT (€) |
| `prix_original` | decimal | Prix plein HT (€) |
| `url_source` | string | URL du cottage |

## 🚧 Statut du projet
En cours de développement.

## 📄 Licence
MIT