<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sejour extends Model
{
    // Toutes les colonnes qu'on a le droit de remplir via create() ou updateOrCreate()
    protected $fillable = [
        'housing_code',
        'housing_type',
        'comfort_level',
        'nb_personnes',
        'date_arrivee',
        'duree',
        'prix',
        'prix_original',
        'url_source',
    ];

    // Dis à Laravel comment convertir chaque colonne automatiquement
    // Sans ça, tout revient comme string depuis SQLite
    protected $casts = [
        'date_arrivee'   => 'date',       // string "2026-05-01" → objet Carbon (date PHP)
        'prix'           => 'float',      // string "307.00" → float 307.0
        'prix_original'  => 'float',
        'duree'          => 'integer',    // string "7" → int 7
        'nb_personnes'   => 'integer',
    ];
}
