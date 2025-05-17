window.addEventListener("DOMContentLoaded", function () {
    // Recuperează produsele deja în coș și bifează-le
    const cos = JSON.parse(localStorage.getItem("cos") || "[]");

    document.querySelectorAll(".select-cos").forEach(cb => {
        if (cos.includes(cb.value)) {
            cb.checked = true;
        }

        cb.addEventListener("change", function () {
            let cosActualizat = JSON.parse(localStorage.getItem("cos") || "[]");
            const id = this.value;

            if (this.checked) {
                if (!cosActualizat.includes(id)) {
                    cosActualizat.push(id);
                }
            } else {
                cosActualizat = cosActualizat.filter(pid => pid !== id);
            }

            localStorage.setItem("cos", JSON.stringify(cosActualizat));
        });
    });
});
