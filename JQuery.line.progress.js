//NProgress
;
(function (factory) {
    if (typeof module === 'function') {
        module.exports = factory(this.jQuery || require('jquery'))
    } else if (typeof define === 'function' && define.amd) {
        define(['jquery'], function ($) {
            return factory($)
        })
    } else {
        this.NProgress = factory(this.jQuery)
    }
})(function ($) {
    var NProgress = {};
    NProgress.version = '0.1.2';
    var Settings = NProgress.settings = {
        minimum: 0.08,
        easing: 'ease',
        positionUsing: '',
        speed: 200,
        trickle: true,
        trickleRate: 0.02,
        trickleSpeed: 800,
        showSpinner: true,
        template: '<div class="bar" role="bar"><div class="peg"></div></div><div class="spinner" role="spinner"><div class="spinner-icon"></div></div>'
    };
    NProgress.configure = function (options) {
        $.extend(Settings, options);
        return this
    };
    NProgress.status = null;
    NProgress.set = function (n) {
        var started = NProgress.isStarted();
        n = clamp(n, Settings.minimum, 1);
        NProgress.status = (n === 1 ? null : n);
        var $progress = NProgress.render(!started),
            $bar = $progress.find('[role="bar"]'),
            speed = Settings.speed,
            ease = Settings.easing;
        $progress[0].offsetWidth;
        $progress.queue(function (next) {
            if (Settings.positionUsing === '') Settings.positionUsing = NProgress.getPositioningCSS();
            $bar.css(barPositionCSS(n, speed, ease));
            if (n === 1) {
                $progress.css({
                    transition: 'none',
                    opacity: 1
                });
                $progress[0].offsetWidth;
                setTimeout(function () {
                    $progress.css({
                        transition: 'all ' + speed + 'ms linear',
                        opacity: 0
                    });
                    setTimeout(function () {
                        NProgress.remove();
                        next()
                    }, speed)
                }, speed)
            } else {
                setTimeout(next, speed)
            }
        });
        return this
    };
    NProgress.isStarted = function () {
        return typeof NProgress.status === 'number'
    };
    NProgress.start = function () {
        if (!NProgress.status) NProgress.set(0);
        var work = function () {
            setTimeout(function () {
                if (!NProgress.status) return;
                NProgress.trickle();
                work()
            }, Settings.trickleSpeed)
        };
        if (Settings.trickle) work();
        return this
    };
    NProgress.done = function (force) {
        if (!force && !NProgress.status) return this;
        return NProgress.inc(0.3 + 0.5 * Math.random()).set(1)
    };
    NProgress.inc = function (amount) {
        var n = NProgress.status;
        if (!n) {
            return NProgress.start()
        } else {
            if (typeof amount !== 'number') {
                amount = (1 - n) * clamp(Math.random() * n, 0.1, 0.95)
            }
            n = clamp(n + amount, 0, 0.994);
            return NProgress.set(n)
        }
    };
    NProgress.trickle = function () {
        return NProgress.inc(Math.random() * Settings.trickleRate)
    };
    NProgress.render = function (fromStart) {
        if (NProgress.isRendered()) return $("#nprogress");
        $('html').addClass('line-progress-busy');
        var $el = $("<div id='line-progress'>").html(Settings.template);
        var perc = fromStart ? '-100' : toBarPerc(NProgress.status || 0);
        $el.find('[role="bar"]').css({
            transition: 'all 0 linear',
            transform: 'translate3d(' + perc + '%,0,0)'
        });
        if (!Settings.showSpinner) $el.find('[role="spinner"]').remove();
        $el.appendTo(document.body);
        return $el
    };
    NProgress.remove = function () {
        $('html').removeClass('line-progress-busy');
        $('#line-progress').remove()
    };
    NProgress.isRendered = function () {
        return ($("#line-progress").length > 0)
    };
    NProgress.getPositioningCSS = function () {
        var bodyStyle = document.body.style;
        var vendorPrefix = ('WebkitTransform' in bodyStyle) ? 'Webkit' : ('MozTransform' in bodyStyle) ? 'Moz' : ('msTransform' in bodyStyle) ? 'ms' : ('OTransform' in bodyStyle) ? 'O' : '';
        if (vendorPrefix + 'Perspective' in bodyStyle) {
            return 'translate3d'
        } else if (vendorPrefix + 'Transform' in bodyStyle) {
            return 'translate'
        } else {
            return 'margin'
        }
    };

    function clamp(n, min, max) {
        if (n < min) return min;
        if (n > max) return max;
        return n
    }

    function toBarPerc(n) {
        return (-1 + n) * 100
    }

    function barPositionCSS(n, speed, ease) {
        var barCSS;
        if (Settings.positionUsing === 'translate3d') {
            barCSS = {
                transform: 'translate3d(' + toBarPerc(n) + '%,0,0)'
            }
        } else if (Settings.positionUsing === 'translate') {
            barCSS = {
                transform: 'translate(' + toBarPerc(n) + '%,0)'
            }
        } else {
            barCSS = {
                'margin-left': toBarPerc(n) + '%'
            }
        }
        barCSS.transition = 'all ' + speed + 'ms ' + ease;
        return barCSS
    }
    return NProgress
});

(function ($) {
    var Line = (function () {
        function Line() {
            this.count = 0;
            this.percentage = 0;
            this.imageArray = [];
        }
        Line.prototype.completeImageLoading = function () {
            this.count++;
            this.percentage = this.count / this.imageArray.length;
            NProgress.set(this.percentage);
            if (this.percentage === 100) {
                NProgress.done();
            }
        };
        Line.prototype.imgError = function (arg) {};
        Line.prototype.progress = function (newOptions) {
            NProgress.configure(newOptions);
            this.options = $.extend({}, this.options, newOptions);
            var bgImg = [],
                img = [];
            NProgress.start();
            $('*').filter(function () {
                var val = $(this).css('background-image').replace(/url\(/g, '').replace(/\)/, '').replace(/"/g, '');
                var imgVal = $(this).not('script').attr('src');
                if (val !== 'none' && !/linear-gradient/g.test(val) && $.inArray(val, bgImg) === -1) {
                    bgImg.push(val);
                }
                if (imgVal !== undefined && $.inArray(imgVal, img) === -1) {
                    img.push(imgVal);
                }
            });
            var imgArray = bgImg.concat(img);
            this.imageArray = imgArray;
            var _this = this;
            $.each(imgArray, function (i, val) {
                $("<img />").attr("src", val).bind("load", function () {
                    _this.completeImageLoading();
                });
                $("<img />").attr("src", val).bind("error", function () {
                    _this.imgError(this);
                });
            });
        };
        return Line;
    })();
    $.line = new Line();
})(jQuery);