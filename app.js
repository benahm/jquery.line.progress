

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
        if(this.percentage === 100) {
            NProgress.done();
        }
    };
    Line.prototype.imgError = function (arg) {
    };
    Line.prototype.progress = function (newOptions) {
		NProgress.configure(newOptions);
        this.options = $.extend({
        }, this.options, newOptions);
        var bgImg = [], img = [];
        NProgress.start();
        $('*').filter(function () {
            var val = $(this).css('background-image').replace(/url\(/g, '').replace(/\)/, '').replace(/"/g, '');
            var imgVal = $(this).not('script').attr('src');
            if(val !== 'none' && !/linear-gradient/g.test(val) && $.inArray(val, bgImg) === -1) {
                bgImg.push(val);
            }
            if(imgVal !== undefined && $.inArray(imgVal, img) === -1) {
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
$.line= new Line();
})(jQuery);

$(document).ready(function () {
    $.line.progress({
    });
});
