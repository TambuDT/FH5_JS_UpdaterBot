const opn = require('opn');
const pupprteer = require('puppeteer');
const fs = require('fs');
const { exit } = require('process');
const fetch = (...args) =>
    import('node-fetch').then(({ default: fetch }) => fetch(...args));
//variabili globali
const filename = "current_game_version.txt";
const release_version_link = "https://www.greydoom.com/2022/10/forza-horizon-5-steam-updates-list-with.html";
const update_url = "https://teamkong.tk/forza-horizon-5/";
var current_game_version = "";
var messaggio_telegram = "";
var last_div_filename = "lastdiv.txt"
var last_div = "";
//fine


function main() {
    //lettura file lastdiv.txt
    fs.readFile(last_div_filename, 'utf8', (err, data) => {
        if (err) {
            console.error(err); S
            return err;
        }
        else {
            last_div = data;
        }
    });//fine


    //lettura file current_game_version.txt
    fs.readFile(filename, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return err;
        }
        else {
            current_game_version = data;
            console.log("Current Version: " + current_game_version);
        }
    });//fine

    async function downloadTorrentAndWriteFiles(magnetLink) {
        
        send_telegram_message(release_version,magnetLink)

        try {
            opn(magnetLink);
        }
        catch (error) {
            console.error('Errore durante apertura programma:', error);
        }

        try {
            // Scrivi su file la nuova versione del gioco
            fs.writeFile(filename, release_version, (err) => {
                if (err) {
                    throw err; // Lancia un'eccezione in caso di errore
                }
                else {
                    console.log("La versione del gioco è stata aggiornata sul file versione");
                }
            });

            last_div++;
            last_div++;

            // Scrivi su file il prossimo div in cui sarà l'update
            fs.writeFile(last_div_filename, "" + last_div, (err) => {
                if (err) {
                    throw err; // Lancia un'eccezione in caso di errore
                }
                else {
                    console.log("Il prossimo div è stato aggiornato sul file lastdiv");
                }
            });

        } catch (error) {
            console.error('Errore durante la scrittura dei file:', error);
        }
    }

    function send_telegram_message(release_version,magnet) {
        var linkCrack='Link Crack: '+'https://teamkong.tk/forza-horizon-5-full-online-fix-files/'+'\n';
        var linkMagnet='Link Magnet: '+magnet;
        var messaggio='Aggiornamento Forza Horizon 5: '+release_version+'\n'+linkCrack+linkMagnet;
        const telegram_token = "your telegram token";
        const chatId = "your chat id";
        fetch("https://api.telegram.org/bot" + telegram_token + "/sendMessage?chat_id=" + chatId + "&text=" + messaggio + "", {
            method: "GET"
        });
        main();
    }


    //funzione per verificare se sul sito teamkong è presente l'aggiornamento della nuova release 
    async function check_online_version(release_ver) {
        try {
            const browser = await pupprteer.launch();
            const page = await browser.newPage();
            await page.goto(update_url);

            const [el] = await page.$x('/html/body/div[2]/div[2]/div/div[1]/main/article/div[1]/div[1]/header/div/div/h1');
            const get_title = await el.getProperty('textContent');
            const title = await get_title.jsonValue();

            if (title.includes(release_ver)) {
                var count = 1;

                while (1) {
                    try {
                        const [el] = await page.$x('/html/body/div[2]/div[2]/div/div[1]/main/article/div[1]/div[2]/div/div[' + count + ']');
                        const [el2] = await page.$x('/html/body/div[2]/div[2]/div/div[1]/main/article/div[1]/div[2]/div/div[' + count + ']/a');
                        const get_title = await el.getProperty('textContent');
                        const linkTitle = await get_title.jsonValue();

                        if (linkTitle.includes('Magnet')) {
                            //console.log(linkTitle + ' contiene magnet nel link');
                            const get_link = await el2.getProperty('href');
                            const upd_link = await get_link.jsonValue();
                            //console.log(upd_link)
                            downloadTorrentAndWriteFiles(upd_link)
                        }

                        count++;
                    } catch (error) {
                        // Gestisci l'errore quando l'elemento non è trovato
                        //console.error('Elemento non trovato:', error.message);
                        break; // Esci dal ciclo
                    }
                }
            }

        } catch (error) {
            console.error('Errore generale:', error.message);
        }
    }


    //funzione per verificare se la versione corrente del mio update è la stessa di quella trovata sul web
    function check(file_ver, release_ver) {
        if (file_ver != release_ver) {
            console.log("")
            check_online_version(release_ver)
        }
        else {
            console.log("hai già la versione più recente del gioco")
        }
    }//fine


    //verifica se esiste una nuova versione di forza
    async function scrapeUpdate(url) {
        try {
            const browser = await pupprteer.launch();
            const page = await browser.newPage();
            await page.goto(url)
            const [el] = await page.$x('//*[@id="Blog1"]/div/div[1]/div[2]/div[' + last_div + ']/span');
            const get_last_version = await el.getProperty('textContent');
            const version = await get_last_version.jsonValue();
            browser.close();
            return new Promise((accept, reject) => {
                accept(version);
            });
        }
        catch (err) {
            console.log(err.message);
        }
    }//fine



    //uso un'altra funzione asincrona per aspettare il risultato della promise della funzione scrapeUpdate
    (async () => {
        var current_released_version = await scrapeUpdate(release_version_link);
        if (current_released_version == "") {
            console.log("NON CI SONO AGGIORNAMENTI");
            process.exit();
        }
        else {
            console.log("Update Version: " + current_released_version);
            release_version = current_released_version;
            check(current_game_version, current_released_version);
        }
    })();//fine

}


main();
