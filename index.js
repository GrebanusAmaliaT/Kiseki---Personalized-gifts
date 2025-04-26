const express= require("express");
const path=require("path");
const fs=require("fs");
const sharp=require("sharp");
const sass=require("sass");
const pg=require("pg");


const Client=pg.Client;

client=new Client({
    database:"tehniciweb",
    user:"ami",
    password:"parola",
    host:"localhost",
    port:5432
})

client.connect()
client.query("select * from prajituri", function(err, rezultat ){
    console.log(err)    
    console.log(rezultat)
})
client.query("select * from unnest(enum_range(null::categ_prajitura))", function(err, rezultat ){
    console.log(err)    
    console.log(rezultat)
})

app= express();

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
    folderBackup:path.join(__dirname,"backup")
}

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
        fs.copyFileSync(caleCss, path.join(obGlobal.folderBackup, "resurse/css",numeFisCss ))// +(new Date()).getTime()
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

    //for (let i=0; i< vErori.length; i++ )
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

app.use("/resurse", express.static(path.join(__dirname, 'resurse')))
app.use("/node_modules", express.static(path.join(__dirname, 'node_modules')))


app.get("/favicon.ico", function(req, res){
    res.sendFile(path.join(__dirname, 'resurse/imagini/favicon/favicon.ico'))
})

app.get("/despre", (req, res) => {
    res.render("pagini/despre");
});

app.get( ["/", "/home", "/index"], function(req, res) {
    res.render("pagini/index", {ip:req.ip, imagini:obGlobal.obImagini.imagini} );
})

app.get("/fisier", function(req,res){
    res.render("pagini/index")
})

app.get("/cerere", function(req, res) {
    res.send("<p style='color:green;'> Buna ziua </p>")
})

app.get("/fisier", function(req, res) {
    res.sendfile(path.join(__dirname,"package.json") )
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

app.get("/produse", function(req, res){
    console.log(req.query)
    var conditieQuery=""; // TO DO where din parametri


    queryOptiuni=" select * from unnest(enum_range(null::categ_prajitura)) "
    client.query(queryOptiuni, function(err, rezOptiuni){
        console.log(rezOptiuni)


        queryProduse="select * from prajituri"
        client.query(queryProduse, function(err, rez){
            if (err){
                console.log(err);
                afisareEroare(res, 2);
            }
            else{
                res.render("pagini/produse", {produse: rez.rows, optiuni:rezOptiuni.rows})
            }
        })
    });
})


app.get(/^\/resurse\/[a-zA-Z0-9_\/]*$/, function(req,res,next){
    afisareEroare(res,403);
})
app.get('/', async (req, res) => {
    const ora = new Date().getHours();
    const imaginiAfisate = imaginiValide(ora);
    await genereazaImagini();
    res.render('pagini/index', { imagini: imaginiAfisate });
});

app.get('/galerie', async (req, res) => {
    const ora = new Date().getHours();
    const imaginiAfisate = imaginiValide(ora);
    await genereazaImagini();
    res.render('pagini/galerie', { imagini: imaginiAfisate });
});

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
        if(errRandare.message.startswith("Cannot find module")){
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

    // Trunchiem la cel mai mic număr par
    if (imaginiValide.length % 2 !== 0) {
        imaginiValide.pop(); // scoatem una dacă sunt impare
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


app.listen(8080);
console.log("Serverul a pornit")

