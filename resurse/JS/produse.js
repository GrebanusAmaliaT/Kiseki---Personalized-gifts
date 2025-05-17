window.onload=function(){
    const btn=document.getElementById("filtrare");
    btn.onclick=function(){
        let inpNume=document.getElementById("inp-nume").value.trim().toLowerCase();

        let vectRadio=document.getElementsByName("gr_rad")

        let inpDimensiune=null
        let minDimensiune=null
        let maxDimensiune=null

        for(let rad of vectRadio){
            if(rad.checked){
                inpDimensiune=rad.value
                if(rad.value!="toate"){
                    [minDimensiune, maxDimensiune]=inpDimensiune.split(":") //350:700 -> ["350", "700"]
                    minDimensiune=parseFloat(minDimensiune)
                    maxDimensiune=parseFloat(maxDimensiune)
                }
                break
            }
        }
        let inpPret=parseFloat(document.getElementById("inp-pret").value.trim());

        let inpCategorie=document.getElementById("inp-categorie").value.trim().toLowerCase();

        let produse=document.getElementsByClassName("produs");

        let inpDescriere = document.getElementById("inp-descriere").value.trim().toLowerCase();

        let inpData = document.getElementById("inp-data").value;


        for(let prod of produse){
            prod.style.display="none";

            let nume=prod.getElementsByClassName("val-nume")[0].innerHTML.trim().toLowerCase();
            
            let dimensiune=parseFloat(prod.getElementsByClassName("val-dimensiune")[0].innerHTML.trim());

            let cond1=nume.startsWith(inpNume)
            let cond2=(inpDimensiune=="toate" || (minDimensiune<=dimensiune && dimensiune<maxDimensiune))

            let pret=parseFloat(prod.getElementsByClassName("val-pret")[0].innerHTML.trim())
            let cond3=(inpPret<= pret)

            let categorie=prod.getElementsByClassName("val-categorie")[0].innerHTML.trim().toLowerCase();

            let cond4=(inpCategorie=="toate" || inpCategorie==categorie)
            

            let ambalajText = prod.getElementsByClassName("val-ambalaj")[0].innerHTML.trim().toLowerCase();
            let ambalaj = (ambalajText === "true"); // boolean true sau false
            let inpAmbalaj = document.getElementById("inp-ambalaj").checked; // valoare checkbox (true/false)
            let cond5 = (!inpAmbalaj || ambalaj); 
            // Afișează toate produsele dacă checkboxul nu e bifat,
            // sau doar cele care au `include_ambalaj == true` dacă e bifat

            let produse = document.getElementsByClassName("produs");
            console.log("Total produse în pagină:", produse.length);



            let descriere = prod.getElementsByClassName("val-descriere");
            let cond6 = true;
            if (descriere.length > 0) {
                cond6 = descriere[0].innerHTML.trim().toLowerCase().includes(inpDescriere);
            }

            let dataProdStr = prod.getElementsByClassName("val-data")[0].dataset.date;
            console.log(dataProdStr, inpData)
            let cond7 = (!inpData || dataProdStr == inpData);

        
            if (cond1 && cond2 && cond3 && cond4 && cond5 && cond6 && cond7) {
                prod.style.display="block";
            }

        }

        let produseVizibile = Array.from(produse).filter(p => p.style.display !== "none");
        let mesaj = document.getElementById("mesaj-vid");
        if (!mesaj) {
            mesaj = document.createElement("p");
            mesaj.id = "mesaj-vid";
            mesaj.className = "text-danger fs-5";
            mesaj.textContent = "Nu există produse conform filtrării curente.";
            document.querySelector(".grid-produse").prepend(mesaj);
        }
        mesaj.style.display = produseVizibile.length === 0 ? "block" : "none";
   
    }
    

    document.getElementById("inp-pret").onchange=function(){
        document.getElementById("infoRange").innerHTML=`(${this.value})`
    }

    document.getElementById("resetare").onclick = function () {
        if (!confirm("Sigur doresti să resetezi filtrele?")) {
            return;
        }
    
        document.getElementById("inp-nume").value = "";
        document.getElementById("i_rad4").checked = true;
    
        let valMinPret = parseFloat(document.getElementById("inp-pret").min);
        document.getElementById("inp-pret").value = valMinPret; // ✅ setează efectiv sliderul
        document.getElementById("infoRange").innerHTML = `(${valMinPret})`;
    
        document.getElementById("inp-categorie").value = "toate";
    
        document.getElementById("inp-descriere").value = "";
        document.getElementById("inp-data").value = "";
        document.getElementById("inp-ambalaj").checked = false;
    
        let produse = document.getElementsByClassName("produs");
        for (let prod of produse) {
            prod.style.display = "block";
        }
    
        let mesaj = document.getElementById("mesaj-vid");
        if (mesaj) mesaj.style.display = "none";
    };
    

    document.getElementById("sortCrescNume").onclick=function(){
        sorteaza(1);
    }

    document.getElementById("sortDescrescNume").onclick=function(){
        sorteaza(-1);
    }

    function sorteaza(semn) {
            let produse=document.getElementsByClassName("produs") 
            
            let vProduse=Array.from(produse);

            vProduse.sort(function(a,b) { // a si b sunt <article>

                let pretA=parseFloat( a.getElementsByClassName("val-pret")[0].innerHTML.trim())
                let pretB=parseFloat( b.getElementsByClassName("val-pret")[0].innerHTML.trim())

                if(pretA!=pretB){
                    return semn*(pretA-pretB);
                }

                //daca pretA=pretB continua aici

                let numeA = a.getElementsByClassName("val-nume")[0].innerHTML.trim().toLocaleLowerCase();
                let numeB = b.getElementsByClassName("val-nume")[0].innerHTML.trim().toLocaleLowerCase();
                return semn*(numeA.localeCompare(numeB))
            })

            for(let prod of vProduse){
                prod.parentNode.appendChild(prod);
            }
        }
}
    
window.onkeydown=function(e) {
    console.log(e);

    if(e.key=="c" && e.altKey ){
        let produse=document.getElementsByClassName("produs")
        sumaPreturi=0;

        for(let prod of produse){
            if(prod.style.display!="none"){
                let pret=parseFloat( prod.getElementsByClassName("val-pret")[0].innerHTML.trim())
                sumaPreturi+=pret
            }
        }
        if( !document.getElementById("suma_preturi") ){
            let pRezultat=document.createElement("p");
            pRezultat.innerHTML=sumaPreturi //<p> sumaPreturi </p>
            pRezultat.id="suma_preturi"

            let p=document.getElementById("p-suma")
            p.parentNode.insertBefore(pRezultat, p.nextElementSibling)
            
            setTimeout(function(){
                let p1=document.getElementById("suma_preturi")

                if(p1){
                    p1.remove();
                }
            }, 2000)
        }
    }
}

function actualizeazaContainerComparare() {
    let lista = JSON.parse(localStorage.getItem("lista_comparare") || "[]");
    let listaElem = document.getElementById("lista-comparare");
    listaElem.innerHTML = "";

    lista.forEach(prod => {
        let li = document.createElement("li");
        li.innerText = prod.nume + " ";
        let btnSterge = document.createElement("button");
        btnSterge.className = "btn btn-danger btn-sm ms-2";
        btnSterge.innerText = "șterge";
        btnSterge.onclick = function () {
            let listaNoua = lista.filter(p => p.id !== prod.id);
            localStorage.setItem("lista_comparare", JSON.stringify(listaNoua));
            localStorage.setItem("ultima_actiune", Date.now());
            actualizeazaContainerComparare();
        };
        li.appendChild(btnSterge);
        listaElem.appendChild(li);
    });

    let container = document.getElementById("container-comparare");
    let btnAfisare = document.getElementById("btn-afisare-comparare");

    if (lista.length === 0) {
        container.classList.add("d-none");
    } else {
        container.classList.remove("d-none");
        btnAfisare.classList.toggle("d-none", lista.length < 2);
    }

    document.querySelectorAll(".btn-compare").forEach(btn => {
        if (lista.length >= 2) {
            btn.disabled = true;
            btn.setAttribute("data-tooltip", "Ștergeți un produs din lista de comparare");
        } else {
            btn.disabled = false;
            btn.removeAttribute("data-tooltip");
        }
    });
    
}

window.addEventListener("DOMContentLoaded", function () {
    actualizeazaContainerComparare();

    document.querySelectorAll(".btn-compare").forEach(btn => {
        btn.addEventListener("click", function () {
            let lista = JSON.parse(localStorage.getItem("lista_comparare") || "[]");

            if (lista.length >= 2) return;

            let produs = {
                id: this.dataset.id,
                nume: this.dataset.nume
            };
            lista.push(produs);
            localStorage.setItem("lista_comparare", JSON.stringify(lista));
            localStorage.setItem("ultima_actiune", Date.now());
            actualizeazaContainerComparare();
        });
    });

    document.getElementById("btn-afisare-comparare").addEventListener("click", function () {
        window.open(`/comparare?ids=${JSON.parse(localStorage.getItem("lista_comparare")).map(p => p.id).join(",")}`, "_blank");
    });

    // Ascundere automată după o zi
    let ultimaActiune = parseInt(localStorage.getItem("ultima_actiune"));
    if (Date.now() - ultimaActiune > 24 * 60 * 60 * 1000) {
        localStorage.removeItem("lista_comparare");
        actualizeazaContainerComparare();
    }
});
