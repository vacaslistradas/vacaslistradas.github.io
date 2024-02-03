document.addEventListener("DOMContentLoaded", function() {
    const toggleButtons = document.querySelectorAll(".toggle-details");

    toggleButtons.forEach(button => {
        button.addEventListener("click", function() {
            const details = this.parentElement.nextElementSibling;
            details.classList.toggle("hidden");
            this.textContent = details.classList.contains("hidden") ? "[+]" : "[-]";
        });
    });
});
