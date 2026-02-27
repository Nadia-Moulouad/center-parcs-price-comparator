<?php

namespace App\Http\Controllers;

use App\Models\Sejour;
use Inertia\Inertia;
use GuzzleHttp\Client;
use Symfony\Component\DomCrawler\Crawler;

class ScraperController extends Controller
{
    // -------------------------------------------------------
    // GET /scraper → affiche la page avec les séjours en DB
    // -------------------------------------------------------
    public function index()
    {
        // on trie par date
        // $sejours = Sejour::orderBy('date_arrivee', 'asc')
        //                  ->orderBy('duree', 'asc')
        //                  ->get();

        // return Inertia::render('scraper/index', [
        //     'sejours' => $sejours,
        // ]);

        //on tie par prix
        $sejours = \App\Models\Sejour::orderBy('prix', 'asc')->get();

        return Inertia::render('scraper/index', [
            'sejours' => $sejours,
        ]);
    }

    // POST /scraper → lance le scraping

    public function scraper(\Illuminate\Http\Request $request)
    {
        $client = new \GuzzleHttp\Client([
            'timeout' => 15,
            'verify' => false,
            'headers' => [
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language' => 'fr-FR,fr;q=0.9,en;q=0.8',
                'Accept-Encoding' => 'gzip, deflate, br',
                'Connection' => 'keep-alive',
                'Upgrade-Insecure-Requests' => '1',
                'Cache-Control' => 'max-age=0',
                'Sec-Fetch-Dest' => 'document',
                'Sec-Fetch-Mode' => 'navigate',
                'Sec-Fetch-Site' => 'none',
                'Sec-Fetch-User' => '?1',
            ],
        ]);

        try {
            // PHASE 1 : Token + liste des cottages
            $url = 'https://www.centerparcs.fr/fr-fr/france/fp_VN_vacances-domaine-villages-nature-paris/cottages';
            $response = $client->get($url);
            $html = $response->getBody()->getContents();

            preg_match('/"token"\s*:\s*"([A-Za-z0-9]+)"/', $html, $matches);
            if (empty($matches[1])) {
                preg_match('/[?&]token=([A-Za-z0-9]+)/', $html, $matches);
            }
            $token = $matches[1] ?? null;

            if (!$token) {
                return redirect()->route('scraper.index')
                    ->with('error', '❌ Token introuvable.');
            }

            $crawler = new \Symfony\Component\DomCrawler\Crawler($html);
            $cottages = [];

            $crawler->filter('a.js-open-popinParticipants[data-housingcode]')->each(function ($node) use (&$cottages) {
                $code = $node->attr('data-housingcode');
                if ($code && !isset($cottages[$code])) {
                    $cottages[$code] = [
                        'housing_code'  => $code,
                        'housing_type'  => $node->attr('data-housing') ?? 'Inconnu',
                        'comfort_level' => $node->attr('data-comfort') ?? 'Inconnu',
                        'nb_personnes'  => (int) ($node->attr('data-maxcapacity') ?? 0),
                    ];
                }
            });

            if (empty($cottages)) {
                return redirect()->route('scraper.index')
                    ->with('error', '❌ Aucun cottage trouvé.');
            }

            // PHASE 2 : Appel API pour chaque cottage × chaque durée

            $durees = $request->input('durees', [2, 3, 4, 5, 6, 7, 10, 11, 14]);

            $durees = array_map('intval', $durees);

            $toutesLesLignes = [];

            foreach ($cottages as $cottage) {
                foreach ($durees as $duree) {
                    try {
                        $apiResponse = $client->get('https://cpe-search-api.groupepvcp.com/v1/product/flexCalendar', [
                            'query' => [
                                'univers'      => 'cpe',
                                'language'     => 'fr',
                                'market'       => 'fr',
                                'offer'        => 'VN',
                                'housing'      => $cottage['housing_code'],
                                'token'        => $token,
                                'currency'     => 'EUR',
                                'displayPrice' => 'per_stay',
                                'duration'     => $duree,
                            ],
                        ]);

                        $data = json_decode($apiResponse->getBody()->getContents(), true);
                        $dates = $data['results']['results']['dates'] ?? [];

                        foreach ($dates as $dateStr => $dateInfo) {
                            $cache = $dateInfo['cache'];
                            $prix = (float) $cache['price']['promo']['rawBeforeTax'];
                            $prixOriginal = $cache['price']['discount'] > 0
                                ? (float) $cache['price']['original']['rawBeforeTax']
                                : null;

                            $toutesLesLignes[] = [
                                'housing_code'  => $cottage['housing_code'],
                                'housing_type'  => $cottage['housing_type'],
                                'comfort_level' => $cottage['comfort_level'],
                                'nb_personnes'  => $cottage['nb_personnes'],
                                'date_arrivee'  => $dateStr,
                                'duree'         => $duree,
                                'prix'          => $prix,
                                'prix_original' => $prixOriginal,
                                'url_source'    => null,
                                'created_at'    => now(),
                                'updated_at'    => now(),
                            ];
                        }

                    } catch (\Exception $e) {
                        // Si un appel échoue pour un cottage/durée, on continue sans planter
                        continue;
                    }
                }
            }

            //PHASE 3 : Sauvegarde en db
            \App\Models\Sejour::truncate();

            // On insère par paquets de 100 pour ne pas surcharger SQLite
            foreach (array_chunk($toutesLesLignes, 100) as $chunk) {
                \App\Models\Sejour::insert($chunk);
            }

            $nb = count($toutesLesLignes);
            return redirect()->route('scraper.index')
                ->with('success', "✅ {$nb} prix récupérés pour " . count($cottages) . " cottages × " . count($durees) . " durées !");

        } catch (\Exception $e) {
            return redirect()->route('scraper.index')
                ->with('error', '❌ Erreur : ' . $e->getMessage());
        }
    }

}


