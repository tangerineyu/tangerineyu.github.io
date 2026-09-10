//  主页面气泡

/*
 * @Author: tzy1997
 * @Date: 2020-12-15 20:55:25
 * @LastEditors: tzy1997
 * @LastEditTime: 2021-01-12 19:02:25
 */

(function() {

    // 气泡
    function bubble() {
        $('#page-header').circleMagic({
            radius: 10,
            density: .2,
            color: 'rgba(255,255,255,.4)',
            clearOffset: 0.99
        });
    }! function(p) {
        p.fn.circleMagic = function(t) {
            var o, a, n, r, e = !0,
                i = [],
                d = p.extend({ color: "rgba(255,0,0,.5)", radius: 10, density: .3, clearOffset: .2 }, t),
                l = this[0];

            function c() { e = !(document.body.scrollTop > a) }

            function s() { o = l.clientWidth, a = l.clientHeight, l.height = a + "px", n.width = o, n.height = a }

            function h() {
                if (e)
                    for (var t in r.clearRect(0, 0, o, a), i) i[t].draw();
                requestAnimationFrame(h)
            }

            function f() {
                var t = this;

                function e() { t.pos.x = Math.random() * o, t.pos.y = a + 100 * Math.random(), t.alpha = .1 + Math.random() * d.clearOffset, t.scale = .1 + .3 * Math.random(), t.speed = Math.random(), "random" === d.color ? t.color = "rgba(" + Math.floor(255 * Math.random()) + ", " + Math.floor(0 * Math.random()) + ", " + Math.floor(0 * Math.random()) + ", " + Math.random().toPrecision(2) + ")" : t.color = d.color }
                t.pos = {}, e(), this.draw = function() { t.alpha <= 0 && e(), t.pos.y -= t.speed, t.alpha -= 5e-4, r.beginPath(), r.arc(t.pos.x, t.pos.y, t.scale * d.radius, 0, 2 * Math.PI, !1), r.fillStyle = t.color, r.fill(), r.closePath() }
            }! function() {
                o = l.offsetWidth, a = l.offsetHeight,
                    function() {
                        var t = document.createElement("canvas");
                        t.id = "canvas", t.style.top = 0, t.style.zIndex = 0, t.style.position = "absolute", l.appendChild(t), t.parentElement.style.overflow = "hidden"
                    }(), (n = document.getElementById("canvas")).width = o, n.height = a, r = n.getContext("2d");
                for (var t = 0; t < o * d.density; t++) {
                    var e = new f;
                    i.push(e)
                }
                h()
            }(), window.addEventListener("scroll", c, !1), window.addEventListener("resize", s, !1)
        }
    }(jQuery);

    // 调用气泡方法
    bubble();
})


// ------------------
// 手机侧边栏默认不展开
var mobile_sidebar_menus = document.getElementById("sidebar-menus");
if (mobile_sidebar_menus) {
    var menus_item_child = mobile_sidebar_menus.getElementsByClassName(
        "menus_item_child"
    );
    var menus_expand = mobile_sidebar_menus.getElementsByClassName("expand");
    for (var i = 0; i < menus_item_child.length; i++) {
        menus_item_child[i].style.display = "none";
    }
}

// 首页标题：每个字符的两份字形交替卷入，结束时在相同位置无缝交接。
(function () {
    var titleSelector = "#page-header.full_page #site-title.staggered-text";
    var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function initializeStaggeredTitle() {
        var title = document.querySelector(titleSelector);
        if (!title || reducedMotion || title.dataset.staggeredReady === "true") return;

        var cells = Array.prototype.slice.call(title.querySelectorAll(".staggered-text__cell"));
        if (!cells.length) return;

        title.dataset.staggeredReady = "true";
        var timers = [];

        function readMilliseconds(propertyName, fallback) {
            var value = window.getComputedStyle(title).getPropertyValue(propertyName).trim();
            if (value.slice(-2) === "ms") return parseFloat(value) || fallback;
            if (value.slice(-1) === "s") return (parseFloat(value) * 1000) || fallback;
            return fallback;
        }

        var flipDuration = readMilliseconds("--stagger-duration", 620);
        var staggerDelay = readMilliseconds("--stagger-delay", 135);
        var cycleGap = readMilliseconds("--stagger-cycle-gap", 1200);
        var initialDelay = readMilliseconds("--stagger-initial-delay", 900);
        // One repeating phrase: normal →, normal ←, slow →, normal ←.
        var phases = [
            { reverse: false, speed: 1 },
            { reverse: true, speed: 1 },
            { reverse: false, speed: 2 },
            { reverse: true, speed: 1 }
        ];
        var phaseIndex = 0;

        function schedule(callback, delay) {
            var timer = window.setTimeout(function () {
                timers = timers.filter(function (item) { return item !== timer; });
                callback();
            }, delay);
            timers.push(timer);
        }

        function runCycle() {
            if (!title.isConnected) {
                timers.forEach(window.clearTimeout);
                return;
            }

            if (document.hidden) {
                schedule(runCycle, 800);
                return;
            }

            var phase = phases[phaseIndex];
            var phaseDuration = flipDuration * phase.speed;
            var phaseDelay = staggerDelay * phase.speed;
            var cycleDuration = phaseDuration + (cells.length - 1) * phaseDelay;
            title.style.setProperty("--stagger-active-duration", phaseDuration + "ms");
            title.style.setProperty("--stagger-roll-direction", phase.reverse ? "-1" : "1");

            cells.forEach(function (cell) {
                cell.classList.remove("is-flipping");
            });

            cells.forEach(function (cell, index) {
                schedule(function () {
                    if (!cell.isConnected || document.hidden) return;

                    // Forcing a fresh style pass lets the same cell replay cleanly next cycle.
                    void cell.offsetWidth;
                    cell.classList.add("is-flipping");

                    schedule(function () {
                        cell.classList.remove("is-flipping");
                    }, phaseDuration + 16);
                }, (phase.reverse ? cells.length - 1 - index : index) * phaseDelay);
            });

            phaseIndex = (phaseIndex + 1) % phases.length;
            schedule(runCycle, cycleDuration + cycleGap);
        }

        schedule(runCycle, initialDelay);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeStaggeredTitle, { once: true });
    } else {
        initializeStaggeredTitle();
    }

    document.addEventListener("pjax:complete", initializeStaggeredTitle);
})();
