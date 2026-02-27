<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('sejours', function (Blueprint $table) {
            $table->id();

            // identifiant du cottage
            // ex: "VN1021" = Villages Nature,
            // cottage 1021 est la ref du 'type de cotage' a priori, parce que on peut en avoir plusieurs avec la meme
            $table->string('housing_code');

            // Type de logement : "Appartement", "Cottage"...
            $table->string('housing_type');

            // Niveau de confort : "VIP", "Premium", "Confort"
            $table->string('comfort_level');

            // Capacité : nombre de personnes max
            $table->integer('nb_personnes');

            // Date d'arrivée possible
            $table->date('date_arrivee');

            // Durée du séjour en nuits (2, 3, 4, 5, 6, 7, 10, 11, 14)
            $table->integer('duree');

            // Prix en euros (sans taxe de séjour)
            $table->decimal('prix', 8, 2);

            // Prix original avant réduction (peut être null si pas de promo)
            $table->decimal('prix_original', 8, 2)->nullable();

            // URL de la page du cottage
            $table->string('url_source')->nullable();

            // Laravel gère created_at et updated_at automatiquement
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('sejours');
    }
};
