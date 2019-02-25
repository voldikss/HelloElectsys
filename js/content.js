const INTERVAL_DEFAULT = 1600;
const INTERVAL_STEP = 200;


let lname;
let lcode;
let tname;
let lstatus;
let times = 0;
let monitor_enabled = 1;
let monitor_interval = 5000;

// 进入新页面时将老师和课程状态等信息清空
saveLessonInfo("tname", "");


// 颜色对照表
color = [];
color[0] = ["#84C1FF", "#84C1FF", "#84C1FF", "#84C1FF", "#84C1FF", "#84C1FF", "#84C1FF"];
color[1] = ["#ff7575", "#ff7575", "#ff7575", "#ff7575", "#ff7575", "#ff7575", "#ff7575"];
border_color = [];
border_color[0] = "blue";
border_color[1] = "red";

// 查询缓存
let g_arrange_cache = {};
let g_last_query_success = new Date().getTime() - INTERVAL_DEFAULT;
let g_ajax_sending = false;

// 侧边栏
function optimizeSidebar() {
    if (!inUrl("/edu/student/sdtleft.aspx")) return;

    // 409 joking
    const name = $('#lblXm').text();
    const neckname = new Map([
        ['段云智', 'VOLDIKSS'],
        ['罗政亚', '蛋蛋'],
        ['陆子良', '陆司机'],
        ['朱抗洪', '抗洪朱']
    ]);

    if (neckname.has(name)) {
        $("#lblXm").text(neckname.get(name));
    }

    const share_link = $(`
        <tr style="">
            <td>
                <img src="../imgs/icon.menu.gif" width="25" height="15">
            </td>
            <td class="menu">
                <a href="https://github.com/voldikss/HelloElectsys">HelloElectsys</a>
            </td>
        </tr>`);

    const last_line = $(`
        <tr>
            <td colspan="2"><img src="../imgs/leftline.gif" width="122" height="1"></td>
        </tr>`);

    $("td[colspan=2]").slice(1, 2).parent().after(share_link);
    share_link.after(last_line);

    share_link.on("mouseover", () => share_link.css("background-color", "rgb(255,204,102)"));
    share_link.on("mouseleave", () => share_link.css("background-color", ""));
}

// 选课提醒页面
function optimizeElectWarning() {
    if (inUrl("/edu/student/elect/electwarning.aspx")) {
        // 选中“我已阅读”
        $("input[type=\"checkbox\"]").prop('checked', true);
        // 点击“继续”按钮
        $("#btnContinue").click();
    }
    // 防止不断在提醒页面循环
    if (inUrl("/edu/messagePage.aspx")) {
        if ($("body").text().indexOf('不能进行该轮选课') > -1) {
            $("#Button1").attr("onclick", "location.href='http://electsys.sjtu.edu.cn/edu/newsBoard/newsInside.aspx'");
        }
    }
}

// 课程列表页面
function optimizeLessonList() {
    if (!inUrl("/edu/student/elect")) return;

    // 不需要应用优化的页面
    let black_list = [
        "/edu/student/elect/viewLessonTbl.aspx",
        "/edu/student/elect/electResultOuter.aspx",
        "/edu/student/elect/electwarning.aspx",
        "/edu/student/elect/RecommandTblOuter.aspx",
        "/edu/student/elect/selectRecommandLesson.aspx"
    ];
    if (inUrl(black_list)) return;

    prependSmalltable();
    $('body').append('<div id="electsys_view_lesson"></div>');

    // global variable
    type = "tongshi";

    if (inUrl("/edu/student/elect/speltyRequiredCourse.aspx"))
        type = "bixiu";
    if (inUrl("/edu/student/elect/speltyCommonCourse.aspx"))
        type = "tongshi";
    if (inUrl("/edu/student/elect/outSpeltyEP.aspx"))
        type = "renxuan";
    if (inUrl("/edu/student/elect/ShortSession.aspx"))
        type = "xiaoxueqi";

    // 点击radiobutton自动进入课程安排
    let radiogroup = $("[name=myradiogroup]", document);
    for (let radio_index = 0; radio_index < radiogroup.length; radio_index++) {
        $(radiogroup[radio_index]).click(function () {
            lname = $(this).parent().parent().next().html();
            lcode = $(this).val();
            saveLessonInfo("lname", lname);
            saveLessonInfo("lcode", lcode);

            setTimeout(() => $("input[value=课程安排]").trigger("click"), 300);
        });
    }


    $("[name=myradiogroup]", document).slice(0, 1).parent().parent().parent().prev().children().slice(0, 1).css({
        "background-color": "#83A9C9",
        "background-image": "none"
    });
    $("[name=myradiogroup]", document).slice(0, 1).parent().parent().parent().prev().children().slice(0, 1).html("<a href='#' class='refresh_list' style='font-weight:400;'>刷新信息</a>");

    document.processInterval = INTERVAL_DEFAULT;
    initQueryList();

    $('.refresh_list').click(function () {
        clearAllInterval();
        $(".fullspan,.attrtag").remove();
        let radiogroup = $("[name=myradiogroup]", document).get().reverse();
        document.lids = [];
        for (let radio_index = 0; radio_index < radiogroup.length; radio_index++) {
            // 在列表上添加是否空的span - fullspan
            let lid = radiogroup[radio_index].value;
            document.lids[radio_index] = [lid, type];
            $(radiogroup[radio_index]).parent().after('<span class="fullspan" style="height: 40px">&nbsp;&nbsp;</span>');
        }

        setInterval(processLidQueue, document.processInterval);
    });
}

// 课程安排页面
function optimizeLessonArrangement() {
    if (!inUrl("/edu/lesson/viewLessonArrange.aspx")) return;

    $(".button").parent().first().before('<input type="button" id="onekey-elect" style="width: 100px;background-color: #ffc760" value="一键选课">');
    $("#onekey-elect").before('<input type="button" id="monitor" style="width: 100px;background-color: #ffc760" value="监控">');

    let radiogroup = $("[name=myradiogroup]", document).get();
    radiogroup[0].click(); // 默认把第一个老师选中

    $("#onekey-elect").click((event) => {
        event.stopPropagation();
        monitor_enabled = 1;
        elect_mode = "onekey-elect";
        electLesson(elect_mode);
    });

    $("#monitor").click((event) => {
        event.stopPropagation();
        saveLessonInfo("hide_info", 0);
        monitor_enabled = 1;
        elect_mode = "monitor";
        setInterval(electLesson, monitor_interval, "monitor");
    })
}

// 选定此课程
function electLesson(elect_mode) {
    if (monitor_enabled === 0) {
        clearAllInterval();
        return;
    }
    let radiogroup = $("[name=myradiogroup]", document).get(); //js的作用域让人头大
    for (let i = 0, len = radiogroup.length; i < len; i++) {
        if (radiogroup[i].checked) {
            // TODO
            var lesson = radiogroup[i];
            tname = $(radiogroup[i]).parent().parent().next().html();
            console.log("老师：" + tname + ";  刷新次数+1");
            saveLessonInfo("tname", tname);
            break;
        }
    }
    lesson_id = lesson.value;

    let tmp = $(lesson).parent().parent().siblings().get().reverse()[0];
    lstatus = tmp.innerText;

    saveLessonInfo("lstatus", lstatus);
    let data = {
        "__VIEWSTATE": $('#__VIEWSTATE', document).val(),
        "__EVENTVALIDATION": $('#__EVENTVALIDATION', document).val(),
        "__VIEWSTATEGENERATOR": $('#__VIEWSTATEGENERATOR', document).val()
    };
    data["myradiogroup"] = lesson_id;
    data["LessonTime1$btnChoose"] = "选定此教师";

    form = $("form", document);
    let url = base_url + "/edu/lesson/" + form.attr("action");
    //POST
    $.ajax({
        type: 'POST',
        url: url,
        data: data,
        async: true,
        success: (data) => {
            times += 1;
            if (data.indexOf("人数已满") > -1 || data.indexOf("请选择课程") > -1) {
                if (elect_mode === "monitor") {
                    saveLessonInfo("monitor_status", "ON");
                    return;
                } else {
                    alert("该课该时间段人数已满！");
                    return;
                }
            } else if (data.indexOf("请勿频繁刷新") > -1) {
                if (elect_mode === "monitor") {
                    saveLessonInfo("monitor_status", "OFF(刷新频率过高)");
                    return;
                } else {
                    alert("请勿频繁刷新页面！");
                    return;
                }
            } else if (data.indexOf("网页已经过期") > -1) {
                alert("网页已过期！");
                window.parent.document.location.href = "http://electsys.sjtu.edu.cn/edu/index.aspx";
            }
            gotoMainPage(elect_mode);
        },
        error: (message) => {
            saveLessonInfo("monitor_status", "OFF(请检查网络连接)");
            console.log('POST 失败，请检查网络连接！');
        },
        dataType: "html"
    });
}

// 必须回到主页然后才能提交成功
function gotoMainPage(elect_mode) {
    url = "http://electsys.sjtu.edu.cn/edu/student/elect/speltyRequiredCourse.aspx";
    $.get(url, (document) => {
        data = {
            "__VIEWSTATE": $('#__VIEWSTATE', document).val(),
            "__EVENTVALIDATION": $('#__EVENTVALIDATION', document).val(),
            "__VIEWSTATEGENERATOR": $('#__VIEWSTATEGENERATOR', document).val()
        };
        data["SpeltyRequiredCourse1$Button1"] = "选课提交";
        url = base_url + "/edu/student/elect/speltyRequiredCourse.aspx";
        electSubmit(url, data, elect_mode);
    })
}

// 选课提交
function electSubmit(url, data, elect_mode) {
    $.ajax({
        type: 'POST',
        url: url,
        data: data,
        async: true,
        success: (data) => {
            if (data.indexOf("冲突") > -1) {
                alert("你的课程有冲突或者已经选上，请检查！");
                if (elect_mode === "monitor") {
                    saveLessonInfo("monitor_status", "OFF");
                    clearAllInterval();
                }
                return;
            } else if (data.indexOf("请勿频繁刷新") > -1) {
                if (elect_mode === "monitor") {
                    saveLessonInfo("monitor_status", "OFF(刷新频率过高)");
                    return;
                } else {
                    alert("请勿频繁刷新页面！");
                    return;
                }
            }
            alert("选课提交成功！");
            clearAllInterval();
        },
        error: (error) => console.log(error),
        dataType: "html"
    });
}

// 检查是否停止监控
function checkOffOn() {
    chrome.runtime.onMessage.addListener(
        (message, sender, sendResponse) => {
            if (message.content) {
                sendResponse("1");
                monitor_enabled = 1;
            } else {
                sendResponse("0");
                alert("已经停止监控");
                times = 0;
                saveLessonInfo("monitor_status", "OFF");
                monitor_enabled = 0;
            }
        }
    );
}

// 保存所监控的课程信息
function saveLessonInfo(key, item) {
    switch (key) {
        case "lname":
            chrome.storage.local.set({lname: item});
            break;
        case "lcode":
            chrome.storage.local.set({lcode: item});
            break;
        case "tname":
            chrome.storage.local.set({tname: item});
            break;
        case "lstatus":
            chrome.storage.local.set({lstatus: item});
            break;
        case "monitor_status":
            chrome.storage.local.set({monitor_status: item});
            break;
        case "hide_info":
            chrome.storage.local.set({hide_info: item});
            break;
    }
    chrome.storage.local.set({times: times});
}

// 一键退课
function oneKeyRemove() {
    if (!inUrl("edu/student/elect/removeLessonFast.aspx?second=y")) return;
    $("#btnSubmit", document).click();
}

function initQueryList() {
    $(".fullspan,.attrtag").remove();
    let radiogroup = $("[name=myradiogroup]", document).get().reverse();
    document.lids = [];
    for (let radio_index = 0; radio_index < radiogroup.length; radio_index++) {
        let lid = radiogroup[radio_index].value; //lid应该是lesson id的意思
        $(radiogroup[radio_index]).parent().after('<span class="fullspan">&nbsp;&nbsp;</span>');
        $(radiogroup[radio_index]).parent().before('<span style="cursor:pointer;color:" class="lesson_query" lid="' + lid.toString() + '">查</span>');
    }
    $('.lesson_query').click(function (event) {
        event.stopPropagation();
        $(this).parent().find('.fullspan').html('<span class="fullspan">&nbsp;&nbsp;</span>');
        let lid = $(this).attr('lid');
        document.lids[document.lids.length] = [lid, type];
        clearAllInterval();
        let now = new Date().getTime();
        let diff = g_last_query_success + document.processInterval - now;
        if (g_ajax_sending) {
            diff += document.processInterval;
        }

        // 如果没有在限制频率内，则直接查询，加快速度
        setTimeout(function () {
            processLidQueue(); // POST first
            setInterval("processLidQueue();", document.processInterval);
        }, Math.max(0, diff) + 100);
    });
}

// 小课表
function prependSmalltable() {
    let st_fixed_div = $('  <div id="st_fixed_div" style="margin:0px;width:60%;z-index: 999;position: fixed;top:5px;right:0px;border:1px solid gray;text-align: center;"><div class="smalltable_title" style="height:25px;font-size: 12px;line-height:25px;cursor:pointer;background-image:url(http://electsys.sjtu.edu.cn/edu/imgs/subbg2.gif);">课程表(展开/收起)</div><div id="smalltable_handle" style="cursor:move;"><div id="smalltable_container"><span id="LessonTbl1_spanContent_small"></span></div><div class="smalltable_under" style="height:25px;font-size: 12px;line-height:25px;background:#B5C7DE;">small table by laohyx(拖动)</div></div></div>');
    $("body").prepend(st_fixed_div);
    $("#st_fixed_div").draggable({
        handle: "#smalltable_handle"
    });
    $("#LessonTbl1_spanContent_small").append($(".alltab", document)[$(".alltab", document).length - 1].outerHTML);

    // 初始把小课表合上
    $("#smalltable_container").slideToggle(0);

    $(".smalltable_title").click(function () {
        $("#smalltable_container").slideToggle(50);
    });
}

function processLidQueue() {
    if (document.lids.length === 0) {
        clearAllInterval();
        return;
    }
    // 取栈顶
    let args = document.lids[document.lids.length - 1];
    document.lids = document.lids.slice(0, document.lids.length - 1);
    let lid = args[0];
    let type = args[1];
    let data = {
        "__VIEWSTATE": $('#__VIEWSTATE', document).val(),
        "__EVENTVALIDATION": $('#__EVENTVALIDATION', document).val()
    };
    if (type === "renxuan") {
        data["OutSpeltyEP1$dpYx"] = $("#OutSpeltyEP1_dpYx", document).val();
        data["OutSpeltyEP1$dpNj"] = $("#OutSpeltyEP1_dpNj", document).val();
    }

    data["myradiogroup"] = lid;
    let sub_button = $('[value=课程安排]', document);
    data[sub_button.attr("name")] = sub_button.val();

    let form = $("form", document);
    let url = base_url + "/edu/student/elect/" + form.attr("action");
    post(url, data, lid);
}

function clearAllInterval() {
    let highestIntervalId = setInterval(";", 100000);
    for (let i = 0; i <= highestIntervalId; i++) {
        clearInterval(i);
    }
}

function processArrangement(html, lid, url) {
    // 判断是否有错误提示
    let error_pattern = new RegExp("<span id=\"lblMessage\" .*?>(.*?)</span>");
    let error_match = error_pattern.exec(html);
    if (error_match != null) {
        let error_message = error_match[1];
        console.log(error_message);

        if (error_message.indexOf("不能继续增加通识课") > -1) {
            // 记录接受到响应的时间
            g_last_query_success = new Date().getTime();

            error_message = "通识达上限";
            document.lids = [];
            //在列表上添加是否空的提示
            lessontr = $("input[value=" + lid + "]", document).parent().parent().parent();
            fullspan = lessontr.find(".fullspan")[0];
            fullspan.setAttribute("style", "color:gray");
            fullspan.innerHTML = error_message;
            return;
        }

        // 其他情况（比如提示查询频繁）
        // 把该lid加回去
        document.lids[document.lids.length] = [lid, type];
        document.processInterval += INTERVAL_STEP;
        console.log(document.processInterval);
        clearAllInterval();
        setInterval("processLidQueue();", document.processInterval);

        return;
    }

    // 记录接受到响应的时间
    g_last_query_success = new Date().getTime();
    // 缓存查询结果
    g_arrange_cache[lid] = {
        url: url,
        html: html,
        expire: g_last_query_success + document.processInterval
    };

    // 开始处理html，并绘制至课表中
    let lessons = [];
    tablelsn = $("#LessonTime1_gridMain", html)[0];


    trs = $("tr", tablelsn).slice(1);
    //		console.log(lid);
    for (x = 0; x < trs.length; x++) {
        let l = {
            "lid": lid,
            "now": Number(trs.slice(x, x + 1).children().slice(8, 9).text()),
            "max": Number(trs.slice(x, x + 1).children().slice(5, 6).text())
        };
        l.arrange = Trim(trs.slice(x, x + 1).children().slice(9, 10).text(), "g");
        l.times = [];
        pattern = new RegExp("星期(.*?)第(.*?)节--第(.*?)节", "ig");
        matches = l.arrange.match(pattern);
        console.log(matches);
        console.log(l.arrange);


        matches = matches.distinct();
        for (i = 0; i < matches.length; i++) {
            pattern = new RegExp("星期(.*?)第(.*?)节--第(.*?)节", "ig");
            txt = matches[i];
            match = pattern.exec(txt);
            switch (match[1]) {
                case "一":
                    day = 1;
                    break;
                case "二":
                    day = 2;
                    break;
                case "三":
                    day = 3;
                    break;
                case "四":
                    day = 4;
                    break;
                case "五":
                    day = 5;
                    break;
                case "六":
                    day = 6;
                    break;
                case "日":
                    day = 7;
                    break;
                default:
                    day = 7;
            }
            if (l.max - l.now > 0)
                full = 0;
            else
                full = 1;
            time = {
                "day": day,
                "from": Number(match[2]),
                "to": Number(match[3]),
                "full": full
            };
            l.times.push(time);
        }
        // n个老师
        lessons.push(l);
    }


    // 保存lessons信息到tr中,用隐藏的div存储
    let lessontr = $("input[value=" + lid + "]", document).parent().parent().parent();

    lessontr.attr("lid", lid);
    let full_identifier = 1;
    for (x = 0; x < lessons.length; x++) {
        times = lessons[x].times;
        //console.log(time);
        for (y = 0; y < times.length; y++) {
            time = times[y];
            if (time.full === 0)
                full_identifier = 0;
            attrtag = document.createElement("div");
            attrtag.setAttribute("class", "attrtag");
            attrtag.setAttribute("day", time.day);
            attrtag.setAttribute("from", time.from);
            attrtag.setAttribute("to", time.to);
            attrtag.setAttribute("full", time.full);
            attrtag.setAttribute("hidden", "true");
            attrtag.setAttribute("teacher_order", x);
            lessontr.slice(0, 1).append(attrtag);
        }
    }

    //在列表上修改是否空的提示
    fullspan = lessontr.find(".fullspan")[0];
    // console.log(lessons);
    if (lessons.length === 0) {
        fullspan.setAttribute("style", "color:gray");
        fullspan.innerHTML = "无";
        return;
    }

    if (full_identifier === 1) {
        fullspan.setAttribute("style", "color:gray");
        fullspan.innerHTML = "满";
    } else {
        fullspan.setAttribute("style", "color:blue");
        fullspan.innerHTML = "未满";
    }
    if ($("tr", tablelsn).length < 2) {
        $("#loadimg_" + lid, document).remove();
        return;
    }

    lessontr.mouseover(function () {
        if ($(this).attr("clicked") !== "1") {
            $(this).css("background-color", "#CFC");
            drawLesson($(this).attr("lid"), 0);
        }
    });

    lessontr.click(function () {
        $(this).css("background-color", "#FC9");
        if ($(this).attr("clicked") === "1") {
            $(this).attr("clicked", "0");
            clearDrawLid($(this).attr("lid"));
        } else {
            clearDrawLid($(this).attr("lid"));
            drawLesson($(this).attr("lid"), 1);
            $(this).attr("clicked", "1");
        }

    });

    $("input[value=" + lid + "]", document).parent().parent().parent().mouseout(function () {
        if ($(this).attr("clicked") !== "1") {
            $(this).attr("style", "");
            clearDrawLid($(this).attr("lid"));
        }

    });
}

function Trim(str, is_global) {
    let result;
    result = str.replace(/(^\s+)|(\s+$)/g, "");
    if (is_global.toLowerCase() === "g")
        result = result.replace(/\s/g, "");
    return result;
}

// 获取元素的纵坐标
function getTop(e) {
    let offset = e.offsetTop;
    if (e.offsetParent != null) offset += getTop(e.offsetParent);
    return offset;
}

// 获取元素的横坐标
function getLeft(e) {
    let offset = e.offsetLeft;
    if (e.offsetParent != null) offset += getLeft(e.offsetParent);
    return offset;
}

function drawLesson(lid, clicked) {
    lessontr = $("tr[lid=" + lid + "]", document);
    lessons = $("div[hidden=true]", lessontr);
    for (x = 0; x < lessons.length; x++) {
        lesson = lessons[x];
        day = lesson.getAttribute("day");
        from = lesson.getAttribute("from");
        to = lesson.getAttribute("to");
        full = lesson.getAttribute("full");
        teacher_order = Number(lesson.getAttribute("teacher_order")) + 1;
        draw(day, from, to, full, lid, clicked, teacher_order);
    }
}


function draw(weekday, hour_from, hour_to, isFull, lid, clicked, t_order) {
    //课表的处理

    //Summer session
    if (inUrl("/edu/student/elect/ShortSession.aspx")) {
        //table_span = $("#LessonTbl1_span1",document);
        table = $(".alltab", document)[$(".alltab", document).length - 1];
    } else {
        table_span = $("#LessonTbl1_spanContent,#lessonTbl_spanContent", document);
        table = $(".alltab", table_span)[0];
    }

    tbody = table.children[0];
    tablex = getTop(table);
    tabley = getLeft(table);

    //trlist,0是表头,1~15是14节课
    trlist = tbody.children;

    //每行高度,0为表头
    cellheight = [];
    for (let n = 0; n < 15; n++) {
        cellheight[n] = trlist[n].clientHeight;
    }

    //每格宽度,0为序号单元
    cellwidth = [];
    for (let n = 0; n < 8; n++) {
        cellwidth[n] = trlist[0].children[n].clientWidth + 2;
    }
    //动态处理表格宽度 over


    posx = cellwidth[0];
    posy = 0;

    weekday = Number(weekday);
    hour_from = Number(hour_from);
    hour_to = Number(hour_to);
    isFull = Number(isFull);
    clicked = Number(clicked);


    for (let n = 1; n < weekday; n++)
        posx += cellwidth[n];
    for (let n = 0; n < hour_from; n++) {
        posy += cellheight[n];
    }
    draw_height = 0;
    for (let n = hour_from; n <= hour_to; n++) {
        draw_height += cellheight[n];

    }
    draw_width = cellwidth[weekday];

    if (t_order > 5) {
        draw_color = color[isFull][6 - 1];
    } else {
        draw_color = color[isFull][t_order - 1];
    }

    draw_obj = document.createElement("div");
    draw_id = "draw" + weekday + hour_from + hour_to + isFull;
    draw_obj.setAttribute("class", "lsntable_draw");
    draw_obj.setAttribute("class", draw_id);
    draw_obj.setAttribute("lid", lid);
    draw_obj.setAttribute("clicked", clicked);
    draw_obj.innerHTML = lid + "_" + t_order;
    if (isFull === 0)
        draw_obj.innerHTML += "<br />未满";
    else
        draw_obj.innerHTML += "<br />满";

    $("#LessonTbl1_spanContent,#lessonTbl_spanContent").append(draw_obj);
    //$("#"+draw_id).css({"width":draw_width-border_width,"height":draw_height-border_width,"position":"absolute","top":posy+getTop(table),"left":posx+getLeft(table)+border_width,"border":border_width+"px solid "+draw_color})
    $("." + draw_id, document).css({
        "width": draw_width - 3,
        "height": draw_height - 3,
        "position": "absolute",
        "top": posy + getTop(table) + 2,
        "left": posx + getLeft(table) + 2,
        "background": draw_color,
        "font-size": "12px",
        "opacity": "0.8",
        "text-align": "center",
        "border": "1px solid " + border_color[isFull]
    });


    /****************************************************
     *
     *
     * 画小课表
     *
     *
     *
     */

    //动态处理表格宽度
    smalltable_span = $("#LessonTbl1_spanContent_small", document);
    //课表的处理
    table = $(".alltab", smalltable_span)[0];


    tbody = table.children[0];
    tablex = getTop(table);
    tabley = getLeft(table);


    //trlist,0是表头,1~15是14节课
    trlist = tbody.children;

    //每行高度,0为表头
    cellheight = [];
    for (let n = 0; n < 15; n++) {
        cellheight[n] = trlist[n].clientHeight;
    }

    //每格宽度,0为序号单元
    cellwidth = [];
    for (let n = 0; n < 8; n++) {
        cellwidth[n] = trlist[0].children[n].clientWidth + 2;
    }
    //动态处理表格宽度 over

    posx = cellwidth[0];
    posy = 0;

    weekday = Number(weekday);
    hour_from = Number(hour_from);
    hour_to = Number(hour_to);
    isFull = Number(isFull);
    clicked = Number(clicked);


    for (let n = 1; n < weekday; n++)
        posx += cellwidth[n];
    for (let n = 0; n < hour_from; n++) {
        posy += cellheight[n];
    }
    draw_height = 0;
    for (let n = hour_from; n <= hour_to; n++) {
        draw_height += cellheight[n];

    }
    draw_width = cellwidth[weekday];
    if (t_order > 5) {
        draw_color = color[isFull][6 - 1];
    } else {
        draw_color = color[isFull][t_order - 1];
    }

    draw_obj = document.createElement("div");
    draw_id = "draw" + weekday + hour_from + hour_to + isFull;
    draw_obj.setAttribute("class", "lsntable_draw");
    draw_obj.setAttribute("class", draw_id + "_small");
    draw_obj.setAttribute("lid", lid);
    draw_obj.setAttribute("clicked", clicked);
    draw_obj.innerHTML = lid + "_" + t_order;
    if (isFull === 0)
        draw_obj.innerHTML += "<br />未满";
    else
        draw_obj.innerHTML += "<br />满";
    tbody.appendChild(draw_obj);
    //这里与画大课表上的div不同，它已经有相对位置，因此只要加25的title高就ok
    $("." + draw_id + "_small", document).css({
        "width": draw_width - 3,
        "height": draw_height - 3,
        "position": "absolute",
        "top": posy + 25 + 2,
        "left": posx + 2,
        "background": draw_color,
        "font-size": "12px",
        "opacity": "0.8",
        "text-align": "center",
        "border": "1px solid " + border_color[isFull]
    });
}


function clearDrawLid(lid) {
    tables = $("#LessonTbl1_spanContent,#LessonTbl_spanContent,#LessonTbl1_spanContent_small", document);
    $("div[lid=" + lid + "]", tables).remove();
}

document.addEventListener("DOMContentLoaded", () => {
    base_url = document.URL.slice(0, document.URL.indexOf("sjtu.edu.cn") + 11);

    optimizeSidebar();
    checkOffOn();
    optimizeLessonList();
    optimizeLessonArrangement();
    optimizeElectWarning();
    oneKeyRemove();
});
