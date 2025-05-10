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

        let produse=document.getElementsByClassName("produs")

        for(let prod of produse){
            prod.style.display="none";

            let nume=prod.getElementsByClassName("val-nume")[0].innerHTML.trim().toLowerCase();
            
            let dimensiune=parseFloat(prod.getElementsByClassName("val-gramaj")[0].innerHTML.trim());

            let cond1=nume.startsWith(inpNume)
            let cond2=(inpDimensiune=="toate" || (minDimensiune<=dimensiune && dimensiune<maxDimensiune))

            let pret=parseFloat(prod.getElementsByClassName("val-pret")[0].innerHTML.trim())
            let cond3=(inpPret<= pret)

            let categorie=prod.getElementsByClassName("val-categorie")[0].innerHTML.trim().toLowerCase();

            let cond4=(inpCategorie=="toate" || inpCategorie==categorie)

            if(cond1 && cond2 && cond3 && cond4){
                prod.style.display="block";
            }


        }

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
        document.getElementById("inp-pret").value = 0;
        document.getElementById("infoRange").innerHTML = "(0)";
        document.getElementById("inp-categorie").value = "toate";
    
        let produse = document.getElementsByClassName("produs");
        for (let prod of produse) {
            prod.style.display = "block";
        }
    }
    

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