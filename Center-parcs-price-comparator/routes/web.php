<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;
use App\Http\Controllers\ScraperController;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    Route::get('scraper', [ScraperController::class, 'index'])
        ->name('scraper.index');
    Route::post('scraper', [ScraperController::class, 'scraper'])
        ->name('scraper.store');
});

require __DIR__.'/settings.php';
