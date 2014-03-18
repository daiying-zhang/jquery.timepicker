/**
 * @fileOverview
 * @author daiying.zhang
 */

;(function($){
    var DATA_NAME = 'jq-timepicker';

    var tmpl = [];

    function TimePicker(node, opt){
        init.call(this, node, opt);
    }

    TimePicker.fn = TimePicker.prototype;

    TimePicker.fn.getValue = function(){
        return this.hourEle.val() + ":" + this.minuteEle.val()
    }

    /**
     * 展示输入框
     */
    TimePicker.fn.show = function(){
        !this.$picker && this.addPicker();

        var position = this.$node.offset();
        //保证picker显示完整，页面不出现滚动条
        if(position.left + this.$picker.width() > $('body').width()){
            delete position.left;
            position.right = 1;
            position.left = 'auto'
        }
        position.top += this.$node.height() + 2;

        this.$picker.css(position).show();
        this.hourEle[0].focus();
    }

    /**
     * 关闭输入框
     */
    TimePicker.fn.close = function(){
        this.$picker && this.$picker.hide();
    }

    /**
     * 添加picker所对应的DOM结构
     */
    TimePicker.fn.addPicker = function(){
        this.$picker = $(getTMPL.call(this)).appendTo('body').attr('id', this.id);

        initPickerEvent(this);

        //时、分输入框
        this.hourEle = this.$picker.find('input.hour').val(this.opt.defHour);
        this.minuteEle = this.$picker.find('input.minute').val(this.opt.defMinute);
    }

    function init(node, opt){
        var uid = ("" + Math.random() * 1000).replace('.',''),
            data = {id : uid};

        data[DATA_NAME] = this;

        //存储数据
        $.data(node, data);

        var $node = $(node).addClass('timepicker-con');

        this.opt = opt;
        this.$node = $node.prop('readonly',opt.readonly);

        //最大值
        this.maxHour = 23 - 23 % opt.hourStep;
        this.maxMinute = 59 - 59 % opt.minuteStep;

        initEvent.call(this, node)
    }

    function initEvent(node){
        var self = this;

        $(node).on('click', function(eve){
            self.show();
        });

        $(document).on('click', function(eve){
            var $tar = $(eve.target);
            !$tar.is(node) && self.close();
        });

    }

    function initPickerEvent(thisVal){
        //事件代理，处理按钮、数字的点击事件
        thisVal.$picker.on('click','[data-action]', function(eve){
            var action = $(this).data('action') + 'Click';
            funcs[action] && funcs[action].call(thisVal, eve);
            eve.stopPropagation();
        }).on('click',function(eve){
            eve.stopPropagation()
        });

        //失去焦点时纠正用户输入的值
        thisVal.$picker.on('blur', 'input', function(eve){
            var target = eve.target,
                val = target.value,
                tmp = parseInt(val),
                max = thisVal.maxHour,
                role = $(target).data('role'),
                step = thisVal.opt[role + 'Step'];

            if(isNaN(tmp)){
                tmp = val = 0
            }

            if(val % step !== 0){
                tmp = step * (1 + Math.floor(val / step));
                max = thisVal[role === 'hour' ? 'maxHour' : 'maxMinute']
            }

            tmp = Math.max(0,Math.min(max,tmp)); //纠正
            target.value = tmp < 10 ? '0' + tmp : tmp
        });
    }

    function getTMPL(){
        if(tmpl.length === 0){
            tmpl.push('<div class="timepicker" data-action="" style="display: none">');
            tmpl.push('<div class="timeinfo" data-action="">');
            tmpl.push('<div class="timebox"><input type="text" placeholder="时" class="hour" data-role="hour" />');
            tmpl.push('<div class="hourbox"><div class="arrow up" data-action="addHour" data-target="1"></div><div class="arrow down" data-action="addHour" data-target="-1"></div></div>');
            tmpl.push('<label><i class="split">时</i></label>');
            tmpl.push('<input type="text" placeholder="分" class="minute" data-role="minute" />');
            tmpl.push('<div class="minutebox"><div class="arrow up" data-action="addMinute" data-target="1"></div><div class="arrow down" data-action="addMinute" data-target="-1"></div></div>');
            tmpl.push('<label><i class="split">分</i></label></div>');

            tmpl.push('</div>');
            tmpl.push('<div class="click" data-action="">');
            tmpl.push('<ul class="hour" data-action="hoursNum">');

            for(var i=0; i<= this.maxHour; i+= this.opt.hourStep){
                tmpl.push('<li>' + i + '</li>')
            }

            tmpl.push('</ul>');
            tmpl.push('<ul class="minute" data-action="minutesNum">');
            for(var i=0; i<= this.maxMinute; i+= this.opt.minuteStep){
                tmpl.push('<li>' + i + '</li>')
            }
            tmpl.push('</ul>');
            tmpl.push('</div>');
            tmpl.push('<div data-action="cancel" class="cancel">取消</div>');
            tmpl.push('<div data-action="done" class="confirm">确定</div>');
            tmpl.push('</div>')
        }
        return tmpl.join('')
    }

    var funcs = {
        'hoursNumClick' : function(eve){
            var $target = $(eve.target);
            if($target.hasClass('hour')){
                return
            }
            var text = $target.text();
            this.hourEle.val(text.length === 1 ? '0' + text : text)
        },
        'minutesNumClick' : function(eve){
            var $target = $(eve.target);
            if($target.hasClass('minute')){
                return
            }
            var text = $target.text();
            this.minuteEle.val(text.length === 1 ? '0' + text : text)
        },
        'doneClick' : function(){
            this.$node.val(this.getValue());
            this.close()
        },
        'cancelClick' : function(){
            this.close()
        },
        '_getValAsNum' : function(thisVal,eve,type){
            var data = $(eve.target).data(),
                max = {'hour':thisVal.maxHour,'minute':thisVal.maxMinute},
                val = thisVal[type + 'Ele'].val(),
                newVal = parseInt(val) + data.target * thisVal.opt[type + 'Step'];
            newVal = Math.max(0, Math.min(max[type], newVal));
            return newVal < 10 ? '0' + newVal : newVal
        },
        'addHourClick' : function(eve){
            this.hourEle.val(funcs._getValAsNum(this,eve,'hour'))
        },
        'addMinuteClick' : function(eve){
            this.minuteEle.val(funcs._getValAsNum(this,eve,'minute'))
        }
    }

    /**
     * 插件方法
     * @param {Object} opt
     * @param {String} [opt.defHour='00']       默认小时
     * @param {String} [opt.defMinute='00']     默认分钟
     * @param {Boolean} [opt.readonly=true]     文本框只读
     * @param {Number} [opt.hourStep=1]         小时刻度
     * @param {Number} [opt.minuteStep=5]       分钟刻度
     * @returns {*}
     */
    $.fn.timepicker = function(opt){
        //var now = new Date();
        opt = $.extend({
            defHour : '00',//now.getHours(),
            defMinute : '00',//now.getMinutes() + 1,
            readonly : true,
            hourStep : 1,
            minuteStep : 5
        },opt);

        return this.each(function(){
            new TimePicker(this, opt)
        })
    }

    $.fn.timepicker.version = '1.0.0'
})(jQuery)