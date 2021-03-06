//../wgeCore.js
"use strict";
/*
* wgeCore.js
*
*  Created on: 2014-7-25
*      Author: Wang Yang
*        Blog: http://blog.wysaid.org
*        Mail: admin@wysaid.org
*/

/*
简介： WGE (Web Graphics Engine) 是一个web平台下的图形引擎。
       主要使用webgl实现，同时编写context 2d兼容版本
	   context 2d版本主要用于兼容部分低版本的IE浏览器，但不保证支持WGE的所有功能
*/

window.WGE = 
{
	VERSION : '1.0.1'

};

WGE.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);

WGE.clone = function(myObj)
{ 
	if(!myObj)
		return myObj;
	else if(myObj instanceof Array)
		return myObj.slice(0);
	else if(!(myObj instanceof Object))
		return myObj;
	var myNewObj = {}; 
	for(var i in myObj) 
	{
		try
		{
			myNewObj[i] = WGE.clone(myObj[i]);
		} catch(e){}
	}
	return myNewObj; 
};

//数组将被深拷贝
WGE.deepClone = function(myObj)
{ 
	if(!myObj)
		return myObj;
	else if(myObj instanceof Array)
	{
		var arr = new Array(myObj.length);
		for(var i = 0; i != myObj.length; ++i)
		{
			try
			{
				arr[i] = WGE.deepClone(myObj[i]);
			}catch(e){}
		}
		return arr;
	}
	else if(!(myObj instanceof Object))
		return myObj;
	var myNewObj = {}; 
	for(var i in myObj) 
	{
		try
		{
			myNewObj[i] = WGE.deepClone(myObj[i]);
		} catch(e){}
	}
	return myNewObj; 
};

WGE.release = function(myObj)
{
	//不允许删除function里面的属性。
	if(!(myObj instanceof Object))
		return ;

	for(var i in myObj) 
	{
		try
		{
			delete myObj[i];
		} catch(e){}
	}
};

//deepRelease 会彻底删掉给出类里面的所有元素，包括数组等
//如果传入的类里面和别的类引用了同一项内容，也会被彻底删除
//在不确定的情况下最好不要使用。
WGE.deepRelease = function(myObj)
{
	if(!(myObj instanceof Object))
		return ;
	else if(myObj instanceof Array)
	{
		for(var i in myObj)
		{
			WGE.release(myObj[i]);
		}
	}

	for(var i in myObj) 
	{
		try
		{
			WGE.release(myObj[i]);
			delete myObj[i];
		} catch(e){}
	}
};

WGE.extend = function(dst, src)
{
	for (var i in src)
	{
		try
		{
			dst[i] = src[i];
		} catch (e) {}
	}
	return dst;
};

//特殊用法，将 WGE.ClassInitWithArr 作为第一个参数传递给一个 WGE.Class 构造时，
//initialize 将使用第二个参数(数组) 作为整个initialize 的参数。灵活性较强。
WGE.ClassInitWithArr = {};

WGE.Class = function()
{
	var wge = function(bInitWithArr, argArray)
	{
    	//initialize 为所有类的初始化方法。
    	if(this.initialize && this.initialize.apply)
    	{
    		if(bInitWithArr === WGE.ClassInitWithArr)
    			this.initialize.apply(this, argArray);	
    		else
    			this.initialize.apply(this, arguments);
    	}
    };
    wge.ancestors = WGE.clone(arguments);
    wge.prototype = {};
    for (var i = 0; i < arguments.length; i++)
    {
    	var a = arguments[i]
    	if (a.prototype)
    	{
    		WGE.extend(wge.prototype, a.prototype);
    	}
    	else
    	{
    		WGE.extend(wge.prototype, a);
    	}
    }
    WGE.extend(wge, wge.prototype);
    return wge;
};

WGE.rotateArray = function(arr)
{
	arr.push(arr.shift());
	return arr[arr.length - 1];
};

WGE.getContentByID = function(tagID)
{
	var content = document.getElementById(scriptID);
	if (!content) return "";
	return content.textContent || content.text || content.innerText || content.innerHTML;
};

WGE.getHTMLByID = function(tagID)
{
	var content = document.getElementById(scriptID);
	if (!content) return "";
	return content.innerHTML;
};

WGE.requestTextByURL = function(url, callback)
{
	var async = callback ? true : false;
	var xmlHttp = new XMLHttpRequest();
	xmlHttp.open('get', url, async);
	if(async)
	{
		xmlHttp.onreadystatechange = function()	{
			if(xmlHttp.readyState == 4)
			{
				callback(xmlHttp.responseText, xmlHttp);
			}
		};
	}
	xmlHttp.send();
	return xmlHttp.responseText;
};

WGE.CE = function(name)
{
	return document.createElement(name);
};

WGE.ID = function(id)
{
	return document.getElementById(id);
};

//第一个参数为包含image url的数组
//第二个参数为所有图片完成后的callback，传递参数为一个包含所有图片的数组
//第三个参数为单张图片完成后的callback，传递三个参数，分别为当前完成的图片、当前已经完成的图片数、当前完成的图片在整个相对于image url数组的下标
WGE.loadImages = function(imageURLArr, finishCallback, eachCallback)
{
	var n = 0;
	var imgArr = [];

	var J = function(img) {
		++n;
		if(typeof eachCallback == 'function')
			eachCallback(img, n, img.wgeImageID);
		if(n >= imageURLArr.length && typeof finishCallback == 'function')
			finishCallback(imgArr);
		this.onload = null; //解除对imgArr, n 等的引用
	};

	var F = function() {
		var url = URL.createObjectURL(this.response);
		var img = new Image();
		imgArr[this.wgeImageID] = img;
		img.wgeImageID = this.wgeImageID;
		img.onload = function() {
			J.call(this, this, this.wgeImageID);
			URL.revokeObjectURL(url);
		};
		img.onerror = function() {
			this.src = WGE.Image404Data;
		};

		img.src = url;
		img.url = this.url;
		
	};

	//当加载失败时，确保引擎正常工作，并返回默认404图片.
	// var E = function() {
	// 	var img = new Image();
	// 	imgArr[this.wgeImageID] = img;
	// 	img.wgeImageID = this.wgeImageID;
	// 	img.onload = function() {			
	// 		J.call(this, this, this.wgeImageID);
	// 	};

	// 	img.onerror = function() {
	// 		this.src = WGE.Image404Data;
	// 	};

	// 	img.src = this.url;
	// };

	var E2 = function() {
		var img = new Image();
		imgArr[this.wgeImageID] = img;
		img.wgeImageID = this.wgeImageID;
		img.src = WGE.Image404Data;
		J.call(img, img, this.wgeImageID);
	};

	for (var i = 0; i < imageURLArr.length; i++)
	{
		var xhr = new XMLHttpRequest();
		xhr.wgeImageID = i;
		xhr.onload = F;
		xhr.onerror = E2;
		xhr.url = imageURLArr[i];
		xhr.open('GET', xhr.url, true);
		xhr.responseType = 'blob';
 	    xhr.send();
 	}
}

//简介： 所有需要提供给Animation使用的sprite 
//       都必须实现 wgeSpriteInterface2d 里面涉及到的方法。
//       为了保证公共方法正常使用，pos等类成员名必须有效。

WGE.SpriteInterface2d = WGE.Class(
{
	pos : null,           //sprite 所在位置, 类型: WGE.Vec2
	scaling : null,       //sprite 缩放, 类型: WGE.Vec2
	rotation : 0,         //sprite 旋转(弧度)
	alpha : 1,            //sprite 透明度(范围0~1)
	zIndex : 0,           //sprite 的z值
	childSprites : null,  //sprite 的子节点

	initialize : function()
	{
		console.warn("This should never be called!");
	},

	getPosition : function()
	{
		return this.pos;
	},

	getScaling : function()
	{
		return this.scaling;
	},

	getRotation : function()
	{
		return this.rotation;
	},

	getAlpha : function()
	{
		return this.alpha;
	},

	getZ : function()
	{
		return this.zIndex;
	},

	//给sprite 添加子节点。
	addChild : function()
	{
		if(!(this.childSprites instanceof Array))
			this.childSprites = [];
		this.childSprites.push.apply(this.childSprites, arguments);
	},

	//要操作子节点，可直接获取，并按js的数组操作。
	getChildren : function()
	{
		return this.childSprites;
	},

	//设置sprite的重心, (0,0)表示中心，(-1, -1)表示左上角(1,1) 表示右下角
	setHotspot : function(hx, hy) {},

	//将sprite重心设置为纹理正中心。
	setHotspot2Center : function() {},

	//将sprite重心设置为相对于纹理实际像素的某个点(相对于纹理左上角)
	setHotspotWithPixel : function() {},

	//将sprite移动到相对于当前位置位移(dx, dy) 的某个位置。
	move : function(dx, dy) {},

	//将sprite移动到指定位置。
	moveTo : function(x, y) {},

	//将sprite相对于当前缩放值缩放
	scale : function(sx, sy) {},

	//将sprite相对于正常大小缩放
	scaleTo : function(sx, sy) {},

	//将sprite相对于当前旋转值旋转 (顺时针)
	rotate : function(dRot) {},

	//将sprite从0旋转至给定值 (顺时针)
	rotateTo : function(rot) {},

	//将sprite渲染到给定的context之上
	render : function(ctx) {},

	//将子节点渲染到给定的context之上
	//注意，根据实现方式的不同，renderChildren的参数请根据自己sprite的需要填写。
	_renderChildren : function(ctx) {},

});

if(!window.requestAnimationFrame)
{
	// window.requestAnimationFrame = window.mozRequestAnimationFrame ||
	// 						window.webkitRequestAnimationFrame ||
	// 						window.msRequestAnimationFrame ||
	// 						window.oRequestAnimationFrame ||
	// 						function(callback) {
	// 							return setTimeout(callback, 1000 / 60);
	// 						};

	// 目前主流浏览器支持html5的话，均已支持 requestAnimationFrame
	// 仅使用 setTimeout确保兼容，以方便 cancel方法一一对应！
	window.requestAnimationFrame = function(callback) {
		return setTimeout(callback, 1000/60);
	}
}

if(!window.cancelAnimationFrame)
{
	window.cancelAnimationFrame = function(reqID) {
		clearTimeout(reqID);
	}
}



//这函数没别的用, 就追踪一下使用情况@_@ 无视吧。 你在使用时可以删掉。
WGE.WYSAIDTrackingCode = function()
{
	try
	{
		(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
			(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
			m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
		})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

		ga('create', 'UA-41296769-1', 'wysaid.org');
		ga('send', 'pageview');

		var baidu = WGE.CE('script');
		baidu.setAttribute("type", "text/javascript");
		baidu.src = "http://hm.baidu.com/h.js%3Fb1b964c80dff2a1af1bb8b1ee3e9a7d1";

		var tencent = WGE.CE('script');
		tencent.setAttribute("type", "text/javascript");
		tencent.src = "http://tajs.qq.com/stats?sId=23413950";

		var div = WGE.CE('div');
		div.setAttribute('style', 'display:none');
		
		div.appendChild(baidu);
		div.appendChild(tencent);
		document.body.appendChild(div);
	}catch(e)
	{
		console.log(e);
	};

	delete WGE.WYSAIDTrackingCode;
};

// setTimeout(WGE.WYSAIDTrackingCode, 15000); //打开页面15秒之后再统计。

WGE.Image404Data = "data:image/png;base64,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"

WGE.gen404Image = function()
{
	var img = new Image;
	img.src = WGE.Image404Data;
	if(img.complete)
	{
		var c2 = WGE.CE('canvas');
		c2.width = 1024;
		c2.height = 768;
		var ctx = c2.getContext('2d');
		ctx.fillStyle = "#72BCAB";
		ctx.fillRect(0, 0, c2.width, c2.height);
		ctx.drawImage(img, 0, 0, img.width, img.height, 512 - img.width/2, 384 - img.height / 2, img.width, img.height);
		WGE.Image404Data = c2.toDataURL();
	}
	else
	{
		img.onload = function() {
			var c2 = WGE.CE('canvas');
			c2.width = 1024;
			c2.height = 768;
			var ctx = c2.getContext('2d');
			ctx.fillStyle = "#72BCAB";
			ctx.fillRect(0, 0, c2.width, c2.height);
			ctx.drawImage(img, 0, 0, img.width, img.height, 512 - img.width/2, 384 - img.height / 2, img.width, img.height);
			WGE.Image404Data = c2.toDataURL();
		}
	}
}

WGE.gen404Image();

//../wgeAlgorithm.js
"use strict";
/*
	Author: wysaid
	Blog: blog.wysaid.org
	Mail: wysaid@gmail.com OR admin@wysaid.org
	Description: 本文件里面的方法可能涉及到频繁调用, 必须注意执行效率问题！
	             为了提升效率. 本文件里面的所有算法, 均不考虑容错问题。
*/

//本文件部分算法参考自: http://opengl.org/

WGE.Vec2 = WGE.Class(
{
	data : null,

	initialize : function(x, y)
	{
		this.data = new Float32Array([x, y]);
	},

	dot : function(v2)
	{
		return this.data[0] * v2.data[0] + this.data[1] * v2.data[1];
	},

	dotSelf : function()
	{
		return this.data[0] * this.data[0] + this.data[1] * this.data[1];
	},

	add : function(v2)
	{
		this.data[0] += v2.data[0];
		this.data[1] += v2.data[1];
		return this;
	},

	sub : function(v2)
	{
		this.data[0] -= v2.data[0];
		this.data[1] -= v2.data[1];
		return this;
	},

	mul : function(v2)
	{
		this.data[0] *= v2.data[0];
		this.data[1] *= v2.data[1];
		return this;
	},

	div : function(v2)
	{
		this.data[0] /= v2.data[0];
		this.data[1] /= v2.data[1];
		return this;
	},

	normalize : function()
	{
		var scale = 1.0 / Math.sqrt(this.data[0]*this.data[0] + this.data[1]*this.data[1]);
		this.data[0] *= scale;
		this.data[1] *= scale;
		return this;
	},

	//////////////////////////////////////////////////

	subFloat : function(fValue)
	{
		this.data[0] -= fValue;
		this.data[1] -= fValue;
	},

	addFloat : function(fValue)
	{
		this.data[0] += fValue;
		this.data[1] += fValue;
	},

	mulFloat : function(fValue)
	{
		this.data[0] *= fValue;
        this.data[1] *= fValue;
	},

	divFloat : function(fValue)
	{
        this.data[0] /= fValue;
        this.data[1] /= fValue;
	}
});

WGE.Vec3 = WGE.Class(
{
	data : null,

	initialize : function(x, y, z)
	{
		this.data = new Float32Array([x, y, z])
	},

	dot : function(v3)
	{
		return this.data[0] * v3.data[0] + this.data[1] * v3.data[1] + this.data[2] * v3.data[2];
	},

	dotSelf : function()
	{
		return this.data[0] * this.data[0] + this.data[1] * this.data[1] + this.data[2] * this.data[2];
	},

	add : function(v3)
	{
		this.data[0] += v3.data[0];
		this.data[1] += v3.data[1];
		this.data[2] += v3.data[2];
		return this;
	},

	sub : function(v3)
	{
		this.data[0] -= v3.data[0];
		this.data[1] -= v3.data[1];
		this.data[2] -= v3.data[2];
		return this;
	},

	mul : function(v3)
	{
		this.data[0] *= v3.data[0];
		this.data[1] *= v3.data[1];
		this.data[2] *= v3.data[2];
		return this;
	},

	div : function(v3)
	{
		this.data[0] /= v3.data[0];
		this.data[1] /= v3.data[1];
		this.data[2] /= v3.data[2];
		return this;
	},

	normalize : function()
	{
		var scale = 1.0 / Math.sqrt(this.data[0]*this.data[0] + this.data[1]*this.data[1] + this.data[2]*this.data[2]);
		this.data[0] *= scale;
		this.data[1] *= scale;
		this.data[2] *= scale;
		return this;
	},

	//////////////////////////////////////////////////

	subFloat : function(fValue)
	{
		this.data[0] -= fValue;
		this.data[1] -= fValue;
		this.data[2] -= fValue;
	},

	addFloat : function(fValue)
	{
		this.data[0] += fValue;
		this.data[1] += fValue;
		this.data[2] += fValue;
	},

	mulFloat : function(fValue)
	{
		this.data[0] *= fValue;
        this.data[1] *= fValue;
        this.data[2] *= fValue;
	},

	divFloat : function(fValue)
	{
        this.data[0] /= fValue;
        this.data[1] /= fValue;
        this.data[2] /= fValue;
	},

	//////////////////////////////////////////////////

	cross : function(v3)
	{
		var x = this.data[1] * v3.data[2] - this.data[2] * v3.data[1];
        var y = this.data[2] * v3.data[0] - this.data[0] * v3.data[2];
        this.data[2] = this.data[0] * v3.data[1] - this.data[1] * v3.data[0];
        this.data[0] = x;
        this.data[1] = y;
	}		
});

WGE.makeVec3 = function(x, y, z)
{
	return new WGE.Vec3(x, y, z);
};

WGE.vec3Sub = function(v3Left, v3Right)
{
	return WGE.makeVec3(v3Left.data[0] - v3Right.data[0],
		v3Left.data[1] - v3Right.data[1],
		v3Left.data[2] - v3Right.data[2]);
};

WGE.vec3Add = function(v3Left, v3Right)
{
	return WGE.makeVec3(v3Left.data[0] + v3Right.data[0],
		v3Left.data[1] + v3Right.data[1],
		v3Left.data[2] + v3Right.data[2]);
};

WGE.vec3Mul = function(v3Left, v3Right)
{
	return WGE.makeVec3(v3Left.data[0] * v3Right.data[0],
		v3Left.data[1] * v3Right.data[1],
		v3Left.data[2] * v3Right.data[2]);
};

WGE.vec3Div = function(v3Left, v3Right)
{
	return WGE.makeVec3(v3Left.data[0] / v3Right.data[0],
		v3Left.data[1] / v3Right.data[1],
		v3Left.data[2] / v3Right.data[2]);
};

//////////////////////////////////////////////////

WGE.vec3SubFloat = function(v3Left, fValue)
{
	return WGE.makeVec3(v3Left.data[0] - fValue,
		v3Left.data[1] - fValue,
		v3Left.data[2] - fValue);
};

WGE.vec3AddFloat = function(v3Left, fValue)
{
	return WGE.makeVec3(v3Left.data[0] + fValue,
		v3Left.data[1] + fValue,
		v3Left.data[2] + fValue);
};

WGE.vec3MulFloat = function(v3Left, fValue)
{
	return WGE.makeVec3(v3Left.data[0] * fValue,
		v3Left.data[1] * fValue,
		v3Left.data[2] * fValue);
};

WGE.vec3DivFloat = function(v3Left, fValue)
{
	return WGE.makeVec3(v3Left.data[0] / fValue,
		v3Left.data[1] / fValue,
		v3Left.data[2] / fValue);
};

//////////////////////////////////////////////////

WGE.vec3Cross = function(v3Left, v3Right)
{
	return WGE.makeVec3(v3Left.data[1] * v3Right.data[2] - v3Left.data[2] * v3Right.data[1],
			v3Left.data[2] * v3Right.data[0] - v3Left.data[0] * v3Right.data[2],
			v3Left.data[0] * v3Right.data[1] - v3Left.data[1] * v3Right.data[0]);
};



WGE.vec3Project = function(v3ToProj, projVec)
{
	var d = projVec.dot(v3ToProj) / projVec.dotSelf();
	return WGE.vec3MulFloat(projVec, d);
};

//////////////////////////////////////////////////////


// vector 4 没怎么用到，暂时不写太多。
WGE.Vec4 = WGE.Class(
{
	data : null,

	initialize : function(x, y, z, w)
	{
		this.data = new Float32Array([x, y, z, w]);
	}
});




//////////////////////////////////////////////////////
//
//        Hard code for matrix.   --By wysaid
//
//////////////////////////////////////////////////////

WGE.Mat2 = WGE.Class(
{
	data : null,

	initialize : function(m00, m01, m10, m11)
	{
		this.data = new Float32Array([m00, m01, m10, m11]);
	},

	rotate : function(rad)
	{
		this.data = WGE.mat2Mul(this, WGE.mat2Rotation(rad)).data;
	}

});

WGE.makeMat2 = function (m00, m01, m10, m11)
{
    return new WGE.Mat2(m00, m01, m10, m11);
};

WGE.mat2Identity = function ()
{
    return new WGE.Mat2(1.0, 0.0, 0.0, 1.0);
};

WGE.mat2Scale = function (x, y, z)
{
    return new WGE.Mat2(x, 0.0, 0.0, y);
};

WGE.mat2Rotation = function (rad)
{
    var cosRad = Math.cos(rad);
    var sinRad = Math.sin(rad);
    return new WGE.Mat2(cosRad, sinRad, -sinRad, cosRad);
};

WGE.mat2Mul = function (mat2Left, mat2Right)
{
    return new WGE.Mat2(mat2Left.data[0] * mat2Right.data[0] + mat2Left.data[2] * mat2Right.data[1],
		mat2Left.data[1] * mat2Right.data[0] + mat2Left.data[3] * mat2Right.data[1],
		mat2Left.data[0] * mat2Right.data[2] + mat2Left.data[2] * mat2Right.data[3],
		mat2Left.data[1] * mat2Right.data[2] + mat2Left.data[3] * mat2Right.data[3]);
};

WGE.mat2MulVec2 = function(mat2Left, vec2Right)
{
	return new WGE.Vec2(mat2Left.data[0] * vec2Right.data[0] + mat2Left.data[2] * vec2Right.data[1],
		mat2Left.data[1] * vec2Right.data[0] + mat2Left.data[3] * vec2Right.data[1]);
}

//////////////////////////////////////////////////////
// matrix 3 x 3
//////////////////////////////////////////////////////

WGE.Mat3 = WGE.Class(
{
    data: null,

    initialize: function (m00, m01, m02, m10, m11, m12, m20, m21, m22)
    {
        this.data = new Float32Array([m00, m01, m02, m10, m11, m12, m20, m21, m22]);
    },

    transpose: function ()
    {
        this.data = new Float32Array([this.data[0], this.data[3], this.data[6],
			this.data[1], this.data[4], this.data[7],
			this.data[2], this.data[5], this.data[8]]);
    },

    rotate : function(rad, x, y, z)
    {
    	this.data = WGE.mat3Mul(this, WGE.mat3Rotation(rad, x, y, z)).data;
    },
    
    rotateX : function(rad)
    {
    	this.data = WGE.mat3Mul(this, WGE.mat3XRotation(rad)).data;
    },

    rotateY : function(rad)
    {
    	this.data = WGE.mat3Mul(this, WGE.mat3YRotation(rad)).data;
    },

    rotateZ : function(rad)
    {
    	this.data = WGE.mat3Mul(this, WGE.mat3ZRotation(rad)).data;
    }

});

WGE.mat3Mul = function (mat3Left, mat3Right)
{
    return new WGE.Mat3(mat3Left.data[0] * mat3Right.data[0] + mat3Left.data[3] * mat3Right.data[1] + mat3Left.data[6] * mat3Right.data[2],
		mat3Left.data[1] * mat3Right.data[0] + mat3Left.data[4] * mat3Right.data[1] + mat3Left.data[7] * mat3Right.data[2],
		mat3Left.data[2] * mat3Right.data[0] + mat3Left.data[5] * mat3Right.data[1] + mat3Left.data[8] * mat3Right.data[2],

		mat3Left.data[0] * mat3Right.data[3] + mat3Left.data[3] * mat3Right.data[4] + mat3Left.data[6] * mat3Right.data[5],
		mat3Left.data[1] * mat3Right.data[3] + mat3Left.data[4] * mat3Right.data[4] + mat3Left.data[7] * mat3Right.data[5],
		mat3Left.data[2] * mat3Right.data[3] + mat3Left.data[5] * mat3Right.data[4] + mat3Left.data[8] * mat3Right.data[5],

		mat3Left.data[0] * mat3Right.data[6] + mat3Left.data[3] * mat3Right.data[7] + mat3Left.data[6] * mat3Right.data[8],
		mat3Left.data[1] * mat3Right.data[6] + mat3Left.data[4] * mat3Right.data[7] + mat3Left.data[7] * mat3Right.data[8],
		mat3Left.data[2] * mat3Right.data[6] + mat3Left.data[5] * mat3Right.data[7] + mat3Left.data[8] * mat3Right.data[8]);
};

WGE.mat3MulVec3 = function (mat3, vec3)
{
    return new WGE.Mat3(mat3.data[0] * vec3.data[0] + mat3.data[3] * vec3.data[1] + mat3.data[6] * vec3.data[2],
		mat3.data[1] * vec3.data[0] + mat3.data[4] * vec3.data[1] + mat3.data[7] * vec3.data[2],
		mat3.data[2] * vec3.data[0] + mat3.data[5] * vec3.data[1] + mat3.data[8] * vec3.data[2]);
};

/////////////////////////////////////////////////////////////

WGE.makeMat3 = function (m00, m01, m02, m10, m11, m12, m20, m21, m22)
{
    return new WGE.Mat3(m00, m01, m02, m10, m11, m12, m20, m21, m22);
};

WGE.mat3Identity = function ()
{
    return new WGE.Mat3(1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0);
};

WGE.mat3Scale = function (x, y, z)
{
    return new WGE.Mat3(x, 0.0, 0.0, 0.0, y, 0.0, 0.0, 0.0, z);
};

WGE.mat3Rotation = function (rad, x, y, z)
{
    var scale = 1.0 / Math.sqrt(x * x + y * y + z * z);
    x *= scale;
    y *= scale;
    z *= scale;
    var cosRad = Math.cos(rad);
    var cosp = 1.0 - cosRad;
    var sinRad = Math.sin(rad);
    return new WGE.Mat3(cosRad + cosp * x * x,
		cosp * x * y + z * sinRad,
		cosp * x * z - y * sinRad,
		cosp * x * y - z * sinRad,
		cosRad + cosp * y * y,
		cosp * y * z + x * sinRad,
		cosp * x * z + y * sinRad,
		cosp * y * z - x * sinRad,
		cosRad + cosp * z * z);
};

WGE.mat3XRotation = function (rad)
{
    var cosRad = Math.cos(rad);
    var sinRad = Math.sin(rad);
    return new WGE.Mat3(1.0, 0.0, 0.0,
		0.0, cosRad, sinRad,
		0.0, -sinRad, cosRad);
};

WGE.mat3YRotation = function (rad)
{
    var cosRad = Math.cos(rad);
    var sinRad = Math.sin(rad);
    return new WGE.Mat3(cosRad, 0.0, -sinRad,
		0.0, 1.0, 0.0,
		sinRad, 0.0, cosRad);
};

WGE.mat3ZRotation = function (rad)
{
    var cosRad = Math.cos(rad);
    var sinRad = Math.sin(rad);
    return new WGE.Mat3(cosRad, sinRad, 0.0,
		-sinRad, cosRad, 0.0,
		0.0, 0.0, 1.0);
};

WGE.mat3Mul = function (mat3Left, mat3Right)
{
    return new WGE.Mat3(mat3Left.data[0] * mat3Right.data[0] + mat3Left.data[3] * mat3Right.data[1] + mat3Left.data[6] * mat3Right.data[2],
		mat3Left.data[1] * mat3Right.data[0] + mat3Left.data[4] * mat3Right.data[1] + mat3Left.data[7] * mat3Right.data[2],
		mat3Left.data[2] * mat3Right.data[0] + mat3Left.data[5] * mat3Right.data[1] + mat3Left.data[8] * mat3Right.data[2],

		mat3Left.data[0] * mat3Right.data[3] + mat3Left.data[3] * mat3Right.data[4] + mat3Left.data[6] * mat3Right.data[5],
		mat3Left.data[1] * mat3Right.data[3] + mat3Left.data[4] * mat3Right.data[4] + mat3Left.data[7] * mat3Right.data[5],
		mat3Left.data[2] * mat3Right.data[3] + mat3Left.data[5] * mat3Right.data[4] + mat3Left.data[8] * mat3Right.data[5],

		mat3Left.data[0] * mat3Right.data[6] + mat3Left.data[3] * mat3Right.data[7] + mat3Left.data[6] * mat3Right.data[8],
		mat3Left.data[1] * mat3Right.data[6] + mat3Left.data[4] * mat3Right.data[7] + mat3Left.data[7] * mat3Right.data[8],
		mat3Left.data[2] * mat3Right.data[6] + mat3Left.data[5] * mat3Right.data[7] + mat3Left.data[8] * mat3Right.data[8]);
};

WGE.mat3MulVec3 = function (mat3, vec3)
{
    return new WGE.Mat3(mat3.data[0] * vec3.data[0] + mat3.data[3] * vec3.data[1] + mat3.data[6] * vec3.data[2],
		mat3.data[1] * vec3.data[0] + mat3.data[4] * vec3.data[1] + mat3.data[7] * vec3.data[2],
		mat3.data[2] * vec3.data[0] + mat3.data[5] * vec3.data[1] + mat3.data[8] * vec3.data[2]);
};


////////////////////////////////////////////////////////////////////
// matrix 4 x 4
////////////////////////////////////////////////////////////////////

WGE.Mat4 = WGE.Class(
{
	data : null,

	initialize : function(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33)
	{
		this.data = new Float32Array([m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33]);
	},

	transpose : function()
	{
		this.data = new Float32Array([this.data[0],  this.data[4],  this.data[8],  this.data[12],
			this.data[1],  this.data[5],  this.data[9],  this.data[13],
			this.data[2],  this.data[6],  this.data[10],  this.data[14],
			this.data[3],  this.data[7],  this.data[11],  this.data[15]]);
	},

	translateX : function(x)
	{
		this.data[12] += this.data[0] * x;
		this.data[13] += this.data[1] * x;
		this.data[14] += this.data[2] * x;
	},

	translateY : function(y)
	{
		this.data[12] += this.data[4] * y;
		this.data[13] += this.data[5] * y;
		this.data[14] += this.data[6] * y;
	},

	translateZ : function(z)
	{
		this.data[12] += this.data[8] * z;
		this.data[13] += this.data[9] * z;
		this.data[14] += this.data[10] * z;
	},

	scaleX : function(x)
	{
		this.data[0] *= x;
		this.data[1] *= x;
		this.data[2] *= x;
		this.data[3] *= x;
	},

	scaleY : function(y)
	{
		this.data[4] *= y;
		this.data[5] *= y;
		this.data[6] *= y;
		this.data[7] *= y;
	},

	scaleZ : function(z)
	{
		this.data[8] *= z;
		this.data[9] *= z;
		this.data[10] *= z;
		this.data[11] *= z;
	},

	scale : function(x, y, z)
	{
		this.scaleX(x);
		this.scaleY(y);
		this.scaleZ(z);
	},

	rotate : function(rad, x, y, z)
    {
    	this.data = WGE.mat4Mul(this, WGE.mat4Rotation(rad, x, y, z)).data;
    },
    
    rotateX : function(rad)
    {
    	this.data = WGE.mat4Mul(this, WGE.mat4XRotation(rad)).data;
    },

    rotateY : function(rad)
    {
    	this.data = WGE.mat4Mul(this, WGE.mat4YRotation(rad)).data;
    },

    rotateZ : function(rad)
    {
    	this.data = WGE.mat4Mul(this, WGE.mat4ZRotation(rad)).data;
    }
});

/////////////////////////////////////////////////////////////

WGE.makeMat4 = function(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33)
{
	return new WGE.Mat4(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33);
};

WGE.mat4Identity = function()
{
	return new WGE.Mat4(1.0, 0.0, 0.0, 0.0,
					0.0, 1.0, 0.0, 0.0,
					0.0, 0.0, 1.0, 0.0,
					0.0, 0.0, 0.0, 1.0);
};

WGE.mat4Translation = function(x, y, z)
{
	return new WGE.Mat4(1.0, 0.0, 0.0, 0.0,
		0.0, 1.0, 0.0, 0.0,
		0.0, 0.0, 1.0, 0.0,
		x, y, z, 1.0);
};

WGE.mat4Scale = function(x, y, z)
{
	return new WGE.Mat4(x, 0.0, 0.0, 0.0,
		0.0, y, 0.0, 0.0,
		0.0, 0.0, z, 0.0,
		0.0, 0.0, 0.0, 1.0);
};

WGE.mat4Rotation = function(rad, x, y, z)
{
	var scale = 1.0 / Math.sqrt(x*x + y*y + z*z);
	x *= scale;
	y *= scale;
	z *= scale;
	var cosRad = Math.cos(rad);
	var cosp = 1.0 - cosRad;
	var sinRad = Math.sin(rad);
	return new WGE.Mat4(cosRad + cosp * x * x,
		cosp * x * y + z * sinRad,
		cosp * x * z - y * sinRad,
		0.0,
		cosp * x * y - z * sinRad,
		cosRad + cosp * y * y,
		cosp * y * z + x * sinRad,
		0.0,
		cosp * x * z + y * sinRad,
		cosp * y * z - x * sinRad,
		cosRad + cosp * z * z,
		0.0, 0.0, 0.0, 0.0, 1.0);
};

WGE.mat4XRotation = function(rad)
{
	var cosRad = Math.cos(rad);
	var sinRad = Math.sin(rad);
	return new WGE.Mat4(1.0, 0.0, 0.0, 0.0,
		0.0, cosRad, sinRad, 0.0,
		0.0, -sinRad, cosRad, 0.0,
		0.0, 0.0, 0.0, 1.0);
};

WGE.mat4YRotation = function(rad)
{
	var cosRad = Math.cos(rad);
	var sinRad = Math.sin(rad);
	return new WGE.Mat4(cosRad, 0.0, -sinRad, 0.0,
		0.0, 1.0, 0.0, 0.0,
		sinRad, 0.0, cosRad, 0.0,
		0.0, 0.0, 0.0, 1.0);
};

WGE.mat4ZRotation = function(rad)
{
	var cosRad = Math.cos(rad);
	var sinRad = Math.sin(rad);
	return new WGE.Mat4(cosRad, sinRad, 0.0, 0.0,
		-sinRad, cosRad, 0.0, 0.0,
		0.0, 0.0, 1.0, 0.0,
		0.0, 0.0, 0.0, 1.0);
};

WGE.makePerspective = function(fovyRad, aspect, nearZ, farZ)
{
	var cotan = 1.0 / Math.tan(fovyRad / 2.0);
	return new WGE.Mat4(cotan / aspect, 0.0, 0.0, 0.0,
		0.0, cotan, 0.0, 0.0,
		0.0, 0.0, (farZ + nearZ) / (nearZ - farZ), -1.0,
		0.0, 0.0, (2.0 * farZ * nearZ) / (nearZ - farZ), 0.0);
};

WGE.makeFrustum = function(left, right, bottom, top, nearZ, farZ)
{
	var ral = right + left;
	var rsl = right - left;
	var tsb = top - bottom;
	var tab = top + bottom;
	var fan = farZ + nearZ;
	var fsn = farZ - nearZ;

	return new WGE.Mat4(2.0 * nearZ / rsl, 0.0, 0.0, 0.0,
		0.0, 2.0 * nearZ / tsb, 0.0, 0.0,
		ral / rsl, tab / tsb, -fan / fsn, -1.0,
		0.0, 0.0, (-2.0 * farZ * nearZ) / fsn, 0.0);
};

WGE.makeOrtho = function(left, right, bottom, top, nearZ, farZ)
{
	var ral = right + left;
	var rsl = right - left;
	var tsb = top - bottom;
	var tab = top + bottom;
	var fan = farZ + nearZ;
	var fsn = farZ - nearZ;

	return new WGE.Mat4(2.0 / rsl, 0.0, 0.0, 0.0,
		0.0, 2.0 / tsb, 0.0, 0.0,
		0.0, 0.0, -2.0 / fsn, 0.0,
		-ral / rsl, -tab / tsb, -fan / fsn, 1.0);
};

WGE.makeLookAt = function(eyeX, eyeY, eyeZ, centerX, centerY, centerZ,	upX, upY, upZ)
{
    var ev = WGE.makeVec3(eyeX, eyeY, eyeZ);
    var cv = WGE.makeVec3(centerX, centerY, centerZ);
    var uv = WGE.makeVec3(upX, upY, upZ);
    var n = WGE.vec3Sub(ev, cv).normalize();
    var u = WGE.vec3Cross(uv, n).normalize();
    var v = WGE.vec3Cross(n, u);

	return new WGE.Mat4(u.data[0], v.data[0], n.data[0], 0.0,
		u.data[1], v.data[1], n.data[1], 0.0,
		u.data[2], v.data[2], n.data[2], 0.0,
		-u.dot(ev),
		-v.dot(ev),
		-n.dot(ev),
		1.0);
};

WGE.mat4Mul = function(mat4Left, mat4Right)
{
	return new WGE.Mat4(mat4Left.data[0] * mat4Right.data[0] + mat4Left.data[4] * mat4Right.data[1] + mat4Left.data[8] * mat4Right.data[2] + mat4Left.data[12] * mat4Right.data[3],
		mat4Left.data[1] * mat4Right.data[0] + mat4Left.data[5] * mat4Right.data[1] + mat4Left.data[9] * mat4Right.data[2] + mat4Left.data[13] * mat4Right.data[3],
		mat4Left.data[2] * mat4Right.data[0] + mat4Left.data[6] * mat4Right.data[1] + mat4Left.data[10] * mat4Right.data[2] + mat4Left.data[14] * mat4Right.data[3],
		mat4Left.data[3] * mat4Right.data[0] + mat4Left.data[7] * mat4Right.data[1] + mat4Left.data[11] * mat4Right.data[2] + mat4Left.data[15] * mat4Right.data[3],
		mat4Left.data[0] * mat4Right.data[4] + mat4Left.data[4] * mat4Right.data[5] + mat4Left.data[8] * mat4Right.data[6] + mat4Left.data[12] * mat4Right.data[7],
		mat4Left.data[1] * mat4Right.data[4] + mat4Left.data[5] * mat4Right.data[5] + mat4Left.data[9] * mat4Right.data[6] + mat4Left.data[13] * mat4Right.data[7],
		mat4Left.data[2] * mat4Right.data[4] + mat4Left.data[6] * mat4Right.data[5] + mat4Left.data[10] * mat4Right.data[6] + mat4Left.data[14] * mat4Right.data[7],
		mat4Left.data[3] * mat4Right.data[4] + mat4Left.data[7] * mat4Right.data[5] + mat4Left.data[11] * mat4Right.data[6] + mat4Left.data[15] * mat4Right.data[7],
		mat4Left.data[0] * mat4Right.data[8] + mat4Left.data[4] * mat4Right.data[9] + mat4Left.data[8] * mat4Right.data[10] + mat4Left.data[12] * mat4Right.data[11],
		mat4Left.data[1] * mat4Right.data[8] + mat4Left.data[5] * mat4Right.data[9] + mat4Left.data[9] * mat4Right.data[10] + mat4Left.data[13] * mat4Right.data[11],
		mat4Left.data[2] * mat4Right.data[8] + mat4Left.data[6] * mat4Right.data[9] + mat4Left.data[10] * mat4Right.data[10] + mat4Left.data[14] * mat4Right.data[11],
		mat4Left.data[3] * mat4Right.data[8] + mat4Left.data[7] * mat4Right.data[9] + mat4Left.data[11] * mat4Right.data[10] + mat4Left.data[15] * mat4Right.data[11],
		mat4Left.data[0] * mat4Right.data[12] + mat4Left.data[4] * mat4Right.data[13] + mat4Left.data[8] * mat4Right.data[14] + mat4Left.data[12] * mat4Right.data[15],			
		mat4Left.data[1] * mat4Right.data[12] + mat4Left.data[5] * mat4Right.data[13] + mat4Left.data[9] * mat4Right.data[14] + mat4Left.data[13] * mat4Right.data[15],			
		mat4Left.data[2] * mat4Right.data[12] + mat4Left.data[6] * mat4Right.data[13] + mat4Left.data[10] * mat4Right.data[14] + mat4Left.data[14] * mat4Right.data[15],			
		mat4Left.data[3] * mat4Right.data[12] + mat4Left.data[7] * mat4Right.data[13] + mat4Left.data[11] * mat4Right.data[14] + mat4Left.data[15] * mat4Right.data[15]);
};

WGE.mat4MulVec4 = function(mat4, vec4)
{
	return new WGE.Mat4(mat4.data[0] * vec4.data[0] + mat4.data[4] * vec4.data[1] + mat4.data[8] * vec4.data[2] + mat4.data[12] * vec4.data[3],
		mat4.data[1] * vec4.data[0] + mat4.data[5] * vec4.data[1] + mat4.data[9] * vec4.data[2] + mat4.data[13] * vec4.data[3],
		mat4.data[2] * vec4.data[0] + mat4.data[6] * vec4.data[1] + mat4.data[10] * vec4.data[2] + mat4.data[14] * vec4.data[3],
		mat4.data[3] * vec4.data[0] + mat4.data[7] * vec4.data[1] + mat4.data[11] * vec4.data[2] + mat4.data[15] * vec4.data[3]);
};

WGE.mat4MulVec3 = function(mat4, vec3)
{
	return new WGE.Mat4(mat4.data[0] * vec3.data[0] + mat4.data[4] * vec3.data[1] + mat4.data[8] * vec3.data[2],
		mat4.data[1] * vec3.data[0] + mat4.data[5] * vec3.data[1] + mat4.data[9] * vec3.data[2],
		mat4.data[2] * vec3.data[0] + mat4.data[6] * vec3.data[1] + mat4.data[10] * vec3.data[2]);
};

//通过四元数创建矩阵
WGE.mat4WithQuaternion = function(x, y, z, w)
{
	var scale = 1.0 / Math.sqrt(x*x + y*y + z*z + w*w);
	x *= scale;
	y *= scale;
	z *= scale;
	w *= scale;
	var _2x = x + x;
	var _2y = y + y;
	var _2z = z + z;
	var _2w = w + w;
	return new WGE.Mat4(1.0 - _2y * y - _2z * z,
		_2x * y + _2w * z,
		_2x * z - _2w * y,
		0.0,
		_2x * y - _2w * z,
		1.0 - _2x * x - _2z * z,
		_2y * z + _2w * x,
		0.0,
		_2x * z + _2w * y,
		_2y * z - _2w * x,
		1.0 - _2x * x - _2y * y,
		0.0, 0.0, 0.0, 0.0, 1.0);
};

//obj: WGEVec4; w should be 1.0
//modelViewMat, projMat: WGE.Mat4;
//viewport: WGE.Vec4;
//winCoord: WGE.Vec3;
WGE.projectMat4 = function(obj, modelViewMat, projMat, viewport, winCoord)
{
    var result = WGE.mat4MulVec4(projMat, WGE.mat4MulVec4(modelViewMat, obj));

	if (result.data[3] == 0.0)
		return false;

	result.data[0] /= result.data[3];
	result.data[1] /= result.data[3];
	result.data[2] /= result.data[3];

	winCoord.data[0] = viewport.data[0] + (1.0 + result.data[0]) * viewport.data[2] / 2.0;
	winCoord.data[1] = viewport.data[1] + (1.0 + result.data[1]) * viewport.data[3] / 2.0;
	if(winCoord.data[2])
		winCoord.data[2] = (1.0 + result.data[2]) / 2.0;
	return true;
};


///////////////////////////////////////////////////
//
//    以下是一些与矩阵向量无关的数学计算
//    每一个方法都必须写上它的用法、参数意义
//
///////////////////////////////////////////////////


/////////////////////////////////////

//lineIntersectionV 和 lineIntersectionA 均为计算两直线交点的函数
//P0, p1 为第一条直线上的两个点, p2, p3 为第二条直线上的两个点。

WGE.lineIntersectionV = function(p0, p1, p2, p3)
{
	var D = (p0.data[1] - p1.data[1]) * (p3.data[0] - p2.data[0]) + (p0.data[0] - p1.data[0]) * (p2.data[1] - p3.data[1]);
    var Dx = (p1.data[0] * p0.data[1] - p0.data[0] * p1.data[1]) * (p3.data[0] - p2.data[0]) + (p0.data[0] - p1.data[0]) * (p3.data[0] * p2.data[1] - p2.data[0] * p3.data[1]);
    var Dy = (p0.data[1] - p1.data[1]) * (p3.data[0] * p2.data[1] - p2.data[0] * p3.data[1]) + (p3.data[1] - p2.data[1]) * (p1.data[0] * p0.data[1] - p0.data[0] * p1.data[1]);
    return new WGE.Vec2(Dx / D, Dy / D);
};

WGE.lineIntersectionA = function(p0, p1, p2, p3)
{
	var D = (p0[1] - p1[1]) * (p3[0] - p2[0]) + (p0[0] - p1[0]) * (p2[1] - p3[1]);
    var Dx = (p1[0] * p0[1] - p0[0] * p1[1]) * (p3[0] - p2[0]) + (p0[0] - p1[0]) * (p3[0] * p2[1] - p2[0] * p3[1]);
    var Dy = (p0[1] - p1[1]) * (p3[0] * p2[1] - p2[0] * p3[1]) + (p3[1] - p2[1]) * (p1[0] * p0[1] - p0[0] * p1[1]);
    return [Dx / D, Dy / D];
};

//////////////////////////////////////

//../wgeAnimation.js
"use strict";
/*
* wgeAnimation.js
*
*  Created on: 2014-7-25
*      Author: Wang Yang
*        Blog: http://blog.wysaid.org
*/


// TimeActionInterface 定义了Time line可能会用到的公共函数，
// 这些函数在子类中如果需要用到的话则必须实现它！
// TimeActionInterface 不计算动作是否开始或者结束
WGE.TimeActionInterface = WGE.Class(
{
	// 为了方便统一计算， percent 值域范围必须为[0, 1]， 内部计算时请自行转换。
	act : function(percent) {},

	// 为Action开始做准备工作，比如对一些属性进行复位。(非必须)
	actionStart : function() {},

	// Action结束之后的扫尾工作，比如将某物体设置运动结束之后的状态。
	actionStop : function() {},

	bind : function(obj) { this.bindObj = obj; }, // 将动作绑定到某个实际的对象。

	// 在一次TimeAttrib中重复的次数, 对某些操作比较有用，如旋转
	repeatTimes : 1,
	bindObj : undefined,

	// 注意：这里的时间是相对于某个 SpriteAnimation自身的时间，而不是整个时间轴的时间！
	tStart : 0, //起始时间
	tEnd : 0 //结束时间
});

WGE.AnimationInterface2d = WGE.Class(
{
	startTime : undefined,
	endTime : undefined,
	timeActions : undefined, //action数组，将在规定时间内完成指定的动作
	actions2Run : undefined, //时间轴启动后，未完成的action。

	initialize : function(startTime, endTime)
	{
		this.setAttrib(startTime, endTime);
		this.timeActions = [];
	},

	setAttrib : function(tStart, tEnd)
	{
		this.startTime = parseFloat(tStart);
		this.endTime = parseFloat(tEnd);
	},

	push : function(action)
	{
		if(action.bind)
			action.bind(this);
		this.timeActions.push(action);
	},

	pushArr : function(actions)
	{
		for(var i in actions)
		{
			if(actions[i].bind)
				actions[i].bind(this);
			this.timeActions.push(actions[i]);
		}
	},

	clear : function()
	{
		this.timeActions = [];
	},

	run : function(totalTime)
	{
		var time = totalTime - this.startTime;
		var running = false;

		var len = this.actions2Run.length;
		var hasDelete = false;

		for(var i = 0; i != len; ++i)
		{
			var action = this.actions2Run[i];
			if(!action) continue;

			if(time >= action.tEnd)
			{
				action.actionStop();
				delete this.actions2Run[i];
				hasDelete = true;
			}
			else if(time > action.tStart)
			{
				var t = (time - action.tStart) / (action.tEnd - action.tStart);
				action.act(t);
			}

			running = true;
		}

		if(hasDelete)
		{
			var newArr = [];
			var arr = this.actions2Run;
			for(var i = 0; i != len; ++i)
			{
				if(arr[i])
					newArr.push(arr[i]);
			}
			this.actions2Run = newArr;
		}

		return running;
	},

	//进度跳转
	runTo : function(time)
	{

	},

	//启动时将action复位。
	timeStart : function()
	{
		for(var i = 0; i != this.timeActions.length; ++i)
		{
			this.timeActions[i].actionStart();
		}
		this.actions2Run = WGE.clone(this.timeActions);
	},

	//结束时将action设置为结束状态
	timeUp : function()
	{
		for(var i = 0; i != this.actions2Run.length; ++i)
		{
			this.actions2Run[i].actionStop();
		}
		this.actions2Run = undefined;
	}
});

WGE.AnimationWithChildrenInterface2d = WGE.Class(WGE.AnimationInterface2d,
{
	childSprites : null, //js特殊用法，扩展了对action的更新。

	run : function(totalTime)
	{
		WGE.AnimationInterface2d.run.call(this, totalTime);

		for(var i in this.childSprites)
		{
			this.childSprites[i].run(totalTime);
		}
	},

	//进度跳转
	runTo : function(time)
	{
		WGE.AnimationInterface2d.runTo.call(this, time);
		for(var i in childSprites)
		{
			this.childSprites[i].runTo(time);
		}
	},

	//启动时将action复位。
	timeStart : function()
	{
		WGE.AnimationInterface2d.timeStart.call(this);
		for(var i in this.childSprites)
		{
			this.childSprites[i].timeStart();
		}
	},

	//结束时将action设置为结束状态
	timeUp : function()
	{
		WGE.AnimationInterface2d.timeUp.call(this);
		for(var i in this.childSprites)
		{
			this.childSprites[i].timeUp();
		}
	}

});


//特殊用法, 不包含sprite的任何功能，仅仅作为管理那些特殊单独存在的action的容器。

WGE.AnimationActionManager = WGE.Class(WGE.AnimationInterface2d,
{
	zIndex : -10000,

	initialize : function(startTime, endTime)
	{
		this.setAttrib(startTime, endTime);
		this.timeActions = [];
	},

	push : function()
	{
		this.timeActions.push.apply(this, arguments);
	},

	pushArr : function(arr)
	{
		this.timeActions.push.call(this.timeActions, arr);
	}

});


/*
// AnimationSprite 定义了某个时间段的动作。
// AnimationSprite 与 TimeActionInterface 为包含关系，
// 一个 AnimationSprite 包含一个或多个 TimeActionInterface或者其子类.
// AnimationSprite 及其子类 根据action起始时间，计算动作开始或者结束

//以下为AnimationSprite 实现原型，本身是一个完整的sprite
WGE.AnimationSprite = WGE.Class(WGE.Sprite*, WGE.AnimationInterface2d,
{
	initialize : function(startTime, endTime, img, w, h)
	{
		this.setAttrib(startTime, endTime);
		this.timeActions = [];
		if(img)
		{
			this.initSprite(img, w, h);
		}
	}
});
*/

//时间轴
WGE.TimeLine = WGE.Class(
{
	currentTime : 0.0,
	totalTime : 0.0,
	timeObjects : undefined,
	isStarted : false,
	//动画开始后等待绘制的所有timeObjects(已经结束绘制的将被剔除队列)
	ObjectsWait2Render : undefined,
	//每一帧要绘制的timeObjects，将按z值排序，并筛选掉不需要绘制的节点。
	Objects2Render : undefined, 

	initialize : function(totalTime)
	{
		this.totalTime = parseFloat(totalTime);
		this.timeObjects = [];
	},

	push : function()
	{
		this.timeObjects.push.apply(this.timeObjects, arguments);
		
		if(this.isStarted)
		{
			this.timeObjects.sort(function(a, b){
				return a.startTime - b.startTime;
			});
		}
	},

	pushArr : function(attribArr)
	{
		this.timeObjects.push.apply(this.timeObjects, attribArr);

		if(this.isStarted)
		{
			this.timeObjects.sort(function(a, b){
				return a.startTime - b.startTime;
			});
		}
	},

	clear : function()
	{
		this.timeObjects = [];
	},

	//startTime可不填，默认为0
	start : function(startTime)
	{
		this.isStarted = true;
		this.currentTime = parseFloat(startTime ? startTime : 0);

		this.timeObjects.sort(function(a, b){
			return a.startTime - b.startTime;
		});

		this.ObjectsWait2Render = WGE.clone(this.timeObjects);

		for(var i = 0; i != this.ObjectsWait2Render.length; ++i)
		{
			this.ObjectsWait2Render[i].timeStart();
		}
		this.Objects2Render = this.ObjectsWait2Render;
	},

	//将整个画面设置为结束状态
	end : function()
	{
		this.isStarted = false;
	},

	//根据时间变化更新，请保证 time > 0。
	//update之前请先调用start函数确保画面初始化。
	update : function(deltaTime)
	{
		if(!this.isStarted)
			return false;
		this.Objects2Render = [];
		this.currentTime += deltaTime;
		if(this.currentTime > this.totalTime)
			return false;
		
		var time = this.currentTime;
		var running = false;
		var len = this.ObjectsWait2Render.length;
		var hasDelete = false;

		for(var i = 0; i != len; ++i)
		{
			var anim = this.ObjectsWait2Render[i];
			if(!anim) continue;

			running = true;
						
			if(time >= anim.endTime)
			{
				anim.timeUp();
				//并不是所有的动作都需要渲染
				if(anim.render)
					this.Objects2Render.push(anim);
				delete this.ObjectsWait2Render[i];
				hasDelete = true;
			}
			else if(time > anim.startTime)
			{
				anim.run(time);
				this.Objects2Render.push(anim);
			}
			else break; //所有事件已经通过起始时间排序，若中间某一个事件起始时间未达到，则后面的均未达到。
		}

		if(hasDelete)
		{
			var newArr = [];
			var arr = this.ObjectsWait2Render;
			for(var i = 0; i != len; ++i)
			{
				if(arr[i])
					newArr.push(arr[i]);
			}
			this.ObjectsWait2Render = newArr;
		}

		return running;
	},

	//进度跳转， 要对整个时间轴进行插值计算，可能速度较慢
	updateTo : function(currentTime)
	{

	},

	render : function(ctx)
	{
		this.Objects2Render.sort(function(a, b){return a.zIndex - b.zIndex;});
		for(var i = 0; i != this.Objects2Render.length; ++i)
		{
			var anim = this.Objects2Render[i];
			anim.render(ctx);
		}
	},

	getProgressRate : function()
	{
		return this.currentTime / this.totalTime;
	},

	getCurrentTime : function()
	{
		return this.currentTime;
	}

});

//../wgeGUI.js
"use strict";
/*
 * wgeGUI.js
 *
 *  Created on: 2014-6-23
 *      Author: Wang Yang
 *        blog: http://blog.wysaid.org
 */

/*
	简介： 提供简单的界面接口.
*/

WGE.GUIInterface = WGE.Class(
{
	boundingWidth : undefined,
	boundingHeight : undefined,
	canvas : undefined,	
	father : undefined,
	fatherWidthName : ['width', 'clientWidth', 'offsetWidth'],
	fatherHeightName : ['height', 'clientHeight', 'offsetHeight'],
	resizeEvent : null, //Event由子类或者用户设置
	mouseMoveEvent : null, 
	mouseDownEvent : null,
	mouseUpEvent : null,
	mouseClickEvent : null,
	mouseDBLClickEvent : null,
	mouseOverEvent : null,
	mouseOutEvent : null,
	wheelEvent : null,
	keyDownEvent : null,
	keyUpEvent : null,
	keypressEvent : null,

	_animationRequest : null,
	startTime : 0,
	lastTime : 0,
	nowTime : 0,

	_forceAutoResize : false, //强制resize，设置标记后将在每一帧检测是否需要resize

	 //将在gui 重新绑定father或者release时解除对于原有father的绑定。
	_events : null,

	initialize : function(fatherObj)
	{
		this.setupEvents();
		this.bindFather(fatherObj);
	},

	setupEvents : function()
	{
		//Mark : onresize 添加至此无效。
		this._events = {
			'mousemove' : this.onmousemove.bind(this),
			'click' : this.onclick.bind(this),
			'mousedown' : this.onmousedown.bind(this),
			'mouseup' : this.onmouseup.bind(this),
			'dblclick' : this.ondblclick.bind(this),
			'mouseover' : this.onmouseover.bind(this),
			'mouseout' : this.onmouseout.bind(this),
			'keydown' : this.onkeydown.bind(this),
			'keypress' : this.onkeypress.bind(this),
			'keyup' : this.onkeyup.bind(this),
			//wheel 方法在firefox中不受支持。
			'wheel' : this.onwheel.bind(this),
		};
		
		if(document.body.onwheel === undefined)
        {
        	this._events['mousewheel'] = this._events['wheel'];
        	this._events['wheel'] = undefined;
        }
	},

	release : function()
	{
		this.canvas = undefined;
		if(this.father && this.father.removeEventListener)
		{
			for(var i in _events)
			{
				this.father.removeEventListener(i, _events[i]);
			}
		}
		this.father = undefined;
	},

	//设置在运行过程中，强制对界面长宽进行检测和刷新。
	//如果您已经手动将onresize 事件添加到 body的onresize属性中，则没必要启用。
	forceAutoResize : function(flag)
	{
		this._forceAutoResize = flag;
	},

	isStarted : function()
	{
		return !!this._animationRequest;
	},

	start : function()
	{
		if(this._animationRequest)
		{
			console.warn("wgeGUI is already started!");
			return;
		}
//		this.onresize();
		this.startTime = Date.now();
		this.lastTime = this.startTime;
		this._animationRequest = requestAnimationFrame(this._run.bind(this));
	},

	stop : function()
	{
		if(this._animationRequest)
		{
			cancelAnimationFrame(this._animationRequest);
			this._animationRequest = null;
		}
	},

	_run : function()
	{
		if(this._forceAutoResize)
		{
			this.onresize();
		}

		this.nowTime = Date.now();
		var deltaTime = this.nowTime - this.lastTime;

		this.update(deltaTime);
		this.render(deltaTime);

		this.lastTime = this.nowTime;

		//如果在_run函数执行期间调用过stop，则不再继续请求frame.
		if(this._animationRequest)
			this._animationRequest = requestAnimationFrame(this._run.bind(this));
	},

	//update和render 由用户自定义，
	//类型为函数，包含一个参数表示两次调用之间的间隔时间(ms)
	update : function(deltaTime)
	{

	},

	render : function(deltaTime)
	{

	},

	//由于canvas元素不支持部分事件(如根据stype属性的百分比宽高设置实际像素宽高)，
	//需要将它绑定到一个支持此类事件的DOM上，如body, div等
	//画面将占满整个father元素，且根据father元素自适应
	bindFather : function(fatherObj, width, height)
	{
		if(typeof fatherObj != 'object')
		{
			return false;
		}

		this.release();

		if(width && height)
		{
			this.boundingWidth = width;
			this.boundingHeight = height;
		}

		this.canvas = WGE.CE('canvas');
		fatherObj.appendChild(this.canvas);
		this.father = fatherObj;

        for(var eventName in this._events)
        {
        	fatherObj.addEventListener(eventName, this._events[eventName]);
        }

		var widthName = null, heightName = null;

		for(var i in this.fatherWidthName)
		{
			if(typeof fatherObj[this.fatherWidthName[i]] == 'number')
			{
				widthName = this.fatherWidthName[i];
				break;
			}
		}

		this.fatherWidthName = widthName;

		for(var i in this.fatherHeightName)
		{
			if(typeof fatherObj[this.fatherHeightName[i]] == 'number')
			{
				heightName = this.fatherHeightName[i];
				break;
			}
		}

		this.fatherHeightName = heightName;

		this.onresize();
		return true;
	},

	//经过测试，发现大部分元素不支持onresize, 建议手动添加至body中。
	onresize : function(e)
	{
		var cvs = this.canvas, father = this.father;

		var width = this.boundingWidth || father[this.fatherWidthName];
		var height = this.boundingHeight || father[this.fatherHeightName];

		//当 forceAutoResize 启用时，可以有效减少事件调用。		
		if(cvs.width != width || cvs.height != height) 
		{
			cvs.width = width;
			cvs.height = height;
			if(typeof this.resizeEvent == 'function')
				this.resizeEvent(e);
		}
	},

	onmousemove : function(e)
	{
		if(this.mouseMoveEvent)
		{
			this.mouseMoveEvent(e, e.offsetX || e.layerX, e.offsetY || e.layerY);
		}
	},

	onclick : function(e)
	{
		if(this.mouseClickEvent)
		{
			this.mouseClickEvent(e, e.offsetX || e.layerX, e.offsetY || e.layerY);
		}
	},

	onmousedown : function(e)
	{
		if(this.mouseDownEvent)
		{
			this.mouseDownEvent(e, e.offsetX || e.layerX, e.offsetY || e.layerY);
		}
	},

	onmouseup : function(e)
	{
		if(this.mouseUpEvent)
		{
			this.mouseUpEvent(e, e.offsetX || e.layerX, e.offsetY || e.layerY);
		}
	},

	ondblclick : function(e)
	{
		if(this.mouseDBLClickEvent)
		{
			this.mouseDBLClickEvent(e, e.offsetX || e.layerX, e.offsetY || e.layerY);
		}
	},

	onmouseover : function(e)
	{
		if(this.mouseOverEvent)
		{
			this.mouseOverEvent(e, e.offsetX || e.layerX, e.offsetY || e.layerY);
		}
	},

	onmouseout : function(e)
	{
		if(this.mouseOutEvent)
		{
			this.mouseOutEvent(e, e.offsetX || e.layerX, e.offsetY || e.layerY);
		}
	},

	onwheel : function(e)
	{
		if(this.wheelEvent)
		    this.wheelEvent(e, e.deltaY || e.wheelDelta);
	},

	//注: 如果div元素无法响应key事件，则很可能是因为div无法获得焦点，请设置tabindex
	onkeydown : function()
	{
		if(this.keyDownEvent)
			this.keyDownEvent.apply(this, arguments);
	},

	onkeypress : function()
	{
		if(this.keypressEvent)
			this.keypressEvent.apply(this, arguments);
	},

	onkeyup : function()
	{
		if(this.keyUpEvent)
			this.keyUpEvent.apply(this, arguments);
	}

});

/*

##使用方式

例:

//此GUI将占满整个屏幕，并随机在屏幕中绘制小红点
//如果鼠标按下的话，小红点将绘制到鼠标点击的位置。

var myGUI = WGE.Class(WGE.GUIInterface, 
{
	context : undefined,
	x : 0,
	y : 0,
	isMouseDown : false,

	bindFather : function(fatherObj)
	{
		if(WGE.GUIInterface.bindFather.call(this, fatherObj));
		{
			this.context = this.canvas.getContext('2d');
			return !!this.context;
		}
		return false;
	},

	update : function()
	{
		if(!this.isMouseDown)
		{
			this.x = Math.random() * this.canvas.width;
			this.y = Math.random() * this.canvas.height;
		}
	},

	render : function()
	{
		var ctx = this.context;
		var cvs = this.canvas;
		ctx.clearRect(0, 0, cvs.width, cvs.height);
		this.context.fillStyle = "#f00";
		ctx.fillRect(this.x, this.y, 100, 100);
		ctx.fillText("click me!", 10, 10);
	},

	mouseDownEvent : function(e)
	{
		this.isMouseDown = true;
		this.x = e.x || e.offsetX;
		this.y = e.y || e.offsetY;
	},

	mouseUpEvent : function(e)
	{
		this.isMouseDown = false;
	},

	mouseMoveEvent : function(e)
	{
		if(this.isMouseDown)
		{
			this.x = e.offsetX || e.layerX;
			this.y = e.offsetY || e.layerY;
		}
	}
});

//// 调用代码如下：

var gui = new myGUI(document.body);

//下面两句都是使整个ui大小跟随父元素变化，推荐前者。嫌麻烦或者跟已有代码有冲突（比如body的onresize有别的代码会随时更改）写成后者也没关系。
document.body.setAttribute("onresize", "gui.onresize(event);"); //较好
//gui.forceAutoResize(true); //这一句和上一句功能类似，这种方法可保证正确性

gui.start();

//// 怎么样，简单吧？！

*/

//../wgeParticleSystem.js


//../wgeFont.js


//../2d/wgeSprite.js
"use strict";
/*
* wgeSprite.js for context-2d
*
*  Created on: 2014-7-25
*      Author: Wang Yang
*        Blog: http://blog.wysaid.org
*/

//LogicSprite 本身不包含绘制方法，但是可为其child结点提供相对位置
WGE.LogicSprite = WGE.Class(WGE.SpriteInterface2d,
{
	pos : undefined,
	hotspot : undefined,
	size : undefined,
	scaling : undefined, // 缩放
	rotation : 0, // 旋转(弧度)
	alpha : 1, //透明度
	blendMode : undefined, //混合模式
	zIndex : 0, // 由于canvas本身并不支持z值，所以这里的zIndex仅用作排序依据。

	initialize : function()
	{
		this.pos = new WGE.Vec2(0, 0);
		this.hotspot = new WGE.Vec2(0, 0);
		this.size = new WGE.Vec2(0, 0);
		this.scaling = new WGE.Vec2(1, 1);
	},

	setHotspot : function(hx, hy)
	{
		this.hotspot.data[0] = this.size.data[0] * (0.5 - hx/2);
		this.hotspot.data[1] = this.size.data[1] * (0.5 - hy/2);
	},

	setHotspot2Center : function()
	{
		this.hotspot.data[0] = this.size.data[0] / 2.0;
		this.hotspot.data[1] = this.size.data[1] / 2.0;
	},

	setHotspotWithRatio : function(rx, ry)
	{
		this.hotspot.data[0] = this.size.data[0] * rx;
		this.hotspot.data[1] = this.size.data[1] * ry;
	},

	//相对于本sprite纹理坐标
	setHotspotWithPixel : function(px, py)
	{
		this.hotspot.data[0] = hx;
		this.hotspot.data[1] = hy;
	},

	move : function(dx, dy)
	{
		this.pos.data[0] += dx;
		this.pos.data[1] += dy;
	},

	moveTo : function(x, y)
	{
		this.pos.data[0] = x;
		this.pos.data[1] = y;
	},

	moveWithRatio : function(rdx, rdy)
	{
		this.pos.data[0] += rdx * this.size.data[0];
		this.pos.data[1] += rdy * this.size.data[1];
	},

	moveToWithRatio : function(rx, ry)
	{
		this.pos.data[0] = rx * this.size.data[0];
		this.pos.data[1] = ry * this.size.data[1];
	},

	scale : function(sx, sy)
	{
		this.scaling.data[0] *= sx;
		this.scaling.data[1] *= sy;
	},

	scaleTo : function(sx, sy)
	{
		this.scaling.data[0] = sx;
		this.scaling.data[1] = sy;
	},

	rotate : function(dRot)
	{
		this.rotation += dRot;
	},

	rotateTo : function(rot)
	{
		this.rotation = rot;
	},

	//将sprite渲染到指定的context
	render : function(ctx)
	{
		ctx.save();
		ctx.translate(this.pos.data[0], this.pos.data[1]);
		if(this.rotation)
			ctx.rotate(this.rotation);

		ctx.scale(this.scaling.data[0], this.scaling.data[1]);

		ctx.globalAlpha *= this.alpha;		
		if(this.blendMode)
			ctx.globalCompositeOperation = this.blendMode;

		for(var i in this.childSprites)
		{
			this.childSprites[i].render(ctx);
		}
		ctx.restore();
	},

	renderTo : function(ctx, pos, rot, scaling, alpha, blendmode)
	{		
		ctx.save();
		ctx.translate(pos.data[0], pos.data[1]);
		if(rot)
			ctx.rotate(rot);
		if(scaling)
			ctx.scale(scaling.data[0], scaling.data[1]);
		if(alpha)
			ctx.globalAlpha = alpha;
		if(blendmode)
			ctx.globalCompositeOperation = blendmode;

		for(var i in this.childSprites)
		{
			this.childSprites[i].render(ctx);
		}
		ctx.restore();
	}


});

//
// 下方提供渲染速度较快的 SpriteExt, 但是旋转操作需要进行矩阵运算，较慢。
// 请考虑场景综合选择。
//
WGE.Sprite = WGE.Class(WGE.LogicSprite,
{
	img : null,  // Sprite自身图像。

	initialize : function(img, w, h)
	{
		this.pos = new WGE.Vec2(0, 0);
		this.hotspot = new WGE.Vec2(0, 0);
		this.size = new WGE.Vec2(0, 0);
		this.scaling = new WGE.Vec2(1, 1);
		this.initSprite(img, w, h);
	},

	// 当 img直接使用image或者canvas对象时，
	// 将w设置为负值 可使Sprite仅引用此对象，减少内存占用。
	initSprite : function(img, w, h)
	{
		if(!img)
			return false;

		if(typeof img == 'string')
		{
			img = WGE.ID(img);
		}
		else if(w < 0 && typeof img == 'object')
		{
			this.img = img;
			this.size.data[0] = img.width;
			this.size.data[1] = img.height;
			return;
		}

		this.img = WGE.CE('canvas');
		if(img)
		{
			if(w && h)
			{
				this.size.data[0] = w;
				this.size.data[1] = h;
				this.img.width = w;
				this.img.height = h;
			}
			else
			{
				this.size.data[0] = img.width;
				this.size.data[1] = img.height;
				this.img.width = img.width;
				this.img.height = img.height;
			}

			var ctx = this.img.getContext('2d');
			ctx.drawImage(img, 0, 0, this.img.width, this.img.height, 0, 0, img.width, img.height);
		}
	},

	//将sprite渲染到指定的context
	render : function(ctx)
	{
		ctx.save();
		ctx.translate(this.pos.data[0], this.pos.data[1]);
		if(this.rotation)
			ctx.rotate(this.rotation);

		ctx.scale(this.scaling.data[0], this.scaling.data[1]);

		ctx.globalAlpha *= this.alpha;		
		if(this.blendMode)
			ctx.globalCompositeOperation = this.blendMode;

		ctx.drawImage(this.img, -this.hotspot.data[0], -this.hotspot.data[1]);

		for(var i in this.childSprites)
		{
			this.childSprites[i].render(ctx);
		}
		ctx.restore();
	},

	renderTo : function(ctx, pos, rot, scaling, alpha, blendmode)
	{		
		ctx.save();
		ctx.translate(pos.data[0], pos.data[1]);
		if(rot)
			ctx.rotate(rot);

		if(scaling)
			ctx.scale(scaling.data[0], scaling.data[1]);
		if(alpha)
			ctx.globalAlpha = alpha;
		if(blendmode)
			ctx.globalCompositeOperation = blendmode;
		ctx.drawImage(this.img, -this.hotspot.data[0], pos.data[1] -this.hotspot.data[1]);

		for(var i in this.childSprites)
		{
			this.childSprites[i].render(ctx);
		}
		ctx.restore();
	}
});


//使用矩阵操作完成旋转平移缩放等。
//WGE.SpriteExt 具有较快的渲染速度，但是如果频繁旋转的话，效率不高。
//建议需要旋转，但并非每一帧都需要旋转的情况下使用。
WGE.SpriteExt = WGE.Class(WGE.Sprite,
{
	rot : null, //2x2矩阵
	rotation : 0, //特别注意, rotation 仅对旋转作一个记录，本身不影响旋转值！

	initialize : function(img, w, h)
	{
		WGE.Sprite.apply(this, arguments);
		this.rot = new WGE.mat2Identity();
	},

	//将旋转平移缩放和到一次 transform 操作，渲染速度较快。
	render : function(ctx)
	{
		ctx.save();
		var m = this.rot.data;
		ctx.transform(m[0] * this.scaling.data[0], m[1], m[2] * this.scaling.data[1], m[3], this.pos.data[0], this.pos.data[1]);
		ctx.globalAlpha *= this.alpha;		
		if(this.blendMode)
			ctx.globalCompositeOperation = this.blendMode;

		ctx.drawImage(this.img, -this.hotspot.data[0], -this.hotspot.data[1]);

		for(var i in this.childSprites)
		{
			this.childSprites[i].render(ctx);
		}
		ctx.restore();
	},

	rotate : function(dRot)
	{
		this.rot.rotate(dRot);
		this.rotation += dRot;
	},

	rotateTo : function(rot)
	{
		this.rot = WGE.mat2Rotation(rot);
		this.rotation = rot;
	}

});


//延后实现，使用2d canvas模拟3d
//主要运用矩阵运算计算出渲染点坐标，配合canvas自带的 transform 转换
WGE.SpriteExt3d = WGE.Class(WGE.Sprite,
{

});


//////////////////////////////////////////
//
// 简介 :  video sprite 实现类似于gif或者video标签的播放方式。
//
//////////////////////////////////////////

WGE.VideoSpriteInterface = WGE.Class(WGE.LogicSprite,
{
	// _resource : null,  // Sprite自身图像。

	// initialize : function(img, w, h)
	// {
	// 	this.pos = new WGE.Vec2(0, 0);
	// 	this.hotspot = new WGE.Vec2(0, 0);
	// 	this.size = new WGE.Vec2(0, 0);
	// 	this.scaling = new WGE.Vec2(1, 1);
	// }


});

WGE.GifSprite = WGE.Class(WGE.VideoSpriteInterface,
{
	_imgArr : null,
	playIndex : 0,

	//w和h 必须指定！
	initialize : function(imgArr, w, h, noShare)
	{
		this.pos = new WGE.Vec2(0, 0);
		this.hotspot = new WGE.Vec2(0, 0);
		this.size = new WGE.Vec2(0, 0);
		this.scaling = new WGE.Vec2(1, 1);
		if(imgArr)
			this.initSprite(imgArr, w, h, noShare);
	},

	initSprite : function(imgArr, w, h, noShare)
	{
		this.size = new WGE.Vec2(parseInt(w), parseInt(h));
		if(noShare)
		{
			this._imgArr = [];
			for(var i in imgArr)
			{
				var img = imgArr[i];
				var cvs = WGE.CE('canvas');
				cvs.width = img.width;
				cvs.height = img.height;
				cvs.getContext('2d').drawImage(img, 0, 0);
				this._imgArr.push(cvs);
			}
		}
		else
		{
			this._imgArr = imgArr;
		}
	},

	switchImage : function()
	{
		++this.playIndex;
		this.playIndex %= this._imgArr.length;
	},

	//将sprite渲染到指定的context
	render : function(ctx)
	{
		var img = this._imgArr[this.playIndex];
		ctx.save();
		ctx.translate(this.pos.data[0], this.pos.data[1]);
		if(this.rotation)
			ctx.rotate(this.rotation);

		ctx.scale(this.scaling.data[0], this.scaling.data[1]);

		ctx.globalAlpha *= this.alpha;		
		if(this.blendMode)
			ctx.globalCompositeOperation = this.blendMode;

		ctx.drawImage(img, -this.hotspot.data[0], -this.hotspot.data[1]);

		for(var i in this.childSprites)
		{
			this.childSprites[i].render(ctx);
		}
		ctx.restore();
	},

	renderTo : function(ctx, pos, rot, scaling, alpha, blendmode)
	{
		var img = this._imgArr[this.playIndex];
		ctx.save();
		ctx.translate(pos.data[0], pos.data[1]);
		if(rot)
			ctx.rotate(rot);

		if(scaling)
			ctx.scale(scaling.data[0], scaling.data[1]);
		if(alpha)
			ctx.globalAlpha = alpha;
		if(blendmode)
			ctx.globalCompositeOperation = blendmode;
		ctx.drawImage(img, -this.hotspot.data[0], -this.hotspot.data[1]);

		for(var i in this.childSprites)
		{
			this.childSprites[i].render(ctx);
		}
		ctx.restore();
	}

});

WGE.VideoSprite = WGE.Class(WGE.VideoSpriteInterface,
{
	_video : null,

	initialize : function(video, w, h)
	{
		this.pos = new WGE.Vec2(0, 0);
		this.hotspot = new WGE.Vec2(0, 0);
		this.size = new WGE.Vec2(0, 0);
		this.scaling = new WGE.Vec2(1, 1);
		if(video)
			this.initSprite(video, w, h);
	},

	initSprite : function(video, w, h)
	{
		this.size = new WGE.Vec2(parseInt(w), parseInt(h));
		if(typeof video == "string")
		{
			var v = WGE.CE('video');
			var self = this;
			v.onload = function() {
				self._video = this;
			};
			v.onerror = function() {
				console.log("load video faild : ", video);
			}
			v.src = video;
		}
		else
		{
			this._video = video;
		}
	},

	playVideo : function()
	{
		this._video.play();
	},

	pauseVideo : function()
	{
		this._video.pause();
	},

	loopVideo : function(shouldLoop)
	{
		this._video.loop = shouldLoop;
	},

	//将sprite渲染到指定的context
	render : function(ctx)
	{
		if(!this._video)
			return ;
		ctx.save();
		ctx.translate(this.pos.data[0], this.pos.data[1]);
		if(this.rotation)
			ctx.rotate(this.rotation);

		ctx.scale(this.scaling.data[0], this.scaling.data[1]);

		ctx.globalAlpha *= this.alpha;		
		if(this.blendMode)
			ctx.globalCompositeOperation = this.blendMode;

		ctx.drawImage(this._video, -this.hotspot.data[0], -this.hotspot.data[1], this.size.data[0], this.size.data[1]);

		for(var i in this.childSprites)
		{
			this.childSprites[i].render(ctx);
		}
		ctx.restore();
	},

	renderTo : function(ctx, pos, rot, scaling, alpha, blendmode)
	{
		if(!this._video)
			return;
		ctx.save();
		ctx.translate(pos.data[0], pos.data[1]);
		if(rot)
			ctx.rotate(rot);

		if(scaling)
			ctx.scale(scaling.data[0], scaling.data[1]);
		if(alpha)
			ctx.globalAlpha = alpha;
		if(blendmode)
			ctx.globalCompositeOperation = blendmode;
		ctx.drawImage(this._video, -this.hotspot.data[0], -this.hotspot.data[1]);

		for(var i in this.childSprites)
		{
			this.childSprites[i].render(ctx);
		}
		ctx.restore();
	}

});

//../2d/wgeFilters.js
"use strict";
/*
* wgeFilters.js for context-2d
*
*  Created on: 2014-8-2
*      Author: Wang Yang
*        Blog: http://blog.wysaid.org
*        Mail: admin@wysaid.org
*/

/*
	简介： 提供在context-2d环境下的简单CPU滤镜
*/

WGE.FilterInterface = WGE.Class(
{
	canvasObject : undefined,
	imageData : undefined,

	//img 必须是image对象或者canvas对象
	initialize : function(img)
	{
		this.bind(img);
	},

	bind : function(img, x, y, w, h)
	{
		if(!img)
			return null;

		if(!(x && y && w && h))
		{
			x = y = 0;
			w = img.width;
			h = img.height;
		}

		if(img.getContext)
		{
			this.canvasObject = img;
			this.imageData = img.getContext("2d").getImageData(x, y, w, h);
		}
		else
		{
			this.canvasObject = WGE.CE('canvas');
			this.canvasObject.width = w;
			this.canvasObject.height = h;
			var ctx = this.canvasObject.getContext('2d');
			ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
			this.imageData = ctx.getImageData(0, 0, w, h);
		}
		return this;
	},

	//noCopy sets "the src and dst are the same canvas".
	run : function(args, noCopy)
	{
		var dst = null;
		if(this.canvasObject && this.imageData)
		{
			//当启用noCopy的时候，可以连续对同一个canvas执行一系列滤镜。
			if(noCopy)
			{
				this._run(this.imageData.data, this.imageData.data, this.canvasObject.width, this.canvasObject.height, args)
				this.canvasObject.getContext("2d").putImageData(this.imageData, 0, 0);
			}
			else
			{
				dst = WGE.CE('canvas');
				dst.width = this.canvasObject.width;
				dst.height = this.canvasObject.height;
				var ctx = dst.getContext('2d');
				var dstImageData = ctx.getImageData(0, 0, dst.width, dst.height);
				this._run(dstImageData.data, this.imageData.data, dst.width, dst.height, args);
				ctx.putImageData(dstImageData, 0, 0);
			}
		}

		if(noCopy)
			return this.canvasObject;
		return dst;
	},

	_run : function(dst, src, w, h)
	{
		//Do nothing.
	}

});

WGE.Filter = {};

WGE.Filter.Monochrome = WGE.Class(WGE.FilterInterface,
{
	_run : function(dst, src, w, h)
	{
		var len = w * h * 4;
		for(var i = 0; i < len; i += 4)
		{
			var gray = (src[i] * 4899 + src[i + 1] * 9617 + src[i + 2] * 1868 + 8192) >> 14;
			dst[i] = dst[i + 1] = dst[i + 2] = gray;
			dst[i + 3] = src[i + 3];
		}
	}
});

WGE.Filter.Edge = WGE.Class(WGE.FilterInterface,
{
	_run : function(dst, src, w, h)
	{

		var func = function(v)
		{
			return Math.max(Math.min(v * 2.0, 255), 0);
		}

		var lw = w - 2, lh = h - 2;
		for(var i = 0; i < lh; ++i)
		{
			var line = i * w * 4;
			for(var j = 0; j < lw; ++j)
			{
				var index1 = line + j * 4;
				var index2 = index1 + w * 8 + 8;
				dst[index1] = func(src[index1] - src[index2]);
				dst[index1 + 1] = func(src[index1 + 1] - src[index2 + 1]);
				dst[index1 + 2] = func(src[index1 + 2] - src[index2 + 2]);
				dst[index1 + 3] = src[index1 + 3];
			}
		}
	}
});

WGE.Filter.StackBlur = WGE.Class(WGE.FilterInterface,
{
	run : function(args, noCopy)
	{
		var dst = null;
		if(this.canvasObject && this.imageData)
		{
			//当启用noCopy的时候，可以连续对同一个canvas执行一系列滤镜。
			if(noCopy)
			{
				this._run(this.imageData.data, this.canvasObject.width, this.canvasObject.height, args)
				this.canvasObject.getContext("2d").putImageData(this.imageData, 0, 0);
			}
			else
			{
				dst = WGE.CE('canvas');
				dst.width = this.canvasObject.width;
				dst.height = this.canvasObject.height;
				var ctx = dst.getContext('2d');
				this._run(this.imageData.data, dst.width, dst.height, args);
				ctx.putImageData(this.imageData, 0, 0);
			}
		}

		if(noCopy)
			return this.canvasObject;
		return dst;
	},

	_run : function(pixels, width, height, args)
	{
		var top_x = 0, top_y = 0;
		var radius = args[0];

		if ( isNaN(radius) || radius < 1 ) return;
		radius |= 0;

		var x, y, i, p, yp, yi, yw, r_sum, g_sum, b_sum,
		r_out_sum, g_out_sum, b_out_sum,
		r_in_sum, g_in_sum, b_in_sum,
		pr, pg, pb, rbs;

		var div = radius + radius + 1;
		var w4 = width << 2;
		var widthMinus1  = width - 1;
		var heightMinus1 = height - 1;
		var radiusPlus1  = radius + 1;
		var sumFactor = radiusPlus1 * ( radiusPlus1 + 1 ) / 2;

		var stackStart = new WGE.Filter.StackBlur.BlurStack();
		var stack = stackStart;
		var stackEnd;
		for ( i = 1; i < div; i++ )
		{
			stack = stack.next = new WGE.Filter.StackBlur.BlurStack();
			if ( i == radiusPlus1 ) stackEnd = stack;
		}
		stack.next = stackStart;
		var stackIn = null;
		var stackOut = null;

		yw = yi = 0;

		var mul_sum = WGE.Filter.StackBlur.mul_table[radius];
		var shg_sum = WGE.Filter.StackBlur.shg_table[radius];

		for ( y = 0; y < height; y++ )
		{
			r_in_sum = g_in_sum = b_in_sum = r_sum = g_sum = b_sum = 0;

			r_out_sum = radiusPlus1 * ( pr = pixels[yi] );
			g_out_sum = radiusPlus1 * ( pg = pixels[yi+1] );
			b_out_sum = radiusPlus1 * ( pb = pixels[yi+2] );

			r_sum += sumFactor * pr;
			g_sum += sumFactor * pg;
			b_sum += sumFactor * pb;

			stack = stackStart;

			for( i = 0; i < radiusPlus1; i++ )
			{
				stack.r = pr;
				stack.g = pg;
				stack.b = pb;
				stack = stack.next;
			}

			for( i = 1; i < radiusPlus1; i++ )
			{
				p = yi + (( widthMinus1 < i ? widthMinus1 : i ) << 2 );
				r_sum += ( stack.r = ( pr = pixels[p])) * ( rbs = radiusPlus1 - i );
				g_sum += ( stack.g = ( pg = pixels[p+1])) * rbs;
				b_sum += ( stack.b = ( pb = pixels[p+2])) * rbs;

				r_in_sum += pr;
				g_in_sum += pg;
				b_in_sum += pb;

				stack = stack.next;
			}


			stackIn = stackStart;
			stackOut = stackEnd;
			for ( x = 0; x < width; x++ )
			{
				pixels[yi]   = (r_sum * mul_sum) >> shg_sum;
				pixels[yi+1] = (g_sum * mul_sum) >> shg_sum;
				pixels[yi+2] = (b_sum * mul_sum) >> shg_sum;

				r_sum -= r_out_sum;
				g_sum -= g_out_sum;
				b_sum -= b_out_sum;

				r_out_sum -= stackIn.r;
				g_out_sum -= stackIn.g;
				b_out_sum -= stackIn.b;

				p =  ( yw + ( ( p = x + radius + 1 ) < widthMinus1 ? p : widthMinus1 ) ) << 2;

				r_in_sum += ( stackIn.r = pixels[p]);
				g_in_sum += ( stackIn.g = pixels[p+1]);
				b_in_sum += ( stackIn.b = pixels[p+2]);

				r_sum += r_in_sum;
				g_sum += g_in_sum;
				b_sum += b_in_sum;

				stackIn = stackIn.next;

				r_out_sum += ( pr = stackOut.r );
				g_out_sum += ( pg = stackOut.g );
				b_out_sum += ( pb = stackOut.b );

				r_in_sum -= pr;
				g_in_sum -= pg;
				b_in_sum -= pb;

				stackOut = stackOut.next;

				yi += 4;
			}
			yw += width;
		}


		for ( x = 0; x < width; x++ )
		{
			g_in_sum = b_in_sum = r_in_sum = g_sum = b_sum = r_sum = 0;

			yi = x << 2;
			r_out_sum = radiusPlus1 * ( pr = pixels[yi]);
			g_out_sum = radiusPlus1 * ( pg = pixels[yi+1]);
			b_out_sum = radiusPlus1 * ( pb = pixels[yi+2]);

			r_sum += sumFactor * pr;
			g_sum += sumFactor * pg;
			b_sum += sumFactor * pb;

			stack = stackStart;

			for( i = 0; i < radiusPlus1; i++ )
			{
				stack.r = pr;
				stack.g = pg;
				stack.b = pb;
				stack = stack.next;
			}

			yp = width;

			for( i = 1; i <= radius; i++ )
			{
				yi = ( yp + x ) << 2;

				r_sum += ( stack.r = ( pr = pixels[yi])) * ( rbs = radiusPlus1 - i );
				g_sum += ( stack.g = ( pg = pixels[yi+1])) * rbs;
				b_sum += ( stack.b = ( pb = pixels[yi+2])) * rbs;

				r_in_sum += pr;
				g_in_sum += pg;
				b_in_sum += pb;

				stack = stack.next;

				if( i < heightMinus1 )
				{
					yp += width;
				}
			}

			yi = x;
			stackIn = stackStart;
			stackOut = stackEnd;
			for ( y = 0; y < height; y++ )
			{
				p = yi << 2;
				pixels[p]   = (r_sum * mul_sum) >> shg_sum;
				pixels[p+1] = (g_sum * mul_sum) >> shg_sum;
				pixels[p+2] = (b_sum * mul_sum) >> shg_sum;

				r_sum -= r_out_sum;
				g_sum -= g_out_sum;
				b_sum -= b_out_sum;

				r_out_sum -= stackIn.r;
				g_out_sum -= stackIn.g;
				b_out_sum -= stackIn.b;

				p = ( x + (( ( p = y + radiusPlus1) < heightMinus1 ? p : heightMinus1 ) * width )) << 2;

				r_sum += ( r_in_sum += ( stackIn.r = pixels[p]));
				g_sum += ( g_in_sum += ( stackIn.g = pixels[p+1]));
				b_sum += ( b_in_sum += ( stackIn.b = pixels[p+2]));

				stackIn = stackIn.next;

				r_out_sum += ( pr = stackOut.r );
				g_out_sum += ( pg = stackOut.g );
				b_out_sum += ( pb = stackOut.b );

				r_in_sum -= pr;
				g_in_sum -= pg;
				b_in_sum -= pb;

				stackOut = stackOut.next;

				yi += width;
			}
		}
	},

	stackBlurCanvasRGB : function(canvas, top_x, top_y, width, height, radius)
	{
		if ( isNaN(radius) || radius < 1 ) 
			radius = 10;
		radius |= 0;

		var context = canvas.getContext("2d");
		var imageData;

		try {
			try {
				imageData = context.getImageData( top_x, top_y, width, height );
			} catch(e) {

				try {
					netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");
					imageData = context.getImageData( top_x, top_y, width, height );
				} catch(e) {
					alert("Cannot access local image");
					throw new Error("unable to access local image data: " + e);
					return;
				}
			}
		} catch(e) {
			alert("Cannot access image");
			throw new Error("unable to access image data: " + e);
		}

		var pixels = imageData.data;

		var x, y, i, p, yp, yi, yw, r_sum, g_sum, b_sum,
		r_out_sum, g_out_sum, b_out_sum,
		r_in_sum, g_in_sum, b_in_sum,
		pr, pg, pb, rbs;

		var div = radius + radius + 1;
		var w4 = width << 2;
		var widthMinus1  = width - 1;
		var heightMinus1 = height - 1;
		var radiusPlus1  = radius + 1;
		var sumFactor = radiusPlus1 * ( radiusPlus1 + 1 ) / 2;

		var stackStart = new WGE.Filter.StackBlur.BlurStack();
		var stack = stackStart;
		for ( i = 1; i < div; i++ )
		{
			stack = stack.next = new WGE.Filter.StackBlur.BlurStack();
			if ( i == radiusPlus1 ) var stackEnd = stack;
		}
		stack.next = stackStart;
		var stackIn = null;
		var stackOut = null;

		yw = yi = 0;

		var mul_sum = WGE.Filter.StackBlur.mul_table[radius];
		var shg_sum = WGE.Filter.StackBlur.shg_table[radius];

		for ( y = 0; y < height; y++ )
		{
			r_in_sum = g_in_sum = b_in_sum = r_sum = g_sum = b_sum = 0;

			r_out_sum = radiusPlus1 * ( pr = pixels[yi] );
			g_out_sum = radiusPlus1 * ( pg = pixels[yi+1] );
			b_out_sum = radiusPlus1 * ( pb = pixels[yi+2] );

			r_sum += sumFactor * pr;
			g_sum += sumFactor * pg;
			b_sum += sumFactor * pb;

			stack = stackStart;

			for( i = 0; i < radiusPlus1; i++ )
			{
				stack.r = pr;
				stack.g = pg;
				stack.b = pb;
				stack = stack.next;
			}

			for( i = 1; i < radiusPlus1; i++ )
			{
				p = yi + (( widthMinus1 < i ? widthMinus1 : i ) << 2 );
				r_sum += ( stack.r = ( pr = pixels[p])) * ( rbs = radiusPlus1 - i );
				g_sum += ( stack.g = ( pg = pixels[p+1])) * rbs;
				b_sum += ( stack.b = ( pb = pixels[p+2])) * rbs;

				r_in_sum += pr;
				g_in_sum += pg;
				b_in_sum += pb;

				stack = stack.next;
			}


			stackIn = stackStart;
			stackOut = stackEnd;
			for ( x = 0; x < width; x++ )
			{
				pixels[yi]   = (r_sum * mul_sum) >> shg_sum;
				pixels[yi+1] = (g_sum * mul_sum) >> shg_sum;
				pixels[yi+2] = (b_sum * mul_sum) >> shg_sum;

				r_sum -= r_out_sum;
				g_sum -= g_out_sum;
				b_sum -= b_out_sum;

				r_out_sum -= stackIn.r;
				g_out_sum -= stackIn.g;
				b_out_sum -= stackIn.b;

				p =  ( yw + ( ( p = x + radius + 1 ) < widthMinus1 ? p : widthMinus1 ) ) << 2;

				r_in_sum += ( stackIn.r = pixels[p]);
				g_in_sum += ( stackIn.g = pixels[p+1]);
				b_in_sum += ( stackIn.b = pixels[p+2]);

				r_sum += r_in_sum;
				g_sum += g_in_sum;
				b_sum += b_in_sum;

				stackIn = stackIn.next;

				r_out_sum += ( pr = stackOut.r );
				g_out_sum += ( pg = stackOut.g );
				b_out_sum += ( pb = stackOut.b );

				r_in_sum -= pr;
				g_in_sum -= pg;
				b_in_sum -= pb;

				stackOut = stackOut.next;

				yi += 4;
			}
			yw += width;
		}


		for ( x = 0; x < width; x++ )
		{
			g_in_sum = b_in_sum = r_in_sum = g_sum = b_sum = r_sum = 0;

			yi = x << 2;
			r_out_sum = radiusPlus1 * ( pr = pixels[yi]);
			g_out_sum = radiusPlus1 * ( pg = pixels[yi+1]);
			b_out_sum = radiusPlus1 * ( pb = pixels[yi+2]);

			r_sum += sumFactor * pr;
			g_sum += sumFactor * pg;
			b_sum += sumFactor * pb;

			stack = stackStart;

			for( i = 0; i < radiusPlus1; i++ )
			{
				stack.r = pr;
				stack.g = pg;
				stack.b = pb;
				stack = stack.next;
			}

			yp = width;

			for( i = 1; i <= radius; i++ )
			{
				yi = ( yp + x ) << 2;

				r_sum += ( stack.r = ( pr = pixels[yi])) * ( rbs = radiusPlus1 - i );
				g_sum += ( stack.g = ( pg = pixels[yi+1])) * rbs;
				b_sum += ( stack.b = ( pb = pixels[yi+2])) * rbs;

				r_in_sum += pr;
				g_in_sum += pg;
				b_in_sum += pb;

				stack = stack.next;

				if( i < heightMinus1 )
				{
					yp += width;
				}
			}

			yi = x;
			stackIn = stackStart;
			stackOut = stackEnd;
			for ( y = 0; y < height; y++ )
			{
				p = yi << 2;
				pixels[p]   = (r_sum * mul_sum) >> shg_sum;
				pixels[p+1] = (g_sum * mul_sum) >> shg_sum;
				pixels[p+2] = (b_sum * mul_sum) >> shg_sum;

				r_sum -= r_out_sum;
				g_sum -= g_out_sum;
				b_sum -= b_out_sum;

				r_out_sum -= stackIn.r;
				g_out_sum -= stackIn.g;
				b_out_sum -= stackIn.b;

				p = ( x + (( ( p = y + radiusPlus1) < heightMinus1 ? p : heightMinus1 ) * width )) << 2;

				r_sum += ( r_in_sum += ( stackIn.r = pixels[p]));
				g_sum += ( g_in_sum += ( stackIn.g = pixels[p+1]));
				b_sum += ( b_in_sum += ( stackIn.b = pixels[p+2]));

				stackIn = stackIn.next;

				r_out_sum += ( pr = stackOut.r );
				g_out_sum += ( pg = stackOut.g );
				b_out_sum += ( pb = stackOut.b );

				r_in_sum -= pr;
				g_in_sum -= pg;
				b_in_sum -= pb;

				stackOut = stackOut.next;

				yi += width;
			}
		}
		return imageData;	
	},

	stackBlurCanvasRGBA : function (canvas, top_x, top_y, width, height, radius)
	{
		if ( isNaN(radius) || radius < 1 ) return;
		radius |= 0;
		var context = canvas.getContext("2d");
		var imageData;

		try {
			try {
				imageData = context.getImageData( top_x, top_y, width, height );
			} catch(e) {


				try {
					netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");
					imageData = context.getImageData( top_x, top_y, width, height );
				} catch(e) {
					alert("Cannot access local image");
					throw new Error("unable to access local image data: " + e);
					return;
				}
			}
		} catch(e) {
			alert("Cannot access image");
			throw new Error("unable to access image data: " + e);
		}

		var pixels = imageData.data;

		var x, y, i, p, yp, yi, yw, r_sum, g_sum, b_sum, a_sum, 
		r_out_sum, g_out_sum, b_out_sum, a_out_sum,
		r_in_sum, g_in_sum, b_in_sum, a_in_sum, 
		pr, pg, pb, pa, rbs;

		var div = radius + radius + 1;
		var w4 = width << 2;
		var widthMinus1  = width - 1;
		var heightMinus1 = height - 1;
		var radiusPlus1  = radius + 1;
		var sumFactor = radiusPlus1 * ( radiusPlus1 + 1 ) / 2;

		var stackStart = new BlurStack();
		var stack = stackStart;
		for ( i = 1; i < div; i++ )
		{
			stack = stack.next = new BlurStack();
			if ( i == radiusPlus1 ) var stackEnd = stack;
		}
		stack.next = stackStart;
		var stackIn = null;
		var stackOut = null;

		yw = yi = 0;

		var mul_sum = mul_table[radius];
		var shg_sum = shg_table[radius];

		for ( y = 0; y < height; y++ )
		{
			r_in_sum = g_in_sum = b_in_sum = a_in_sum = r_sum = g_sum = b_sum = a_sum = 0;

			r_out_sum = radiusPlus1 * ( pr = pixels[yi] );
			g_out_sum = radiusPlus1 * ( pg = pixels[yi+1] );
			b_out_sum = radiusPlus1 * ( pb = pixels[yi+2] );
			a_out_sum = radiusPlus1 * ( pa = pixels[yi+3] );

			r_sum += sumFactor * pr;
			g_sum += sumFactor * pg;
			b_sum += sumFactor * pb;
			a_sum += sumFactor * pa;

			stack = stackStart;

			for( i = 0; i < radiusPlus1; i++ )
			{
				stack.r = pr;
				stack.g = pg;
				stack.b = pb;
				stack.a = pa;
				stack = stack.next;
			}

			for( i = 1; i < radiusPlus1; i++ )
			{
				p = yi + (( widthMinus1 < i ? widthMinus1 : i ) << 2 );
				r_sum += ( stack.r = ( pr = pixels[p])) * ( rbs = radiusPlus1 - i );
				g_sum += ( stack.g = ( pg = pixels[p+1])) * rbs;
				b_sum += ( stack.b = ( pb = pixels[p+2])) * rbs;
				a_sum += ( stack.a = ( pa = pixels[p+3])) * rbs;

				r_in_sum += pr;
				g_in_sum += pg;
				b_in_sum += pb;
				a_in_sum += pa;

				stack = stack.next;
			}


			stackIn = stackStart;
			stackOut = stackEnd;
			for ( x = 0; x < width; x++ )
			{
				pixels[yi+3] = pa = (a_sum * mul_sum) >> shg_sum;
				if ( pa != 0 )
				{
					pa = 255 / pa;
					pixels[yi]   = ((r_sum * mul_sum) >> shg_sum) * pa;
					pixels[yi+1] = ((g_sum * mul_sum) >> shg_sum) * pa;
					pixels[yi+2] = ((b_sum * mul_sum) >> shg_sum) * pa;
				} else {
					pixels[yi] = pixels[yi+1] = pixels[yi+2] = 0;
				}

				r_sum -= r_out_sum;
				g_sum -= g_out_sum;
				b_sum -= b_out_sum;
				a_sum -= a_out_sum;

				r_out_sum -= stackIn.r;
				g_out_sum -= stackIn.g;
				b_out_sum -= stackIn.b;
				a_out_sum -= stackIn.a;

				p =  ( yw + ( ( p = x + radius + 1 ) < widthMinus1 ? p : widthMinus1 ) ) << 2;

				r_in_sum += ( stackIn.r = pixels[p]);
				g_in_sum += ( stackIn.g = pixels[p+1]);
				b_in_sum += ( stackIn.b = pixels[p+2]);
				a_in_sum += ( stackIn.a = pixels[p+3]);

				r_sum += r_in_sum;
				g_sum += g_in_sum;
				b_sum += b_in_sum;
				a_sum += a_in_sum;

				stackIn = stackIn.next;

				r_out_sum += ( pr = stackOut.r );
				g_out_sum += ( pg = stackOut.g );
				b_out_sum += ( pb = stackOut.b );
				a_out_sum += ( pa = stackOut.a );

				r_in_sum -= pr;
				g_in_sum -= pg;
				b_in_sum -= pb;
				a_in_sum -= pa;

				stackOut = stackOut.next;

				yi += 4;
			}
			yw += width;
		}


		for ( x = 0; x < width; x++ )
		{
			g_in_sum = b_in_sum = a_in_sum = r_in_sum = g_sum = b_sum = a_sum = r_sum = 0;

			yi = x << 2;
			r_out_sum = radiusPlus1 * ( pr = pixels[yi]);
			g_out_sum = radiusPlus1 * ( pg = pixels[yi+1]);
			b_out_sum = radiusPlus1 * ( pb = pixels[yi+2]);
			a_out_sum = radiusPlus1 * ( pa = pixels[yi+3]);

			r_sum += sumFactor * pr;
			g_sum += sumFactor * pg;
			b_sum += sumFactor * pb;
			a_sum += sumFactor * pa;

			stack = stackStart;

			for( i = 0; i < radiusPlus1; i++ )
			{
				stack.r = pr;
				stack.g = pg;
				stack.b = pb;
				stack.a = pa;
				stack = stack.next;
			}

			yp = width;

			for( i = 1; i <= radius; i++ )
			{
				yi = ( yp + x ) << 2;

				r_sum += ( stack.r = ( pr = pixels[yi])) * ( rbs = radiusPlus1 - i );
				g_sum += ( stack.g = ( pg = pixels[yi+1])) * rbs;
				b_sum += ( stack.b = ( pb = pixels[yi+2])) * rbs;
				a_sum += ( stack.a = ( pa = pixels[yi+3])) * rbs;

				r_in_sum += pr;
				g_in_sum += pg;
				b_in_sum += pb;
				a_in_sum += pa;

				stack = stack.next;

				if( i < heightMinus1 )
				{
					yp += width;
				}
			}

			yi = x;
			stackIn = stackStart;
			stackOut = stackEnd;
			for ( y = 0; y < height; y++ )
			{
				p = yi << 2;
				pixels[p+3] = pa = (a_sum * mul_sum) >> shg_sum;
				if ( pa > 0 )
				{
					pa = 255 / pa;
					pixels[p]   = ((r_sum * mul_sum) >> shg_sum ) * pa;
					pixels[p+1] = ((g_sum * mul_sum) >> shg_sum ) * pa;
					pixels[p+2] = ((b_sum * mul_sum) >> shg_sum ) * pa;
				} else {
					pixels[p] = pixels[p+1] = pixels[p+2] = 0;
				}

				r_sum -= r_out_sum;
				g_sum -= g_out_sum;
				b_sum -= b_out_sum;
				a_sum -= a_out_sum;

				r_out_sum -= stackIn.r;
				g_out_sum -= stackIn.g;
				b_out_sum -= stackIn.b;
				a_out_sum -= stackIn.a;

				p = ( x + (( ( p = y + radiusPlus1) < heightMinus1 ? p : heightMinus1 ) * width )) << 2;

				r_sum += ( r_in_sum += ( stackIn.r = pixels[p]));
				g_sum += ( g_in_sum += ( stackIn.g = pixels[p+1]));
				b_sum += ( b_in_sum += ( stackIn.b = pixels[p+2]));
				a_sum += ( a_in_sum += ( stackIn.a = pixels[p+3]));

				stackIn = stackIn.next;

				r_out_sum += ( pr = stackOut.r );
				g_out_sum += ( pg = stackOut.g );
				b_out_sum += ( pb = stackOut.b );
				a_out_sum += ( pa = stackOut.a );

				r_in_sum -= pr;
				g_in_sum -= pg;
				b_in_sum -= pb;
				a_in_sum -= pa;

				stackOut = stackOut.next;

				yi += width;
			}
		}
		return imageData;
	}
});

WGE.Filter.StackBlur.mul_table = [
512,512,456,512,328,456,335,512,405,328,271,456,388,335,292,512,
454,405,364,328,298,271,496,456,420,388,360,335,312,292,273,512,
482,454,428,405,383,364,345,328,312,298,284,271,259,496,475,456,
437,420,404,388,374,360,347,335,323,312,302,292,282,273,265,512,
497,482,468,454,441,428,417,405,394,383,373,364,354,345,337,328,
320,312,305,298,291,284,278,271,265,259,507,496,485,475,465,456,
446,437,428,420,412,404,396,388,381,374,367,360,354,347,341,335,
329,323,318,312,307,302,297,292,287,282,278,273,269,265,261,512,
505,497,489,482,475,468,461,454,447,441,435,428,422,417,411,405,
399,394,389,383,378,373,368,364,359,354,350,345,341,337,332,328,
324,320,316,312,309,305,301,298,294,291,287,284,281,278,274,271,
268,265,262,259,257,507,501,496,491,485,480,475,470,465,460,456,
451,446,442,437,433,428,424,420,416,412,408,404,400,396,392,388,
385,381,377,374,370,367,363,360,357,354,350,347,344,341,338,335,
332,329,326,323,320,318,315,312,310,307,304,302,299,297,294,292,
289,287,285,282,280,278,275,273,271,269,267,265,263,261,259];


WGE.Filter.StackBlur.shg_table = [
9, 11, 12, 13, 13, 14, 14, 15, 15, 15, 15, 16, 16, 16, 16, 17, 
17, 17, 17, 17, 17, 17, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 
19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 20, 20, 20,
20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 21,
21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21,
21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 22, 22, 22, 22, 22, 22, 
22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22,
22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 23, 
23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 
23, 23, 23, 23, 23, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 
24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24 ];

WGE.Filter.StackBlur.BlurStack = function()
{
	this.r = 0;
	this.g = 0;
	this.b = 0;
	this.a = 0;
	this.next = null;
};

//../2d/wgeSlideshow.js
"use strict";
/*
* wgeSlideshow.js
*
*  Created on: 2014-8-14
*      Author: Wang Yang
*        Blog: http://blog.wysaid.org
*/

/*
简介：主要提供与网站界面兼容的接口设计，
      以及提供对于json配置文件的解析接口。
*/


//特别注意， SlideshowSettings 里面的width和height代表slideshow算法用到的实际宽高，精确到像素
//style里面的宽高是显示时的宽高，系统会自动进行缩放显示。
//请勿在slideshow里面添加任何无意义的动态设定宽高的代码，浪费性能。

WGE.SlideshowSettings = 
{
	assetsDir : "",  //音乐等资源所在文件夹
	width : 1024,
	height : 768,
	style : "width:100%;height:100%;background-color:#000"
};

if(window.soundManager && window.soundManager.onready)
{
	soundManager.onready(function(){
		WGE.soundManagerReady = true;
		console.log("WGE SM2 Ready");
	});
}

//如果不添加后两个参数， 则默认统一规范，slideshow使用分辨率为 1024*768
//本函数将等比缩放图片，将使图片宽或者高满足这个分辨率并且另一边大于等于这个分辨率。
//如： 图片分辨率为 1024 * 1024， 则图片不变
//     图片分辨率为 768 * 768， 则将等比缩放为 1024 * 1024
//     图片分辨率为 1024 * 500， 则将等比缩放为 1573 * 768
// 后两个参数表示将分辨率缩小至这个尺寸， 可根据实际需求设定。
WGE.slideshowFitImages = function(imgs, w, h)
{
	if(!(w && h))
	{
		w = WGE.SlideshowSettings.width;
		h = WGE.SlideshowSettings.height;
	}
	else
	{
		w *= WGE.SlideshowSettings.width;
		h *= WGE.SlideshowSettings.height;
	}

	var fitImgs = [];

	for(var i = 0; i != imgs.length; ++i)
	{
		var img = imgs[i];
		var canvas = WGE.CE('canvas');
		var scale = Math.min(img.width / w, img.height / h);
		canvas.width = img.width / scale;
		canvas.height = img.height / scale;
		canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height);
		fitImgs.push(canvas);
	}
	return fitImgs;
};

WGE.slideshowFitImage = function(img, w, h)
{
	if(!(w && h))
	{
		w = WGE.SlideshowSettings.width;
		h = WGE.SlideshowSettings.height;
	}
	else
	{
		w *= WGE.SlideshowSettings.width;
		h *= WGE.SlideshowSettings.height;
	}

	var canvas = WGE.CE('canvas');
	var scale = Math.min(img.width / w, img.height / h);
	canvas.width = img.width / scale;
	canvas.height = img.height / scale;
	canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height);
	return canvas;
};

WGE.imagesFitSlideshow = function(imgs, w, h)
{
	if(!(w && h))
	{
		w = WGE.SlideshowSettings.width;
		h = WGE.SlideshowSettings.height;
	}
	else
	{
		w *= WGE.SlideshowSettings.width;
		h *= WGE.SlideshowSettings.height;
	}

	var fitImgs = [];

	for(var i = 0; i != imgs.length; ++i)
	{
		var img = imgs[i];
		var canvas = WGE.CE('canvas');
		var scale = Math.max(img.width / w, img.height / h);
		canvas.width = img.width / scale;
		canvas.height = img.height / scale;
		canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height);
		fitImgs.push(canvas);
	}
	return fitImgs;
};

WGE.imageFitSlideshow = function(img, w, h)
{
	if(!(w && h))
	{
		w = 1024;
		h = 768;
	}
	else
	{
		w *= WGE.SlideshowSettings.width;
		h *= WGE.SlideshowSettings.height;
	}
	var canvas = WGE.CE('canvas');
	var scale = Math.max(img.width / w, img.height / h);
	canvas.width = img.width / scale;
	canvas.height = img.height / scale;
	canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height);
	return canvas;
};

if(WGE.Sprite && WGE.AnimationWithChildrenInterface2d)
{
	//注： initialize 末尾两个参数，如果 w 为-1， 表示img 不拷贝，共享使用
	WGE.SlideshowAnimationSprite = WGE.Class(WGE.Sprite, WGE.AnimationWithChildrenInterface2d,
	{
		initialize : function(startTime, endTime, img, w, h)
		{
			WGE.AnimationWithChildrenInterface2d.initialize.call(this, startTime, endTime);
			WGE.Sprite.initialize.call(this, img, w, h);
		}
	});

	WGE.SlideshowAnimationLogicSprite = WGE.Class(WGE.LogicSprite, WGE.AnimationWithChildrenInterface2d,
	{
		initialize : function(startTime, endTime)
		{
			WGE.AnimationWithChildrenInterface2d.initialize.call(this, startTime, endTime);
			WGE.LogicSprite.initialize.call(this);
		}
	});

	WGE.SlideshowAnimationGifSprite = WGE.Class(WGE.GifSprite, WGE.AnimationWithChildrenInterface2d,
	{
		switchTime : 250,

		initialize : function(startTime, endTime, imgArr, w, h)
		{
			WGE.AnimationWithChildrenInterface2d.initialize.call(this, startTime, endTime);
			WGE.GifSprite.initialize.call(this, imgArr, w, h);
		},

		run : function(totalTime)
		{
			this.playIndex = parseInt(totalTime / this.switchTime) % this._imgArr.length;
			WGE.AnimationWithChildrenInterface2d.run.call(this, totalTime);
		},
	});

	WGE.SlideshowAnimationVideoSprite = WGE.Class(WGE.VideoSprite, WGE.AnimationWithChildrenInterface2d,
	{		
		initialize : function(startTime, endTime, video, w, h)
		{
			WGE.AnimationWithChildrenInterface2d.initialize.call(this, startTime, endTime);
			WGE.VideoSprite.initialize.call(this, video, w, h);
		},

		run : function(totalTime)
		{			
			WGE.AnimationWithChildrenInterface2d.run.call(this, totalTime);
		},

		timeStart : function()
		{
			if(this._video.paused)
				this._video.play();
			WGE.AnimationWithChildrenInterface2d.timeStart.call(this);
		},

		timeUp : function()
		{
			if(!this._video.loop)
				this._video.pause();
			WGE.AnimationWithChildrenInterface2d.timeUp.call(this);
		},
	});
}


WGE.SlideshowInterface = WGE.Class(
{
	audioFileName : "", //音乐文件名(可以为数组)
	musicDuration : 60000, //音乐文件的总时长
	audio : null,
	audioPlayedTimes : 0, //音乐被重复播放次数
	timeline : null, //整个slideshow的时间轴.

	father : null, //绘制目标所在的DOM
	canvas : null, //绘制目标
	context : null, //绘制目标的context

	srcImages : null,  //canvas类型的数组。
	config : null, //slideshow配置(json)

	_animationRequest : null,  //保存每一次的动画请求，当pause或者stop时可以及时停止。
	_lastFrameTime : null, //保存每一帧执行完之后的时间。
	_loopFunc : null, // mainloop.bind(this)
	_audioplayingTime : 0, //播放时间
	_endCanvas : null, //结束画面
	_endBlurCanvas : null, //结束模糊画面

	_imageRatioX : null,
	_imageRatioY : null, //图像缩放率
	_syncTime : 500, //音乐同步默认时间

	//loadingimage时，没完成一张，就对其进行处理。(函数)
	//参数有两个，第一个为一个Image对象， 第二个为它对应的下标。
	_dealLoadingImage : null, 

	//完成图像加载后执行，
	//参数有一个，为Image数组
	_dealFinishLoadingImage : null,

	_lastVolume : null, //音乐淡出辅助变量

	//注意： 在initialize末尾把子类的构造函数传递进来，末尾执行是很不好的行为
	//请直接在子类里面执行。 避免不必要的逻辑绕弯，加大维护时的麻烦。
	//config参数表示slideshow的配置文件。 默认将对config进行解析，如果默认方法无法解析，
	//请重写自己的实现
	//末尾的canvas和context参数可选， 如果填写则直接将绘制目标设置为末尾参数指定的canvas(主要用于demo)
	initialize : function(fatherDOM, imgURLs, finishCallback, eachCallback, imageRatioX, imageRatioY, config, canvas, context)
	{
		this.father = fatherDOM;
		this.canvas = canvas;
		if(!this.canvas)
		{
			this.canvas = WGE.CE('canvas');
			this.canvas.width = WGE.SlideshowSettings.width;
			this.canvas.height = WGE.SlideshowSettings.height;
			this.canvas.setAttribute("style", WGE.SlideshowSettings.style);
			this.father.appendChild(this.canvas);
		}		

		this.context = context || this.canvas.getContext('2d');
		
		if(config)
			this.config = config;

		if(imageRatioX && imageRatioY)
		{
			this._imageRatioX = imageRatioX;
			this._imageRatioY = imageRatioY;
		}

		this._loadImages(imgURLs, finishCallback, eachCallback);

		var audioFileNames;
		if(this.audioFileName instanceof Array)
		{
			audioFileNames = [];
			for(var i in this.audioFileName)
				audioFileNames.push(WGE.SlideshowSettings.assetsDir + this.audioFileName[i]);
		}
		else if(this.audioFileName) 
			audioFileNames = WGE.SlideshowSettings.assetsDir + this.audioFileName;

		if(audioFileNames)
			this.audioFileName = audioFileNames;

		if(this.audioFileName)
		{
			if(this.audioFileName instanceof Array)
			{
				audioFileNames = [];
				for(var i in this.audioFileName)
					audioFileNames.push(WGE.SlideshowSettings.assetsDir + this.audioFileName[i]);
			}
			else audioFileNames = WGE.SlideshowSettings.assetsDir + this.audioFileName;
			this._initAudio(audioFileNames);
		}
	},

	//config 为json配置文件
	initTimeline : function(config)
	{
		WGE.SlideshowParsingEngine.parse(config, this);

		if(!this.audio)
		{
			var audioFileNames;
			if(this.audioFileName instanceof Array)
			{
				audioFileNames = [];
				for(var i in this.audioFileName)
					audioFileNames.push(WGE.SlideshowSettings.assetsDir + this.audioFileName[i]);
			}
			else audioFileNames = WGE.SlideshowSettings.assetsDir + this.audioFileName;
			this._initAudio(audioFileNames);
			return ;
		}
	},

	_loadImages : function(imgURLs, finishCallback, eachCallback)
	{
		var self = this;
		WGE.loadImages(imgURLs, function(imgArr) {
			if(typeof self._dealFinishLoadingImage == 'function')
				self._dealFinishLoadingImage(imgArr);
			else
				self.srcImages = WGE.slideshowFitImages(imgArr, self._imageRatioX, self._imageRatioY);

			if(self.config)
				self.initTimeline(self.config);
			if(finishCallback)
				finishCallback(self.srcImages || imgArr, self);

			self.config = null;
		}, function(img, n, imageIndex) {
			if(typeof self._dealLoadingImage == 'function')
				self._dealLoadingImage(img, imageIndex);
			if(eachCallback)
				eachCallback(img, n, self);
		});
	},

	//需要第三方 soundManager
	_initAudio : function(url)
	{
		var self = this;
		var arg = {url : url};

		if(typeof this._audioFinish == "function")
			arg.onfinish = this._audioFinish.bind(this);

		if(typeof this._audioplaying == "function")
			arg.whileplaying = this._audioplaying.bind(this);

		if(typeof this._audiosuspend == "function")
			arg.onsuspend = this._audiosuspend.bind(this);
		if(typeof this._audioTimeout == "function")
			arg.ontimeout = this._audioTimeout.bind(this);

		var tryInitAudio = function() {
			if(WGE.soundManagerReady)
			{
				if(self.audio)
					return;
				self.audio = soundManager.createSound(arg);
				if(!self.audio)
					self._checkAudioFailed();
				self.audio.play();
				//初始时将音乐标记为暂停状态，而不是未播放状态。
				if(!self._animationRequest)
					self.audio.pause();
			}
			else
			{
				setTimeout(tryInitAudio.bind(this), 100);
			}
		};

		tryInitAudio();
	},

	_audioFinish : function()
	{
		//默认音乐循环播放
		++this.audioPlayedTimes;
		this.audio.play();
	},

	_audioplaying : function()
	{
		this._audioplayingTime = this.getAudioPlayingTime();
	},

	_audiosuspend : function()
	{
		
	},

	_audioTimeout : function()
	{
		console.error("Audio time out!");
	},

	_checkAudioFailed : function()
	{
		if(this.audio.readyState == 2)
		{
			console.error("Failed to play audio : ", this.audioFileName);
			this.stop();
			return true;
		}
		else if(this.audio.readyState == 3)
		{
			this._checkAudioFailed = null;
		}
		return false;
	},

	getAudioPlayingTime : function()
	{
		return this.audioPlayedTimes * this.audio.duration + this.audio.position;
	},

	//释放内存，在移动设备上效果比较明显。
	release : function()
	{
		this.audio.destruct();
		this.srcImages = undefined;
		WGE.release(this);
	},

	play : function()
	{
		if(this._animationRequest || !this.timeline)
		{
			if(this._animationRequest)
				console.warn("重复请求， slideshow 已经正在播放中!");
			if(!this.timeline)
				console.error("时间轴不存在！");
			return ;
		}

		if(this.audio)
		{
			this.audio.play();
		}
		
		this._lastFrameTime = Date.now();
		this._loopFunc = this.mainloop.bind(this);
		this.timeline.start(0);
		this._animationRequest = requestAnimationFrame(this._loopFunc);
		this.audioPlayedTimes = 0;
		this._audioplayingTime = 0;
	},

	isPlaying : function()
	{
		return !!this._animationRequest;
	},

	stop : function()
	{
		if(this._animationRequest)
		{
			cancelAnimationFrame(this._animationRequest);
			this._animationRequest = null;
		}

		if(this.audio)
		{
			this.audio.stop();
		}
	},

	pause : function()
	{
		if(this._animationRequest)
		{
			cancelAnimationFrame(this._animationRequest);
			this._animationRequest = null;
		}

		if(this.audio)
		{
			this.audio.pause();
		}
	},

	resume : function()
	{
		if(!this._animationRequest && this.timeline && this.timeline.isStarted)
		{
			requestAnimationFrame(this._loopFunc);
			this._lastFrameTime = Date.now();

			if(this.audio)
			{
				this.audio.resume();
			}
		}
	},

	setVolume : function(v)
	{
		if(this.audio)
			this.audio.setVolume(v);
	},

	//进度跳转, 暂不实现
	// jump : function(time)
	// {

	// },


	endloop : function()
	{
		if(this._animationRequest || !(this.context && this._endBlurCanvas && this._endCanvas))
			return;
		var time = Date.now();
		var dt = time - this._lastFrameTime;
		if(dt >  5000)
		{
			this.context.save();
			this.context.drawImage(this._endBlurCanvas, 0, 0, this._endBlurCanvas.width, this._endBlurCanvas.height, 0, 0, this.canvas.width, this.canvas.height);
			this.context.fillStyle = "#000";
			this.context.globalAlpha = 0.5;
			this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
			this.context.restore();
			console.log("Slideshow endloop finished.");
			if(this.audio)
			{
				this.audio.stop();
				this.audio.setVolume(this._lastVolume);
				this._lastVolume = null;
			}
			return ;
		}

		this.context.save();

		if(dt < 1500)
		{
			this.context.drawImage(this._endCanvas, 0, 0);
			this.context.globalAlpha = dt / 1500;
			this.context.drawImage(this._endBlurCanvas, 0, 0, this._endBlurCanvas.width, this._endBlurCanvas.height, 0, 0, this.canvas.width, this.canvas.height);
		}
		else
		{
			this.context.drawImage(this._endBlurCanvas, 0, 0, this._endBlurCanvas.width, this._endBlurCanvas.height, 0, 0, this.canvas.width, this.canvas.height);
			this.context.globalAlpha = (dt - 1500) / 7000;
			this.context.fillStyle = "#000";
			this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
		}
		this.context.restore();

		if(this._lastVolume)
			this.audio.setVolume(this._lastVolume * (1 - dt / 5000));

		//保证淡出执行间隔。(淡出不需要太高的帧率，和大量运算)
		setTimeout(this.endloop.bind(this), 20);
	},

	_end : function()
	{
		console.log("Slideshow End");
		this._animationRequest = null;
		this._endBlurCanvas = WGE.CE("canvas");
		this._endBlurCanvas.width = this.canvas.width / 2;
		this._endBlurCanvas.height = this.canvas.height / 2;
		var ctx = this._endBlurCanvas.getContext('2d');
		ctx.drawImage(this.canvas, 0, 0, this.canvas.width, this.canvas.height, 0, 0, this._endBlurCanvas.width, this._endBlurCanvas.height);
		var blurredData = WGE.Filter.StackBlur.stackBlurCanvasRGB(this._endBlurCanvas, 0, 0, this._endBlurCanvas.width, this._endBlurCanvas.height, 25);
		ctx.putImageData(blurredData, 0, 0);
		this._endCanvas = WGE.CE("canvas");
		this._endCanvas.width = this.canvas.width;
		this._endCanvas.height = this.canvas.height;
		this._endCanvas.getContext('2d').drawImage(this.canvas, 0, 0);
		this.timeline.end();
		this._lastVolume = this.audio.volume;
		this._lastFrameTime = Date.now();
		this.endloop();
	},

	// slideshow主循环
	mainloop : function()
	{
		var timeNow = Date.now();
		var asyncTime = this._audioplayingTime - this.timeline.currentTime;

		//当音乐时间与时间轴时间差异超过300毫秒时，执行同步操作
		if(Math.abs(asyncTime) > this._syncTime)
		{
			//console.log("同步: 音乐时间", this._audioplayingTime, "时间轴时间",this.timeline.currentTime, "差值", asyncTime, "大于" + this._syncTime + ",进行同步");
			//当时间轴慢于音乐时间时，执行时间轴跳跃。
			if(asyncTime > this._syncTime)
			{
				if(!this.timeline.update(asyncTime))
				{
					this.timeline.currentTime = this.timeline.totalTime;
					this._end();
					return ;
				}
				this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
				this.timeline.render(this.context);
			}
			else if(this.audio)
			{
				if(this._checkAudioFailed && this._checkAudioFailed())
					return ;
				this.audio.resume();
				this._audioplayingTime = this.getAudioPlayingTime();
			}

			this._lastFrameTime = timeNow;			
			this._animationRequest = requestAnimationFrame(this._loopFunc);
			return ;
		}

		var deltaTime = timeNow - this._lastFrameTime;
		this._lastFrameTime = timeNow;

		if(!this.timeline.update(deltaTime))
		{
			this.timeline.currentTime = this.timeline.totalTime;
			this._end();
			return ;
		}

		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.timeline.render(this.context);
		this._animationRequest = requestAnimationFrame(this._loopFunc);
	}
	
});


WGE.SlideshowParsingEngine = 
{

	parse : function(config, slideshow)
	{
		if(!config)
			return null;
		if(config instanceof String)
		{
			config = JSON ? JSON.parse(config) : eval('(' + config + ')');
		}

		var parser;
		try
		{
			parser = this[config.parserName] || this.defaultParser;
		}catch(e) {
			parser = this.defaultParser;
		};
		return parser.call(this, config, slideshow);
	},

	_parseSceneDefault : function(scene, imgArr)
	{
		var spriteClass = WGE[scene.name] || WGE.SlideshowAnimationSprite;
		var sprite = new spriteClass(WGE.ClassInitWithArr, scene.initArgs);

		if(typeof scene.imageindex == "number")
		{
			var img = imgArr[scene.imageindex % imgArr.length];

			/////////////////////////////

			if(scene.spriteConfig.filter && img)
			{
				try
				{
					var filter = new WGE.Filter[scene.spriteConfig.filter](WGE.ClassInitWithArr, scene.spriteConfig.filterArgs);
					img = filter.bind(img).run();
				}catch(e) {
					console.error("when doing filter, defaultParser : ", e);
				}
			}

			var spriteInitFunc = sprite[scene.spriteConfig.name] || sprite.initSprite;
			spriteInitFunc.call(sprite, img, scene.spriteConfig.width, scene.spriteConfig.height);
		}

		/////////////////////////////

		var execFunc = scene.execFunc;
		for(var funcIndex in execFunc)
		{
			var funcConfig = execFunc[funcIndex];
			var func = sprite[funcConfig.name];
			if(func instanceof Function)
			{
				var arg = WGE.clone(funcConfig.arg);
				if(funcConfig.relativeResolution)
				{
					//相对分辨率参数是一个0~1之间的浮点数。
					if(arg[funcConfig.relativeWidth] && arg[funcConfig.relativeHeight])
					{
						arg[funcConfig.relativeWidth] *= WGE.SlideshowSettings.width;
						arg[funcConfig.relativeHeight] *= WGE.SlideshowSettings.height;
					}
				}
				func.apply(sprite, arg);
			}
		}

		/////////////////////////////

		var actions = scene.actions;
		for(var actionIndex in actions)
		{
			var actionConfig = actions[actionIndex];
			var actionClass = WGE.Actions[actionConfig.name];
			if(actionClass instanceof Function)
			{
				var action = new actionClass(WGE.ClassInitWithArr, actionConfig.arg);
				sprite.push(action);
			}				
		}

		////////////////////////////

		var childNodes = scene.childNodes;
		for(var childIndex in childNodes)
		{
			sprite.addChild(this._parseSceneDefault(childNodes[childIndex], imgArr));
		}
		return sprite;
	},

	// 默认解析器
	defaultParser : function(config, slideshow)
	{
		if(!slideshow)
		{
			console.error("Invalid Params in WGE.SlideshowParsingEngine");
			return;
		}
		
		if(config.audioFileName)
		{
			slideshow.audioFileName = config.audioFileName;
			slideshow.musicDuration = parseFloat(config.musicDuration);
		}

		var totalTime = Math.ceil(slideshow.srcImages.length / config.loopImageNum) * config.loopTime;
		slideshow.timeline = new WGE.TimeLine(totalTime);

		var timeline = slideshow.timeline;
		var sceneArr = config.sceneArr;
		for(var sceneIndex in sceneArr)
		{
			timeline.push(this._parseSceneDefault(sceneArr[sceneIndex], slideshow.srcImages));
		}
	}
};


//../extends/wgeExtendActions.js
"use strict";
/*
* wgeCommonActions.js
*
*  Created on: 2014-8-22
*
*/


/*
	简介: 扩展action 列表库，列举并提供所有的可能被公用的action 操作
	      需要与wgeAnimation结合使用。
	      在添加每个actions的前面请务必注释并写上添加者名字，以方便后续使用
	      如果你觉得全部写到一个文件里面不方便，也可以自己在extend目录里面添加一个文件，自己写自己的actions （这样可能重复利用率低，导致大家各写各的）

	特别注意: 如果该方法涉及到某个特定环境下(比如必须要context-2d支持), 请务必标注出来。
*/


// 将本文件内所有方法添加至 WGE.Actions 类名下，防止命名冲突。
WGE.Actions = {};

(function()
{

var A = WGE.Actions;

//动态改变透明度
A.UniformAlphaAction = WGE.Class(WGE.TimeActionInterface,
{
	fromAlpha : 1,
	toAlpha : 1,
	dis : 0,

	initialize : function(time, from, to, repeatTimes)
	{
		if(time instanceof Array)
		{
			this.tStart = time[0];
			this.tEnd = time[1];
		}
		else if(time instanceof WGE.Vec2)
		{
			this.tStart = time.data[0];
			this.tEnd = time.data[1];
		}
		this.fromAlpha = from;
		this.toAlpha = to;
		this.dis = to - from;
		this.repeatTimes = repeatTimes ? repeatTimes : 1;
	},

	act : function(percent)
	{
		var t = this.repeatTimes * percent;
		t -= Math.floor(t);
		try
		{
			this.bindObj.alpha = this.fromAlpha + this.dis * t;
		}catch(e)
		{
			console.error("Invalid Binding Object!");
		}

		this.act = function(percent)
		{
			var t = this.repeatTimes * percent;
			t -= Math.floor(t);
			this.bindObj.alpha = this.fromAlpha + this.dis * t;
		};
	},

	actionStart : function()
	{
		this.bindObj.alpha = this.fromAlpha;
	},

	actionStop : function()
	{
		this.bindObj.alpha = this.toAlpha;
	}
});

A.BlinkAlphaAction = WGE.Class(A.UniformAlphaAction,
{
	act : function(percent)
	{
		var t = this.repeatTimes * percent;
		t = (t - Math.floor(t)) * 2.0;
		if(t > 1.0)
			t = 2.0 - t;
		t = t * t * (3.0 - 2.0 * t);
		try
		{
			this.bindObj.alpha = this.fromAlpha + this.dis * t;
		}catch(e)
		{
			console.error("Invalid Binding Object!");
		}

		this.act = function(percent)
		{
			var t = this.repeatTimes * percent;
			t = (t - Math.floor(t)) * 2.0;
			if(t > 1.0)
				t = 2.0 - t;
			t = t * t * (3.0 - 2.0 * t);
			this.bindObj.alpha = this.fromAlpha + this.dis * t;
		};
	},

	actionStop : function()
	{
		this.bindObj.alpha = this.fromAlpha;
	}
});

//匀速直线运动
A.UniformLinearMoveAction = WGE.Class(WGE.TimeActionInterface,
{
	//为了效率，此类计算不使用前面封装的对象
	fromX : 0,
	fromY : 0,
	toX : 1,
	toY : 1,
	disX : 1,
	disY : 1,

	initialize : function(time, from, to, repeatTimes)
	{
		if(time instanceof Array)
		{
			this.tStart = time[0];
			this.tEnd = time[1];
		}
		else
		{
			this.tStart = time.data[0];
			this.tEnd = time.data[1];
		}

		if(from instanceof Array)
		{
			this.fromX = from[0];
			this.fromY = from[1];
		}
		else
		{
			this.fromX = from.data[0];
			this.fromY = from.data[1];
		}

		if(to instanceof Array)
		{
			this.toX = to[0];
			this.toY = to[1];
		}
		else
		{
			this.toX = to.data[0];
			this.toY = to.data[1];
		}		

		this.disX = this.toX - this.fromX;
		this.disY = this.toY - this.fromY;

		this.repeatTimes = repeatTimes ? repeatTimes : 1;
	},

	act : function(percent)
	{
		var t = this.repeatTimes * percent;
		t -= Math.floor(t);
		try
		{
			this.bindObj.moveTo(this.fromX + this.disX * t, this.fromY + this.disY * t);
		}catch(e)
		{
			console.error("Invalid Binding Object!");
		}

		this.act = function(percent)
		{
			var t = this.repeatTimes * percent;
			t -= Math.floor(t);
			this.bindObj.moveTo(this.fromX + this.disX * t, this.fromY + this.disY * t);
		};
	},

	actionStart : function()
	{
		this.bindObj.moveTo(this.fromX, this.fromY);
	},

	actionStop : function()
	{
		this.bindObj.moveTo(this.toX, this.toY);
	}
});

A.NatureMoveAction = WGE.Class(A.UniformLinearMoveAction,
{
	act : function(percent)
	{
		var t = this.repeatTimes * percent;
		t -= Math.floor(t);
		t = t * t * (3 - 2 * t);
		this.bindObj.moveTo(this.fromX + this.disX * t, this.fromY + this.disY * t);
	}
});

A.UniformScaleAction = WGE.Class(A.UniformLinearMoveAction,
{
	act : function(percent)
	{
		var t = this.repeatTimes * percent;
		t -= Math.floor(t);
		try
		{
			this.bindObj.scaleTo(this.fromX + this.disX * t, this.fromY + this.disY * t);
		}catch(e)
		{
			console.error("Invalid Binding Object!");
		}

		this.act = function(percent)
		{
			var t = this.repeatTimes * percent;
			t -= Math.floor(t);
			this.bindObj.scaleTo(this.fromX + this.disX * t, this.fromY + this.disY * t);
		};
	},

	actionStart : function()
	{
		this.bindObj.scaleTo(this.fromX, this.fromY);
	},

	actionStop : function()
	{
		this.bindObj.scaleTo(this.toX, this.toY);
	}
});

//简单适用实现，兼容2d版sprite和webgl版sprite2d
A.UniformRotateAction = WGE.Class(A.UniformLinearMoveAction,
{
	fromRot : 0,
	toRot : 0,
	disRot : 0,

	initialize : function(time, from, to, repeatTimes)
	{
		if(time instanceof Array)
		{
			this.tStart = time[0];
			this.tEnd = time[1];
		}
		else
		{
			this.tStart = time.data[0];
			this.tEnd = time.data[1];
		}

		this.fromRot = from;
		this.toRot = to;
		this.disRot = to - from;

		this.repeatTimes = repeatTimes ? repeatTimes : 1;
	},

	actionStart : function()
	{
		this.bindObj.rotateTo(this.fromRot);
	},

	act : function(percent)
	{
		var t = this.repeatTimes * percent;
		t -= Math.floor(t);
		this.bindObj.rotateTo(this.fromRot + t * this.disRot);
	},

	actionStop : function()
	{
		this.bindObj.rotateTo(this.toRot);
	}

});

// 将绑定的 AnimationSprite的某个属性，在给定的时间点设置为给定的值。
// 适用于某些离散操作
A.SetAttribAction = WGE.Class(WGE.TimeActionInterface,
{
	originAttribValue : null,
	attribName : null,
	attribValue : null,

	initialize : function(time, attribName, attribValue, bindObj)
	{
		if(time instanceof Array)
		{
			this.tStart = time[0];
			this.tEnd = time[1];
		}
		else if(time instanceof WGE.Vec2)
		{
			this.tStart = time.data[0];
			this.tEnd = time.data[1];			
		}
		this.attribName = attribName;
		this.attribValue = attribValue;
		this.originAttribValue = attribValue;
		this.bindObj = bindObj;
	},

	//当timeline重新开始时，对属性进行复位。
	actionStart : function()
	{
		this.bindObj[this.attribName] = this.originAttribValue;
	},

	act : function(percent)
	{
		this.bindObj[this.attribName] = this.attribValue;
	},

	actionStop : function()
	{
		this.bindObj[this.attribName] = this.attribValue
	}
});

A.PointIntersectionAction = WGE.Class(WGE.TimeActionInterface,
{
	pnts : undefined,

	initialize : function(time, pnts, bindObj)
	{
		if(time instanceof Array)
		{
			this.tStart = time[0];
			this.tEnd = time[1];
		}
		else if(time instanceof WGE.Vec2)
		{
			this.tStart = time.data[0];
			this.tEnd = time.data[1];			
		}

		this.bindObj = bindObj;
		this.pnts = pnts;
	},


	act : function(percent)
	{
		var pnt = WGE.lineIntersectionV(this.pnts[0], this.pnts[1], this.pnts[2], this.pnts[3]);
		this.bindObj.data[0] = pnt.data[0];
		this.bindObj.data[1] = pnt.data[1];
	},

	actionStop : function()
	{
		var pnt = WGE.lineIntersectionV(this.pnts[0], this.pnts[1], this.pnts[2], this.pnts[3]);
		this.bindObj.data[0] = pnt.data[0];
		this.bindObj.data[1] = pnt.data[1];
	}

});

A.PointMoveAction = WGE.Class(WGE.TimeActionInterface,
{
	fromX : 0,
	fromY : 0,
	toX : 1,
	toY : 1,
	disX : 1,
	disY : 1,

	initialize : function(time, from, to, bindObj)
	{
		if(time instanceof Array)
		{
			this.tStart = time[0];
			this.tEnd = time[1];
		}
		else if(time instanceof WGE.Vec2)
		{
			this.tStart = time.data[0];
			this.tEnd = time.data[1];			
		}

		if(from instanceof Array)
		{
			this.fromX = from[0];
			this.fromY = from[1];						
		}
		else
		{
			this.fromX = from.data[0];
			this.fromY = from.data[1];
			
		}

		if(to instanceof Array)
		{
			this.toX = to[0];
			this.toY = to[1];
		}
		else
		{
			this.toX = to.data[0];
			this.toY = to.data[1];
		}

		this.disX = this.toX - this.fromX;
		this.disY = this.toY - this.fromY;
		this.bindObj = bindObj;
	},

	act : function(percent)
	{
		var t = percent;
		try
		{
			this.bindObj.data[0] = this.fromX + this.disX * t;
			this.bindObj.data[1] = this.fromY + this.disY * t;
		}catch(e)
		{
			console.error("Invalid Binding Object!");
		}

		this.act = function(percent)
		{
			var t = percent;
			this.bindObj.data[0] = this.fromX + this.disX * t;
			this.bindObj.data[1] = this.fromY + this.disY * t;
		};
	},

	// 为Action开始做准备工作，比如对一些属性进行复位。
	actionStart : function()
	{
		// this.bindObj.data[0] = this.fromX;
		// this.bindObj.data[1] = this.fromY;
	},

	// Action结束之后的扫尾工作，比如将某物体设置运动结束之后的状态。
	actionStop : function()
	{
		this.bindObj.data[0] = this.toX;
		this.bindObj.data[1] = this.toY;
	}
});

A.PointMoveSlowDown3X = WGE.Class(A.PointMoveAction,
{
	act : function(percent)
	{
		var t = percent * percent * (3 - 2 * percent);
		this.bindObj.data[0] = this.fromX + this.disX * t;
		this.bindObj.data[1] = this.fromY + this.disY * t;
	}
});

//一个非连续的跳跃移动动作，参数移动的时间和移动的和相对于当前位置移动的距离
A.jumpMoveAction = WGE.Class(WGE.TimeActionInterface,
{
	endX: 0,
	endY: 0,

	initialize : function(time, jumpPos)
	{	
		this.tStart = time;
		this.tEnd = time;
		
		if(jumpPos instanceof Array)
		{
			this.endX = jumpPos[0];
			this.endY = jumpPos[1];
		}
		else if(jumpPos instanceof WGE.Vec2)
		{
			this.endX = jumpPos.data[0];
			this.endY = jumpPos.data[1];
		}
	},

	act : function(percent)
	{
		this.bindObj.moveTo(this.bindObj.pos.data[0] + this.endX, this.bindObj.pos.data[1]+this.endY);
	},

	actionStop : function()
	{
		this.bindObj.moveTo(this.bindObj.pos.data[0] + this.endX, this.bindObj.pos.data[1]+this.endY);
	}
});

//非连续的瞬间缩放动作
A.jumpScaleAction = WGE.Class(WGE.TimeActionInterface,
{
	scaleX: 0,
	scaleY: 0,

	initialize : function(time, endScale)
	{	
		this.tStart = time;
		this.tEnd = time;
		
		if(endScale instanceof Array)
		{
			this.scaleX = endScale[0];
			this.scaleY = endScale[1];
		}
		else if(endScale instanceof WGE.Vec2)
		{
			this.scaleX = endScale.data[0];
			this.scaleY = endScale.data[1];
		}
	},

	act : function(percent)
	{
		this.bindObj.scaleTo(this.scaleX, this.scaleY);
	},

	actionStop : function()
	{
		this.bindObj.scaleTo(this.scaleX, this.scaleY);
	}
});

A.acceleratedMoveAction = WGE.Class(WGE.Actions.UniformLinearMoveAction,
{
	act : function(percent)
	{
		var t = this.repeatTimes * percent;
		t -= Math.floor(t);
		t = t * t * (3 - 2 * t);
		var y = Math.sin(Math.PI * 2 * t) * 50;
		this.bindObj.moveTo(this.fromX, this.fromY + y);
	},

	actionStart : function()
	{
		
	},

	actionStop : function()
	{

	}
});

A.MoveRightAction = WGE.Class(WGE.Actions.UniformLinearMoveAction,
{


	distance : 0,
	act : function(percent)
	{
		var t = this.repeatTimes * percent;
		t -= Math.floor(t);
		t = t * t * (3 - 2 * t);
		var x = Math.sin(Math.PI/2* t) * this.distance;
		this.bindObj.moveTo(this.fromX+x, this.fromY);

	},

	setDistance : function(distance)
	{
		this.distance = distance;
	}
});

A.MoveDownAction = WGE.Class(WGE.Actions.UniformLinearMoveAction,
{
	distance : 0,
	act : function(percent)
	{
		var t = this.repeatTimes * percent;
		t -= Math.floor(t);
		t = t * t * (3 - 2 * t);
		var y = Math.sin(Math.PI/2* t) * this.distance;
		this.bindObj.moveTo(this.fromX, this.fromY + y);

	},

	setDistance : function(distance)
	{
		this.distance = distance;
	}
});

A.MoveSlideAction = WGE.Class(WGE.Actions.UniformLinearMoveAction,
{
	distance : 0,
	descDistance : 0,
	y : 0,
	y1 : 0,
	act : function(percent)
	{
		var proporty = 0.5;
		var t = this.repeatTimes * percent;
		t -= Math.floor(t);
		t = t * t * (3 - 2 * t);
		var t1 = t/proporty;
		var t2 = (t - proporty) / (1-proporty);
		
		
		if(t < 0.5){
			this.y  = Math.sin(Math.PI/2* t1) * this.distance;
			this.bindObj.moveTo(this.fromX, this.fromY - this.y);
		}
		else{
			this.y1 = Math.sin(Math.PI/2* t2) * this.descDistance;
			this.bindObj.moveTo(this.fromX, this.fromY + this.y1 - this.y);
		}
	},

	actionStop : function()
	{

	},

	setDistance : function(distance)
	{
		this.distance = distance;
	},

	setDescDistance : function(descDistance)
	{
		this.descDistance = descDistance;
	}
});

//和slideup接轨的动作
A.acceleratedSlideMoveAction = WGE.Class(WGE.Actions.UniformLinearMoveAction,
{
	firstNode : true,
	posx : 0,
	posy : 0,

	act : function(percent)
	{
		if(this.firstNode)
		{
			this.firstNode = false;
			this.posx = this.bindObj.pos.data[0];
			this.posy = this.bindObj.pos.data[1];
		}
		var t = this.repeatTimes * percent;
		t -= Math.floor(t);
		t = t * t * (3 - 2 * t);
		var y = Math.sin(Math.PI * 2 * t) * 50;
		this.bindObj.moveTo(this.posx, this.posy + y);
	},

	actionStart : function()
	{
		
	},

	actionStop : function()
	{

	}
});


A.MoveSlideRightAction = WGE.Class(WGE.Actions.UniformLinearMoveAction,
{


	distance : 0,
	firstNode : true,
	posx : 0,
	posy : 0,

	act : function(percent)
	{
		if(this.firstNode)
		{
			this.firstNode = false;
			this.posx = this.bindObj.pos.data[0];
			this.posy = this.bindObj.pos.data[1];
		}
		var t = this.repeatTimes * percent;
		t -= Math.floor(t);
		t = t * t * (3 - 2 * t);
		var x = Math.sin(Math.PI/2* t) * this.distance;
		this.bindObj.moveTo(this.posx+x, this.posy);

	},

	setDistance : function(distance)
	{
		this.distance = distance;
	},

	actionStop : function()
	{

	}

});


})();

//../extends/wgeExtendFunctions.js
"use strict";
/*
* wgeCommonFunctions.js
*
*  Created on: 2014-8-25
*
*/

/*
	简介： 公用的扩展方法库， 列举一些可能被重用的方法。
	       如果你觉得全部写到一个文件里面不方便，也可以自己新添加一个文件。

	特别注意: 如果该方法涉及到某个特定环境下(比如必须要context-2d支持), 请务必标注出来。
*/

// 将本文件内所有方法添加至 WGE.ExtendFunc 类名下，防止命名冲突

WGE.ExtendFunc = {};

(function()
{

var F = WGE.ExtendFunc;


//注: clipZone和fillZone选择其中一个使用即可。
//    Zone2d 仅支持context-2d
//功能: 提供一系列点，围成一个区域，然后对传入的context进行裁剪/填充
//      具体效果参考 PhotoFrame(Piano)
F.Zone2d = WGE.Class(
{
	clipArray : undefined,

	initialize : function(arr)
	{
		if(arr instanceof Array)
		{
			this.clipArray = arr;
		}
		else
		{
			this.clipArray = [];
			this.clipArray.push.apply(this.clipArray, arguments);
		}
	},

	//使用前请save ctx状态
	clipZone : function(ctx, stroke, style, lineWidth)
	{
		if(style)
			ctx.strokeStyle = style;
		if(lineWidth)
			ctx.lineWidth = lineWidth;

		ctx.beginPath();
		ctx.moveTo(this.clipArray[0].data[0], this.clipArray[0].data[1]);
		for(var i in this.clipArray)
		{
			ctx.lineTo(this.clipArray[i].data[0], this.clipArray[i].data[1]);
		}
		ctx.closePath();
		if(stroke)
			ctx.stroke();
		ctx.clip();
	},

	//同上
	fillZone : function(ctx, pattern, style, lineWidth)
	{
		if(pattern)
			ctx.fillStyle = pattern;
		if(style)
			ctx.strokeStyle = style;
		if(lineWidth)
			ctx.lineWidth = lineWidth;
		ctx.beginPath();
		ctx.moveTo(clipArray[0].data[0], clipArray[0].data[1]);
		for(var i in clipArray)
		{
			ctx.lineTo(clipArray[i].data[0], clipArray[i].data[1]);
		}
		ctx.closePath();
		ctx.stroke();
		ctx.fill();
	}

});


})();

//../extends/wgeFotorSlideshowInterface.js
"use strict";
/*
* wgeFotorSlideshowInterface.js
*
*  Created on: 2014-8-29
*      Author: Wang Yang
*        Blog: http://blog.wysaid.org
*/

/*
	简介: 为fotor slideshow 提供一致对外接口
	需要网站部分js代码支持， 不可单独使用。

*/


WGE.FotorSlideshowInterface = WGE.Class(FT.KAnimator, WGE.SlideshowInterface,
{
	_lastVolume : null, //音乐淡出辅助变量

	_blurFadeoutTime : 1500, //界面模糊淡出时间
	_logoShowTime : 1500, //logo出现时间点
	_totalEndingTime : 5000, //总共结束时间

	//options、lastPhotoCallback 都是无意义参数，建议剔除
	initialize : function(element, options, template, callback, scope, lastPhotoCallback)
	{
		FT.KAnimator.initialize.call(this, template);
		var self = this;
		var imageURLs = template.config.imageUrls || template.config.previewImageUrls;
		var len = imageURLs.length;

		if(!(len > 0))
		{
			console.error("未传入图片");
			return ;
		}

		if(template.config.assetsDir) {
			WGE.SlideshowSettings.assetsDir = template.config.assetsDir;			
		}

		FT.EventManager.sendEvent(new FT.KTemplateLoadingEvent(0, FT.TLP_ANIMATION_IMAGELOADING, this.template));

		WGE.SlideshowInterface.initialize.call(this, element, imageURLs, function (imgArr, slideshowThis){
			if(callback)
				callback.call(scope);

			// self.play();
			// self.pause();

		}, function(img, n, slideshowThis){
			FT.EventManager.sendEvent(new FT.KTemplateLoadingEvent(n / len, FT.TLP_ANIMATION_IMAGELOADING, self.template));
		});

		//兼容接口
		this.setMusicVolume = this.setVolume;
		this.clear = this.release;
	},

	release : function()
	{
		this.audio.destruct();
		this.srcImages = undefined;
		this.timeline = undefined;
		WGE.release(this);
	},

	_audioplaying : function()
	{
		this._audioplayingTime = this.getAudioPlayingTime();
		FT.EventManager.sendEvent({
			type: "FM_PLAY_PROGRESS",
			position: this.timeline.currentTime,
			duration: this.timeline.totalTime
		});
	},

	//需要第三方 soundManager
	_initAudio : function(url)
	{
		var self = this;
		var arg = {url : url};

		if(typeof this._audioFinish == "function")
			arg.onfinish = this._audioFinish.bind(this);

		if(typeof this._audioplaying == "function")
			arg.whileplaying = this._audioplaying.bind(this);

		if(typeof this._audiosuspend == "function")
			arg.onsuspend = this._audiosuspend.bind(this);
		if(typeof this._audioTimeout == "function")
			arg.ontimeout = this._audioTimeout.bind(this);

		var tryInitAudio = function() {
			if(WGE.soundManagerReady)
			{
				if(self.audio)
					return;
				self.audio = soundManager.createSound(arg);
				if(!self.audio)
					self._checkAudioFailed();
				self.audio.play();
				//初始时将音乐标记为暂停状态，而不是未播放状态。
				if(!self._animationRequest)
					self.audio.pause();
				try
				{
					var v = self.template.config.music.defaultVolume;
					if(!isNaN(v))
						self.audio.setVolume(v);
				}catch(e) {}
			}
			else
			{
				setTimeout(tryInitAudio.bind(this), 100);
			}
		};

		tryInitAudio();
	},

	_checkAudioFailed : function()
	{
		if(this.audio.readyState == 2)
		{
			console.error("Failed to play audio : ", this.audioFileName);
			FT.EventManager.sendEvent({type: "FM_TEMPLATE_LOADMUSIC_FAILED"});
			this.stop();
			return true;
		}
		else if(this.audio.readyState == 3)
		{
			this._checkAudioFailed = null;
		}
		return false;
	},

	onEvent: function(e)
	{
		try
		{
			if (this.template.config.autoPauseAsHide)
			{
				if (e.type == "FM_WINDOW_HIDE")
				{
					this.pause();
				}
				else if (e.type == "FM_WINDOW_SHOW")
				{
					this.resume();
				}
			}
		}catch(e)
		{
			console.warn("多余Event, 需要网站解决");
		}
	},

	endloop : function()
	{
		if(this._animationRequest || !(this.context && this._endBlurCanvas && this._endCanvas))
			return;
		var time = Date.now();
		var dt = time - this._lastFrameTime;
		if(dt >  this._totalEndingTime)
		{
			this.context.save();
			this.context.drawImage(this._endBlurCanvas, 0, 0, this._endBlurCanvas.width, this._endBlurCanvas.height, 0, 0, this.canvas.width, this.canvas.height);
			this.context.fillStyle = "#000";
			this.context.globalAlpha = 0.5;
			this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
			this.context.restore();
			console.log("Slideshow endloop finished.");
			if(this.audio)
			{
				this.audio.stop();
				this.audio.setVolume(this._lastVolume);
				this._lastVolume = null;
			}
			return ;
		}

		this.context.save();

		if(dt < this._blurFadeoutTime)
		{
			this.context.drawImage(this._endCanvas, 0, 0);
			this.context.globalAlpha = dt / this._blurFadeoutTime;
			this.context.drawImage(this._endBlurCanvas, 0, 0, this._endBlurCanvas.width, this._endBlurCanvas.height, 0, 0, this.canvas.width, this.canvas.height);
		}
		else
		{
			this.context.drawImage(this._endBlurCanvas, 0, 0, this._endBlurCanvas.width, this._endBlurCanvas.height, 0, 0, this.canvas.width, this.canvas.height);
			this.context.globalAlpha = (dt - this._blurFadeoutTime) / (2.0 * (this._totalEndingTime - this._blurFadeoutTime));
			this.context.fillStyle = "#000";
			this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
		}
		this.context.restore();

		if(this._lastVolume)
			this.audio.setVolume(this._lastVolume * (1 - dt / this._totalEndingTime));

		//保证淡出执行间隔。(淡出不需要太高的帧率，和大量运算)
		setTimeout(this.endloop.bind(this), 20);
	},

	_end : function()
	{
		console.log("Slideshow End");
		this._animationRequest = null;
		this._endBlurCanvas = WGE.CE("canvas");
		this._endBlurCanvas.width = this.canvas.width / 2;
		this._endBlurCanvas.height = this.canvas.height / 2;
		var ctx = this._endBlurCanvas.getContext('2d');
		ctx.drawImage(this.canvas, 0, 0, this.canvas.width, this.canvas.height, 0, 0, this._endBlurCanvas.width, this._endBlurCanvas.height);
		var blurredData = WGE.Filter.StackBlur.stackBlurCanvasRGB(this._endBlurCanvas, 0, 0, this._endBlurCanvas.width, this._endBlurCanvas.height, 25);
		ctx.putImageData(blurredData, 0, 0);
		this._endCanvas = WGE.CE("canvas");
		this._endCanvas.width = this.canvas.width;
		this._endCanvas.height = this.canvas.height;
		this._endCanvas.getContext('2d').drawImage(this.canvas, 0, 0);
		this.timeline.end();
		this._lastVolume = this.audio.volume;

		this._lastFrameTime = Date.now();

		FT.EventManager.sendEvent({
			type: "FM_PLAY_PROGRESS",
			position: this.timeline.totalTime,
			duration: this.timeline.totalTime
		});
		setTimeout(this.endloop.bind(this), 1);
		setTimeout(this._showLogo.bind(this), this._logoShowTime);
	},

	_showLogo : function()
	{
		if(this._animationRequest || !(this.context && this._endBlurCanvas && this._endCanvas))
			return;
		FT.EventManager.sendEvent({
			type: "FM_MUSIC_END"
		});
	},

	setParam : function(param)
	{
		if(typeof param.musicVolume == "number")
		{
			//this._lastVolume = null;
			this.setVolume(param.musicVolume);
		}
	}

});

