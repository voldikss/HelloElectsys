function inUrl(url) {
    // Iterate if url is an array
    if (Array.isArray(url)) {
        let len = url.length;
        for (let i = 0; i < len; ++i) {
            if (inUrl(url[i])) {
                return true;
            }
        }
        return false;
    }
    return (document.URL.toLowerCase().indexOf(url.toLowerCase()) != -1);
}

Array.prototype.distinct = function () {
    let a = {}, c = [], l = this.length;
    for (let i = 0; i < l; i++) {
        let b = this[i];
        let d = (typeof b) + b;
        if (a[d] === undefined) {
            c.push(b);
            a[d] = 1;
        }
    }
    return c;
};

function main() {

    base_url = document.URL.slice(0, document.URL.indexOf("sjtu.edu.cn") + 11);

    change_name();
    check_off_on();
    optimize_elect1();
    optimize_elect2();
    optimize_elect_warning();
    one_key_remove();
}


jQuery(document).ready(function () {
    main();
});
