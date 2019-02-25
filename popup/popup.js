function stopMonitor() {
    $("#stop-btn").click(() => {
        console.log('lesson monitor disabled');
        monitor_enabled = 0;
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, tabs => {
            chrome.tabs.sendMessage(tabs[0].id, {
                content: monitor_enabled
            })
        });
    });

}

function getLessonInfo() {
    chrome.storage.local.get(null, items => {
        lname = items["lname"];
        lcode = items["lcode"];
        tname = items["tname"];
        lstatus = items["lstatus"];
        times = items["times"];
        monitor_status = items["monitor_status"];
        hide_info = items["hide_info"];
        updateLessonInfo(lname, lcode, tname, lstatus, times, monitor_status, hide_info)
    })
}

function updateLessonInfo(lname, lcode, tname, lstatus, times, monitor_status, hide_info) {
    if (hide_info) {
        return;
    }
    if (tname === "") {
        lname = "";
        lcode = "";
        lstatus = "";
        times = "";
        monitor_status = "";
    }
    $("#tname").html(tname);
    $("#lname").html(lname);
    $("#lcode").html(lcode);
    $("#lstatus").html(lstatus);
    $("#times").html(times);
    $("#monitor-status").html(monitor_status);
}

function clearLessonInfo() {
    $("#clear-info").click(() => {
        chrome.storage.local.set({
            hide_info: 1
        });
        window.close();
    })
}

function getExtVersion() {
    $("#version").html("HelloElectsys " + "(version " + chrome.runtime.getManifest().version + ")")
}

document.addEventListener("DOMContentLoaded", () => {
    stopMonitor();
    getLessonInfo();
    updateLessonInfo();
    clearLessonInfo();
    getExtVersion();
});
