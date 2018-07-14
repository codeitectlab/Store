var checkboxes = document.querySelectorAll('section.filters div input');

var applyFilters = function() {
    alert(this.value);
};

for(vari=0; i<checkboxes.length; i++) {
    checkboxes[i].addEventListener('change', applyFilters);
}