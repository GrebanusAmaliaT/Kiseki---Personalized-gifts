const express= require("express");
const path=require("path");
const fs=require("fs");
const sharp=require("sharp");
const sass=require("sass");
const pg=require("pg");

const AccesBD=require("./module_proprii/accesbd.js");
AccesBD.getInstanta().select({tabel:"cadouri", campuri:["*"]}, function(err,rez) {
    console.log("---------------Acces BD----------------")
    console.log(err);
    console.log(rez)
});

const Client=pg.Client;

const client=new Client({
    database:"tehniciweb",
    user:"ami",
    password:"parola",
    host:"localhost",
    port:5432
})

client.connect()
const app= express();

v=[10,27,23,44,15]

nrImpar=v.find( function(elem){return elem % 100 ==1 })
console.log(nrImpar)

console.log("Folderul proiectului: ", __dirname);
console.log("Cale fisier index.js: ", __filename);
console.log("Folder de lucru: ", process.cwd() );

app.set("view engine", "ejs");

obGlobal={
    obErori:null,
    obImagini:null,
    folderScss:path.join(__dirname, "resurse/SCSS"),
    folderCss:path.join(__dirname, "resurse/CSS"),
    folderBackup:path.join(__dirname,"backup"),
    optiuniMeniu:null
}

client.query("select * from unnest(enum_range(null::tip_cadou))", function(err,rezultat) {
    console.log(err);
    console.log(rezultat);
    obGlobal.optiuniMeniu=rezultat.rows

});


let vect_foldere=["temp", "backup", "temp1"]
for(let folder of vect_foldere){
    let caleFolder = path.join(__dirname, folder);
    if( ! fs.existsSync(caleFolder)){
        fs.mkdirSync(caleFolder);
    }
}
const dirMedii = path.join(__dirname, 'resurse/imagini/galerieStatica-medii');
const dirMici = path.join(__dirname, 'resurse/imagini/galerieStatica-mici');

if (!fs.existsSync(dirMedii)){
    fs.mkdirSync(dirMedii);
}
if (!fs.existsSync(dirMici)){
    fs.mkdirSync(dirMici);
}

function compileazaScss(caleScss, caleCss){
    console.log("cale:",caleCss);
    if(!caleCss){

        let numeFisExt=path.basename(caleScss); //folder1/folder2/ceva.txt basename este ceva.txt 
        let numeFis=numeFisExt.split(".")[0]   /// "a.scss"  -> ["a","scss"]
        caleCss=numeFis+".css";
    }
    
    if (!path.isAbsolute(caleScss))
        caleScss=path.join(obGlobal.folderScss,caleScss )
    if (!path.isAbsolute(caleCss))
        
        caleCss=path.join(obGlobal.folderCss,caleCss )
    

    let caleBackup=path.join(obGlobal.folderBackup, "resurse/css");
    if (!fs.existsSync(caleBackup)) {
        fs.mkdirSync(caleBackup,{recursive:true})
    }
    
    // la acest punct avem cai absolute in caleScss si  caleCss

    let numeFisCss=path.basename(caleCss);
    if (fs.existsSync(caleCss)){
        let timestamp = Date.now(); 
        let numeFisierFaraExtensie = numeFisCss.split(".")[0]; //a 
        let extensie = path.extname(caleCss); //  .css

        let caleBackupFisier = path.join(
            obGlobal.folderBackup,
            "resurse/css",
            `${numeFisierFaraExtensie}_${timestamp}${extensie}`
        );
    
    fs.copyFileSync(caleCss, caleBackupFisier);
    }

    rez=sass.compile(caleScss, {"sourceMap":true});
    fs.writeFileSync(caleCss,rez.css)
    //console.log("Compilare SCSS",rez);
}
//compileazaScss("a.scss");

vFisiere=fs.readdirSync(obGlobal.folderScss); //vector de fisiere
for( let numeFis of vFisiere ){
    if (path.extname(numeFis)==".scss"){
        compileazaScss(numeFis);
    }
}


fs.watch(obGlobal.folderScss, function(eveniment, numeFis){
    console.log(eveniment, numeFis);
    if (eveniment=="change" || eveniment=="rename"){
        let caleCompleta=path.join(obGlobal.folderScss, numeFis);
        if (fs.existsSync(caleCompleta)){
            compileazaScss(caleCompleta);
        }
    }
})

function initErori(){
    let continut = fs.readFileSync(path.join(__dirname,"resurse/json/erori.json")).toString("utf-8");
    
    obGlobal.obErori=JSON.parse(continut)
    
    obGlobal.obErori.eroare_default.imagine=path.join(obGlobal.obErori.cale_baza, obGlobal.obErori.eroare_default.imagine)
    for (let eroare of obGlobal.obErori.info_erori){
        eroare.imagine=path.join(obGlobal.obErori.cale_baza, eroare.imagine)
    }
    console.log(obGlobal.obErori)

}

initErori()

function afisareEroare(res, identificator, titlu, text, imagine){
    let eroare= obGlobal.obErori.info_erori.find(function(elem)
    { 
        return elem.identificator==identificator 
        });

    if(eroare){
        if(eroare.status)
            res.status(identificator)
        var titluCustom=titlu || eroare.titlu;
        var textCustom=text || eroare.text;
        var imagineCustom=imagine || eroare.imagine;
    }
    else{
        var err=obGlobal.obErori.eroare_default
        var titluCustom=titlu || err.titlu;
        var textCustom=text || err.text;
        var imagineCustom=imagine || err.imagine;
    }

    res.render("pagini/eroare", { //transmit obiectul locals
        titlu: titluCustom,
        text: textCustom,
        imagine: imagineCustom
    })

}
function initImagini(){
    var continut= fs.readFileSync(path.join(__dirname,"resurse/json/galerie.json")).toString("utf-8");

    obGlobal.obImagini=JSON.parse(continut);
    let vImagini=obGlobal.obImagini.imagini;

    let caleAbs=path.join(__dirname,obGlobal.obImagini.cale_galerie);
    let caleAbsMediu=path.join(__dirname,obGlobal.obImagini.cale_galerie, "mediu");
   
    if (!fs.existsSync(caleAbsMediu))
        fs.mkdirSync(caleAbsMediu);

    for (let imag of vImagini){
        [numeFis, ext]=imag.cale_relativa.split(".");
        
        let caleFisAbs=path.join(caleAbs,imag.cale_relativa);
        let caleFisMediuAbs=path.join(caleAbsMediu, numeFis+".webp");
        
        sharp(caleFisAbs).resize(300).toFile(caleFisMediuAbs);
        
        imag.cale_relativa_mediu=path.join("/", obGlobal.obImagini.cale_galerie, "mediu",numeFis+".webp" )
        imag.cale_relativa=path.join("/", obGlobal.obImagini.cale_galerie, imag.cale_relativa )
        
    }
    console.log(obGlobal.obImagini)
}


initImagini();

// app.use(async function(req, res, next){
//     try {
//         const rezultat = await client.query("SELECT unnest(enum_range(NULL::tip_cadou))");
//         res.locals.optiuni = rezultat.rows; // disponibil în toate paginile
//     } catch (err) {
//         console.log("Eroare la query optiuni:", err);
//         res.locals.optiuni = [];
//     }
//     next();
// });

app.use("/*", function(req,res,next) {
    try{
    res.locals.optiuniMeniu=obGlobal.optiuniMeniu
    } catch (err) {
            console.log("Eroare la query optiuni:", err);
            res.locals.optiuniMeniu = [];
        }

    next();
})

app.use("/resurse", express.static(path.join(__dirname, 'resurse')))
app.use("/node_modules", express.static(path.join(__dirname, 'node_modules')))


app.get("/favicon.ico", function(req, res){
    res.sendFile(path.join(__dirname, 'resurse/imagini/favicon/favicon.ico'))
})

app.get("/despre", (req, res) => {
    res.render("pagini/despre");
});


app.get( ["/", "/home", "/index"], async (req,res) => {
    console.log("AM INTRAT PE ROUTE /");
    
    const ora = new Date().getHours();
    const imaginiValideCurent = imaginiValide(ora);
    const imaginiAfisate = imaginiValideCurent;
    const imaginiAcasaStatic= imaginiValideCurent;

    const imaginiAnimata = selectRandomImages(imaginiValideCurent); 

    await genereazaImagini();

    res.render("pagini/index", {
        ip:req.ip, 
        imagini:obGlobal.obImagini.imagini, 
        imaginiAnimata: imaginiAnimata,
        imaginiGalerieStatica: imaginiValideCurent } );
})

app.get("/fisier", function(req,res){
    res.render("pagini/index")
})

app.get("/cerere", function(req, res) {
    res.send("<p style='color:green;'> Buna ziua </p>")
})

app.get("/fisier", function(req, res) {
    res.sendFile(path.join(__dirname,"package.json") )
})


app.get("/abc", function(req, res,next){
    res.write("Data curenta: ");
    next();
})


app.get("/abc", function(req, res,next){
    res.write((new Date())+" ");
    res.end();
    next();
})

app.get("/produse/seturi", async function (req, res) {
    try {
        const seturiQuery = `
            SELECT s.id, s.nume_set, s.descriere_set
            FROM seturi s
            JOIN asociere_set a ON s.id = a.id_set
            JOIN cadouri p ON a.id_produs = p.id
            GROUP BY s.id, s.nume_set, s.descriere_set
        `;

        const produseQuery = `
            SELECT s.id AS id_set, p.id, p.nume, p.pret, p.imagine
            FROM seturi s
            JOIN asociere_set a ON s.id = a.id_set
            JOIN cadouri p ON a.id_produs = p.id
        `;

        const [seturiResult, produseResult] = await Promise.all([
            client.query(seturiQuery),
            client.query(produseQuery)
        ]);

        const seturi = seturiResult.rows.map(set => {
            set.produse = produseResult.rows.filter(p => p.id_set === set.id);
           
            set.pret_final = set.produse.reduce((acc, p) => acc + (Number(p.pret) || 0), 0) * 0.9;

            return set;
        });
        
        res.render("pagini/seturi", { seturi });

    } catch (err) {
        console.error("Eroare interogare seturi:", err);
        afisareEroare(res, 2, "Eroare interogare seturi.");
    }
});


app.get("/produse", function(req, res){
    console.log(req.query);
    
    let conditieQuery = "";
    if (req.query.tip) {
        conditieQuery = `WHERE tip='${req.query.tip}'`;
    }

    const queryIeptine = `
    SELECT DISTINCT ON (subcategorie) id
    FROM cadouri
    ORDER BY subcategorie, pret ASC
    `;

    const queryProduse = `SELECT * FROM cadouri ${conditieQuery}`;
    const queryOptiuni = `SELECT * FROM unnest(enum_range(null::tip_cadou))`;
    const queryMinMax = `SELECT MIN(pret) AS min, MAX(pret) AS max FROM cadouri`;
    const queryDateBounds = `SELECT 
    to_char(MIN(data_adaugare), 'YYYY-MM-DD') AS min, 
    to_char(MAX(data_adaugare), 'YYYY-MM-DD') AS max 
    FROM cadouri`;
    const queryExemplu = `SELECT nume FROM cadouri ORDER BY RANDOM() LIMIT 1`;
    const queryElemPers = `SELECT DISTINCT UNNEST(elemente_personalizare) AS elem FROM cadouri`;
    const queryDatalist = `SELECT DISTINCT nume FROM cadouri`;

    client.query(queryProduse, function(err, rezProduse){
        if (err) {
            console.log(err);
            afisareEroare(res, 2);
            return;
        }

        client.query(queryOptiuni, function(err, rezOptiuni){
            if (err) {
                console.log(err);
                afisareEroare(res, 2);
                return;
            }

            client.query(queryMinMax, function(err, rezMinMax){
                if (err) {
                    console.log(err);
                    afisareEroare(res, 2);
                    return;
                }
                client.query(queryDateBounds, function(err, rezDate){
                    if (err) {
                        console.log(err);
                        afisareEroare(res, 2);
                        return;
                    }
                client.query(queryExemplu, function(err, rezEx){
                    if (err) {
                        console.log(err);
                        afisareEroare(res, 2);
                        return;
                    }

                    client.query(queryElemPers, function(err, rezElem){
                        if (err) {
                            console.log(err);
                            afisareEroare(res, 2);
                            return;
                        }

                        client.query(queryDatalist, function(err, rezDatalist){
                            if (err) {
                                console.log(err);
                                afisareEroare(res, 2);
                                return;
                            }

                            client.query(queryIeptine, function(err, rezIeftine) {
                                if (err) {
                                    console.log(err);
                                    afisareEroare(res, 2);
                                    return;
                                }
                                const idIeptine = rezIeftine.rows.map(r => r.id);
                                
                                res.render("pagini/produse", {
                                    produse: rezProduse.rows,
                                    optiuni: rezOptiuni.rows,
                                    minPret: rezMinMax.rows[0].min,
                                    maxPret: rezMinMax.rows[0].max,
                                    minData: rezDate.rows[0].min,
                                    maxData: rezDate.rows[0].max,
                                    exempluNume: rezEx.rows[0].nume,
                                    elemente: rezElem.rows.map(r => r.elem),
                                    datalistProduse: rezDatalist.rows.map(r => r.nume),
                                    produseIeftine: idIeptine
                                });
                            });
                        });
                     });
                    });
                });
            });
        });
    });
});

app.get("/produs/:id", async (req, res) => {
    try {
        const resultProd = await client.query("SELECT * FROM cadouri WHERE id=$1", [req.params.id]);
        if (resultProd.rows.length === 0) return afisareEroare(res, 404);

        const produs = resultProd.rows[0];

        const resultSimilare = await client.query(
            "SELECT * FROM cadouri WHERE tip=$1 AND id != $2 LIMIT 4",
            [produs.tip, req.params.id]
        );


        const resultSeturi = await client.query(`
            SELECT s.id, s.nume_set, s.descriere_set,
                   ARRAY_AGG(p.id) AS produse_ids,
                   ARRAY_AGG(p.nume) AS produse_nume,
                   ARRAY_AGG(p.imagine) AS produse_imagini,
                   ARRAY_AGG(p.pret) AS produse_preturi
            FROM seturi s
            JOIN asociere_set a ON s.id = a.id_set
            JOIN cadouri p ON a.id_produs = p.id
            WHERE s.id IN (
                SELECT id_set FROM asociere_set WHERE id_produs=$1
            )
            GROUP BY s.id
        `, [req.params.id]);

        res.render("pagini/produs", { 
            prod: produs, 
            seturi: resultSeturi.rows,
            similare: resultSimilare.rows });
    } catch (e) {
        console.error(e);
        afisareEroare(res, 2);
    }
});


app.get("/produse/:tip", function(req, res) {
    const tipCerut = req.params.tip;

    console.log(req.query);
    
    let conditieQuery = "";
    if (req.query.tip) {
        conditieQuery = `WHERE tip='${req.query.tip}'`;
    }

    const queryProduse = `SELECT * FROM cadouri ${conditieQuery}`;
    const queryOptiuni = `SELECT * FROM unnest(enum_range(null::tip_cadou))`;
    const queryMinMax = `SELECT MIN(pret) AS min, MAX(pret) AS max FROM cadouri`;
    const queryDateBounds = `SELECT 
    to_char(MIN(data_adaugare), 'YYYY-MM-DD') AS min, 
    to_char(MAX(data_adaugare), 'YYYY-MM-DD') AS max 
    FROM cadouri`;
    const queryExemplu = `SELECT nume FROM cadouri ORDER BY RANDOM() LIMIT 1`;
    const queryElemPers = `SELECT DISTINCT UNNEST(elemente_personalizare) AS elem FROM cadouri`;
    const queryDatalist = `SELECT DISTINCT nume FROM cadouri`;

    client.query("SELECT * FROM unnest(enum_range(NULL::tip_cadou))", function(err, rezOptiuni) {
        if (err) {
            console.log(err);
            afisareEroare(res, 2, "Eroare interogare tipuri.");
            return;
        }

        client.query("SELECT * FROM cadouri WHERE tip = $1", [tipCerut], function(err2, rezProduse) {
            if (err2) {
                console.log(err2);
                afisareEroare(res, 2, "Eroare interogare produse.");
                return;
            }
                client.query(queryMinMax, function(err, rezMinMax){
                                if (err) {
                                    console.log(err);
                                    afisareEroare(res, 2);
                                    return;
                                }
                                client.query(queryDateBounds, function(err, rezDate){
                                    if (err) {
                                        console.log(err);
                                        afisareEroare(res, 2);
                                        return;
                                    }
                                client.query(queryExemplu, function(err, rezEx){
                                    if (err) {
                                        console.log(err);
                                        afisareEroare(res, 2);
                                        return;
                                    }

                                    client.query(queryElemPers, function(err, rezElem){
                                        if (err) {
                                            console.log(err);
                                            afisareEroare(res, 2);
                                            return;
                                        }

                                        client.query(queryDatalist, function(err, rezDatalist){
                                            if (err) {
                                                console.log(err);
                                                afisareEroare(res, 2);
                                                return;
                                            }

                                            res.render("pagini/produse", {
                                                produse: rezProduse.rows,
                                                optiuni: rezOptiuni.rows,
                                                minPret: rezMinMax.rows[0].min,
                                                maxPret: rezMinMax.rows[0].max,
                                                minData: rezDate.rows[0].min,
                                                maxData: rezDate.rows[0].max,
                                                exempluNume: rezEx.rows[0].nume,
                                                elemente: rezElem.rows.map(r => r.elem),
                                                datalistProduse: rezDatalist.rows.map(r => r.nume)
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
});

app.get("/comparare", function(req, res){
    let ids = req.query.ids?.split(",").map(x => parseInt(x)).filter(x => !isNaN(x));
    if (!ids || ids.length !== 2) {
        return res.send("Trebuie să compari exact două produse.");
    }
    client.query("SELECT * FROM cadouri WHERE id = ANY($1::int[])", [ids], function(err, result){
        if (err) {
            console.error(err);
            return res.send("Eroare la comparare.");
        }
        if (result.rows.length !== 2) {
            return res.send("Nu s-au găsit ambele produse.");
        }
        res.render("pagini/comparare", { p1: result.rows[0], p2: result.rows[1] });
    });
});

app.get(/^\/resurse\/[a-zA-Z0-9_\/]*$/, function(req,res,next){
    afisareEroare(res,403);
})


app.get('/galerie', async (req, res) => {
    const ora = new Date().getHours();
    const imaginiAfisate = imaginiValide(ora);
    await genereazaImagini();
    res.render('pagini/galerie', { imagini: imaginiAfisate });
});

app.get("/cos", (req, res) => {
    client.query("SELECT * FROM cadouri")
        .then(result => {
            const produse = result.rows;
            res.render("pagini/cos", { produse });
        })
        .catch(err => {
            console.error("Eroare interogare cadouri:", err);
            res.status(500).send("Eroare la interogarea bazei de date.");
        });
});


app.get("/despre", function(req, res){
    let nrRandom = Math.floor(Math.random() * (17 - 2)) + 2; // de la 2 la 16
    let nrPutere2 = 1;
    while (nrPutere2 * 2 <= nrRandom) {
        nrPutere2 *= 2;
    }
    res.render("pagini/despre", { ip: req.ip, imagini: obGlobal.obImagini.imagini,nrImagini: nrPutere2 });
    
})

app.get("/*.ejs", function(req, res, next){
    afisareEroare(res,400);
})

app.get("/*", function(req, res, next) {
    try{
    res.render("pagini" + req.url, function(err, rezultatRandare)  {
        if(err){
            if(err.message.startsWith("Failed to lookup view")){
                afisareEroare(res,404);
            }else{
                afisareEroare(res);
            }
        }
        else{
            console.log(rezultatRandare);
            res.send(rezultatRandare);
        }
    });
    }catch(errRandare){
        if(errRandare.message.startsWith("Cannot find module")){
            afisareEroare(res,404);
        }else{
            afisareEroare(res);
        }

    }
})
console.log("checkpoint 1");
const galerie = JSON.parse(fs.readFileSync('resurse/json/galerie.json'));

function imaginiValide(oraCurenta) {
    let imaginiValide = galerie.imagini.filter(img => {
        return img.intervale_ore.some(interval => oraCurenta >= interval[0] && oraCurenta <= interval[1]);
    });

    // Trunchiez la cel mai mic nr par
    if (imaginiValide.length % 2 !== 0) {
        imaginiValide.pop(); // scoat una daca nr e impar
    }

    return imaginiValide;
}


async function genereazaImagini() {
    for (const img of galerie.imagini) {
        const numeFisier = img.cale_relativa;
        const caleOriginala = path.join(__dirname, 'resurse/imagini/galerieStatica', numeFisier);
        const caleMedie = path.join(__dirname, 'resurse/imagini/galerieStatica-medii', numeFisier);
        const caleMica = path.join(__dirname, 'resurse/imagini/galerieStatica-mici', numeFisier);

        if (!fs.existsSync(caleMedie)) {
            await sharp(caleOriginala).resize(300).toFile(caleMedie);
        }
        if (!fs.existsSync(caleMica)) {
            await sharp(caleOriginala).resize(150).toFile(caleMica);
        }
    }
}
function randomEven(min, max) {
    let num = Math.floor(Math.random() * ((max - min) / 2 + 1)) * 2 + min;
    return num;
}

function selectRandomImages(imaginiValide) {
    const nrImagini = randomEven(6, 12);
    const imaginiShuffle = [...imaginiValide].sort(() => Math.random() - 0.5);
    return imaginiShuffle.slice(0, nrImagini);
}

app.listen(8080);
console.log("Serverul a pornit")