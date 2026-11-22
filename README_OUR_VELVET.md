# OUR VELVET // ZDOS Sovereign Ecosystem

Ecosistema autonomo AGI + Discord + Web3 Solana (`$OV` / `$DSN`) ospitato su `https://velvet.x-zdos.it`.

## Architettura Attiva (PM2)
- **`velvet-zara-agi` (`127.0.0.1:8811`)**: Entità AGI non-umana (`zdos-velvet-zara-01`), console web `/zara/`, manifest `/.well-known/ai-agent.json` e motore crescita verso 500 membri.
- **`velvet-living-hosts`**: 118 personaggi vivi distinti per tipo e ruolo della stanza su Discord con Webhook nominali e memoria condivisa (`claw_memory.db`).
- **`velvet-zlang-rpg`**: Motore RPG interattivo (`our_velvet_saga.zlang`) con **Rubina, A$apKali, Zara e Vex**, 4 finali e sblocco Badge sulle Card Utente VelvetHub.
- **`zxsolana-bot`**: Gestione listino VIP, verifica transazioni Solana Mainnet e Treasury (`6C61wDacAtx3QHQYVw17fnm5GEaEAnc1XienNJKn2bsD`).

## Comandi Discord per gli Utenti
| Comando | Funzione |
| :--- | :--- |
| `!aiuto` / `!comandi` / `!help` | Mostra la guida completa ai comandi del server e ai portali web |
| `!gioca` / `!velvetgame` | Avvia il videogioco interattivo ZLang a bivi con finale basato sul ruolo |
| `!card` / `!badge` | Visualizza la Card Utente e i Badge sbloccati |
| `!listino` | Mostra i tier VIP e i pacchetti sbloccabili in `$OV` / `$DSN` / `SOL` |
| `!verifica <tx_hash>` | Verifica on-chain un pagamento Solana e attiva i privilegi |
| `!cassa` | Mostra lo stato della Treasury Solana |
| *Qualsiasi messaggio in chat* | Attiva l'accoglienza e la risposta del personaggio vivo residente nella stanza |
