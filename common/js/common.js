// JavaScript Document

// window.onload Event
function addLoadEvent(func){
	var oldonload = window.onload;
	
	if(typeof window.onload != 'function'){
		window.onload = func;
		
	}else{
		window.onload = function(){
			oldonload();
			func();
		}
	}
}

function MM_swapImgRestore() { //v3.0
  var i,x,a=document.MM_sr; for(i=0;a&&i<a.length&&(x=a[i])&&x.oSrc;i++) x.src=x.oSrc;
}
function MM_preloadImages() { //v3.0
  var d=document; if(d.images){ if(!d.MM_p) d.MM_p=new Array();
    var i,j=d.MM_p.length,a=MM_preloadImages.arguments; for(i=0; i<a.length; i++)
    if (a[i].indexOf("#")!=0){ d.MM_p[j]=new Image; d.MM_p[j++].src=a[i];}}
}

function MM_findObj(n, d) { //v4.01
  var p,i,x;  if(!d) d=document; if((p=n.indexOf("?"))>0&&parent.frames.length) {
    d=parent.frames[n.substring(p+1)].document; n=n.substring(0,p);}
  if(!(x=d[n])&&d.all) x=d.all[n]; for (i=0;!x&&i<d.forms.length;i++) x=d.forms[i][n];
  for(i=0;!x&&d.layers&&i<d.layers.length;i++) x=MM_findObj(n,d.layers[i].document);
  if(!x && d.getElementById) x=d.getElementById(n); return x;
}

function MM_swapImage() { //v3.0
  var i,j=0,x,a=MM_swapImage.arguments; document.MM_sr=new Array; for(i=0;i<(a.length-2);i+=3)
   if ((x=MM_findObj(a[i]))!=null){document.MM_sr[j++]=x; if(!x.oSrc) x.oSrc=x.src; x.src=a[i+2];}
}


/* show - hide */
function MM_showHideLayers() { //v9.0
  var i,p,v,obj,args=MM_showHideLayers.arguments;
  for (i=0; i<(args.length-2); i+=3) 
  with (document) if (getElementById && ((obj=getElementById(args[i]))!=null)) { v=args[i+2];
    if (obj.style) { obj=obj.style; v=(v=='show')?'visible':(v=='hide')?'hidden':v; }
    obj.visibility=v; }
}

/* show - hide */
function show_num(num) {
	for ( var i=1; i <= 99; i++ ) {
		$("#no"+i).hide();
	}
	//document.all["no"+num].style.display='';
	//document.getElementById("no"+num).style.display = '';
	$("#no"+num).show();
}



/* quick */
 function initMoving(target, position, topLimit, btmLimit) {
    if (!target)
        return false;

    var obj = document.getElementById("gotop");
    obj.initTop = position;
    obj.topLimit = topLimit;
    obj.bottomLimit = document.documentElement.scrollHeight - btmLimit;

    obj.style.position = "absolute";
    obj.top = obj.initTop;
    obj.left = obj.initLeft;

    if (typeof(window.pageYOffset) == "number") {
        obj.getTop = function() {
            return window.pageYOffset;
        }
    } else if (typeof(document.documentElement.scrollTop) == "number") {
        obj.getTop = function() {
            return document.documentElement.scrollTop;
        }
    } else {
        obj.getTop = function() {
            return 0;
        }
    }

    if (self.innerHeight) {
        obj.getHeight = function() {
            return self.innerHeight;
        }
    } else if(document.documentElement.clientHeight) {
        obj.getHeight = function() {
            return document.documentElement.clientHeight;
        }
    } else {
        obj.getHeight = function() {
            return 500;
        }
    }

    obj.move = setInterval(function() {
        if (obj.initTop > 0) {
            pos = obj.getTop() + obj.initTop;
        } else {
            pos = obj.getTop() + obj.getHeight() + obj.initTop;
            //pos = obj.getTop() + obj.getHeight() / 2 - 15;
        }

        if (pos > obj.bottomLimit)
            pos = obj.bottomLimit;
        if (pos < obj.topLimit)
            pos = obj.topLimit;

        interval = obj.top - pos;
        obj.top = obj.top - interval / 3;
        obj.style.top = obj.top + "px";
    }, 30)
}


/* png24 */
function setPng24(obj) {
  var tempsw=-1;
  if( navigator.appVersion.indexOf("MSIE 6") > -1){
    obj.width=obj.height=1;
    obj.className=obj.className.replace(/png24/i,'');
    var tempobjsrc=obj.src;
    tempsw=tempobjsrc.indexOf('http://');
    if(tempsw>=0){
      tempobjsrc=tempobjsrc.replace('http://', '');
    }
    tempobjsrc= escape(tempobjsrc);
    if(tempsw>=0){
      tempobjsrc='http://' + tempobjsrc;
    }

    obj.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='"+ tempobjsrc +"',sizingMethod='image');";
    obj.src='';
  }
  return '';
}


/* 포커스(인풋) */
function focusEvent(tBox, color) {
	tBox.style.backgroundImage = "";
	if(color == null) color = "";
	tBox.style.background = color;
}


/* openBrWindow */
function MM_openBrWindow(theURL,winName,features) { //v2.0
  window.open(theURL,winName,features);
}



/* faq  */

var onoff=0;
var re_num=5;
function faq_list(num){
	 var target = document.getElementById("faq").getElementsByTagName('ul');

	var Maxnum = target.length;

	if(re_num==num && onoff==0){

		target[num-1].getElementsByTagName('li')[1].style.display = 'none';
		onoff=1;

	}else{
		for(i=0; i<Maxnum; i++){
		target[i].getElementsByTagName('li')[1].style.display = 'none';
		}
		target[num-1].getElementsByTagName('li')[1].style.display = '';
		onoff=0;
		re_num=num;
	}
}

/* faq  */

var onoff=0;
var re_num=5;
function faq_list(num){
	 var target = document.getElementById("opinion").getElementsByTagName('ul');

	var Maxnum = target.length;

	if(re_num==num && onoff==0){

		target[num-1].getElementsByTagName('li')[1].style.display = 'none';
		onoff=1;

	}else{
		for(i=0; i<Maxnum; i++){
		target[i].getElementsByTagName('li')[1].style.display = 'none';
		}
		target[num-1].getElementsByTagName('li')[1].style.display = '';
		onoff=0;
		re_num=num;
	}
}

/* navi */
function addLoadEvent(func){
	var oldonload = window.onload;
	if(typeof window.onload != 'function'){
		window.onload = func;

	}else{
		window.onload = function(){
			oldonload();
			func();
		}
	}
}


/*Tab*/
function initTabMenu(tabContainerID) {
	var tabContainer = document.getElementById(tabContainerID);
	var tabAnchor = tabContainer.getElementsByTagName("a");
	var i = 0;

	for(i=0; i<tabAnchor.length; i++) {
		if (tabAnchor.item(i).className == "tab")
			thismenu = tabAnchor.item(i);
		else
			continue;

		thismenu.container = tabContainer;
		thismenu.targetEl = document.getElementById(tabAnchor.item(i).href.split("#")[1]);
		thismenu.targetEl.style.display = "none";
		thismenu.imgEl = thismenu.getElementsByTagName("img").item(0);
		if (thismenu.imgEl) {
			thismenu.onmouseover = function () {
				//this.onmouseover();
			}
		}
		thismenu.onmouseover = tabMenuClick;
		
		if (!thismenu.container.first)
			thismenu.container.first = thismenu;
	}
	tabContainer.first.onmouseover();
}
function tabMenuClick() {
	currentmenu = this.container.current;
	if (currentmenu != this) {
		if (currentmenu) {
			currentmenu.targetEl.style.display = "none";
			if (currentmenu.imgEl) {
				currentmenu.imgEl.src = currentmenu.imgEl.src.replace("_on.gif", ".gif");
			} else {
				currentmenu.className = currentmenu.className.replace(" on", "");
			}
		}

		this.targetEl.style.display = "block";
		if (this.imgEl) {
			this.imgEl.src = this.imgEl.src.replace(".gif", "_on.gif");
		} else {
			this.className += " on";
		}
		this.container.current = this;
	}
	return false;
}



/*Favorite*/
function myFavorite() {
	window.external.AddFavorite('http://www.presdaq.co.kr', ':::프리스닥에 오신것을 환영합니다:::')
}


/*search*/
var select = {
        action: function(el, state) {
            var SelectElement = document.getElementById(el.id);
            var ListElement = SelectElement.getElementsByTagName("ul")[0];
            var ActionElement = ListElement.getElementsByTagName("a");
 
            if (ListElement.style.display == "block") {
 
                select.close(ListElement);
                return false;
            } else {
                ListElement.style.display = "block";
            }
 
            var strSelected = SelectElement.getElementsByTagName("a")[0];
 
            strSelected.focus();
            for (var i = 0; i < ActionElement.length; i++) {
 
                if (strSelected.firstChild.nodeValue == ActionElement[i].firstChild.nodeValue) {
                    select.elementClass = ActionElement[i];
                    select.elementClass.className = "selected";
                    ActionElement[i].onclick = function() {
                        return false;
                    }
                } else {
 
                    ActionElement[i].onclick = function() {
                        if (this.href.indexOf("javascript") > -1) {
                            eval(this.href);
                        } else if (this.href == "" || this.href.indexOf("#") > -1) {
                        } else if (this.target == "_blank") {
                            window.open(this.href);
                        } else {
                            location.href(this.href);
                        }
                        if (state == 1) {
                            strSelected.firstChild.nodeValue = this.firstChild.nodeValue;
                        }
                        return false;
                    }
                }
            }
 
 
        },
        close: function(el) {
            el.style.display = "none";
            return false;
        }
    }


/*Top Menu*/
$(document).ready(function(){
	$("<div id='eb_arrow' style='position:absolute;display:none;'></div>").appendTo("#topmenu");
	
	$("#topmenu a").each( function() {
		$(this)
		.bind("mouseover", function(){
			if( $("#"+$(this).attr("class")).html() ) {
				$("#eb_arrow").css({top:$(this).parent().parent().parent().offset().top+43,left:$(this).position().left+($(this).find("img").width()/2) }).show();
			}
							
			$("#"+$(this).attr("class"))
			.stop()
			.css({display:"block"})
			.animate({opacity:1})
			.mouseover(function(){ $(this).stop().css({display:"block"}).animate({opacity:1}); })
			.mouseleave(function(){	$(this).stop().fadeOut("slow"); });
		}).bind("focus", function(){
			if( $("#"+$(this).attr("class")).html() ) {
				$("#eb_arrow").css({top:$(this).parent().parent().parent().offset().top+43,left:$(this).position().left+($(this).find("img").width()/2) }).show();
			}
							
			$("#"+$(this).attr("class"))
			.stop()
			.css({display:"block"})
			.animate({opacity:1})
			.mouseover(function(){ $(this).stop().css({display:"block"}).animate({opacity:1}); })
			.mouseleave(function(){	$(this).stop().fadeOut("slow"); });
		}).mouseleave(function(){
			$("#eb_arrow").hide();
			$("#"+$(this).attr("class")).stop().fadeOut("fast");
		}).bind("blur", function(){
			$("#eb_arrow").hide();
			$("#"+$(this).attr("class")).hide();
		});
	});	
});



$(function() {
	/* menu 투명도 */
	$("#menu1,#menu2,#menu3,#menu4,#menu5,#menu6").css("opacity", "1");

	//영문, 숫자 적용
	$(".onlynum").keyup(function(){$(this).val( $(this).val().replace(/[^0-9]/g,"") );} );
	$(".onlyeng").keyup(function(){$(this).val( $(this).val().replace(/[^\!-z]/g,"") );} );
});
