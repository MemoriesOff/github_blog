(function ($) {
	
	var timeFormat=function(time){
		var format;
		if(parseInt(time/60)<10)
			format="0"+parseInt(time/60)+":";
		else
			format=parseInt(time/60)+":";
		if(parseInt(time%60)<10)
			format+="0"+parseInt(time%60);
		else
			format+=parseInt(time%60);
		return format;
	};
	
	var player=function(element,options){
		$(element).css({"height":parseInt(player.defaults.height)+37+"px","width": player.defaults.width,"background-color":"black"});
		$(element).append("<div class=\"video-div\"><canvas class=\"mask-layer\" width="+options.width+" height="+options.height+"></canvas><video src="+options.src+" 。 width="+options.width+" height="+options.height+" ></video><div id=\"my-comment-stage\" class=\"container\" ></div><div class=\"setting\" ><p>防挡弹幕：</p><div class=\"line\"><div class=\"button\">ON</div><div class=\"button\">OFF</div></div><p>神经网络种类：</p><div class=\"line\"><div class=\"button\">精准</div><div class=\"button\">快速</div></div></div>");
		var video=$(element).children(".video-div").children("video").get(0);
		var videodiv=$(element).children(".video-div");
		var danmuLayer=videodiv.children(".container").get(0);
		var controlBoard=videodiv.children(".setting").get(0);
		var networkOnButton=$($(controlBoard).children(".line").get(0)).children(".button").get(0);
		var networkOffButton=$($(controlBoard).children(".line").get(0)).children(".button").get(1);
		var fcn32OnButton=$($(controlBoard).children(".line").get(1)).children(".button").get(0);
		var fcn32OffButton=$($(controlBoard).children(".line").get(1)).children(".button").get(1);
		//danmuLayer.style.webkitMaskSize="cover";
		var maskLayer=videodiv.children(".mask-layer").get(0);
		var maskLayerCTX=maskLayer.getContext('2d');
		videodiv.append("<div class=\"time-reminding\">12:12</div>");
		$(element).append("<div class=\"control\"></div>");
		$(element).append("<div class=\"loading\"><div class=\"loading-ball\"></div><div class=\"loading-ball\"></div><div class=\"loading-ball\"></div><div class=\"loading-ball\"></div><div class=\"loading-ball\"></div></div>");
		var timereminding=videodiv.children(".time-reminding");
		var control=$(element).children(".control");
		var loading=$(element).children(".loading");
		control.css({"height":35+"px","width":parseInt(player.defaults.width)-2+"px","background-color":"white","border":"#C0C0C0 solid 1px"});
		control.append("<div title=\"播放\" class=\"playbtn\" style=\"float:left;cursor:pointer; width:40px;height:35px;border-right:#C0C0C0 solid 1px ;text-align: center \"></div>");
		var playbtn=control.children(".playbtn");
		playbtn.html("<div  class=\"botton-play\"></div>");
		control.append("<div class=\" progress \" ></div>");
		var progress=control.children(".progress");
		progress.length=parseInt(player.defaults.width)/5*3;
		progress.css({"width":progress.length+"px"});
		progress.append("<div  class=\"dot\"><div  class=\"small-dot\"></div></div>");
		progress.append("<div  class=\"current\"></div>");
		var dot=progress.children(".dot");
		var current=progress.children(".current");
		control.append("<div  class=\"conTime\">00:00/00:00</div>");
		var conTime=control.children(".conTime");
		control.append("<div title=\"全屏\" class=\"fullscreen\"><ul><li></li><li></li><li></li></ul> </div>");
		var fullscreen=control.children(".fullscreen");
		control.append("<div title=\"弹幕\" class=\"danmubutton\"><div class=\"square\"></div><div class=\"tri\"></div><div class=\"squaretop\"></div><div class=\"squarebottom\"></div></div>");
		var danmubutton=control.children(".danmubutton");
		control.append("<div class=\" soundline \" ><div  class=\"soundcurrent\"></div></div>");
		var soundline=control.children(".soundline");
		var soundcurrent=soundline.children(".soundcurrent");
		control.append("<div title=\"音量\" class=\" soundbul \" ><div class=\"square\"></div><div class=\"trapezoid\"></div><div class=\"ring\"></div><div class=\"squaretop\"></div><div class=\"squarebottom\"></div></div>");
		var soundbul=control.children(".soundbul");
		control.append("<div title=\"设置\" class=\" setting-button \" ><div class=\"smallRing\"></div><div class=\"largeRing\"></div><div class=\"rect\"></div><div class=\"rect\"></div><div class=\"rect\"></div><div class=\"rect\"></div><div class=\"rect\"></div><div class=\"rect\"></div></div>");
		var settingButton=control.children(".setting-button");
		//加载完成原数据
		var isVideoLoad=false;
		var isModelLoad=false;
		
		video.onloadedmetadata=function(){
			TIME=video.duration;
			conTime.html("<div  class=\"conTime\">00:00"+"/"+timeFormat(TIME)+"</div>");
			soundcurrent.css("width",video.volume*60);
			isVideoLoad=true;
		};
		var network=new SemanticSegmentation(player.defaults.modelAddress);
		network.load().then(async()=>{
			await network.predict(video,true,false).data();
			isModelLoad=true;				
		});
		//加载弹幕解析核心
		var cm = new CommentManager(document.getElementById('my-comment-stage'));
		// 制作弹幕供应器
		var provider = new CommentProvider();
		// 添加一个解析器
		provider.addParser(new BilibiliFormat.XMLParser(), CommentProvider.SOURCE_XML);
		// 添加一个静态弹幕源（只加载一次）
		provider.addStaticSource(CommentProvider.XMLProvider('GET', player.defaults.comments), CommentProvider.SOURCE_XML)
		provider.addTarget(cm);
		// 加载弹幕并启动 cm
		cm.init();
		provider.load().then(function () {
		}).catch(function (e) {
			alert('载入弹幕出错了！' + e);
		}); 	
		var interval_1s = setInterval(function () {
			if(isVideoLoad){
				var nowTime=video.currentTime;
				cm.time(nowTime*1000);
				dot.length=progress.length*(nowTime/TIME);
				dot.css("left",dot.length);
				current.css("width",dot.length);
				conTime.html("<div  class=\"conTime\">"+timeFormat(nowTime)+"/"+timeFormat(TIME)+"</div>");
				if(!video.paused)
				{
//						dot.animate({left:'+='+progress.length/TIME+'px'},1000);
//						current.animate({width:'+='+progress.length/TIME+'px'},1000);
					
				}
			}
			if(loading!=null && isModelLoad&& isVideoLoad){
				$(loading).remove();
				loading=null;
			}
		 
		}, 1000);
		async function maskLayerPercess (){
			if(!video.paused&&isModelLoad&&isDanmuOn&&isNetworkOn){				
				console.time()					
				var netOutput;
				var canva;
				var ctx;
				if(player.defaults.testcanva!=null){
				        canva=player.defaults.testcanva;
					ctx=canva.getContext('2d');	 
					ctx.clearRect(0, 0,  player.defaults.width, player.defaults.height);
					ctx.drawImage(video, 0, 0,  player.defaults.width, player.defaults.height);
				}
				if(isFcn32On){
					network.modelPixels=[288,512];
					netOutput=await network.predict(video,false,true).data();
				}else{
					network.modelPixels=[198,352];
					netOutput=await network.predict(video,true,false).data();						
				}			
				maskLayerCTX.clearRect(0, 0, player.defaults.width, player.defaults.height);
				//maskLayerCTX.drawImage(video, 0, 0,  player.defaults.width, player.defaults.height);
				maskLayerCTX.fillStyle="#000000";
				maskLayerCTX.fillRect(0,0,player.defaults.width,player.defaults.height);
				var maskLayerImageDate=maskLayerCTX.getImageData(0, 0, player.defaults.width ,player.defaults.height);												
				if(isFcn32On){
					for(var i=0;i<netOutput.length;i++){
						if(netOutput[i]==15) //0.85
						{						  			
						   maskLayerImageDate.data[4*i+0]=255;
						   maskLayerImageDate.data[4*i+1]=255;
						   maskLayerImageDate.data[4*i+2]=255;
						   maskLayerImageDate.data[4*i+3]=0;								   
						}
					}
				}else{
					for(var i=0;i<netOutput.length;i++){
						if(netOutput[i]>0.85) //0.85
						{									
						   maskLayerImageDate.data[4*i+0]=255;
						   maskLayerImageDate.data[4*i+1]=255;
						   maskLayerImageDate.data[4*i+2]=255;
						   maskLayerImageDate.data[4*i+3]=0;								   
						}
					}
				}
				maskLayerCTX.putImageData(maskLayerImageDate,0, 0);					
				danmuLayer.style.webkitMaskImage="url("+maskLayer.toDataURL("image/png",0.25)+")";
				if(player.defaults.testcanva!=null){
					var imgData=ctx.getImageData(0, 0, player.defaults.width, player.defaults.height);

					if(isFcn32On){
						for(var i=0;i<netOutput.length;i++){
							if(netOutput[i]==15) //0.85
							{						
							   imgData.data[4*i+2]+=100;
							   imgData.data[4*i+3]=100;											   
							}
						}
					}else{
						for(var i=0;i<netOutput.length;i++){
							if(netOutput[i]>0.85) //0.85
							{						
							   imgData.data[4*i+2]+=100;
							   imgData.data[4*i+3]=100;									   
							}
						}
					}
					ctx.putImageData(imgData,0, 0);
				}
				console.timeEnd()	
				
			}else{
				if((!isDanmuOn)||(!isNetworkOn))
					danmuLayer.style.webkitMaskImage=null;
			}
			requestAnimationFrame(maskLayerPercess);
		}
		
		
		maskLayerPercess();
		//setTimeout(()=>{setInterval(function () {maskLayerPercess()},1000);}, 2000 );
		
		//播放暂停事件
		var playPause=function(){
			if(isModelLoad&&isVideoLoad){
			  
				if(video.paused)
				{
					video.play();
					playbtn.html("");
					playbtn.append("<div  class=\"botton-pause\" style=\"left:12px\"></div>");
					playbtn.append("<div  class=\"botton-pause\" style=\"left:14px\"></div>");
					playbtn.attr("title","暂停");
					cm.start();
				}
				else
				{
					video.pause();
					playbtn.html("<div  class=\"botton-play\"></div>");
					playbtn.attr("title","播放");
					cm.stop();
				}
			}
		};
		//静音
		soundbul.click(function(e){
			if(video.muted===false)
			{
				video.muted=true;
				soundbul.children(".ring").css("display","none");
				soundbul.children(".squaretop").css("display","inline");
				soundbul.children(".squarebottom").css("display","inline");
				soundcurrent.css("width",0);
				
			}else{
				video.muted=false;
				soundbul.children(".ring").css("display","inline");
				soundbul.children(".squaretop").css("display","none");
				soundbul.children(".squarebottom").css("display","none");
				soundcurrent.css("width",video.volume*60);
			}
		});
		//控制面板
		$(controlBoard).css("display","none");
		var isControlBoardShow=false;
		var isControlBoardIn=false;
		$(settingButton).mouseenter(()=>{
			$(controlBoard).css("display","inline");
			isControlBoardShow=true;
		});
		$(settingButton).mouseleave(()=>{
			window.setTimeout(()=>{
				if(!isControlBoardIn){
					$(controlBoard).css("display","none");
					isControlBoardShow=false;
				}
			},500);
		});
		$(controlBoard).mouseenter(()=>{
			$(controlBoard).css("display","inline");
			isControlBoardShow=true;
			isControlBoardIn=true;
		});
		$(controlBoard).mouseleave(()=>{
			$(controlBoard).css("display","none");
			isControlBoardShow=false;
			isControlBoardIn=false;
		});
		var isNetworkOn=true;
		var isFcn32On=false;
		$(networkOffButton).css("background","#5C5C5C");
		networkOnButton.onclick=()=>{
			$(networkOffButton).css("background","#5C5C5C")
			$(networkOnButton).css("background","#00A1D6")
			isNetworkOn=true;
		};
		networkOffButton.onclick=()=>{
			$(networkOnButton).css("background","#5C5C5C")
			$(networkOffButton).css("background","#00A1D6")
			isNetworkOn=false;
		};
		$(fcn32OnButton).css("background","#5C5C5C")
		fcn32OnButton.onclick=()=>{
			$(fcn32OffButton).css("background","#5C5C5C")
			$(fcn32OnButton).css("background","#00A1D6")
			isFcn32On=true;
		};
		fcn32OffButton.onclick=()=>{
			$(fcn32OnButton).css("background","#5C5C5C")
			$(fcn32OffButton).css("background","#00A1D6")
			isFcn32On=false;
		};
		
		//音量大小
		var isSoundMouseDown=false;
		soundline.mousedown(function(e){
			isSoundMouseDown=true;
			
		});
		soundline.mousemove(function(e){
			var offset = soundline.offset();
			var lenth=e.pageX-offset.left;
			if(isSoundMouseDown)
			{
				soundcurrent.css("width",lenth);
				video.volume=lenth/60;
			}
		});
		soundline.mouseup(function(e){
			var offset = soundline.offset();
			var lenth=e.pageX-offset.left;
			isSoundMouseDown=false;
			soundcurrent.css("width",lenth);
			video.volume=lenth/60;
		});
		
		var isMouseDown=false;
		
		//进度条
		progress.mousedown(function(e){
			var offset = progress.offset();
			if(e.pageY>offset.top-18 && e.pageY<offset.top+10 )
				isMouseDown=true;
			dot.stop();
			
		});	
		progress.mousemove(function(e){
			var offset = progress.offset();
			var lenth=e.pageX-offset.left;
			if(lenth>=0&&lenth<=progress.length &&e.pageY>offset.top-18 && e.pageY<offset.top+10)
			{
				timereminding.html(timeFormat(lenth/progress.length*TIME));
				timereminding.css("left",lenth+30);
				timereminding.css("display","inline");
			}
			else
			{
				timereminding.css("display","none");
			}
			
			if(isMouseDown){
				dot.stop();
				if(lenth>=0&&lenth<=progress.length)
					dot.css("left",lenth);
			}
			
		});
		//进度条拖动事件
		progress.mouseup(function(e){
			
			dot.stop();
			var offset = progress.offset();
			var lenth=e.pageX-offset.left;
			if(lenth>0&&lenth<progress.length&& isMouseDown)
			{
				video.currentTime=lenth/progress.length*TIME;
				dot.css("left",lenth);
				current.css("width",lenth);
				conTime.html("<div  class=\"conTime\">"+timeFormat(video.currentTime)+"/"+timeFormat(TIME)+"</div>");
			}
			isMouseDown=false;
		});
		//播放暂停按钮事件
		control.children(".playbtn").click(function(){
			playPause();
		});
		/*$(element).click(function(e){
			var offset = $(element).offset();
			if(e.pageY>offset.top && e.pageY<(offset.top+parseInt(player.defaults.height)))			
				playPause();
		});*/
		video.onclick=()=>{playPause();};
		danmuLayer.onclick=()=>{playPause();};
		
		//全屏判定
		isFullScreen=false;		
		var exitFullscreen=function(){
			isFullScreen=false;
			 var de = document;
			 if (de.exitFullscreen) {
				 de.exitFullscreen();
			 } else if (de.mozCancelFullScreen) {
				 de.mozCancelFullScreen();
			 } else if (de.webkitCancelFullScreen) {
				 de.webkitCancelFullScreen();
			 }
			 videodiv.css({"height":player.defaults.height+"px"});
			 video.style.height=player.defaults.height;
			 
			 control.css({"width":parseInt(player.defaults.width)-2+"px"});
			 control.css("bottom","0");
			 progress.length=parseInt(player.defaults.width)/5*3;
			 progress.css({"width":progress.length+"px"});
			 control.stop();
			 timereminding.css("bottom","0px");
		};
		//弹幕开关按钮
		var isDanmuOn=true;
		control.children(".danmubutton").click(function()
		{
			if(isDanmuOn){
				isDanmuOn=false;
				control.children(".danmubutton").children(".squaretop").css("display","inline");
				control.children(".danmubutton").children(".squarebottom").css("display","inline");
				danmuLayer.style.display="none";
				
			}else{
				control.children(".danmubutton").children(".squaretop").css("display","none");
				control.children(".danmubutton").children(".squarebottom").css("display","none");
				isDanmuOn=true;
				danmuLayer.style.display="inline";
				cm.clear();
			}
		});				
		//全屏事件
		control.children(".fullscreen").click(function()
		{
			if(isFullScreen===false)
			{
				isFullScreen=true;
				var de =element;
				 video.controls="none";
				 if (de.requestFullscreen) {
					 de.requestFullscreen();
				 } else if (de.mozRequestFullScreen) {
						 de.mozRequestFullScreen();
				 } else if (de.webkitRequestFullScreen) {
					  de.webkitRequestFullScreen();
				 }
				 videodiv.css({"width":"100%"});
				 videodiv.css({"height":"100%"});
				 video.style.width="100%";
				 video.style.height="100%";
				 
				 
				 control.css({"width":"100%"});
				 progress.css({"width":"60%"});
				 progress.length=screen.availWidth*0.6;
				 control.animate({bottom:'-=35px'},1500);
				 timereminding.css("bottom","35px");
			}else{
				 exitFullscreen();
			}
		});
		
		control.mousemove(function(e){
			if(isFullScreen)
			{
				control.stop();
				//control.css("bottom","0px");
				control.animate({bottom:'0px'},100);
			}
		});
		control.mouseout(function(e){
			if(isFullScreen)
			{
				control.stop();
				control.animate({bottom:'-35px'},500);
			}
		});
		
		
		function checkFull(){
			var isFull =   window.fullScreen || document.webkitIsFullScreen || document.msFullscreenEnabled;
			if(isFull === undefined) isFull = false;
			return isFull;
		}
		
		//监听尺寸变化
		$(window).resize(function() {
			//console.log("resize");				
			if (!checkFull()) {
				//触发esc事件，执行业务逻辑。
				exitFullscreen();
			}
			var defWidth = player.defaults.width , defHeight = player.defaults.height;
			var stage = cm.stage; // CommentManager 的 stage
			// 计算缩放比例，只看宽度
			var scale = videodiv.offsetWidth / defWidth;
			var relHeight = videodiv.offsetHeight / scale;
			// 把弹幕舞台设置成小版舞台
			//cm.setBounds(defWidth, relHeight);
			cm.setBounds(scale, relHeight);
			//stage.style.width = defWidth;
			//stage.style.height = relHeight;
			// 用 CSS 来拉伸
			//stage.style.transform = "scale(" + scale + ")";
			
		});
						
		//按键监听
		$(document).keyup(function(event){
			 switch(event.keyCode) {
			 case 27:
				exitFullscreen();
			 }
		});
		
	};
	//800 450
	player.defaults={
		width: "800" ,
		height: "450", 
		src:null,
		comments:null,
		modelAddress:null,
		testcanva:null
	};
	
	
	$.fn.H5Player=function(options){
		var opts=jQuery.extend(player.defaults,options);
		return this.each(function(){
			player(this,opts);
		});
	};
})(jQuery)
