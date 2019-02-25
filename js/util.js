Array.prototype.distinct = function () {
    let a = {},
        c = [],
        l = this.length;
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

function post(url, data, lid) {
    g_ajax_sending = true;
    $.ajax({
        type: 'POST',
        url: url,
        data: data,
        async: true,
        success: function (data, res) {
            g_ajax_sending = false;
            processArrangement(data, lid, url);
        },
        error: function (data) {
            g_ajax_sending = false;
            console.log("error", data);
        },
        dataType: "html"
    });
}

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
    return (document.URL.toLowerCase().indexOf(url.toLowerCase()) !== -1);
}
